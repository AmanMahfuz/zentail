"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { GoogleGenAI, Type } from "@google/genai";

export type InterviewType = "technical" | "hr" | "case" | "other";

export async function createInterview(
  applicationId: string,
  data: {
    round: number;
    interview_type: InterviewType;
    scheduled_at: string;
    notes?: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { data: interview, error } = await supabase
    .from("interviews")
    .insert({
      application_id: applicationId,
      round: data.round,
      interview_type: data.interview_type,
      scheduled_at: data.scheduled_at,
      notes: data.notes || "",
      prep_status: "pending",
    })
    .select()
    .single();

  if (error || !interview) {
    console.error("Create interview error:", error);
    return { success: false, message: "Failed to create interview." };
  }

  // Auto-create an empty prep workspace for it
  const { error: prepError } = await supabase
    .from("interview_prep")
    .insert({
      interview_id: interview.id,
      topics: [],
      questions: [],
      answers: {},
      checklist: [
        { id: "1", text: "Research company recent news", completed: false },
        { id: "2", text: "Test audio and video setup", completed: false },
        { id: "3", text: "Prepare 3 questions to ask them", completed: false },
        { id: "4", text: "Review job description carefully", completed: false },
      ],
    });

  if (prepError) {
    console.error("Create prep error:", prepError);
  }

  revalidatePath("/applications");
  revalidatePath("/interviews");
  return { success: true, interviewId: interview.id };
}

export async function getInterviews() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, data: [] };

  const { data, error } = await supabase
    .from("interviews")
    .select(`
      id,
      application_id,
      round,
      interview_type,
      scheduled_at,
      prep_status,
      notes,
      created_at,
      applications (
        id,
        jobs (
          company,
          title
        )
      )
    `)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("Get interviews error:", error);
    return { success: false, data: [] };
  }

  // Filter to only include interviews where the user owns the application
  // In a real app we'd want RLS to handle this, but since applications belong to the user,
  // we could do a direct join. Supabase RLS will actually filter out applications the user doesn't own.
  const validInterviews = data.filter(i => i.applications !== null);

  return { success: true, data: validInterviews };
}

export async function getInterviewDetails(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false };

  const { data: interview, error: iError } = await supabase
    .from("interviews")
    .select(`
      id,
      application_id,
      round,
      interview_type,
      scheduled_at,
      prep_status,
      notes,
      created_at,
      applications (
        id,
        jobs (
          company,
          title,
          description
        ),
        resume_id
      )
    `)
    .eq("id", id)
    .single();

  if (iError || !interview || !interview.applications) {
    return { success: false, error: iError, interview, message: "Failed at getInterviewDetails" };
  }

  const { data: prep, error: pError } = await supabase
    .from("interview_prep")
    .select("*")
    .eq("interview_id", id)
    .single();

  return { success: true, interview, prep: prep || null };
}

export async function generateAITopics(interviewId: string, jobTitle: string, company: string, description: string | null) {
  const supabase = await createClient();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { success: false, message: "No API key" };

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert technical interviewer. I have an upcoming interview for the role of ${jobTitle} at ${company}.
    
Job Description:
${description ? description.substring(0, 2000) : "No description provided."}

Please generate exactly 5 likely interview topics or questions I should prepare for. Focus on technical, system design, or domain-specific areas.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const parsed = JSON.parse(response.text || "[]");
    let topics = [];
    if (Array.isArray(parsed)) topics = parsed;
    else if (parsed.topics && Array.isArray(parsed.topics)) topics = parsed.topics;

    // Save to DB
    const { error: dbErr } = await supabase.from("interview_prep").update({ topics }).eq("interview_id", interviewId);
    if (dbErr) console.error("Failed to update prep topics:", dbErr);
    
    revalidatePath(`/interviews/${interviewId}`);
    return { success: true, topics };
  } catch (err) {
    console.error("AI Topics Error:", err);
    return { success: false, message: "AI generation failed" };
  }
}

export async function evaluateAIPracticeAnswer(question: string, answer: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { success: false, message: "No API key" };

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a tough but fair technical interviewer. I am practicing for an interview.
    
Question: ${question}
My Answer: ${answer}

Evaluate my answer. Return a JSON object with:
1. "score": a number from 1 to 10
2. "feedback": a 2-3 sentence critique of what I did well and what's missing (e.g. STAR method).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING }
          },
          required: ["score", "feedback"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return { success: true, result: parsed };
  } catch (err) {
    console.error("AI Evaluation Error:", err);
    return { success: false, message: "AI evaluation failed" };
  }
}

export async function updateChecklist(interviewId: string, checklist: any[]) {
  const supabase = await createClient();
  await supabase.from("interview_prep").update({ checklist }).eq("interview_id", interviewId);
  return { success: true };
}
