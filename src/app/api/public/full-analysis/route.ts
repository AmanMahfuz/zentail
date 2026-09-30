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

    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

    const prompt = `
      You have a resume (attached) and a job description.
      
      Job Description:
      ${jd.slice(0, 4000)}
      
      Tasks:
      1. Parse the resume completely
      2. Extract all requirements from the job description
      3. Compare them and calculate fit honestly and specifically. Don't fabricate skills.
      
      Return ONLY a JSON object:
      {
        "parsedResume": {
          "name": "string",
          "email": "string",
          "currentRole": "string",
          "experience": "string",
          "skills": ["skill1", "skill2"],
          "projects": [{"title": "string", "description": "string"}],
          "education": "string"
        },
        "analysis": {
          "fitScore": 72,
          "jobTitle": "string",
          "company": "string",
          "matched": ["React", "JavaScript"],
          "partial": ["TypeScript"],
          "missing": ["Docker", "AWS"],
          "verdict": "Good match. A few gaps to address before applying.",
          "whatIsHoldingBack": "Your resume doesn't demonstrate TypeScript depth despite listing it. The role emphasizes this heavily.",
          "improvements": [
            "Strengthen your TypeScript project descriptions with specific examples",
            "Surface your API integration experience more prominently",
            "Add a brief mention of any cloud or deployment experience"
          ]
        }
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: file.type || "application/pdf", data: base64 } }
    ]);

    const raw = result.response.text();

    // Strip markdown fences and extract JSON
    let text = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    // If Gemini prefixes with text, find the first { }
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.slice(jsonStart, jsonEnd + 1);
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error("JSON parse failed. Raw response:", raw.slice(0, 500));
      return NextResponse.json(
        { error: "AI returned an unexpected format. Please try again." },
        { status: 500 }
      );
    }

    if (!data.parsedResume || !data.analysis) {
      console.error("Missing fields. Keys:", Object.keys(data));
      return NextResponse.json(
        { error: "AI response was incomplete. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      parsedResume: data.parsedResume,
      analysis: data.analysis
    });
  } catch (error: any) {
    console.error("Full analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze application" },
      { status: 500 }
    );
  }
}