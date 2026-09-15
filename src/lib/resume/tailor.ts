import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function tailorResume(
  baseResume: any,
  jobDescription: string,
  fitAnalysis: any
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an expert resume writer. 
    Tailor this resume to the job description based on the fit analysis.
    
    BASE RESUME:
    ${JSON.stringify(baseResume, null, 2)}
    
    JOB DESCRIPTION:
    ${jobDescription.slice(0, 4000)}
    
    FIT ANALYSIS (Issues & Missing):
    ${JSON.stringify({ 
      missing: fitAnalysis.missing, 
      partial: fitAnalysis.partial, 
      resumeIssues: fitAnalysis.resumeIssues 
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

  return JSON.parse(text);
}
