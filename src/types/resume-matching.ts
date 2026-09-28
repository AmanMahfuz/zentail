export type RecommendationType = "use_existing" | "tailor_new";

export type QuestionCategory = "technical" | "behavioral" | "system_design" | "situational";
export type QuestionDifficulty = "junior" | "mid" | "senior" | "lead";

export interface ResumeMatchCandidate {
  resumeId: string;
  versionLabel: string;
  versionNumber: number;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
}

export interface ResumeRecommendation {
  id?: string;
  userId?: string;
  applicationId?: string | null;
  jobId?: string | null;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  bestResumeId: string | null;
  bestResumeLabel: string | null;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendationType: RecommendationType;
  explanation: string;
  tailoringSuggestions: string[];
  allCandidates?: ResumeMatchCandidate[];
  createdAt?: string;
}

export interface QABankQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  difficulty: QuestionDifficulty;
  modelAnswer: string;
  keyPoints: string[];
}

export interface QABank {
  id?: string;
  userId?: string;
  applicationId?: string | null;
  recommendationId?: string | null;
  jobTitle: string;
  companyName: string;
  resumeId?: string | null;
  totalQuestions: number;
  questions: QABankQuestion[];
  createdAt?: string;
}

export interface JobPostingInput {
  title: string;
  company: string;
  description: string;
  applicationId?: string;
  jobId?: string;
  targetResumeId?: string;
}

export interface MatchAndPrepResult {
  success: boolean;
  recommendation?: ResumeRecommendation;
  qaBank?: QABank;
  message?: string;
}
