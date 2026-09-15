import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InterviewConfigSchema } from "./schemas";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY;

export type InterviewQuestion = {
  question: string;
  track: string;
  followUp: string;
  expectedKeyPoints: string[];
  difficulty: string;
  isCoding?: boolean;
};

export async function generateAdaptiveQuestions(
  config: z.infer<typeof InterviewConfigSchema>,
  jobDescription: string,
  resumeContent: string,
  skillGaps: any[]
): Promise<InterviewQuestion[]> {
  if (!apiKey) throw new Error("Gemini API key missing");
  const ai = new GoogleGenAI({ apiKey });

  const questionSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        track: { type: Type.STRING },
        followUp: { type: Type.STRING },
        expectedKeyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        difficulty: { type: Type.STRING },
        isCoding: { type: Type.BOOLEAN }
      },
      required: ["question", "track", "followUp", "expectedKeyPoints", "difficulty"]
    }
  };

  const tracksToFocus = config.tracks.length > 0 ? config.tracks.join(", ") : "Behavioral, Technical";

  const numQuestions = config.stage === "Quick Practice" ? 2 : 5;

  const prompt = `
    You are an expert technical interviewer creating questions for a candidate.
    
    Configuration:
    - Stage: ${config.stage} (Generate ${numQuestions} questions)
    - Difficulty: ${config.difficulty}
    - Tracks: ${tracksToFocus}
    - Company Style: ${config.companyType || "General"}
    
    Context:
    - Job Description: ${jobDescription || "Not provided"}
    - Candidate Resume: ${resumeContent || "Not provided"}
    - Identified Skill Gaps: ${JSON.stringify(skillGaps)}
    
    Instructions:
    Generate a highly tailored set of interview questions using the exact context above.
    1. Base questions on the Resume and Job Description.
    2. Focus on their identified Skill Gaps.
    3. If the track includes 'DSA', 'System Design', or 'Technical', flag 'isCoding' as true ONLY if they need to write code.
    4. Provide expected key points for grading.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: questionSchema
    }
  });

  if (!response.text) throw new Error("Failed to generate questions");
  
  return JSON.parse(response.text) as InterviewQuestion[];
}
