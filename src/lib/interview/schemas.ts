import { z } from "zod";

export const InterviewConfigSchema = z.object({
  applicationId: z.string().uuid(),
  stage: z.enum(["Quick Practice", "Weakness Drill", "Full Mock", "Final Round"]),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  tracks: z.array(z.string()),
  mode: z.enum(["Text", "Voice"]),
  companyType: z.string().optional()
});

export const EvaluateAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionIndex: z.number(),
  answer: z.string(),
  answerType: z.enum(["text", "voice"]),
  companyType: z.string().optional()
});
