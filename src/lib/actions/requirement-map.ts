"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateRequirementMap(jobDescription: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Fetch user's evidence profile
  const { data: skills } = await supabase
    .from("user_skills")
    .select("*")
    .eq("user_id", user.id);

  const { data: projects } = await supabase
    .from("user_projects")
    .select("*")
    .eq("user_id", user.id);

  const userProfile = {
    skills: skills || [],
    projects: projects || []
  };

  const prompt = `
    Extract ALL requirements from this job description.
    For each requirement, check if the user has evidence based on their profile.
    
    Job Description: 
    ${jobDescription}
    
    User's Evidence Profile:
    - Skills: ${userProfile.skills.map((s: any) => `${s.skill_name} (${s.proof_status})`).join(', ')}
    - Projects: ${userProfile.projects.map((p: any) => `${p.title}: ${p.description} (Skills: ${p.skills_demonstrated?.join(', ')})`).join(' | ')}
    
    CRITICAL INSTRUCTIONS: 
    - Do NOT say "missing" if user simply didn't mention it but might have it. Say "missing" only if clearly absent.
    - Status can be: 'found' (evidence exists), 'partial' (some mention but weak evidence), 'missing' (no evidence).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              requirement: { type: Type.STRING },
              type: { type: Type.STRING, description: "technical | domain | behavioral | qualification" },
              importance: { type: Type.STRING, description: "high | medium | low" },
              evidence: { type: Type.STRING, description: "Specific evidence found or 'None found'" },
              status: { type: Type.STRING, description: "found | partial | missing" },
              suggestedAction: { type: Type.STRING, description: "What to do if partial or missing" }
            },
            required: ["requirement", "type", "importance", "evidence", "status", "suggestedAction"]
          }
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    return { success: true, requirementMap: result };
  } catch (error: any) {
    console.error("Error generating requirement map:", error);
    return { success: false, error: error.message };
  }
}
