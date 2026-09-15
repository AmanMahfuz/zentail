import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { InterviewConfigSchema } from "@/lib/interview/schemas";
import { generateAdaptiveQuestions } from "@/lib/interview/generate-questions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const config = InterviewConfigSchema.parse(body);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: app, error } = await supabase
      .from("applications")
      .select("*, jobs(title, company, description)")
      .eq("id", config.applicationId)
      .eq("user_id", user.id)
      .single();

    if (error || !app || !app.jobs) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;

    // TODO: Connect resume and skill gaps. Using placeholders for now.
    const resumeContent = "Placeholder resume content";
    const skillGaps: any[] = [];

    const questions = await generateAdaptiveQuestions(
      config,
      job.description || "",
      resumeContent,
      skillGaps
    );

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
    }

    const { data: session, error: sessionError } = await (supabase as any)
      .from("interview_sessions")
      .insert({
        user_id: user.id,
        application_id: config.applicationId,
        questions: questions,
        status: "active",
        difficulty: config.difficulty,
        tracks: config.tracks,
        mode: config.mode
      })
      .select()
      .single();

    if (sessionError) {
      return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
    }

    return NextResponse.json({ 
      sessionId: session.id, 
      questions,
      config
    });
  } catch (error: any) {
    console.error("Start API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
