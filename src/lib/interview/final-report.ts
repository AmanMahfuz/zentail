import { GoogleGenAI, Type, Schema } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export type FinalReportType = {
  overallScore: number;
  trackScores: Record<string, number>;
  strengths: string[];
  priorityFixes: string[];
  learningPlan: string[];
  summary: string;
};

export async function generateComprehensiveFinalReport(
  answers: any[],
  skillGaps: string[]
): Promise<FinalReportType> {
  if (!apiKey) throw new Error("Gemini API key missing");
  const ai = new GoogleGenAI({ apiKey });

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      overallScore: { type: Type.INTEGER },
      trackScores: { type: Type.OBJECT }, // Will hold track names as keys
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      priorityFixes: { type: Type.ARRAY, items: { type: Type.STRING } },
      learningPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
      summary: { type: Type.STRING }
    },
    required: ["overallScore", "trackScores", "strengths", "priorityFixes", "learningPlan", "summary"]
  };

  const prompt = `
    Analyze the full interview transcript and scores.
    Identify repeated weaknesses and create an evidence-backed learning plan.
    Connect weaknesses to the existing skill gaps if applicable: ${skillGaps.join(", ")}
    
    Data:
    ${JSON.stringify(answers.map(a => ({
      question: a.question,
      answer: a.answer,
      scores: a.scores
    })), null, 2)}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  if (!response.text) throw new Error("Failed to generate report");
  
  return JSON.parse(response.text) as FinalReportType;
}
