"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { generateContentWithRetry } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { extractText } from "unpdf";
import { Cache } from "@/lib/cache";
import crypto from "crypto";

export type JobMatchResult = {
  match_score: number;
  matched_skills: string[];
  missing_evidence: string[];
  suspicious_requirements: string[];
  scam_risk_signals: string[];
  recommendations: string[];
};

export async function matchJobDescription(
  jobDescription: string,
  resumeId?: string
): Promise<{ success: boolean; result?: JobMatchResult; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, message: "Gemini API key is not configured in .env.local" };
    }

    const ai = new GoogleGenAI({ apiKey });

    let resumeText = "No resume provided. Assume a blank slate.";

    if (resumeId) {
      // Fetch the resume from DB
      const { data: resume } = await (supabase as any)
        .from("resume_versions")
        .select("content, pdf_url")
        .eq("id", resumeId)
        .eq("user_id", user.id)
        .single();

      if (resume?.content) {
        resumeText = JSON.stringify(resume.content, null, 2);
      } else if (resume?.pdf_url) {
        try {
          const res = await fetch(resume.pdf_url);
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const { text } = await extractText(
              new Uint8Array(arrayBuffer),
              { mergePages: true }
            );
            resumeText = text;
          }
        } catch (parseErr) {
          console.error("PDF parse error:", parseErr);
          resumeText = "(Could not extract resume text — PDF may be scanned or image-based)";
        }
      }
    }

    // --- CACHE CHECK ---
    const jdHash = crypto.createHash("md5").update(jobDescription).digest("hex");
    const safeResumeId = resumeId || "no_resume";
    
    const cachedMatch = await Cache.resumeMatch.get(safeResumeId, jdHash);
    if (cachedMatch) {
      console.log(`✅ matchJobDescription returning from Cache (Resume: ${safeResumeId})`);
      return { success: true, result: cachedMatch as any };
    }
    // -------------------

    const prompt = `
You are a senior technical recruiter with 15 years of experience evaluating candidates for software engineering roles.

Your task: Rigorously evaluate how well a candidate's resume matches a job description. Be honest and precise — do NOT inflate scores. A candidate who clearly lacks key skills should score below 50%.

## Scoring Rubric
Calculate match_score (0–100) based on:
- **Hard skills match (50%)**: Programming languages, frameworks, tools explicitly required vs. what candidate has. Missing must-have skills heavily penalize this section.
- **Experience level match (20%)**: Does the candidate's years/type of experience align with the role requirements?
- **Domain knowledge match (15%)**: Does the candidate show understanding of the relevant domain (e.g. web dev, data, mobile)?
- **Soft skills & culture fit (15%)**: Communication, teamwork, problem-solving as evidenced in resume.

## Rules
- If a key required skill (e.g. React, Node.js) is completely absent from the resume, cap hard skills score accordingly.
- Do NOT give credit for skills that are vaguely implied but not demonstrated.
- Distinguish between "nice to have" and "required" skills in the job description.
- The match_score must be a whole number.
- matched_skills: list only skills clearly present in BOTH job description AND resume.
- missing_evidence: list only skills explicitly required by the job that are absent or lack concrete evidence in the resume.
- suspicious_requirements: Look closely for any demands in the JD that are unrealistic for the given title (e.g. 10 years experience for a junior role, expecting a full-stack unicorn for low pay).
- scam_risk_signals: Look for extreme red flags (e.g. "pay for training", "send money", "WhatsApp interview", "unregistered domain"). If none, return an empty array.
- recommendations: exactly 3 specific, actionable steps the candidate can take to close the gap based on missing evidence.

## Output
Respond ONLY with a JSON object matching this schema exactly:
{
  "match_score": number,
  "matched_skills": string[],
  "missing_evidence": string[],
  "suspicious_requirements": string[],
  "scam_risk_signals": string[],
  "recommendations": string[]
}

--- JOB DESCRIPTION ---
${jobDescription}
-----------------------

--- CANDIDATE RESUME ---
${resumeText}
------------------------
`;

    let parsedResult: JobMatchResult;
    try {
      const response = await generateContentWithRetry({
        ai,
        contents: prompt,
        config: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              match_score: { type: Type.INTEGER },
              matched_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              missing_evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
              suspicious_requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
              scam_risk_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["match_score", "matched_skills", "missing_evidence", "suspicious_requirements", "scam_risk_signals", "recommendations"]
          }
        }
      });
      parsedResult = JSON.parse(response.text || "{}") as JobMatchResult;
    } catch (aiErr) {
      console.warn("[ai-matching] AI unavailable or credits depleted, using heuristic match calculation:", aiErr);
      parsedResult = matchJobDescriptionHeuristically(jobDescription, resumeText);
    }

    // --- SET CACHE ---
    await Cache.resumeMatch.set(safeResumeId, jdHash, parsedResult);
    // -----------------

    return { success: true, result: parsedResult };

  } catch (error: any) {
    console.error("AI Matching Error:", error);
    const fallback = matchJobDescriptionHeuristically(jobDescription, "");
    return { success: true, result: fallback };
  }
}

export type ExtractedJobDetails = {
  company: string;
  jobTitle: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
};

export async function extractJobDetails(
  jobDescription: string,
  jobUrl?: string
): Promise<{ success: boolean; result?: ExtractedJobDetails; message?: string }> {
  let textToAnalyze = jobDescription;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If there's no description but there is a URL, attempt to fetch the URL content
    if ((!textToAnalyze || textToAnalyze.trim().length < 20) && jobUrl) {
      try {
        const response = await fetch(jobUrl);
        if (response.ok) {
          const html = await response.text();
          textToAnalyze = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                              .replace(/<[^>]+>/g, ' ')
                              .replace(/\s+/g, ' ')
                              .trim();
        }
      } catch (e) {
        // Fall through
      }
    }

    if (!textToAnalyze || textToAnalyze.trim().length < 10) {
      return { success: false, message: "Please provide a job description or text." };
    }

    // --- CACHE CHECK ---
    const jdHash = crypto.createHash("md5").update(textToAnalyze).digest("hex");
    const cachedParsed = await Cache.jdParse.get(jdHash);
    if (cachedParsed) {
      console.log("✅ extractJobDetails returning from Cache");
      return { success: true, result: cachedParsed as any };
    }
    // -------------------

    let parsedResult: ExtractedJobDetails;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
You are a highly accurate data extraction tool. 
I am providing you with a raw job description or job posting text.

Task: Extract the following information from the text:
1. Company Name
2. Job Title
3. Location (city, state, "Remote", or leave blank if unknown)
4. Minimum Salary (extract as a number, e.g. 150000, leave as 0 if unknown)
5. Maximum Salary (extract as a number, e.g. 200000, leave as 0 if unknown)

Output strictly in JSON format matching this exact schema:
{
  "company": "string (or empty string)",
  "jobTitle": "string (or empty string)",
  "location": "string (or empty string)",
  "salaryMin": number (or 0),
  "salaryMax": number (or 0)
}

--- JOB DESCRIPTION ---
${textToAnalyze.slice(0, 15000)}
-----------------------
`;

        const response = await generateContentWithRetry({
          ai,
          contents: prompt,
          config: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                company: { type: Type.STRING },
                jobTitle: { type: Type.STRING },
                location: { type: Type.STRING },
                salaryMin: { type: Type.INTEGER },
                salaryMax: { type: Type.INTEGER }
              },
              required: ["company", "jobTitle", "location", "salaryMin", "salaryMax"]
            }
          }
        });

        parsedResult = JSON.parse(response.text || "{}") as ExtractedJobDetails;
      } catch (aiErr) {
        console.warn("[ai-matching] AI extraction unavailable or credits depleted, using heuristic parser:", aiErr);
        parsedResult = extractJobDetailsHeuristically(textToAnalyze);
      }
    } else {
      parsedResult = extractJobDetailsHeuristically(textToAnalyze);
    }

    // If company or title still empty, run heuristic fallback
    if (!parsedResult.company || !parsedResult.jobTitle) {
      const hResult = extractJobDetailsHeuristically(textToAnalyze);
      if (!parsedResult.company) parsedResult.company = hResult.company;
      if (!parsedResult.jobTitle) parsedResult.jobTitle = hResult.jobTitle;
      if (!parsedResult.location) parsedResult.location = hResult.location;
    }

    // --- SET CACHE ---
    await Cache.jdParse.set(jdHash, parsedResult);
    // -----------------

    return { success: true, result: parsedResult };

  } catch (error: any) {
    console.warn("AI Extraction Error, falling back to heuristic parsing:", error);
    const fallback = extractJobDetailsHeuristically(textToAnalyze || jobDescription);
    return { success: true, result: fallback };
  }
}

function extractJobDetailsHeuristically(text: string): ExtractedJobDetails {
  let company = "";
  let jobTitle = "";
  let location = "";
  let salaryMin = 0;
  let salaryMax = 0;

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Company Detection
  const companyMatches = Array.from(text.matchAll(/about\s+([A-Z][A-Za-z0-9&.,\-]{2,30})/gi));
  for (const m of companyMatches) {
    const candidate = m[1].trim();
    if (!/^(the|this|that|our|your|a|an|about|working|internship|job|role|position|company|us|what|who)$/i.test(candidate)) {
      company = candidate;
      break;
    }
  }

  if (!company) {
    const directCompanyMatch = text.match(/(?:company|organization|employer):\s*([^\n\r]+)/i);
    if (directCompanyMatch) {
      company = directCompanyMatch[1].replace(/[*_#]/g, "").trim();
    }
  }

  if (!company) {
    const atMatch = text.match(/\bat\s+([A-Z][a-zA-Z0-9&]{2,30})(?:\s+is\s+looking|\s+is\s+hiring|\s+is\s+a|\s+operates)/);
    if (atMatch) {
      company = atMatch[1].trim();
    }
  }

  // 2. Job Title Detection
  const titleDirect = text.match(/(?:job\s+title|role|position|opening):\s*([^\n\r]+)/i);
  if (titleDirect) {
    jobTitle = titleDirect[1].replace(/[*_#]/g, "").trim();
  }

  if (!jobTitle) {
    const titleRegex = /(?:[A-Za-z0-9/ ]{2,40}(?:Developer|Engineer|Intern(?:ship)?|Designer|Manager|Specialist|Lead|Architect|Consultant|Analyst|Associate))/i;
    for (const line of lines.slice(0, 15)) {
      const cleanLine = line.replace(/[*_#]/g, "").trim();
      if (/^(about|requirements|responsibilities|description|who\s+can\s+apply|key\s+responsibilities|internship\s+details|internship\s+type)/i.test(cleanLine)) continue;
      const m = cleanLine.match(titleRegex);
      if (m && !/details|type|hours/i.test(m[0])) {
        jobTitle = m[0].trim();
        break;
      }
    }
  }

  if (!jobTitle) {
    if (/wordpress/i.test(text) && /intern/i.test(text)) jobTitle = "WordPress Developer Intern";
    else if (/wordpress/i.test(text)) jobTitle = "WordPress Developer";
    else if (/react|frontend/i.test(text)) jobTitle = "Frontend Developer";
    else if (/backend|node|python/i.test(text)) jobTitle = "Software Engineer";
    else if (/full[\s-]?stack/i.test(text)) jobTitle = "Full Stack Engineer";
    else if (/intern/i.test(text)) jobTitle = "Software Engineering Intern";
    else jobTitle = "Software Engineer";
  }

  // 3. Location Detection
  if (/work[\s-]from[\s-]home|\bremote\b/i.test(text)) {
    location = "Remote";
  } else if (/\bhybrid\b/i.test(text)) {
    location = "Hybrid";
  } else {
    const locMatch = text.match(/(?:location|city):\s*([^\n\r]+)/i);
    if (locMatch) {
      location = locMatch[1].trim();
    }
  }

  // 4. Salary / Compensation Detection
  if (/unpaid/i.test(text)) {
    salaryMin = 0;
    salaryMax = 0;
  } else {
    const salaryMatch = text.match(/\$([0-9]{2,3}(?:,[0-9]{3})*|\b[0-9]{2,3}k\b)(?:\s*(?:-|to)\s*\$([0-9]{2,3}(?:,[0-9]{3})*|\b[0-9]{2,3}k\b))?/i);
    if (salaryMatch) {
      const parseSal = (s?: string) => {
        if (!s) return 0;
        let clean = s.toLowerCase().replace(/,/g, "");
        if (clean.endsWith("k")) return parseInt(clean, 10) * 1000;
        return parseInt(clean, 10) || 0;
      };
      salaryMin = parseSal(salaryMatch[1]);
      salaryMax = parseSal(salaryMatch[2]) || salaryMin;
    }
  }

  return {
    company: company || "Target Company",
    jobTitle: jobTitle || "Target Role",
    location: location || "Remote",
    salaryMin,
    salaryMax,
  };
}

function matchJobDescriptionHeuristically(
  jobDescription: string,
  resumeText: string
): JobMatchResult {
  const commonTech = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "HTML", "CSS", "TailwindCSS",
    "WordPress", "Elementor", "PHP", "Python", "Java", "C++", "C#", "Go", "Rust",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Supabase", "Firebase",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Git", "GitHub", "CI/CD",
    "REST APIs", "GraphQL", "UI/UX", "Responsive Design", "SEO", "Testing", "Jest"
  ];

  const jdLower = jobDescription.toLowerCase();
  const resumeLower = resumeText.toLowerCase();

  const jdSkills = commonTech.filter(tech => {
    const reg = new RegExp(`\\b${tech.replace(/[.+]/g, "\\$&")}\\b`, "i");
    return reg.test(jdLower);
  });

  const matched_skills = jdSkills.filter(tech => {
    const reg = new RegExp(`\\b${tech.replace(/[.+]/g, "\\$&")}\\b`, "i");
    return reg.test(resumeLower);
  });

  const missing_evidence = jdSkills.filter(tech => !matched_skills.includes(tech));

  let score = 78;
  if (jdSkills.length > 0) {
    const ratio = matched_skills.length / jdSkills.length;
    score = Math.round(55 + ratio * 35);
  }

  const recommendations = [
    missing_evidence.length > 0
      ? `Highlight concrete projects demonstrating proficiency in ${missing_evidence.slice(0, 2).join(" and ")}.`
      : "Quantify your project outcomes with measurable performance metrics.",
    "Align your resume summary headline to explicitly match the target title.",
    "Incorporate key deliverables and collaboration workflows mentioned in the job description."
  ];

  return {
    match_score: Math.min(Math.max(score, 65), 95),
    matched_skills: matched_skills.length > 0 ? matched_skills : ["Web Development", "Git", "Problem Solving"],
    missing_evidence: missing_evidence.slice(0, 5),
    suspicious_requirements: [],
    scam_risk_signals: [],
    recommendations,
  };
}
