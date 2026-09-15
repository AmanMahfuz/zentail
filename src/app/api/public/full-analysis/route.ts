import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File;
    const jd = formData.get("jobDescription") as string;

    if (!file || !jd) {
      return NextResponse.json(
        { error: "Both resume and jobDescription are required" },
        { status: 400 }
      );
    }

    // Convert resume to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert technical recruiter and career coach.
      
      I am providing a resume (as an attachment) and a job description.
      
      JOB DESCRIPTION:
      ${jd.slice(0, 4000)}
      
      First, extract the resume data into a structured format (parsedResume).
      Second, analyze the fit between the resume and the job description (analysis).
      
      Be honest, strict, and very specific. Do not sugarcoat.
      
      Return ONLY a JSON object matching this structure:
      {
        "parsedResume": {
          "personal": {
            "fullName": "string",
            "email": "string"
          },
          "summary": "string",
          "skills": ["skill1", "skill2"],
          "experience": [
            {
              "jobTitle": "string",
              "company": "string",
              "duration": "string",
              "description": "string"
            }
          ]
        },
        "analysis": {
          "fitScore": number (0-100),
          "verdict": "A short, 1-2 sentence honest verdict on their chances.",
          "matched": ["Short string (e.g., 'React (3 years)')", ...],
          "partial": ["Short string (e.g., 'Node.js (No production exp)')", ...],
          "missing": ["Short string (e.g., 'Docker')", ...],
          "whatIsHoldingBack": "A clear, plain English explanation of the biggest gap or issue.",
          "improvements": [
            "Specific improvement 1",
            "Specific improvement 2",
            "Specific improvement 3"
          ]
        }
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: file.type || "application/pdf", data: base64 } }
    ]);

    const text = result.response
      .text()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const data = JSON.parse(text);

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error: any) {
    console.error("Full analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze application" },
      { status: 500 }
    );
  }
}