// src/store/useInterviewStore.ts
import { create } from "zustand";
import { InterviewRoleFamily, InterviewTrack } from "@/config/interviewTracks";

export type InterviewGoal =
  | "practice_question"
  | "fix_weakness"
  | "full_mock"
  | "final_round"
  | "technical_round";

export type InterviewStateEnum = "config" | "practicing" | "review";
export type SessionPhase = "configurator" | "active" | "feedback" | "completed";

export interface InterviewConfig {
  goal: InterviewGoal;
  mode: string;
  role?: string;
  company?: string;
  jobDescription?: string;
  roleFamily?: InterviewRoleFamily;
  tracks?: InterviewTrack[];
  difficulty?: string;
  simulationMode: "text" | "voice";
  budgetLimit: number;
  applicationId?: string | null;
  companyType?: string;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  question?: string;
  audioBase64?: string | null;
  mimeType?: string | null;
  userAnswer?: string;
  feedback?: {
    overall_score: number;
    filler_word_count?: number;
    what_worked: string[];
    priority_fix: string;
    better_structure: string;
    detailed_scores: {
      relevance: number;
      structure: number;
      evidence: number;
      clarity: number;
      role_fit: number;
      confidence: number;
      english_fluency: number;
    };
    role_scores?: Record<string, number>;
  };
  track?: InterviewTrack | string;
  expected_signals?: string[];
  isCoding?: boolean;
  question_type?: "role_prefixed" | "reinforced_pressure_test" | "standard";
  challenge_focus?: string;
  cited_claim?: string;
  isReinforced?: boolean;
}

export interface InterviewStore {
  // Session Configuration
  currentState: InterviewStateEnum;
  phase: SessionPhase; // Backward compatibility
  config: InterviewConfig | null;
  sessionId: string | null;
  applicationId: string | null;
  stage: string;
  difficulty: string;
  tracks: string[];
  mode: "text" | "voice";
  companyType?: string;

  // Active Session Data
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  isListening: boolean;
  evaluation: any | null;
  finalReport: any | null;

  // Actions
  setConfig: (config: Partial<InterviewConfig> | Partial<InterviewStore>) => void;
  startInterview: (questions: InterviewQuestion[], sessionId?: string) => void;
  startSession: (data: { sessionId: string; questions: any[] }) => void;
  endInterview: () => Promise<void>;
  answerQuestion: (answer: string, feedback: InterviewQuestion["feedback"]) => void;
  setEvaluation: (evaluation: any) => void;
  addQuestion: (question: InterviewQuestion) => void;
  insertReinforcedQuestion: (nextQ: any) => void;
  nextQuestion: () => void;
  retryQuestion: () => void;
  setIsListening: (isListening: boolean) => void;
  setQuestions: (questions: InterviewQuestion[]) => void;
  completeSession: (report: any) => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewStore>((set: any, get: any) => ({
  currentState: "config",
  phase: "configurator",
  config: null,
  sessionId: null,
  applicationId: null,
  stage: "Quick Practice",
  difficulty: "Intermediate",
  tracks: [],
  mode: "text",
  companyType: undefined,

  questions: [],
  currentQuestionIndex: 0,
  isListening: false,
  evaluation: null,
  finalReport: null,

  setConfig: (cfg: any) => {
    set((state: InterviewStore) => {
      const mergedConfig = { ...(state.config || {}), ...cfg };
      return {
        ...state,
        ...cfg,
        config: mergedConfig,
        mode: cfg.simulationMode || cfg.mode || state.mode,
      };
    });
  },

  startInterview: (questions: InterviewQuestion[], sessionId?: string) => {
    const formatted = questions.map((q, idx) => ({
      ...q,
      text: q.text || q.question || `Question ${idx + 1}`,
      question: q.question || q.text || `Question ${idx + 1}`,
    }));
    set({
      questions: formatted,
      sessionId: sessionId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "00000000-0000-0000-0000-000000000000"),
      currentQuestionIndex: 0,
      currentState: "practicing",
      phase: "active",
      evaluation: null,
    });
  },

  startSession: (data: { sessionId: string; questions: any[] }) => {
    const formatted = (data.questions || []).map((q: any, idx: number) => ({
      id: q.id || `q-${idx + 1}`,
      text: q.question || q.text || `Question ${idx + 1}`,
      question: q.question || q.text || `Question ${idx + 1}`,
      track: q.track || "behavioral",
      audioBase64: q.audioBase64 || null,
      mimeType: q.mimeType || null,
    }));
    set({
      sessionId: data.sessionId,
      questions: formatted,
      currentQuestionIndex: 0,
      currentState: "practicing",
      phase: "active",
      evaluation: null,
    });
  },

  answerQuestion: (answer: string, feedback: InterviewQuestion["feedback"]) => {
    set((state: InterviewStore) => {
      const updated = [...state.questions];
      if (updated[state.currentQuestionIndex]) {
        updated[state.currentQuestionIndex] = {
          ...updated[state.currentQuestionIndex],
          userAnswer: answer,
          feedback,
        };
      }
      return {
        questions: updated,
        evaluation: feedback,
        phase: "feedback",
      };
    });
  },

  setEvaluation: (evaluation: any) => set({ evaluation, phase: "feedback" }),

  addQuestion: (question: InterviewQuestion) => {
    set((state: InterviewStore) => ({
      questions: [
        ...state.questions,
        {
          ...question,
          text: question.text || question.question || "Follow-up Question",
          question: question.question || question.text || "Follow-up Question",
        },
      ],
    }));
  },

  insertReinforcedQuestion: (nextQ: any) => {
    set((state: InterviewStore) => {
      const formattedQ: InterviewQuestion = {
        id: nextQ.id || `q-reinforced-${Date.now()}`,
        text: nextQ.question || nextQ.text,
        question: nextQ.question || nextQ.text,
        track: nextQ.track || "technical",
        question_type: "reinforced_pressure_test",
        challenge_focus: nextQ.challenge_focus || "Confidence Under Pressure",
        cited_claim: nextQ.cited_claim || "",
        isReinforced: true,
        audioBase64: nextQ.audioBase64 || null,
        mimeType: nextQ.mimeType || null,
      };

      const currIdx = state.currentQuestionIndex;
      const updated = [...state.questions];

      // If answering Q1 (idx 0), and Q2 (idx 1) is role_prefixed,
      // preserve Q2 as the 2nd foundational question and inject reinforced challenge at Q3 (idx 2)
      if (currIdx === 0 && updated.length > 1 && updated[1]?.question_type === "role_prefixed") {
        if (updated.length > 2) {
          updated[2] = formattedQ;
        } else {
          updated.push(formattedQ);
        }
      } else {
        // For Q2 onwards, the immediate next question is the tough reinforced pressure-test
        const nextIdx = currIdx + 1;
        if (nextIdx < updated.length) {
          updated[nextIdx] = formattedQ;
        } else {
          updated.push(formattedQ);
        }
      }

      return { questions: updated };
    });
  },

  nextQuestion: () => {
    set((state: InterviewStore) => {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex >= state.questions.length) {
        return {
          currentState: "review",
          phase: "completed",
        };
      }
      return {
        currentQuestionIndex: nextIndex,
        currentState: "practicing",
        phase: "active",
        evaluation: null,
      };
    });
  },

  retryQuestion: () => set({ evaluation: null, phase: "active" }),

  setIsListening: (isListening: boolean) => set({ isListening }),

  setQuestions: (questions: InterviewQuestion[]) => set({ questions }),

  completeSession: (report: any) =>
    set({ currentState: "review", phase: "completed", finalReport: report }),

  endInterview: async () => {
    const state = get();
    const count = state.questions.length;
    if (count > 0) {
      const overall = Math.round(
        state.questions.reduce((acc: number, q: InterviewQuestion) => acc + (q.feedback?.overall_score || 0), 0) / count
      );
      set({
        currentState: "review",
        phase: "completed",
        finalReport: {
          overallScore: overall,
          questionsCount: count,
          completedAt: new Date().toISOString(),
        },
      });
    } else {
      set({ currentState: "review", phase: "completed" });
    }
  },

  reset: () =>
    set({
      currentState: "config",
      phase: "configurator",
      config: null,
      sessionId: null,
      applicationId: null,
      stage: "Quick Practice",
      difficulty: "Intermediate",
      tracks: [],
      mode: "text",
      companyType: undefined,
      questions: [],
      currentQuestionIndex: 0,
      isListening: false,
      evaluation: null,
      finalReport: null,
    }),
}));
