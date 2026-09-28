// src/lib/interview/adaptive-engine.ts
import { GoogleGenAI, Type } from "@google/genai";
import { convertGeminiAudioToWavBase64 } from "@/utils/audioConversion";
import { getInterviewConfigForRole, InterviewRoleFamily } from "@/config/interviewTracks";

const apiKey = process.env.GEMINI_API_KEY;

export interface AdaptiveInterviewQuestion {
  id: string;
  question: string;
  track: string;
  category?: string;
  expected_signals?: string[];
  audioBase64?: string | null;
  mimeType?: string | null;
  question_type?: "role_prefixed" | "reinforced_pressure_test" | "standard";
  challenge_focus?: string;
  cited_claim?: string;
}

export async function startAdaptiveInterview(options: {
  role: string;
  company?: string;
  jobDescription?: string;
  resumeDataJson?: string;
  goal?: string;
  mode?: string;
  roleFamily?: InterviewRoleFamily;
  tracks?: string[];
  difficulty?: string;
  budgetLimit?: number;
  voice?: string;
}): Promise<{ questions: AdaptiveInterviewQuestion[] }> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const {
    role,
    company = "Target Company",
    jobDescription = "",
    resumeDataJson = "No resume provided.",
    goal = "full_mock",
    mode = "behavioral",
    roleFamily = "technology",
    tracks = ["behavioral", "technical"],
    difficulty = "Intermediate",
    budgetLimit = 5,
    voice = "Kore",
  } = options;

  const roleConfig = getInterviewConfigForRole(roleFamily);
  const activeTracks = tracks.length > 0 ? tracks : roleConfig.defaultTracks;
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an elite executive & technical hiring bar-raiser conducting a rigorous, realistic adaptive interview for a ${role} position at ${company}.
    
    Session Goal: ${goal}
    Mode/Focus: ${mode}
    Role Family: ${roleFamily}
    Difficulty: ${difficulty}
    Target Competencies: ${roleConfig.competencies.join(", ")}
    Selected Interview Tracks: ${activeTracks.join(", ")}
    
    ${jobDescription ? `Target Job Description:\n${jobDescription.slice(0, 3000)}\n` : ""}
    Candidate Profile / Resume:
    ${resumeDataJson.slice(0, 3000)}
    
    CRITICAL QUESTION STRUCTURING RULES:
    You must generate EXACTLY ${budgetLimit} interview questions.
    
    1. QUESTION 1 (ROLE EXECUTION):
       - MUST be prefixed with "[Role Execution: <Core Technical/Functional Domain>]"
       - Directly tests the candidate's core competency in the exact role at ${company} (e.g. system architecture, execution framework, or core methodology).
       - question_type: "role_prefixed"
       
    2. QUESTION 2 (ROLE CHALLENGE & PRODUCTION TRADE-OFFS):
       - MUST be prefixed with "[Role Challenge: Production Trade-offs]"
       - Places the candidate in a high-stakes, realistic production crisis, architectural compromise, or cross-functional deadlock relevant to ${company} and ${role}.
       - question_type: "role_prefixed"
       
    3. SUBSEQUENT QUESTIONS (Question 3 to ${budgetLimit}):
       - Generate challenging questions distributed across tracks (${activeTracks.join(", ")}).
       - Note: In live simulation, these will be dynamically reinforced and cross-examined based on what the candidate answers in Q1 and Q2 to aggressively test their confidence and edge-case handling.
       - question_type: "standard"
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                track: { type: Type.STRING },
                question_type: { type: Type.STRING },
                challenge_focus: { type: Type.STRING },
                expected_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["id", "question", "track", "question_type", "expected_signals"],
            },
          },
        },
        required: ["questions"],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  const rawQuestions = parsed.questions || [];

  const questions: AdaptiveInterviewQuestion[] = rawQuestions.map((q: any, i: number) => ({
    id: q.id || `q-${i + 1}`,
    question: q.question,
    track: q.track || "behavioral",
    question_type: (i < 2 ? "role_prefixed" : q.question_type || "standard") as any,
    challenge_focus: q.challenge_focus || (i === 0 ? "Role Core Domain" : i === 1 ? "Production Trade-offs" : undefined),
    expected_signals: q.expected_signals || [],
    audioBase64: null,
    mimeType: null,
  }));

  // Generate TTS audio for the first question
  if (questions.length > 0 && questions[0].question) {
    try {
      const ttsRes = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ role: "user", parts: [{ text: questions[0].question }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice,
              },
            },
          },
        },
      });

      const part = ttsRes.candidates?.[0]?.content?.parts?.[0];
      const rawAudio = part?.inlineData?.data;
      const rawMime = part?.inlineData?.mimeType || "audio/pcm";
      if (rawAudio) {
        const converted = convertGeminiAudioToWavBase64(rawAudio, rawMime);
        questions[0].audioBase64 = converted.audioBase64;
        questions[0].mimeType = converted.mimeType;
      }
    } catch (ttsErr) {
      console.warn("TTS generation warning for first question:", ttsErr);
    }
  }

  return { questions };
}

export async function evaluateAdaptiveAnswer(options: {
  question: any;
  textAnswer?: string;
  audioBase64?: string;
  audioMimeType?: string;
  roleFamily?: InterviewRoleFamily;
  jobDescription?: string;
  resumeDataJson?: string;
  voice?: string;
}) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const {
    question,
    textAnswer = "",
    audioBase64,
    audioMimeType = "audio/webm",
    roleFamily = "technology",
    jobDescription = "",
    resumeDataJson = "",
    voice = "Kore",
  } = options;

  const roleConfig = getInterviewConfigForRole(roleFamily);
  const ai = new GoogleGenAI({ apiKey });

  const contentParts: any[] = [];
  if (audioBase64) {
    contentParts.push({
      inlineData: { data: audioBase64, mimeType: audioMimeType },
    });
  }
  if (textAnswer) {
    contentParts.push({ text: textAnswer });
  }

  const prompt = `
    You are an expert, supportive yet rigorous hiring manager and interview coach evaluating a candidate's answer.
    
    Question Context:
    "${question.question || question.text}"
    Track: ${question.track || "General"}
    Expected Signals: ${(question.expected_signals || []).join(", ")}
    Role Family: ${roleFamily}
    Target Job: ${jobDescription || "Not provided"}
    Candidate Background: ${resumeDataJson || "Not provided"}
    
    Candidate Answer:
    ${textAnswer ? `Text/Code Answer:\n${textAnswer}` : "Audio Answer attached in inline data."}
    
    CRITICAL INTERVIEWER INSTRUCTION - REINFORCED CROSS-EXAMINATION & CONFIDENCE TESTING:
    You are an elite, highly experienced Hiring Manager and Technical/Executive Bar-Raiser.
    You do NOT ask generic questions. You actively listen to what the candidate just answered and rigorously CROSS-EXAMINE their claims.
    
    1. EXTRACT CITED CLAIM:
       Identify the specific technical choice, tool, architecture, metric, assumption, or principle the candidate claimed in their answer (store in 'cited_claim').
    
    2. SYNTHESIZE REINFORCED PRESSURE-TEST QUESTION ('next_question'):
       - Prefix the question with "[Reinforced Challenge: Pressure Test]" or "[Reinforced Challenge: Edge Case]".
       - Directly reference their claim: "In your response, you stated: '[cited_claim]'. Let's pressure-test this scenario..."
       - Introduce an aggressive real-world complication or failure mode: e.g. 10x traffic surge, silent data corruption, network partition, downstream service degradation, conflicting executive directive, or security vulnerability where their proposed approach breaks down.
       - Demand that they defend or adapt their technical design under this severe pressure, explain how they avoid catastrophic failure, and state what explicit trade-offs they are willing to accept.
       - The question MUST be tougher and specifically engineered to test their TRUE CONFIDENCE, technical depth, and composure under pressure.
    
    3. SCORING & COACHING:
       - Score the answer objectively across relevance, structure, evidence, clarity, role_fit, confidence, english_fluency, and overall_score (0-100).
       - Count filler words ("um", "uh", "you know", "like") if present.
       - List 2-3 specific things that worked well.
       - Provide the single most important "priority_fix" to elevate the answer.
       - Rewrite the answer using the executive STAR framework (Situation, Task, Action, Result with metrics) for their "better_structure".
       - If audio is provided, accurately transcribe the candidate's spoken response word-for-word into 'transcript'.
  `;

  contentParts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contentParts,
    config: {
      temperature: 0.25,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcript: { type: Type.STRING },
          overall_score: { type: Type.INTEGER },
          filler_word_count: { type: Type.INTEGER },
          what_worked: { type: Type.ARRAY, items: { type: Type.STRING } },
          priority_fix: { type: Type.STRING },
          better_structure: { type: Type.STRING },
          detailed_scores: {
            type: Type.OBJECT,
            properties: {
              relevance: { type: Type.INTEGER },
              structure: { type: Type.INTEGER },
              evidence: { type: Type.INTEGER },
              clarity: { type: Type.INTEGER },
              role_fit: { type: Type.INTEGER },
              confidence: { type: Type.INTEGER },
              english_fluency: { type: Type.INTEGER },
            },
            required: ["relevance", "structure", "evidence", "clarity", "role_fit", "confidence", "english_fluency"],
          },
          role_scores: {
            type: Type.OBJECT,
            properties: {
              technical_depth: { type: Type.INTEGER },
              communication: { type: Type.INTEGER },
              problem_solving: { type: Type.INTEGER },
            },
          },
          next_question: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              track: { type: Type.STRING },
              question_type: { type: Type.STRING },
              challenge_focus: { type: Type.STRING },
              cited_claim: { type: Type.STRING },
            },
            required: ["question", "track", "question_type", "challenge_focus", "cited_claim"],
          },
          is_session_complete: { type: Type.BOOLEAN },
        },
        required: [
          "overall_score",
          "filler_word_count",
          "what_worked",
          "priority_fix",
          "better_structure",
          "detailed_scores",
          "next_question",
        ],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}");

  const evaluation = {
    transcript: parsed.transcript || (textAnswer ? textAnswer : ""),
    overall_score: parsed.overall_score || 75,
    filler_word_count: parsed.filler_word_count || 0,
    what_worked: parsed.what_worked || ["Clear problem statement"],
    priority_fix: parsed.priority_fix || "Add measurable impact metrics to the result.",
    better_structure: parsed.better_structure || "Structure your answer using Situation -> Task -> Action -> Quantifiable Result.",
    detailed_scores: parsed.detailed_scores || {
      relevance: 75,
      structure: 70,
      evidence: 70,
      clarity: 80,
      role_fit: 75,
      confidence: 80,
      english_fluency: 85,
    },
    role_scores: parsed.role_scores || {
      technical_depth: 75,
      communication: 80,
      problem_solving: 75,
    },
    next_question: parsed.next_question?.question
      ? {
          id: `q-${Date.now()}`,
          question: parsed.next_question.question,
          track: parsed.next_question.track || question.track || "technical",
          question_type: "reinforced_pressure_test" as const,
          challenge_focus: parsed.next_question.challenge_focus || "Confidence Under Pressure",
          cited_claim: parsed.next_question.cited_claim || "",
        }
      : null,
    is_session_complete: parsed.is_session_complete || false,
  };

  // Generate TTS for the next question if available
  let nextQuestionAudio: string | null = null;
  let nextMimeType: string | null = null;
  if (evaluation.next_question?.question && !evaluation.is_session_complete) {
    try {
      const ttsRes = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ role: "user", parts: [{ text: evaluation.next_question.question }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice,
              },
            },
          },
        },
      });

      const part = ttsRes.candidates?.[0]?.content?.parts?.[0];
      const rawAudio = part?.inlineData?.data;
      const rawMime = part?.inlineData?.mimeType || "audio/pcm";
      if (rawAudio) {
        const converted = convertGeminiAudioToWavBase64(rawAudio, rawMime);
        nextQuestionAudio = converted.audioBase64;
        nextMimeType = converted.mimeType;
      }
    } catch (ttsErr) {
      console.warn("TTS generation warning for next question:", ttsErr);
    }
  }

  return {
    evaluation,
    nextQuestionAudio,
    nextMimeType,
  };
}
