import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
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

  const { data: signed } = await supabase.storage
    .from("generated-docs")
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  return signed?.signedUrl ?? null;
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

      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("id, resume_id, job:jobs ( title, company, description )")
        .eq("id", applicationId)
        .single();

      if (appError || !application || !application.job || Array.isArray(application.job)) {
        return { success: false, message: "Application or Job not found." };
      }
      const job = application.job as any;

      // 1. Context Gathering: Extract user's base resume text
      let resumeText = "No resume provided.";
      if (application.resume_id) {
        const { data: resume } = await supabase
          .from("resumes")
          .select("file_path, file_url")
          .eq("id", application.resume_id)
          .single();

        if (resume) {
          let buf: Buffer | null = null;
          if (resume.file_path) {
            const { data: fd } = await supabase.storage.from("resumes").download(resume.file_path);
            if (fd) buf = Buffer.from(await fd.arrayBuffer());
          } else if (resume.file_url) {
            const r = await fetch(resume.file_url);
            if (r.ok) buf = Buffer.from(await r.arrayBuffer());
          }
          if (buf) {
            try {
              const { text } = await extractText(new Uint8Array(buf), { mergePages: true });
              resumeText = text;
            } catch (e) {
              console.error("[ResumeAgent] Error extracting pdf text", e);
            }
          }
        }
      }

      // 2. Prompt Engineering
      const prompt = `You are an expert ATS resume writer and AI Recruiter. 
Your task is to tailor the user's resume for the provided Job Description, maximizing the ATS match score while strictly adhering to the truth.

--- User Base Resume ---
${truncate(resumeText)}

--- Target Job Description ---
Job Title: ${job.title}
Company: ${job.company}
Description:
${truncate(job.description || "")}

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
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
      const pdfBuffer = await generatePDFBuffer(parsed.resume_markdown || "");
      const filename = `resume-${applicationId}-${Date.now()}.pdf`;
      const pdfUrl = await uploadToSupabaseBucket(supabase, user.id, "resumes", filename, pdfBuffer);

      const { data: inserted, error: insertError } = await supabase
        .from("resumes_generated")
        .insert({
          user_id: user.id,
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
        return { success: false, message: "Failed to save generated resume." };
      }

      console.log(`[ResumeAgent] Successfully generated and saved tailored resume.`);
      return { success: true, data: { ...inserted, tailoring_log: parsed.tailoring_log } };
    } catch (error: any) {
      console.error("[ResumeAgent] Fatal Error:", error);
      return { success: false, message: error.message };
    }
  }
}
