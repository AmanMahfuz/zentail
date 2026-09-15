import { create } from 'zustand';

export type SessionPhase = 'configurator' | 'active' | 'feedback' | 'completed';

export type InterviewState = {
  // Config
  applicationId: string | null;
  stage: string;
  difficulty: string;
  tracks: string[];
  mode: 'text' | 'voice';
  companyType: string | undefined;

  // Session
  phase: SessionPhase;
  sessionId: string | null;
  questions: any[];
  currentQuestionIndex: number;
  evaluation: any | null;
  finalReport: any | null;
  
  // Actions
  setConfig: (config: Partial<InterviewState>) => void;
  startSession: (data: any) => void;
  setEvaluation: (evaluation: any) => void;
  nextQuestion: () => void;
  completeSession: (report: any) => void;
  reset: () => void;
};

export const useInterviewStore = create<InterviewState>((set: any) => ({
  applicationId: null,
  stage: 'Quick Practice',
  difficulty: 'Intermediate',
  tracks: [],
  mode: 'text',
  companyType: undefined,
  
  phase: 'configurator',
  sessionId: null,
  questions: [],
  currentQuestionIndex: 0,
  evaluation: null,
  finalReport: null,

  setConfig: (config: Partial<InterviewState>) => set((state: InterviewState) => ({ ...state, ...config })),
  startSession: (data: any) => set({ 
    phase: 'active', 
    sessionId: data.sessionId, 
    questions: data.questions, 
    currentQuestionIndex: 0,
    evaluation: null
  }),
  setEvaluation: (evaluation: any) => set({ phase: 'feedback', evaluation }),
  nextQuestion: () => set((state: InterviewState) => ({
    phase: 'active',
    currentQuestionIndex: state.currentQuestionIndex + 1,
    evaluation: null
  })),
  completeSession: (report: any) => set({ phase: 'completed', finalReport: report }),
  reset: () => set({
    applicationId: null,
    stage: 'Quick Practice',
    difficulty: 'Intermediate',
    tracks: [],
    mode: 'text',
    companyType: undefined,
    phase: 'configurator',
    sessionId: null,
    questions: [],
    currentQuestionIndex: 0,
    evaluation: null,
    finalReport: null
  })
}));
