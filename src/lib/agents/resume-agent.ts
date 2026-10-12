import { GoogleGenAI, Type } from "@google/genai";
import { createClient, createAuthClient } from "@/lib/supabase/server";
import { generateContentWithRetry } from "@/lib/gemini";
import { extractText } from "unpdf";
import PDFDocument from "pdfkit";
import { formatDateRange } from "@/lib/resume/date-utils";
import { validateCandidateEvidence } from "./candidate-evidence-validator";

// Helper: Generate PDF Buffer from Markdown
function generatePDFBuffer(content: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: "LETTER" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const lines = content.split("\n");
    for (const line of lines) {
      if (line.startsWith("# ")) {
        doc.moveDown(0.2).fontSize(22).font("Helvetica-Bold").text(line.replace(/^# /, ""), { align: "center" });
      } else if (line.startsWith("## ")) {
        doc.moveDown(0.5).fontSize(13).font("Helvetica-Bold").text(line.replace(/^## /, "").toUpperCase());
        doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor("#cccccc").stroke();
        doc.moveDown(0.2);
      } else if (line.startsWith("### ")) {
        doc.moveDown(0.3).fontSize(11).font("Helvetica-Bold").text(line.replace(/^### /, ""));
      } else if (line.startsWith("- ")) {
        doc.fontSize(10).font("Helvetica").text("• " + line.replace(/^- /, ""), { indent: 15 });
      } else if (line.trim() === "") {
        doc.moveDown(0.3);
      } else {
        doc.fontSize(10).font("Helvetica").text(line);
      }
    }
    doc.end();
  });
}

// Helper: Upload to Supabase Storage
async function uploadToSupabaseBucket(
  supabase: any,
  userId: string,
  folder: "resumes" | "cover-letters",
  filename: string,
  buffer: Buffer
): Promise<string | null> {
  const path = `${userId}/${folder}/${filename}`;
  const { error } = await supabase.storage
    .from("generated-docs")
    .upload(path, buffer, { contentType: "application/pdf", upsert: true });

  if (error) {
    console.error("Storage upload error:", error);
    return null;
  }

  const { data: pub } = supabase.storage
    .from("generated-docs")
    .getPublicUrl(path);

  const url = pub?.publicUrl || null;
  return url && url.length <= 500 ? url : null;
}

const MAX_CHARS = 6000;
function truncate(text: string): string {
  return text.length <= MAX_CHARS ? text : text.slice(0, MAX_CHARS) + "\n\n[...truncated]";
}

export function generateFallbackTailoredResume(bestVer: any, baseContent: any, job: any, options?: { mode?: "direct" | "review"; confirmedSkills?: string[]; unconfirmedSkills?: string[] }) {
  let contentObj: any = baseContent;
  if (typeof baseContent === "string") {
    try {
      contentObj = JSON.parse(baseContent);
    } catch {
      contentObj = {};
    }
  }

  const name =
    contentObj?.contact?.name ||
    contentObj?.name ||
    (contentObj?.first_name ? `${contentObj.first_name} ${contentObj.last_name || ""}`.trim() : "") ||
    bestVer?.version_label ||
    "Candidate";

  // Preserve missing contact details as empty strings — no fabricated placeholders
  const email = contentObj?.contact?.email || contentObj?.email || "";
  const phone = contentObj?.contact?.phone || contentObj?.phone || "";
  const location = contentObj?.contact?.location || contentObj?.location || "";
  const linkedin = contentObj?.contact?.linkedin || contentObj?.linkedin || "";
  const github = contentObj?.contact?.github || contentObj?.github || "";

  // Extract candidate skills
  let candidateSkills: string[] = [];
  if (Array.isArray(contentObj?.skills)) {
    contentObj.skills.forEach((s: any) => {
      if (typeof s === "string") candidateSkills.push(s);
      else if (s && Array.isArray(s.items)) candidateSkills.push(...s.items);
    });
  }
  // In Review Mode, append user-confirmed skills
  if (options?.mode === "review" && Array.isArray(options.confirmedSkills)) {
    for (const cs of options.confirmedSkills) {
      if (!candidateSkills.some(existing => existing.toLowerCase() === cs.toLowerCase())) {
        candidateSkills.push(cs);
      }
    }
  }

  // Scan JD for skills
  const commonTech = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "HTML", "CSS", "TailwindCSS",
    "WordPress", "Elementor", "PHP", "Python", "Java", "C++", "C#", "Go", "Rust",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Supabase", "Firebase",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Git", "GitHub", "CI/CD",
    "REST APIs", "GraphQL", "UI/UX", "Responsive Design", "SEO", "Testing", "Jest"
  ];
  const jdLower = (job.description || "").toLowerCase();
  const jdSkills = commonTech.filter(tech => {
    const reg = new RegExp(`\\b${tech.replace(/[.+]/g, "\\$&")}\\b`, "i");
    return reg.test(jdLower);
  });

  const skills_matched = candidateSkills.filter(cSkill =>
    jdSkills.some(jSkill => jSkill.toLowerCase() === cSkill.toLowerCase())
  );
  if (skills_matched.length === 0) {
    skills_matched.push(...candidateSkills.slice(0, 4));
  }
  const skills_missing = jdSkills.filter(jSkill =>
    !candidateSkills.some(cSkill => cSkill.toLowerCase() === jSkill.toLowerCase())
  );

  const contactLine = [email, phone, location, linkedin, github].filter(Boolean).join(" | ");

  // Build experience section — only from real candidate data. No fabricated blocks.
  const experiences = Array.isArray(contentObj?.experiences)
    ? contentObj.experiences
    : Array.isArray(contentObj?.experience)
    ? contentObj.experience
    : [];

  let experienceMarkdown = "";
  for (const exp of experiences) {
    const roleTitle = exp.title || exp.role || "";
    const compName = exp.company || "";
    if (!roleTitle && !compName) continue; // skip empty entries
    const dateStr = exp.period || exp.duration || formatDateRange(exp.startDate, exp.endDate, exp.current) || exp.date || "";
    const bullets = Array.isArray(exp.bullets) ? exp.bullets.filter(Boolean) : (exp.description ? [exp.description] : []);
    experienceMarkdown += `### ${roleTitle}${compName ? ` - ${compName}` : ""}\n${dateStr ? `${dateStr}\n` : ""}`;
    for (const b of bullets) {
      experienceMarkdown += `- ${b}\n`;
    }
    experienceMarkdown += "\n";
  }

  const summarySkills = skills_matched.length > 0
    ? `with practical experience in ${skills_matched.slice(0, 4).join(", ")}`
    : "seeking to contribute technical skills";
  const summary = `Professional targeting the ${job.title} position at ${job.company}, ${summarySkills}.`;

  const skillsLine = candidateSkills.length > 0
    ? `- Skills: ${candidateSkills.join(", ")}\n`
    : "";

  const educations = Array.isArray(contentObj?.education)
    ? contentObj.education
    : Array.isArray(contentObj?.educations)
    ? contentObj.educations
    : [];

  let educationMarkdown = "";
  for (const edu of educations) {
    const degree = edu.degree || edu.degree_name || "Degree";
    const inst = edu.institution || edu.school || edu.university || "";
    const date = edu.period || edu.duration || formatDateRange(edu.startDate, edu.endDate) || edu.year || edu.graduationDate || "";
    educationMarkdown += `### ${degree}${inst ? ` - ${inst}` : ""}\n${date ? `${date}\n` : ""}\n`;
  }

  const projects = Array.isArray(contentObj?.projects) ? contentObj.projects : [];
  let projectsMarkdown = "";
  for (const proj of projects) {
    const projName = proj.name || proj.title || "Project";
    const tech = proj.tech ? ` (${proj.tech})` : "";
    const pBullets = Array.isArray(proj.bullets) ? proj.bullets.filter(Boolean) : (proj.description ? [proj.description] : []);
    projectsMarkdown += `### ${projName}${tech}\n`;
    for (const b of pBullets) {
      projectsMarkdown += `- ${b}\n`;
    }
    projectsMarkdown += "\n";
  }

  const resume_markdown = `# ${name}
${contactLine ? `${contactLine}\n` : ""}
## Summary
${summary}

## Skills
${skillsLine}
## Experience
${experienceMarkdown.trim() || "(No professional experience on file)"}

${projectsMarkdown.trim() ? `## Projects\n${projectsMarkdown.trim()}\n\n` : ""}${educationMarkdown.trim() ? `## Education\n${educationMarkdown.trim()}\n` : ""}`;

  return {
    resume_markdown: resume_markdown.trim() + "\n",
    skills_matched,
    skills_missing: skills_missing.slice(0, 4),
    // Null score — fallback cannot compute a real ATS score
    ats_score: null as unknown as number,
    tailoring_log: [
      `Fallback resume generated from candidate profile (AI unavailable).`,
      `Mode: ${options?.mode || "direct"}. No experience or scores were fabricated.`,
    ]
  };
}

export class ResumeAgent {
  /**
   * Generates a tailored resume for a specific application using Gemini 2.0 Flash.
   * Supports Direct Mode (automatic from supported facts) and Review Mode (user-confirmed facts).
   */
  static async tailorForJob(
    applicationId: string,
    accessToken?: string,
    options?: {
      mode?: "direct" | "review";
      confirmedSkills?: string[];
      unconfirmedSkills?: string[];
      force?: boolean;
    }
  ) {
    try {
      const mode = options?.mode || "direct";
      const confirmedSkills = Array.isArray(options?.confirmedSkills) ? options!.confirmedSkills : [];
      const unconfirmedSkills = Array.isArray(options?.unconfirmedSkills) ? options!.unconfirmedSkills : [];
      console.log(`[ResumeAgent] Starting tailoring for application: ${applicationId} (mode: ${mode})`);
      const supabase = accessToken ? createAuthClient(accessToken) : await createClient();
      const { data: { user } } = await (accessToken ? supabase.auth.getUser(accessToken) : supabase.auth.getUser());
      if (!user) return { success: false, message: "Unauthorized" };

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return { success: false, message: "Gemini API key not configured." };

      const { data: application, error: appError } = await (supabase as any)
        .from("applications")
        .select("id, user_id, resume_version_id, fit_score, job_title, company_name, job_description, job:jobs ( title, company, description )")
        .eq("id", applicationId)
        .single();

      if (appError || !application) {
        return { success: false, message: "Application not found." };
      }

      // Interview Qualification Check: If candidate's resume already has an interview-ready score (>= 80%),
      // do not create unnecessary tailored copies unless explicitly forced or running Review Mode!
      if (!options?.force && mode === "direct" && (application.fit_score ?? 0) >= 80) {
        console.log(`[ResumeAgent] Application ${applicationId} already has interview-ready fit score of ${application.fit_score}% (>= 80%). Tailoring skipped.`);
        return {
          success: true,
          tailored: false,
          ats_score: application.fit_score,
          message: `Candidate resume already scores ${application.fit_score}% (Interview-Ready >= 80%). No tailoring needed.`
        };
      }

      const job = (application.job as any) || {
        title: application.job_title || "Role",
        company: application.company_name || "Company",
        description: application.job_description || ""
      };

      // 1. Context Gathering: Scan user's resume collection & select best matching base
      let resumeText = "No resume provided.";
      let parentVersionId: string | null = null;
      let baseContent: any = null;
      let bestVer: any = null;
      let scanStrategy = "standard_tailoring";
      let scanMatchPct = 70;
      let scanRationale = "";

      const ai = new GoogleGenAI({ apiKey });

      // Check existing versions in resume_versions
      const { data: userVersions } = await (supabase as any)
        .from("resume_versions")
        .select("*")
        .eq("user_id", user.id)
        .order("version_number", { ascending: false });

      if (userVersions && userVersions.length > 0) {
        if (userVersions.length > 1) {
          // Intelligent Collection Scanner: Compare candidate's existing resumes against target JD
          try {
            const candidatePreviews = userVersions.slice(0, 6).map((v: any) => ({
              id: v.id,
              version_label: v.version_label || `Version ${v.version_number}`,
              origin_type: v.origin_type,
              skills: Array.isArray(v.content?.skills) ? v.content.skills.map((s: any) => typeof s === "string" ? s : s.name).slice(0, 10) : [],
              summary: v.content?.summary || v.content?.personal?.summary || "",
              content_preview: JSON.stringify(v.content || "").slice(0, 400),
            }));

            const scanPrompt = `
You are an expert AI Talent Matcher and Career Architect.
We have a target job opportunity and a collection of the candidate's existing resumes.
Before tailoring, analyze which existing resume in their collection is the closest match to this target job.

Target Job:
Title: ${job.title}
Company: ${job.company}
Description: ${truncate(job.description || "")}

Available Resumes in Candidate Collection:
${JSON.stringify(candidatePreviews, null, 2)}

Instructions:
1. Select the single best matching resume ID from the collection to use as the base foundation.
2. Estimate the initial match percentage (0-100) between that selected resume and the target JD.
3. Determine the alteration strategy:
   - "minor_alterations": If the selected resume is already a very close match (>= 80%), recommending targeted keyword/bullet adjustments without restructuring.
   - "standard_tailoring": If moderate adjustments to skills, summary, and experience emphasis are required.
   - "deep_pivot": If the role requires a significant framing pivot.
4. Provide a brief rationale explaining why this resume was selected.
`;

            const scanResponse = await generateContentWithRetry({
              ai,
              contents: scanPrompt,
              config: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    selected_resume_id: { type: Type.STRING },
                    match_percentage: { type: Type.INTEGER },
                    alteration_strategy: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                  },
                  required: ["selected_resume_id", "match_percentage", "alteration_strategy", "rationale"],
                },
              },
            });

            const scanResult = JSON.parse(scanResponse.text || "{}");
            const foundVer = userVersions.find((v: any) => v.id === scanResult.selected_resume_id);
            if (foundVer) {
              bestVer = foundVer;
              scanStrategy = scanResult.alteration_strategy || "standard_tailoring";
              scanMatchPct = scanResult.match_percentage || 75;
              scanRationale = scanResult.rationale || "";
              console.log(`[ResumeAgent] Collection scan complete: Selected "${bestVer.version_label}" (${scanMatchPct}% match, strategy: ${scanStrategy})`);

              // If candidate's existing resume already matches >= 80% and not forcing tailoring, link directly!
              if (!options?.force && mode === "direct" && scanMatchPct >= 80) {
                console.log(`[ResumeAgent] Resume "${bestVer.version_label}" matches at ${scanMatchPct}% (>= 80%). Linking directly without tailoring.`);
                await (supabase as any)
                  .from("applications")
                  .update({
                    resume_version_id: bestVer.id,
                    fit_score: Math.max(application.fit_score || 0, scanMatchPct),
                    fit_level: "strong"
                  })
                  .eq("id", application.id);

                try {
                  const { data: userResumeRow } = await (supabase as any)
                    .from("user_resume")
                    .select("id")
                    .eq("user_id", user.id)
                    .maybeSingle();
                  const validBaseResumeId = userResumeRow?.id || null;

                  const { data: existingTailored } = await (supabase as any)
                    .from("tailored_resumes")
                    .select("id")
                    .eq("application_id", application.id)
                    .maybeSingle();

                  if (existingTailored?.id) {
                    await (supabase as any)
                      .from("tailored_resumes")
                      .update({
                        base_resume_id: validBaseResumeId,
                        tailored_content: { ...bestVer.content, tailoring_mode: "direct" },
                        resume_markdown: bestVer.content?.markdown || "",
                        ats_score: scanMatchPct,
                        match_percentage: scanMatchPct,
                      })
                      .eq("id", existingTailored.id);
                  } else {
                    await (supabase as any)
                      .from("tailored_resumes")
                      .insert({
                        application_id: application.id,
                        base_resume_id: validBaseResumeId,
                        tailored_content: { ...bestVer.content, tailoring_mode: "direct" },
                        resume_markdown: bestVer.content?.markdown || "",
                        ats_score: scanMatchPct,
                        match_percentage: scanMatchPct,
                      });
                  }
                } catch (tailorSyncErr) {
                  console.warn("[ResumeAgent] tailored_resumes direct sync notice:", tailorSyncErr);
                }

                return {
                  success: true,
                  tailored: false,
                  ats_score: scanMatchPct,
                  message: `Existing resume "${bestVer.version_label}" qualifies for an interview (${scanMatchPct}% match). No tailoring needed.`
                };
              }
            }
          } catch (scanErr) {
            console.warn("[ResumeAgent] Resume collection scan warning, falling back to master:", scanErr);
          }
        }

        if (!bestVer) {
          const masterVer = userVersions.find((v: any) => v.origin_type === "upload" || v.origin_type === "master");
          bestVer = masterVer || userVersions[0];
        }

        parentVersionId = bestVer.id;
        baseContent = bestVer.content;
        resumeText = JSON.stringify(bestVer.content, null, 2);
      } else {
        // Check user_evidence
        const { data: evidence } = await (supabase as any)
          .from("user_evidence")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (evidence) {
          resumeText = JSON.stringify(evidence, null, 2);
        }
      }

      // P0-A: If no resume found for this user, fail safely.
      if (!resumeText || resumeText.trim().length < 50 || resumeText === "{}") {
        return {
          success: false,
          message: "No resume found for your account. Please set up your Career Profile or upload a resume before applying."
        };
      }

      // 2. Prompt Engineering with Direct vs Review Mode and Airtight Truthfulness
      let modeSpecificInstructions = "";
      if (mode === "review" && confirmedSkills.length > 0) {
        modeSpecificInstructions = `
--- REVIEW MODE CONFIRMATIONS ---
The candidate reviewed job requirements not demonstrated on their base resume and EXPLICITLY CONFIRMED possessing these additional skills:
${confirmedSkills.join(", ")}
You MAY include these confirmed skills in the candidate's skills list and align them truthfully.
The candidate DID NOT confirm the following requirements:
${unconfirmedSkills.join(", ")}
CRITICAL: You MUST NOT include these unconfirmed skills in the resume. Keep them in 'skills_missing'.
Note: A missing/unconfirmed skill is simply undemonstrated on the resume, NEVER describe it as a confirmed deficiency.
`;
      } else {
        modeSpecificInstructions = `
--- DIRECT MODE DIRECTIVE ---
Generate strictly without interruption using ONLY supported facts from the candidate's base resume.
Do NOT assume or invent any skill or qualification not in the base resume.
`;
      }

      const prompt = `You are an expert ATS resume writer and AI Recruiter. 
Your task is to tailor the user's resume for the provided Job Description, maximizing the ATS match score while strictly adhering to the truth.

--- Selected Base Resume (From User Collection: "${bestVer?.version_label || 'Default'}") ---
${truncate(resumeText)}

--- Target Job Description ---
Job Title: ${job.title}
Company: ${job.company}
Description:
${truncate(job.description || "")}

--- Mode & Tailoring Strategy ---
Mode: ${mode.toUpperCase()}
Strategy: ${scanStrategy}
Baseline Match: ${scanMatchPct}%
${scanRationale ? `Rationale: ${scanRationale}\n` : ""}
${modeSpecificInstructions}

**CRITICAL RULES: Strict Truthfulness & Zero Fabrication (P0)**
1. FIXED CANDIDATE REALITY: The candidate's work history, past employers, job titles, employment dates, degrees, schools, and metrics come SOLELY from the Base Resume. You MUST NOT invent, add, or alter any of these.
2. NEVER INVENT PAST EMPLOYERS: The candidate has ONLY worked at the employers listed in their Base Resume. You MUST NOT list ${job.company} or any competitor/example company mentioned in the Job Description as a past employer of the candidate.
3. NEVER INVENT DEGREES OR INSTITUTIONS: If the candidate's Base Resume has no degree or only high school, do NOT add Bachelor's, Master's, or Ph.D., and do NOT add universities (e.g. Stanford, MIT, Harvard) mentioned in the Job Description.
4. NEVER INVENT YEARS OF EXPERIENCE: Do NOT claim the candidate has 10+ or 12+ years of experience if their work history shows 1-2 years.
5. NEVER BORROW METRICS OR ACHIEVEMENTS FROM THE JOB DESCRIPTION: If the job description says "Must have scaled $100M ARR system" or "managed 50 engineers", NEVER insert "$100M ARR" or "managed 50 engineers" into the candidate's bullets or summary. Bullet metrics must ONLY be derived from the candidate's own actual achievements.
6. SKILLS INVENTORY:
   - Only include skills that exist in the candidate's base resume${mode === "review" && confirmedSkills.length > 0 ? " or in the confirmed skills list above" : ""}.
   - If the job description requires a skill that the candidate does not have, do NOT add it to the resume skills list or experience bullets. List it ONLY in 'skills_missing'.
   - NEVER turn job requirements into candidate qualifications!

Format the resume_markdown to match this exact shape:
# [First Last]
[Email] | [Phone]

## Summary
...

## Skills
- [Category]: [Skill 1], [Skill 2]

## Experience
### [Title] - [Company]
[Date]
- [Bullet Point]

## Education
...`;

      // 3. Execution (Gemini Call)
      console.log(`[ResumeAgent] Calling Gemini (${mode} mode)...`);
      let parsed: {
        resume_markdown: string;
        skills_matched: string[];
        skills_missing: string[];
        ats_score: number;
        tailoring_log: string[];
      };

      try {
        const response = await generateContentWithRetry({
          ai,
          contents: prompt,
          config: {
            temperature: 0.15,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                resume_markdown: { type: Type.STRING },
                skills_matched: { type: Type.ARRAY, items: { type: Type.STRING } },
                skills_missing: { type: Type.ARRAY, items: { type: Type.STRING } },
                ats_score: { type: Type.INTEGER },
                tailoring_log: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["resume_markdown", "skills_matched", "skills_missing", "ats_score", "tailoring_log"]
            }
          }
        });

        parsed = JSON.parse(response.text || "{}");
        console.log(`[ResumeAgent] Gemini returned score: ${parsed.ats_score} (${mode} mode)`);

        // Comprehensive candidate-evidence boundary enforcement (P0):
        const validation = validateCandidateEvidence(parsed.resume_markdown, baseContent, job, {
          mode,
          confirmedSkills,
          unconfirmedSkills,
        });

        if (!validation.isValid) {
          console.warn("[ResumeAgent] Candidate evidence boundary violations detected:", validation.violations);
          console.warn("[ResumeAgent] Enforcing truthful candidate boundary via fallback generator.");
          parsed = generateFallbackTailoredResume(bestVer, baseContent, job, { mode, confirmedSkills, unconfirmedSkills });
        }
      } catch (geminiErr) {
        console.warn("[ResumeAgent] Gemini unavailable or credits depleted, using deterministic resume generator:", geminiErr);
        parsed = generateFallbackTailoredResume(bestVer, baseContent, job, { mode, confirmedSkills, unconfirmedSkills });
      }

      // 4. Persistence
      const targetUserId = application.user_id || user.id;
      const pdfBuffer = await generatePDFBuffer(parsed.resume_markdown || "");
      const filename = `resume-${applicationId}-${Date.now()}.pdf`;
      const pdfUrl = await uploadToSupabaseBucket(supabase, targetUserId, "resumes", filename, pdfBuffer);

      const { data: existingGen } = await supabase
        .from("resumes_generated")
        .select("id")
        .eq("application_id", application.id)
        .maybeSingle();

      let inserted: any = null;
      if (existingGen) {
        const { data: updatedGen } = await supabase
          .from("resumes_generated")
          .update({
            resume_markdown: parsed.resume_markdown,
            match_percentage: parsed.ats_score,
            ats_score: parsed.ats_score,
            skills_matched: parsed.skills_matched ?? [],
            skills_missing: parsed.skills_missing ?? [],
            pdf_url: pdfUrl,
          })
          .eq("id", existingGen.id)
          .select()
          .single();
        inserted = updatedGen;
      } else {
        const { data: newGen, error: insertError } = await supabase
          .from("resumes_generated")
          .insert({
            user_id: targetUserId,
            application_id: application.id,
            job_title: job.title,
            company: job.company,
            resume_markdown: parsed.resume_markdown,
            match_percentage: parsed.ats_score,
            ats_score: parsed.ats_score,
            skills_matched: parsed.skills_matched ?? [],
            skills_missing: parsed.skills_missing ?? [],
            pdf_url: pdfUrl,
          })
          .select()
          .single();

        if (insertError) {
          console.error("[ResumeAgent] DB insert error:", insertError);
        }
        inserted = newGen;
      }

      // Also save or update into modern resume_versions table (never create duplicates!)
      try {
        const { data: existingVer } = await (supabase as any)
          .from("resume_versions")
          .select("id")
          .eq("application_id", application.id)
          .maybeSingle();

        const confirmationsObj = {
          confirmed: confirmedSkills,
          unconfirmed: unconfirmedSkills,
        };

        const versionContent = baseContent
          ? {
              ...baseContent,
              markdown: parsed.resume_markdown,
              ats_score: parsed.ats_score,
              match_percentage: parsed.ats_score,
              skills_matched: parsed.skills_matched ?? [],
              skills_missing: parsed.skills_missing ?? [],
              tailoring_mode: mode,
              user_confirmations: confirmationsObj,
            }
          : {
              markdown: parsed.resume_markdown,
              ats_score: parsed.ats_score,
              match_percentage: parsed.ats_score,
              skills_matched: parsed.skills_matched ?? [],
              skills_missing: parsed.skills_missing ?? [],
              tailoring_mode: mode,
              user_confirmations: confirmationsObj,
            };

        let verRow: any = null;
        const safeLabel = (`Tailored for ${job.company || "Target Role"}`).slice(0, 200);
        const safePdfUrl = pdfUrl && pdfUrl.length <= 500 ? pdfUrl : null;

        if (existingVer) {
          const { data: updatedVer, error: updateVerErr } = await (supabase as any)
            .from("resume_versions")
            .update({
              content: versionContent,
              pdf_url: safePdfUrl,
              is_latest: true,
            })
            .eq("id", existingVer.id)
            .select("id")
            .single();
          if (updateVerErr) {
            console.error("[ResumeAgent] resume_versions update error:", updateVerErr);
          }
          verRow = updatedVer;
        } else {
          const nextVerNum = (userVersions?.[0]?.version_number || 0) + 1;
          await (supabase as any)
            .from("resume_versions")
            .update({ is_latest: false })
            .eq("user_id", targetUserId);

          const { data: newVer, error: insertVerErr } = await (supabase as any)
            .from("resume_versions")
            .insert({
              user_id: targetUserId,
              version_number: nextVerNum,
              version_label: safeLabel,
              is_latest: true,
              origin_type: "tailored",
              parent_version_id: parentVersionId,
              application_id: application.id,
              content: versionContent,
              pdf_url: safePdfUrl,
              template_id: "modern"
            })
            .select("id")
            .single();

          if (insertVerErr) {
            console.error("[ResumeAgent] resume_versions insert error:", insertVerErr);
          }
          verRow = newVer;
        }

        // Always update the application with the new resume version, ATS score, and matched skills!
        await (supabase as any)
          .from("applications")
          .update({
            ...(verRow?.id ? { resume_version_id: verRow.id } : {}),
            fit_score: parsed.ats_score,
            matched_skills: parsed.skills_matched ?? [],
            missing_skills: parsed.skills_missing ?? [],
          })
          .eq("id", application.id);

        console.log(`[ResumeAgent] Application ${application.id} updated with resume_version_id: ${verRow?.id || 'none'} and fit_score: ${parsed.ats_score}`);

        // Sync into tailored_resumes table
        try {
          const { data: userResumeRow } = await (supabase as any)
            .from("user_resume")
            .select("id")
            .eq("user_id", targetUserId)
            .maybeSingle();
          const validBaseResumeId = userResumeRow?.id || null;

          const { data: existingTailored } = await (supabase as any)
            .from("tailored_resumes")
            .select("id")
            .eq("application_id", application.id)
            .maybeSingle();

          if (existingTailored?.id) {
            await (supabase as any)
              .from("tailored_resumes")
              .update({
                base_resume_id: validBaseResumeId,
                tailored_content: versionContent,
                resume_markdown: parsed.resume_markdown,
                ats_score: parsed.ats_score,
                match_percentage: parsed.ats_score,
              })
              .eq("id", existingTailored.id);
          } else {
            await (supabase as any)
              .from("tailored_resumes")
              .insert({
                application_id: application.id,
                base_resume_id: validBaseResumeId,
                tailored_content: versionContent,
                resume_markdown: parsed.resume_markdown,
                ats_score: parsed.ats_score,
                match_percentage: parsed.ats_score,
              });
          }
        } catch (tailorSyncErr) {
          console.warn("[ResumeAgent] tailored_resumes sync notice:", tailorSyncErr);
        }
      } catch (verErr) {
        console.warn("[ResumeAgent] resume_versions insert warning:", verErr);
      }

      // Auto-trigger interview prep and QA bank in background without blocking resume return
      import("@/lib/actions/phase3").then(({ generateInterviewPrep, generateQABank }) => {
        generateInterviewPrep(application.id, accessToken).catch((prepErr) => {
          console.warn("[ResumeAgent] generateInterviewPrep warning:", prepErr?.message || prepErr);
        });
        generateQABank(application.id, accessToken).catch((qaErr) => {
          console.warn("[ResumeAgent] generateQABank warning:", qaErr?.message || qaErr);
        });
      }).catch(() => {});

      // Revalidate all caches so that /resumes, /applications, etc. immediately reflect the new tailored resume!
      try {
        const { revalidatePath } = await import("next/cache");
        revalidatePath("/resumes");
        revalidatePath("/applications");
        revalidatePath(`/applications/${application.id}`);
        revalidatePath(`/applications/${application.id}/resume`);
        revalidatePath(`/applications/${application.id}/builder`);
        revalidatePath("/dashboard");
      } catch (revErr) {
        // Ignored if called in non-Next lifecycle
      }

      console.log(`[ResumeAgent] Successfully generated and saved tailored resume.`);
      return {
        success: true,
        data: {
          ...inserted,
          tailoring_log: parsed.tailoring_log,
          ats_score: parsed.ats_score,
          match_percentage: parsed.ats_score,
          mode,
          skills_matched: parsed.skills_matched,
          skills_missing: parsed.skills_missing,
          resume_markdown: parsed.resume_markdown,
          pdf_url: pdfUrl,
        }
      };
    } catch (error: any) {
      console.error("[ResumeAgent] Fatal Error:", error);
      return { success: false, message: error.message };
    }
  }
}
