"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { generateContentWithRetry } from "@/lib/gemini";
import { extractText } from "unpdf";
import PDFDocument from "pdfkit";
import { getCachedAIResult, setCachedAIResult, CACHE_TTL_DAYS } from "@/lib/cache";

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
    const { ResumeAgent } = await import("@/lib/agents/resume-agent");
    return await ResumeAgent.tailorForJob(applicationId);
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

    const { data: application } = await (supabase as any)
      .from("applications")
      .select("id, resume_version_id, job_title, company_name, job_description, job:jobs (title, company, description)")
      .eq("id", applicationId)
      .single();

    if (!application) {
      return { success: false, message: "Not found." };
    }
    const job = (application.job as any) || {
      title: application.job_title || "Role",
      company: application.company_name || "Company",
      description: application.job_description || ""
    };

    let resumeText = "No resume provided.";
    if (application.resume_version_id) {
      const { data: ver } = await (supabase as any)
        .from("resume_versions")
        .select("content")
        .eq("id", application.resume_version_id)
        .single();
      if (ver?.content) {
        resumeText = JSON.stringify(ver.content, null, 2);
      }
    } else {
      const { data: ev } = await (supabase as any)
        .from("user_evidence")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (ev) {
        resumeText = JSON.stringify(ev, null, 2);
      }
    }

    const prompt = `You are an expert cover letter writer. Return ONLY a raw JSON object.

Resume (truncated):
${truncate(resumeText)}

Job: ${job.title} at ${job.company}
${truncate(job.description || "")}

Write a ${tone} cover letter (3-4 paragraphs, ends with a call to action).`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await generateContentWithRetry({
      ai,
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
    const response = await generateContentWithRetry({
      ai,
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

// ─── Generate Interview Prep ───────────────────────────────────────────────────

export async function generateInterviewPrep(applicationId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { success: false, message: "Gemini API key not configured." };

    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return { success: false, message: "Application not found." };
    }

    // 1. If prep already exists for this application, return it immediately
    const { data: existingPrep } = await (supabase as any)
      .from("interview_preps")
      .select("*")
      .eq("application_id", applicationId)
      .single();

    if (existingPrep && Array.isArray(existingPrep.topics) && existingPrep.topics.length > 0) {
      return { success: true, data: existingPrep, cached: true };
    }

    const { data: evidence } = await supabase
      .from("user_evidence")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // 2. Check persistent AI cache across similar roles
    const cacheInput = {
      jobTitle: application.job_title,
      company: application.company_name,
      jobDescription: application.job_description,
      summary: evidence?.summary || null,
    };

    const cachedAI = await getCachedAIResult<any>("interview_prep", cacheInput, {
      tokensToAdd: 2200,
    });

    let parsed = cachedAI?.data;

    if (!parsed) {
      const prompt = `
You are an expert technical recruiter and interview coach.
Analyze the following Job Description and the candidate's profile to generate an interview prep pack.

Job Title: ${application.job_title}
Company: ${application.company_name}
Job Description: ${truncate(application.job_description || "Not provided")}

Candidate Profile Summary: ${truncate(evidence?.summary || "Not provided")}

Generate a JSON object containing:
1. "signals": An array of strings representing the key technical and soft skill signals the interviewer will look for (e.g. ["Node.js", "System Design"]).
2. "topics": An array of expected interview topics/rounds. Each object should have:
   - "title" (e.g., "Live Coding Expectations", "System Architecture")
   - "time" (e.g., "45 Min")
   - "description" (e.g., "Typical test: Build a debounce utility...")
   - "icon" (string: "Code2", "Cpu", "MessageSquare", "Layers")
   - "skills" (array of strings, e.g., ["Algorithm", "Data Structures"])
3. "mock_questions": An array of predicted questions. Each object should have:
   - "question" (string)
   - "answer_hints" (array of strings, key points to mention)
      `;

      const ai = new GoogleGenAI({ apiKey });
      const response = await generateContentWithRetry({
        ai,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              signals: { type: Type.ARRAY, items: { type: Type.STRING } },
              topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    time: { type: Type.STRING },
                    description: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["title", "time", "description", "icon", "skills"]
                }
              },
              mock_questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer_hints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["question", "answer_hints"]
                }
              }
            },
            required: ["signals", "topics", "mock_questions"]
          }
        }
      });

      parsed = JSON.parse(response.text || "{}");

      // Save to AI cache
      await setCachedAIResult("interview_prep", cacheInput, parsed, {
        ttlDays: CACHE_TTL_DAYS.INTERVIEW_PREP,
        tokens: 2200,
        model: "gemini-2.5-flash",
      });
    }

    // Save to database
    const { data: inserted, error: insertError } = await (supabase as any)
      .from("interview_preps")
      .upsert({
        application_id: applicationId,
        user_id: user.id,
        signals: parsed.signals || [],
        topics: parsed.topics || [],
        mock_questions: parsed.mock_questions || [],
        status: "ready"
      }, { onConflict: "application_id" })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return { success: false, message: "Failed to save interview prep." };
    }

    return { success: true, data: inserted };
  } catch (error: any) {
    console.error("generateInterviewPrep error:", error);
    return { success: false, message: error.message };
  }
}

export async function generateQABank(applicationId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch application details
    const { data: app, error: appError } = await (supabase as any)
      .from("applications")
      .select("id, user_id, job_title, company_name, job_description")
      .eq("id", applicationId)
      .single();

    if (appError || !app) {
      return { success: false, message: "Application not found" };
    }

    const userId = app.user_id || user?.id;

    // 2. Check if qa_banks already has questions
    const { data: existing } = await (supabase as any)
      .from("qa_banks")
      .select("id, questions")
      .eq("application_id", applicationId)
      .maybeSingle();

    if (existing && existing.questions && (existing.questions as any[]).length > 0) {
      return { success: true, qaBank: existing };
    }

    // 3. Generate questions using Gemini or fallback
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    let questions: any[] = [];

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are an expert technical interviewer. Generate 15 realistic interview questions for:
POSITION: ${app.job_title}
COMPANY: ${app.company_name}
JOB DESCRIPTION: ${app.job_description || app.job_title}

Return ONLY raw JSON array:
[
  {
    "id": "q-1",
    "question": "Question text",
    "category": "behavioral|technical|situational|cultural",
    "difficulty": "easy|medium|hard",
    "howToAnswer": "Advice on how to structure the answer",
    "sampleAnswer": "High scoring sample answer",
    "keywords": ["keyword1", "keyword2"]
  }
]`;
        const response = await generateContentWithRetry({
          ai,
          contents: prompt,
        });

        const text = response.text || "";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn("Gemini QA bank generation error:", e);
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      questions = [
        {
          id: "q-1",
          question: `Tell me about a challenging project related to ${app.job_title} that you led or contributed to. What was your approach?`,
          category: "behavioral",
          difficulty: "medium",
          howToAnswer: "Use the STAR framework (Situation, Task, Action, Result). Highlight quantifiable metrics and personal ownership.",
          sampleAnswer: "In my recent project, I led the architectural overhaul of our core service, decreasing processing latency by 35% and improving uptime to 99.9%.",
          keywords: ["STAR method", "architecture", "results"]
        },
        {
          id: "q-2",
          question: `What are the core technical design principles you rely on when building scalable solutions for ${app.job_title}?`,
          category: "technical",
          difficulty: "hard",
          howToAnswer: "Discuss separation of concerns, modularity, resiliency, and trade-offs between delivery speed vs. technical debt.",
          sampleAnswer: "I prioritize loose coupling, idempotent API contracts, and robust observability patterns.",
          keywords: ["scalability", "modularity", "trade-offs"]
        },
        {
          id: "q-3",
          question: `Why are you interested in joining ${app.company_name} in this ${app.job_title} position?`,
          category: "cultural",
          difficulty: "easy",
          howToAnswer: "Align your professional background with company goals, culture, and market impact.",
          sampleAnswer: `I've followed ${app.company_name}'s product innovation and want to bring my specialized engineering experience to solve these challenges.`,
          keywords: ["mission", "culture", "growth"]
        }
      ];
    }

    // 4. Save to qa_banks
    const { data: savedBank, error: saveErr } = await (supabase as any)
      .from("qa_banks")
      .upsert({
        application_id: applicationId,
        user_id: userId,
        questions,
      }, { onConflict: "application_id" })
      .select()
      .single();

    if (saveErr) {
      console.error("Failed to save QA bank:", saveErr);
      return { success: false, message: saveErr.message };
    }

    // 5. Update application timestamp
    await (supabase as any)
      .from("applications")
      .update({ qa_bank_generated_at: new Date().toISOString() })
      .eq("id", applicationId);

    return { success: true, data: savedBank };
  } catch (err: any) {
    console.error("generateQABank error:", err);
    return { success: false, message: err.message };
  }
}
