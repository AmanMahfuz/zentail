"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function generateMasterResume(
  rawText: string
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

    const prompt = `
You are an expert ATS resume writer and parser. 
I will provide you with raw text which could be a LinkedIn profile export or a raw resume text.
Your task is to parse all this information and strictly output a JSON object representing a comprehensive Master Resume.
This master resume should contain 100% of the candidate's career data. Do not omit any valid experience.

Respond ONLY with a JSON object matching this schema exactly:
{
  "fullName": "First Last",
  "email": "email@example.com",
  "phone": "string",
  "location": "City, State",
  "linkedin": "url",
  "website": "url",
  "summary": "A professional summary...",
  "skills": [
    { "name": "Skill", "proficiency": "Intermediate", "yearsOfExperience": 0 }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or leave missing if current",
      "currentlyWorking": boolean,
      "description": "Accomplishments..."
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
  "certifications": [
    { "name": "Cert", "organization": "Org", "dateObtained": "MM/YYYY" }
  ]
}

--- RAW RESUME / LINKEDIN TEXT ---
${rawText}
----------------------------------
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
                required: ["title", "company", "startDate", "currentlyWorking"]
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
                required: ["degree", "university", "graduationYear"]
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
                required: ["name", "organization", "dateObtained"]
              }
            }
          },
          required: ["fullName", "email"]
        }
      }
    });

    const parsedResult = JSON.parse(response.text || "{}");

    // Insert the generated resume into the database
    const { data: dbData, error: dbError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        name: "AI Generated Master Resume",
        type: "master",
        version_tag: "V1",
        content: parsedResult,
        is_default: false,
        file_url: "", // AI-generated resumes don't necessarily have a file initially
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
