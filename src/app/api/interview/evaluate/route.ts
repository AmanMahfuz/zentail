import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EvaluateAnswerSchema } from "@/lib/interview/schemas";
import { evaluateAnswerStrictly } from "@/lib/interview/evaluate-answer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = EvaluateAnswerSchema.parse(body);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: session, error: sessionError } = await (supabase as any)
      .from("interview_sessions")
      .select("*")
      .eq("id", data.sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const question = session.questions[data.questionIndex];
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 400 });
    }

    const evaluation = await evaluateAnswerStrictly(
      question.question,
      question.track,
      data.answer,
      data.answerType
    );

    await (supabase as any)
      .from("interview_answers")
      .insert({
        session_id: data.sessionId,
        question_index: data.questionIndex,
        question: question.question,
        answer: data.answer,
        answer_type: data.answerType,
        scores: evaluation,
      });

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error("Evaluate API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
