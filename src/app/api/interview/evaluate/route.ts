// src/app/api/interview/evaluate/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateAdaptiveAnswer } from "@/lib/interview/adaptive-engine";
import { InterviewRoleFamily } from "@/config/interviewTracks";

export async function POST(request: Request) {
  try {
    let question: any;
    let textAnswer = "";
    let audioBase64: string | undefined;
    let audioMimeType: string | undefined;
    let roleFamily: string | undefined;
    let jobDescription: string | undefined;
    let sessionId: string | undefined;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const audioFile = formData.get("audio") as Blob | null;
      if (audioFile) {
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        audioBase64 = buffer.toString("base64");
        audioMimeType = audioFile.type || "audio/webm";
      }

      const qRaw = formData.get("question");
      if (qRaw) {
        try {
          question = JSON.parse(String(qRaw));
        } catch {
          question = { question: String(qRaw) };
        }
      }

      textAnswer = String(formData.get("textAnswer") || "");
      sessionId = String(formData.get("interviewId") || formData.get("sessionId") || "");
      roleFamily = String(formData.get("roleFamily") || "technology");
      jobDescription = String(formData.get("jobDescription") || "");
    } else {
      const body = await request.json();
      question = body.question;
      textAnswer = body.textAnswer || body.answer || "";
      audioBase64 = body.audioBase64;
      audioMimeType = body.audioMimeType;
      roleFamily = body.roleFamily;
      jobDescription = body.jobDescription;
      sessionId = body.sessionId;
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    const { createAuthClient } = await import("@/lib/supabase/server");
    const supabase = token ? createAuthClient(token) : await createClient();
    const {
      data: { user },
    } = await (token ? supabase.auth.getUser(token) : supabase.auth.getUser());

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const answerContent = textAnswer || "";

    if (!answerContent && !audioBase64) {
      return NextResponse.json(
        { error: "Please provide an answer (text or voice) to evaluate." },
        { status: 400 }
      );
    }

    let session: any = null;
    if (sessionId && !sessionId.startsWith("temp-")) {
      const { data: existingSession, error: sessErr } = await (supabase as any)
        .from("interview_sessions")
        .select("id, answers")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (sessErr || !existingSession) {
        return NextResponse.json(
          { error: "Session not found or unauthorized" },
          { status: 404 }
        );
      }
      session = existingSession;
    }

    const questionObj =
      typeof question === "object" && question !== null
        ? question
        : { question: String(question || "Interview Question") };

    const { evaluation, nextQuestionAudio, nextMimeType } =
      await evaluateAdaptiveAnswer({
        question: questionObj,
        textAnswer: answerContent,
        audioBase64,
        audioMimeType,
        roleFamily: (roleFamily as InterviewRoleFamily) || "technology",
        jobDescription,
      });

    // Save to Supabase for the authenticated session
    try {
      if (session) {
        const currentAnswers = Array.isArray(session?.answers) ? [...session.answers] : [];
        const finalIndex = currentAnswers.length;

        const newAnswerItem = {
          questionId: questionObj.id || `q-${finalIndex + 1}`,
          question: questionObj.question || questionObj.text || "Interview question",
          text: answerContent || evaluation.transcript || "Voice response",
          transcript: evaluation.transcript,
          score: evaluation.overall_score || 75,
          scores: evaluation,
          feedback: evaluation.priority_fix || "Good response",
          detailed_scores: evaluation.detailed_scores,
          what_worked: evaluation.what_worked,
          priority_fix: evaluation.priority_fix,
          better_structure: evaluation.better_structure,
          answer_type: audioBase64 ? "audio" : "text",
        };

        currentAnswers.push(newAnswerItem);

        await (supabase as any)
          .from("interview_sessions")
          .update({ answers: currentAnswers })
          .eq("id", sessionId)
          .eq("user_id", user.id);

        try {
          await (supabase as any).from("interview_answers").insert({
            session_id: sessionId,
            question_index: finalIndex,
            question: questionObj.question || questionObj.text || "Interview question",
            answer: answerContent || evaluation.transcript || "Voice response",
            answer_type: audioBase64 ? "audio" : "text",
            scores: evaluation,
          });
        } catch {
          // ignore backward compat
        }
      }
    } catch (dbErr) {
      console.warn("Save answer warning:", dbErr);
    }

    return NextResponse.json({
      success: true,
      evaluation,
      nextQuestion: evaluation.next_question,
      nextQuestionAudio,
      nextMimeType,
      // Backward compatibility fields
      overallScore: evaluation.overall_score,
      feedback: {
        whatWorked: evaluation.what_worked,
        priorityFix: evaluation.priority_fix,
        betterStructure: evaluation.better_structure,
      },
    });
  } catch (error: any) {
    console.error("Adaptive interview evaluation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}
