"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { extractText } from "unpdf";
import PDFDocument from "pdfkit";

// ─── PDF Generation ────────────────────────────────────────────────────────────

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

// ─── Supabase Bucket Upload ────────────────────────────────────────────────────

async function uploadToSupabaseBucket(
  supabase: any,
  userId: string,
  folder: "resumes" | "cover-letters",
  filename: string,
  buffer: Buffer
): Promise<string | null> {
  const path = `${userId}/${folder}/${filename}`;
  const { data, error } = await supabase.storage
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


// ─── Feature 1: Resume Auto-Generator ─────────────────────────────────────────

export async function generateTailoredResume(applicationId: string) {
  try {
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

    // Extract resume text
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
          } catch {}
        }
      }
    }

    const prompt = `You are an expert ATS resume writer. Return ONLY a raw JSON object.

User resume (truncated):
${truncate(resumeText)}

Job: ${job.title} at ${job.company}
${truncate(job.description || "")}

**CRITICAL RULE: Truthful Tailoring**
- You may reorder, highlight, or rephrase existing bullet points to better match the job description.
- You MUST NOT invent, hallucinate, or add skills, experiences, metrics, or degrees that are not explicitly present in the original resume.
- Any modifications must be supported by the user's provided evidence.

Format the resume_markdown to match this exact shape:
# Name
email | phone

## Summary
...

## Skills
- skill1

## Experience
### Title - Company
date
- bullet

## Education
...`;

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
      console.error("DB insert error:", insertError);
      return { success: false, message: "Failed to save generated resume." };
    }

    return { success: true, data: { ...inserted, tailoring_log: parsed.tailoring_log } };
  } catch (error: any) {
    console.error("generateTailoredResume error:", error);
    return { success: false, message: error.message };
  }
}

// ─── Feature 2: Cover Letter Generator ────────────────────────────────────────

export async function generateCoverLetter(applicationId: string, tone = "Professional") {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { success: false, message: "Gemini API key not configured." };

    const { data: application } = await supabase
      .from("applications")
      .select("id, resume_id, job:jobs (title, company, description)")
      .eq("id", applicationId)
      .single();

    if (!application || !application.job || Array.isArray(application.job)) {
      return { success: false, message: "Not found." };
    }
    const job = application.job as any;

    let resumeText = "No resume provided.";
    if (application.resume_id) {
      const { data: resume } = await supabase
        .from("resumes")
        .select("file_path, file_url")
        .eq("id", application.resume_id)
        .single();

      if (resume?.file_path) {
        const { data: fd } = await supabase.storage.from("resumes").download(resume.file_path);
        if (fd) {
          try {
            const { text } = await extractText(new Uint8Array(await fd.arrayBuffer()), { mergePages: true });
            resumeText = text;
          } catch {}
        }
      } else if (resume?.file_url) {
        const r = await fetch(resume.file_url);
        if (r.ok) {
          try {
            const { text } = await extractText(new Uint8Array(await r.arrayBuffer()), { mergePages: true });
            resumeText = text;
          } catch {}
        }
      }
    }

    const prompt = `You are an expert cover letter writer. Return ONLY a raw JSON object.

Resume (truncated):
${truncate(resumeText)}

Job: ${job.title} at ${job.company}
${truncate(job.description || "")}

Write a ${tone} cover letter (3-4 paragraphs, ends with a call to action).`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cover_letter: { type: Type.STRING }
          },
          required: ["cover_letter"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");

    const pdfBuffer = await generatePDFBuffer(parsed.cover_letter || "");
    const filename = `cover-letter-${applicationId}-${Date.now()}.pdf`;
    const pdfUrl = await uploadToSupabaseBucket(supabase, user.id, "cover-letters", filename, pdfBuffer);

    const { data: inserted, error: insertError } = await supabase
      .from("cover_letters_generated")
      .insert({
        user_id: user.id,
        application_id: application.id,
        job_title: job.title,
        company: job.company,
        cover_letter_content: parsed.cover_letter,
        tone,
        pdf_url: pdfUrl,
      })
      .select()
      .single();

    if (insertError) return { success: false, message: "Failed to save cover letter." };

    return { success: true, data: inserted };
  } catch (error: any) {
    console.error("generateCoverLetter error:", error);
    return { success: false, message: error.message };
  }
}

// ─── Feature 3: Skills Gap Analysis ───────────────────────────────────────────

export async function analyzeSkillGaps() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: matches } = await supabase
      .from("job_matches")
      .select("missing_skills")
      .eq("user_id", user.id);

    if (!matches || matches.length === 0) {
      return { success: true, message: "No job matches found to analyze." };
    }

    const skillCounts: Record<string, number> = {};
    for (const m of matches) {
      const missing = m.missing_skills as string[] | null;
      if (Array.isArray(missing)) {
        for (const skill of missing) {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        }
      }
    }

    await supabase.from("skill_gaps").delete().eq("user_id", user.id);

    const inserts = Object.entries(skillCounts).map(([skill, count]) => ({
      user_id: user.id,
      skill_name: skill,
      required_in_count: count,
      priority: count,
    }));

    if (inserts.length > 0) {
      await supabase.from("skill_gaps").insert(inserts);
    }

    return { success: true, data: inserts };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ─── Feature 4: Learning Path Generator ───────────────────────────────────────

export async function generateLearningPath(skillId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: gap } = await supabase.from("skill_gaps").select("*").eq("id", skillId).single();
    if (!gap) return { success: false, message: "Skill gap not found." };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { success: false, message: "No Gemini key." };

    const prompt = `Suggest the best free and paid learning resources for the skill: "${gap.skill_name}".`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  resource_name: { type: Type.STRING },
                  url: { type: Type.STRING },
                  price: { type: Type.INTEGER },
                  duration_minutes: { type: Type.INTEGER },
                  difficulty: { type: Type.STRING }
                },
                required: ["platform", "resource_name", "url", "price", "duration_minutes", "difficulty"]
              }
            }
          },
          required: ["resources"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");

    const resources = (parsed.resources || []).map((r: any) => ({
      ...r,
      skill_name: gap.skill_name,
    }));

    const { data: savedResources, error: rError } = await supabase
      .from("learning_resources")
      .insert(resources)
      .select();

    if (rError) return { success: false, message: "Failed to save resources." };

    if (savedResources && savedResources.length > 0) {
      await supabase.from("learning_paths").insert({
        user_id: user.id,
        skill_id: gap.id,
        resource_id: savedResources[0].id,
        status: "not_started",
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("generateLearningPath error:", error);
    return { success: false, message: error.message };
  }
}

// ─── Mark Learning Resource Complete ──────────────────────────────────────────

export async function markResourceComplete(pathId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { error } = await supabase
      .from("learning_paths")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        progress_percentage: 100,
      })
      .eq("id", pathId)
      .eq("user_id", user.id);

    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ─── Save Resume Edits ─────────────────────────────────────────────────────────

export async function saveResumeEdits(resumeId: string, markdown: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    // Re-generate PDF with updated content
    const pdfBuffer = await generatePDFBuffer(markdown);
    const filename = `resume-edited-${resumeId}-${Date.now()}.pdf`;
    const pdfUrl = await uploadToSupabaseBucket(supabase, user.id, "resumes", filename, pdfBuffer);

    const { error } = await supabase
      .from("resumes_generated")
      .update({ resume_markdown: markdown, pdf_url: pdfUrl })
      .eq("id", resumeId)
      .eq("user_id", user.id);

    if (error) return { success: false, message: error.message };
    return { success: true, pdfUrl };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ─── Regenerate Cover Letter with Tone ────────────────────────────────────────

export async function regenerateCoverLetterWithTone(applicationId: string, tone: string) {
  return generateCoverLetter(applicationId, tone);
}

// ─── Save Cover Letter Edits ───────────────────────────────────────────────────

export async function saveCoverLetterEdits(letterId: string, content: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const pdfBuffer = await generatePDFBuffer(content);
    const filename = `cover-letter-edited-${letterId}-${Date.now()}.pdf`;
    const pdfUrl = await uploadToSupabaseBucket(supabase, user.id, "cover-letters", filename, pdfBuffer);

    const { error } = await supabase
      .from("cover_letters_generated")
      .update({ cover_letter_content: content, pdf_url: pdfUrl })
      .eq("id", letterId)
      .eq("user_id", user.id);

    if (error) return { success: false, message: error.message };
    return { success: true, pdfUrl };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
