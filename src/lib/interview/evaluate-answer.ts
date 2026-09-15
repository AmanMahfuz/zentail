import { GoogleGenAI, Type, Schema } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export type DetailedEvaluation = {
  overallScore: number;
  breakdown: {
    clarity: number;
    relevance: number;
    evidence: number;
    technicalReasoning: number;
    tradeoffs: number;
    communication: number;
  };
  feedback: {
    whatWorked: string[];
    priorityFix: string;
    tryThisNextTime: string[];
  };
  askFollowUp: boolean;
  followUpQuestion?: string;
  nextAction: "raise_difficulty" | "follow_up" | "retry";
};

export async function evaluateAnswerStrictly(
  question: string,
  track: string,
  answer: string,
  answerMode: "text" | "voice"
): Promise<DetailedEvaluation> {
  if (!apiKey) throw new Error("Gemini API key missing");
  const ai = new GoogleGenAI({ apiKey });

  const evalSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      overallScore: { type: Type.INTEGER },
      breakdown: {
        type: Type.OBJECT,
        properties: {
          clarity: { type: Type.INTEGER },
          relevance: { type: Type.INTEGER },
          evidence: { type: Type.INTEGER },
          technicalReasoning: { type: Type.INTEGER },
          tradeoffs: { type: Type.INTEGER },
          communication: { type: Type.INTEGER }
        },
        required: ["clarity", "relevance", "evidence", "technicalReasoning", "tradeoffs", "communication"]
      },
      feedback: {
        type: Type.OBJECT,
        properties: {
          whatWorked: { type: Type.ARRAY, items: { type: Type.STRING } },
          priorityFix: { type: Type.STRING },
          tryThisNextTime: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["whatWorked", "priorityFix", "tryThisNextTime"]
      },
      askFollowUp: { type: Type.BOOLEAN },
      followUpQuestion: { type: Type.STRING },
      nextAction: { type: Type.STRING }
    },
    required: ["overallScore", "breakdown", "feedback", "askFollowUp", "nextAction"]
  };

  const prompt = `
    You are evaluating a candidate's answer to an interview question.
    
    Question: ${question}
    Track: ${track}
    Answer Mode: ${answerMode}
    Candidate Answer:
    ${answer}
    
    Evaluate strictly out of 100 points for each breakdown category:
    - clarity (All)
    - relevance (All)
    - evidence (Behavioral/Project)
    - technicalReasoning (Technical/DSA/Design)
    - tradeoffs (Technical/DSA/Design)
    - communication (Voice mode only, text=100)
    
    overallScore should be the average of applicable tracks out of 100.
    
    If overallScore > 85, nextAction = "raise_difficulty".
    If overallScore > 65, nextAction = "follow_up" and askFollowUp = true (provide followUpQuestion).
    If overallScore <= 65, nextAction = "retry" and askFollowUp = false.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: evalSchema
    }
  });

  if (!response.text) throw new Error("Failed to evaluate answer");
  
  return JSON.parse(response.text) as DetailedEvaluation;
}
