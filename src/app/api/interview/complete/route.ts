import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateComprehensiveFinalReport } from "@/lib/interview/final-report";
import { z } from "zod";

const CompleteSchema = z.object({
  sessionId: z.string().uuid()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId } = CompleteSchema.parse(body);

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    const { createAuthClient } = await import("@/lib/supabase/server");
    const supabase = token ? createAuthClient(token) : await createClient();
    const { data: { user } } = await (token ? supabase.auth.getUser(token) : supabase.auth.getUser());

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: session } = await (supabase as any)
      .from("interview_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    let answers: any[] = Array.isArray(session?.answers) ? session.answers : [];

    if (answers.length === 0) {
      const { data: dbAnswers } = await (supabase as any)
        .from("interview_answers")
        .select("*")
        .eq("session_id", sessionId);

      if (dbAnswers && dbAnswers.length > 0) {
        answers = dbAnswers;
      }
    }

    if (answers.length === 0) {
      return NextResponse.json({ error: "Answers not found" }, { status: 404 });
    }

    // Connect real skill gaps if present
    const skillGaps = ["System Design", "Performance Optimization", "Technical Communication"];

    const report = await generateComprehensiveFinalReport(answers, skillGaps);

    await (supabase as any)
      .from("interview_sessions")
      .update({
        score: report.overallScore,
        overall_feedback: report.summary,
        strengths: report.strengths || [],
        weaknesses: report.priorityFixes || [],
        skills_performed_well: report.strengths || [],
        skills_to_improve: report.learningPlan || [],
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Complete API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
