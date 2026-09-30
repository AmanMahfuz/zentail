import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { generateContentWithRetry } from "@/lib/gemini";
import { extractText } from "unpdf";
import PDFDocument from "pdfkit";

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

export class ResumeAgent {
  /**
   * Generates a tailored resume for a specific application using Gemini 2.0 Flash.
   */
  static async tailorForJob(applicationId: string) {
    try {
      console.log(`[ResumeAgent] Starting tailoring for application: ${applicationId}`);
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, message: "Unauthorized" };

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return { success: false, message: "Gemini API key not configured." };

      const { data: application, error: appError } = await (supabase as any)
        .from("applications")
        .select("id, resume_version_id, fit_score, job_title, company_name, job_description, job:jobs ( title, company, description )")
        .eq("id", applicationId)
        .single();

      if (appError || !application) {
        return { success: false, message: "Application not found." };
      }

      // Interview Qualification Check: If candidate's resume already has an interview-ready score (>= 80%),
      // do not create unnecessary tailored copies!
      if ((application.fit_score ?? 0) >= 80) {
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

              // If candidate's existing resume already matches >= 80%, link it directly without tailoring!
              if (scanMatchPct >= 80) {
                console.log(`[ResumeAgent] Resume "${bestVer.version_label}" matches at ${scanMatchPct}% (>= 80%). Linking directly without tailoring.`);
                await (supabase as any)
                  .from("applications")
                  .update({
                    resume_version_id: bestVer.id,
                    fit_score: Math.max(application.fit_score || 0, scanMatchPct),
                    fit_level: "strong"
                  })
                  .eq("id", application.id);

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

      // If user has no resume text yet, look up latest valid resume_versions globally
      if (!resumeText || resumeText.trim().length < 50 || resumeText === "{}") {
        const { data: fallbackVer } = await (supabase as any)
          .from("resume_versions")
          .select("*")
          .not("content", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fallbackVer?.content) {
          bestVer = fallbackVer;
          parentVersionId = fallbackVer.id;
          baseContent = fallbackVer.content;
          resumeText = JSON.stringify(fallbackVer.content, null, 2);
        }
      }

      if (!resumeText || resumeText.trim().length < 50) {
        throw new Error("Cannot tailor resume: No base resume found for candidate.");
      }

      // 2. Prompt Engineering
      const prompt = `You are an expert ATS resume writer and AI Recruiter. 
Your task is to tailor the user's resume for the provided Job Description, maximizing the ATS match score while strictly adhering to the truth.

--- Selected Base Resume (From User Collection: "${bestVer?.version_label || 'Default'}") ---
${truncate(resumeText)}

--- Target Job Description ---
Job Title: ${job.title}
Company: ${job.company}
Description:
${truncate(job.description || "")}

--- Tailoring Strategy & Rationale ---
Strategy: ${scanStrategy}
Baseline Match: ${scanMatchPct}%
${scanRationale ? `Rationale: ${scanRationale}\n` : ""}

${scanStrategy === "minor_alterations" 
  ? "**STRATEGY NOTE: MINOR ALTERATIONS**\nThis resume is ALREADY a very close match to the target JD. Retain the strong existing structure and only make precise, targeted alterations (headline alignment, key tool emphasis, and metric sharpening) to fit ${job.company}."
  : "**STRATEGY NOTE: ADAPTIVE TAILORING**\nReorder and emphasize matching skills, sharpen experience bullet points with relevant keywords, and align the professional summary to ${job.title} at ${job.company}."
}

**CRITICAL RULE: Truthful Tailoring**
- You may reorder, highlight, or rephrase existing bullet points to better match the job description's keywords.
- You MUST NOT invent, hallucinate, or add skills, experiences, metrics, or degrees that are not explicitly present in the original resume.
- If the job requires a skill the user DOES NOT have, do NOT add it.

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
      console.log(`[ResumeAgent] Calling Gemini...`);
      const response = await generateContentWithRetry({
        ai,
        contents: prompt,
        config: {
          temperature: 0.2,
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

      const parsed = JSON.parse(response.text || "{}");
      console.log(`[ResumeAgent] Gemini returned score: ${parsed.ats_score}`);

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

        const versionContent = baseContent
          ? {
              ...baseContent,
              markdown: parsed.resume_markdown,
              ats_score: parsed.ats_score,
              match_percentage: parsed.ats_score,
              skills_matched: parsed.skills_matched ?? [],
              skills_missing: parsed.skills_missing ?? [],
            }
          : {
              markdown: parsed.resume_markdown,
              ats_score: parsed.ats_score,
              match_percentage: parsed.ats_score,
              skills_matched: parsed.skills_matched ?? [],
              skills_missing: parsed.skills_missing ?? [],
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
      } catch (verErr) {
        console.warn("[ResumeAgent] resume_versions insert warning:", verErr);
      }

      // Auto-trigger interview prep text pack for this application
      try {
        const { generateInterviewPrep } = await import("@/lib/actions/phase3");
        await generateInterviewPrep(application.id);
      } catch (prepErr) {
        console.warn("[ResumeAgent] generateInterviewPrep warning:", prepErr);
      }

      // Auto-trigger 15-question interview Q&A bank
      try {
        const { generateQABank } = await import("@/lib/actions/phase3");
        await generateQABank(application.id);
      } catch (qaErr) {
        console.warn("[ResumeAgent] generateQABank warning:", qaErr);
      }

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
      return { success: true, data: { ...inserted, tailoring_log: parsed.tailoring_log } };
    } catch (error: any) {
      console.error("[ResumeAgent] Fatal Error:", error);
      return { success: false, message: error.message };
    }
  }
}
