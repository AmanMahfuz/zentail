"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";



export type JobMatchResult = {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let resumeText = "No resume provided. Assume a blank slate.";

    if (resumeId) {
      // Fetch the resume from DB
      const { data: resume } = await supabase
        .from("resumes")
        .select("file_path, file_url")
        .eq("id", resumeId)
        .eq("user_id", user.id)
        .single();

      if (resume) {
        let pdfBuffer: Buffer | null = null;

        if (resume.file_path) {
          // Download directly from private storage
          const { data: fileData, error } = await supabase.storage
            .from("resumes")
            .download(resume.file_path);
          if (!error && fileData) {
            const arrayBuffer = await fileData.arrayBuffer();
            pdfBuffer = Buffer.from(arrayBuffer);
          }
        } else if (resume.file_url) {
          // Fallback to public URL if no file_path
          const res = await fetch(resume.file_url);
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            pdfBuffer = Buffer.from(arrayBuffer);
          }
        }

        if (pdfBuffer) {
          const pdfParse = require("pdf-parse-new");
          const pdfData = await pdfParse(pdfBuffer);
          resumeText = pdfData.text;
        }
      }
    }

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
- missing_skills: list only skills explicitly required by the job that are absent or unclear in the resume.
- recommendations: exactly 3 specific, actionable steps the candidate can take to close the gap. Be concrete (e.g. "Build a REST API project using Node.js and Express, deploy it on Railway, and add it to your resume" — not just "learn Node.js").

## Output
Respond ONLY with a JSON object matching this schema exactly:
{
  "match_score": number,
  "matched_skills": string[],
  "missing_skills": string[],
  "recommendations": string[]
}

--- JOB DESCRIPTION ---
${jobDescription}
-----------------------

--- CANDIDATE RESUME ---
${resumeText}
------------------------
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0, // Deterministic — same input always gives same score
      },
    });

    const responseText = result.response.text();
    const parsedResult = JSON.parse(responseText) as JobMatchResult;

    return { success: true, result: parsedResult };

  } catch (error: any) {
    console.error("AI Matching Error:", error);
    return { success: false, message: error.message || "Failed to process job match." };
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
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, message: "Gemini API key is not configured." };
    }

    let textToAnalyze = jobDescription;

    // If there's no description but there is a URL, attempt to fetch the URL content
    if ((!textToAnalyze || textToAnalyze.trim().length < 20) && jobUrl) {
      try {
        const response = await fetch(jobUrl);
        if (response.ok) {
          const html = await response.text();
          // Extremely basic HTML to text stripping
          textToAnalyze = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                              .replace(/<[^>]+>/g, ' ')
                              .replace(/\s+/g, ' ')
                              .trim();
        } else {
          return { success: false, message: "Could not read the provided URL. It might be blocking automated access." };
        }
      } catch (e) {
        return { success: false, message: "Failed to fetch the provided URL." };
      }
    }

    if (!textToAnalyze || textToAnalyze.trim().length < 20) {
      return { success: false, message: "Please provide a longer job description." };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
${textToAnalyze.slice(0, 15000)} // Limiting to prevent token limits on large web pages
-----------------------
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    let responseText = result.response.text();
    // Strip markdown formatting if the model accidentally included it
    responseText = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    console.log("AI Extracted Text:", responseText);
    
    const parsedResult = JSON.parse(responseText) as ExtractedJobDetails;
    console.log("Parsed Result:", parsedResult);

    return { success: true, result: parsedResult };

  } catch (error: any) {
    console.error("AI Extraction Error:", error);
    return { success: false, message: error.message || "Failed to extract job details." };
  }
}
