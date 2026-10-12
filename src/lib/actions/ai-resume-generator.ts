"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { generateContentWithRetry } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function generateMasterResume(
  input: string | Record<string, any>
): Promise<{ success: boolean; message?: string; resumeId?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, message: "Gemini API key is not configured." };
    }

    const ai = new GoogleGenAI({ apiKey });

    const rawText = typeof input === "string" ? input : JSON.stringify(input, null, 2);

    const prompt = `
You are an expert ATS resume writer and parser. 
I will provide you with candidate information which could be a raw resume text, a LinkedIn profile export, or structured candidate inputs.
Your task is to parse and synthesize all this information and strictly output a JSON object representing a comprehensive, high-quality Master Resume.
This master resume should contain 100% of the candidate's genuine career and academic data.
If the candidate is a fresher or student with no corporate work experience, keep the "experience" array empty ([]) and emphasize their genuine "projects", "education", and "skills".
CRITICAL: Never invent employers, degrees, dates, skills, certifications, achievements, or numerical metrics. Bullet points must be concise, high-impact, action-verb driven, and truthful.

Respond ONLY with a JSON object matching this schema exactly:
{
  "fullName": "First Last",
  "email": "email@example.com",
  "phone": "string",
  "location": "City, State",
  "linkedin": "url",
  "website": "url",
  "summary": "A concise, professional summary highlighting core competencies...",
  "skills": [
    { "name": "Skill", "proficiency": "Intermediate", "yearsOfExperience": 0 }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "currentlyWorking": boolean,
      "description": "High-impact accomplishment bullets..."
    }
  ],
  "education": [
    {
      "degree": "Degree",
      "university": "University",
      "specialization": "Specialization",
      "graduationYear": "YYYY"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "tech": "Technologies used",
      "url": "Project or GitHub URL",
      "description": "High-impact technical implementation details..."
    }
  ],
  "certifications": [
    { "name": "Cert Name", "organization": "Issuer", "dateObtained": "YYYY" }
  ]
}

--- CANDIDATE INFORMATION ---
${rawText}
------------------------------
`;

    let parsedResult: any;
    try {
      const response = await generateContentWithRetry({
        ai,
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              location: { type: Type.STRING },
              linkedin: { type: Type.STRING },
              website: { type: Type.STRING },
              summary: { type: Type.STRING },
              skills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    proficiency: { type: Type.STRING },
                    yearsOfExperience: { type: Type.INTEGER }
                  },
                  required: ["name"]
                }
              },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    company: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    currentlyWorking: { type: Type.BOOLEAN },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "company"]
                }
              },
              education: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    degree: { type: Type.STRING },
                    university: { type: Type.STRING },
                    specialization: { type: Type.STRING },
                    graduationYear: { type: Type.STRING }
                  },
                  required: ["degree", "university"]
                }
              },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    tech: { type: Type.STRING },
                    url: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name"]
                }
              },
              certifications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    organization: { type: Type.STRING },
                    dateObtained: { type: Type.STRING }
                  },
                  required: ["name"]
                }
              }
            },
            required: ["fullName", "email"]
          }
        }
      });

      parsedResult = JSON.parse(response.text || "{}");
    } catch (aiErr: any) {
      console.warn("[ai-resume-generator] AI generation failed:", aiErr);
      return { success: false, message: "AI generation failed. Please try again or create your resume manually." };
    }

    // Merge and preserve candidate input data to ensure no candidate info is lost
    if (typeof input === "object" && input !== null) {
      if ((!parsedResult.skills || parsedResult.skills.length === 0) && Array.isArray(input.skills)) {
        parsedResult.skills = input.skills.map((s: any) => (typeof s === "string" ? { name: s } : s));
      }
      if ((!parsedResult.projects || parsedResult.projects.length === 0) && Array.isArray(input.projects)) {
        parsedResult.projects = input.projects;
      }
      if ((!parsedResult.education || parsedResult.education.length === 0) && Array.isArray(input.education)) {
        parsedResult.education = input.education;
      }
      if ((!parsedResult.certifications || parsedResult.certifications.length === 0) && Array.isArray(input.certifications)) {
        parsedResult.certifications = input.certifications;
      }
      if (!parsedResult.fullName && input.fullName) parsedResult.fullName = input.fullName;
      if (!parsedResult.email && input.email) parsedResult.email = input.email;
      if (!parsedResult.phone && input.phone) parsedResult.phone = input.phone;
      if (!parsedResult.location && input.location) parsedResult.location = input.location;
      if (!parsedResult.linkedin && input.linkedin) parsedResult.linkedin = input.linkedin;
      if (!parsedResult.website && input.website) parsedResult.website = input.website;
    }

    // Insert the generated resume into the database as a version
    const { data: dbData, error: dbError } = await (supabase as any)
      .from("resume_versions")
      .insert({
        user_id: user.id,
        version_label: "AI Generated Resume Version",
        origin_type: "ai_generated",
        content: parsedResult,
        is_latest: false,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("DB Insert Error:", dbError);
      return { success: false, message: "Failed to save the generated resume to the database." };
    }

    revalidatePath("/resumes");
    return { success: true, resumeId: dbData.id };
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return { success: false, message: error.message || "Failed to generate AI Resume." };
  }
}
