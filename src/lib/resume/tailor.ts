import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateTailoredResume } from "@/lib/actions/phase3";

export { generateTailoredResume };

export async function tailorResumeForApplication(applicationId: string) {
  const { ResumeAgent } = await import("@/lib/agents/resume-agent");
  return await ResumeAgent.tailorForJob(applicationId);
}

export async function tailorResume(
  baseResume: any,
  jobDescription: string,
  fitAnalysis: any = {}
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an expert resume writer. 
    Tailor this resume to the job description based on the fit analysis.
    
    BASE RESUME:
    ${JSON.stringify(baseResume, null, 2)}
    
    JOB DESCRIPTION:
    ${(jobDescription || "").slice(0, 4000)}
    
    FIT ANALYSIS (Issues & Missing):
    ${JSON.stringify({ 
      missing: fitAnalysis?.missing || [], 
      partial: fitAnalysis?.partial || [], 
      resumeIssues: fitAnalysis?.resumeIssues || [] 
    })}
    
    YOUR TASK:
    1. Rewrite the summary to highlight relevance to the job.
    2. Reorder skills to match the job description.
    3. Enhance experience bullets to better align with the job requirements.
       (Do NOT invent experience — just rephrase or highlight relevant parts).
    4. Reorder experience/projects if it makes sense.
    
    Return the FULL UPDATED RESUME in JSON matching the exact structure of the base resume.
    Do NOT change keys.
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text()
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse tailored resume JSON:", text);
    return baseResume;
  }
}
