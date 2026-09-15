"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

const apiKey = process.env.GEMINI_API_KEY;

export type CompanyProfile = {
  companyType: string;
  difficulty: "easy" | "medium" | "hard";
  focusAreas: string[];
  rounds: string;
  interviewStyle: string;
};

// ==========================================
// 1. Detect Company Type
// ==========================================
export async function detectCompanyType(
  companyName: string,
  jobDescription: string
): Promise<{ success: boolean; profile?: CompanyProfile; message?: string }> {
  try {
    if (!apiKey) return { success: false, message: "Gemini API key missing" };
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Analyze this company and job description.
      
      Company: ${companyName}
      Job Description: ${jobDescription}
      
      Identify:
      1. companyType: 
         - "faang" (Google, Meta, Amazon, Apple, Netflix, Microsoft)
         - "indian_giant" (Flipkart, Zomato, Swiggy, Ola, Paytm, CRED)
         - "mnc" (TCS, Infosys, Wipro, Accenture, Cognizant, HCL, Capgemini)
         - "product_startup" (funded startup, product-focused)
         - "service_company" (IT services, outsourcing)
         - "early_startup" (early stage, <50 employees)
         - "unknown"
         
      2. difficulty: "easy" | "medium" | "hard"
      3. focusAreas: Array of strings like ["dsa", "system_design", "behavioral", "technical", "culture"]
      4. rounds: string (e.g. "3-4")
      5. interviewStyle: A brief 1-2 sentence description of their known interview process.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyType: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            rounds: { type: Type.STRING },
            interviewStyle: { type: Type.STRING }
          },
          required: ["companyType", "difficulty", "focusAreas", "rounds", "interviewStyle"]
        }
      }
    });

    return { 
      success: true, 
      profile: JSON.parse(response.text || "{}") as CompanyProfile 
    };
  } catch (error: any) {
    console.error("detectCompanyType Error:", error);
    return { success: false, message: error.message };
  }
}

// ==========================================
// 2. Generate Adaptive Questions
// ==========================================
export type InterviewQuestion = {
  question: string;
  category: "behavioral" | "technical" | "situational" | "system_design" | "dsa" | "hr" | "culture" | "product_thinking";
  followUp: string;
  expectedKeyPoints: string[];
  difficulty: string;
};

export async function generateCompanySpecificQuestions(
  profile: CompanyProfile,
  role: string,
  jobDescription: string
): Promise<{ success: boolean; questions?: InterviewQuestion[]; message?: string }> {
  try {
    if (!apiKey) return { success: false, message: "Gemini API key missing" };
    const ai = new GoogleGenAI({ apiKey });

    const basePrompt = `
      You are a ${profile.companyType} company interviewer hiring for a ${role}.
      
      Company Type: ${profile.companyType}
      Interview Style: ${profile.interviewStyle}
      Difficulty: ${profile.difficulty}
      Focus Areas: ${profile.focusAreas.join(", ")}
      
      Job Description: ${jobDescription}
    `;

    const typeSpecificPrompts: Record<string, string> = {
      faang: `
        Generate exactly 5 interview questions:
        - 2 DSA coding questions (${profile.difficulty} difficulty LeetCode style)
        - 1 system design question (distributed systems focus)
        - 2 behavioral questions (leadership principles focus)
      `,
      mnc: `
        Generate exactly 5 interview questions:
        - 2 basic technical (OOP, database, web concepts)
        - 1 project-based question
        - 2 HR behavioral questions
        Focus on communication and fundamentals, not complex algorithms.
      `,
      product_startup: `
        Generate exactly 5 interview questions:
        - 2 practical coding (real-world problems from JD)
        - 1 simplified system design
        - 1 culture fit question
        - 1 product thinking question
        Focus on shipping fast and practical experience.
      `,
      service_company: `
        Generate exactly 5 interview questions:
        - 2 technical fundamentals (from JD technologies)
        - 1 project-based question
        - 1 client communication scenario
        - 1 HR question
        Focus on teamwork, communication, and reliability.
      `,
      early_startup: `
        Generate exactly 5 interview questions:
        - 1 practical problem (real company challenge)
        - 2 attitude/motivation questions
        - 1 technical question (broad, from JD)
        - 1 founder-style culture question
        Focus on passion, versatility, and ability to learn fast.
      `,
      indian_giant: `
        Generate exactly 5 interview questions:
        - 2 DSA (medium difficulty)
        - 1 system design (product-focused)
        - 1 behavioral (product thinking)
        - 1 technical (from JD tech stack)
        Similar to FAANG but more product-focused.
      `
    };

    const prompt = basePrompt + "\n" + (typeSpecificPrompts[profile.companyType] || typeSpecificPrompts.product_startup) + `
      For each question also provide:
      - A followUp question if their answer is weak.
      - expectedKeyPoints in a good answer.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              category: { type: Type.STRING },
              followUp: { type: Type.STRING },
              expectedKeyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              difficulty: { type: Type.STRING }
            },
            required: ["question", "category", "followUp", "expectedKeyPoints", "difficulty"]
          }
        }
      }
    });

    return { 
      success: true, 
      questions: JSON.parse(response.text || "[]") as InterviewQuestion[] 
    };
  } catch (error: any) {
    console.error("generateQuestions Error:", error);
    return { success: false, message: error.message };
  }
}

// ==========================================
// 3. Evaluate Answer
// ==========================================
export type AnswerEvaluation = {
  overallScore: number;
  clarityScore: number;
  relevanceScore: number;
  starFormatScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  askFollowUp: boolean;
  followUpQuestion: string;
  suggestedAnswer: string;
};

export async function evaluateByCompanyType(
  question: string,
  answer: string,
  companyType: string
): Promise<{ success: boolean; evaluation?: AnswerEvaluation; message?: string }> {
  try {
    if (!apiKey) return { success: false, message: "Gemini API key missing" };
    const ai = new GoogleGenAI({ apiKey });

    const evalCriteria: Record<string, string> = {
      faang: `
        Evaluate for FAANG standards:
        - Time/space complexity mentioned?
        - Edge cases considered?
        - Communication of thought process?
        - Leadership principles alignment?
        Score very strictly (7+ = good, <7 = not ready).
      `,
      mnc: `
        Evaluate for MNC standards:
        - Basic concepts understood?
        - Communication clear?
        - Professional demeanor?
        - Teamwork mentioned?
        Score moderately (6+ = good for MNC).
      `,
      product_startup: `
        Evaluate for startup standards:
        - Practical approach?
        - Can they ship this?
        - Problem-solving mindset?
        - Passion and energy?
        Score based on attitude + skill.
      `,
      early_startup: `
        Evaluate for early startup:
        - Hunger and passion shown?
        - Versatility demonstrated?
        - Fast learner signals?
        - Real examples from personal projects?
        Value attitude over perfection.
      `
    };

    const activeCriteria = evalCriteria[companyType] || evalCriteria.product_startup;

    const prompt = `
      You are an interviewer evaluating a candidate's answer.
      
      Question: ${question}
      Candidate's Answer: ${answer}
      
      ${activeCriteria}
      
      Return evaluation matching the JSON schema precisely.
      All scores should be out of 10.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER },
            clarityScore: { type: Type.INTEGER },
            relevanceScore: { type: Type.INTEGER },
            starFormatScore: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            askFollowUp: { type: Type.BOOLEAN },
            followUpQuestion: { type: Type.STRING },
            suggestedAnswer: { type: Type.STRING }
          },
          required: [
            "overallScore", "clarityScore", "relevanceScore", "starFormatScore",
            "feedback", "strengths", "improvements", "askFollowUp", "followUpQuestion", "suggestedAnswer"
          ]
        }
      }
    });

    return { 
      success: true, 
      evaluation: JSON.parse(response.text || "{}") as AnswerEvaluation 
    };
  } catch (error: any) {
    console.error("evaluate Answer Error:", error);
    return { success: false, message: error.message };
  }
}

// ==========================================
// 4. Final Report
// ==========================================
export async function generateFinalReport(
  answersList: any[]
): Promise<{ success: boolean; report?: string; message?: string }> {
  try {
    if (!apiKey) return { success: false, message: "Gemini API key missing" };
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Analyze the following interview answers and their evaluations.
      Generate a concise, professional final report summarizing the candidate's performance.
      Highlight key strengths, critical weaknesses, and state a final "Hire/No Hire/Needs Improvement" recommendation.
      
      Data:
      ${JSON.stringify(answersList, null, 2)}
      
      Format the report as beautiful Markdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.3 }
    });

    return { success: true, report: response.text };
  } catch (error: any) {
    console.error("generateFinalReport Error:", error);
    return { success: false, message: error.message };
  }
}
