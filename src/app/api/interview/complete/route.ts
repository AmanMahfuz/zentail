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

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: answers, error: answersError } = await (supabase as any)
      .from("interview_answers")
      .select("*")
      .eq("session_id", sessionId);

    if (answersError || !answers || answers.length === 0) {
      return NextResponse.json({ error: "Answers not found" }, { status: 404 });
    }

    // TODO: Connect real skill gaps
    const skillGaps = ["TypeScript", "System Design"];

    const report = await generateComprehensiveFinalReport(answers, skillGaps);

    await (supabase as any)
      .from("interview_sessions")
      .update({
        status: "completed",
        final_score: report.overallScore,
        final_report: JSON.stringify(report),
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
