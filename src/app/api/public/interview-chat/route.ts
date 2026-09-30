// src/app/api/public/interview-chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateContentWithRetry } from "@/lib/gemini";

const SYSTEM_PROMPT = `You are a friendly career coach helping someone who does NOT have a resume yet build their first one. 
You have been given a job description they are interested in. Your goal is to learn about their real experience through a short structured conversation.

Your rules:
1. You must ask exactly ONE question at a time in this specific order:
   - Question 1: What is their full name and their current role (or field of study if student)?
   - Question 2: How many years of experience do they have, and where are they based (city/country or remote)?
   - Question 3: What are their top 3-6 technical or professional skills?
   - Question 4: What is a recent project or accomplishment they are proud of (tools used, what they built)?
   - Question 5: What is their preferred email address, and do they have any links (GitHub, portfolio, or LinkedIn) to include?
2. Keep questions short, conversational, and warm. 
3. After they answer Question 5 (or if wrap-up is requested), set done=true and return the extracted data.
4. Do NOT lecture or give feedback during the interview — just ask the questions.

After the questions are answered or wrap-up is triggered, return done=true with extracted JSON. The parsedProfile must be in this exact shape:
{
  "personal": {
    "fullName": "Candidate full name",
    "email": "Candidate email if provided, else empty string",
    "phone": "Phone number if provided, else empty string",
    "location": "Candidate location or remote",
    "githubUrl": "GitHub link or empty string",
    "portfolioUrl": "Portfolio link or empty string",
    "linkedinUrl": "LinkedIn link or empty string"
  },
  "currentRole": "Their current role or student",
  "summary": "Tailored 2-3 sentence executive summary based on their background",
  "skills": ["skill1", "skill2", ...],
  "projects": [{ "title": "Project name", "description": "What they built and how", "techStack": ["skill1", "skill2"] }],
  "experience": [{ "jobTitle": "Role", "company": "Company or Projects", "description": "Key contributions and accomplishments", "skillsUsed": ["skill1"] }],
  "education": [{ "degree": "Degree and field", "institution": "Institution name" }],
  "targetRole": "The job they are looking for"
}

Also return an analysis object estimating fit vs the job:
{
  "fitScore": 0-100,
  "jobTitle": "...",
  "company": "...",
  "matched": ["skills that match"],
  "partial": ["skills mentioned but not demonstrated clearly"],
  "missing": ["key skills not mentioned at all"],
  "verdict": "One sentence honest verdict",
  "whatIsHoldingBack": "One sentence about the main gap",
  "improvements": ["3 things they can do to improve their fit"]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, jobDescription, action } = body;

    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: "Job description required" }, { status: 400 });
    }

    // Build the conversation history for Gemini
    const conversationContext = messages?.length
      ? messages.map((m: { role: string; text: string }) =>
          `${m.role === "ai" ? "Coach" : "Candidate"}: ${m.text}`
        ).join("\n\n")
      : "";

    const userCount = messages?.filter((m: any) => m.role === "user").length ?? 0;
    const shouldFinish = action === "finish" || userCount >= 5;

    const prompt = action === "start"
      ? `${SYSTEM_PROMPT}

---
JOB DESCRIPTION:
${jobDescription}
---

Start the conversation. Greet them warmly (1 sentence), mention the target role if apparent from the JD, and ask your first focused question (their name and current role or field of study). Keep it under 3 sentences total.

Respond ONLY with JSON in this exact format:
{ "message": "your greeting and first question", "done": false }`
      : `${SYSTEM_PROMPT}

---
JOB DESCRIPTION:
${jobDescription}
---

CONVERSATION SO FAR:
${conversationContext}
---

${shouldFinish
  ? `You have gathered enough information. Wrap up warmly (1 sentence max), then set done=true and fill in the extracted data.

Respond ONLY with JSON in this exact format:
{
  "message": "your warm wrap-up message",
  "done": true,
  "extracted": {
    "parsedProfile": { ... },
    "analysis": { ... }
  }
}`
  : `Continue the interview. Ask the next most useful question based on what you know so far. One question only.

Respond ONLY with JSON in this exact format:
{ "message": "your next question", "done": false }`
}`;

    const result = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });

    const text = typeof (result as any).text === "function" ? (result as any).text() : ((result as any).text || "");
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON from the response
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse AI response: " + text.slice(0, 100));
      parsed = JSON.parse(match[0]);
    }

    return NextResponse.json({
      message: parsed.message || "Could you tell me more about your background?",
      done: parsed.done ?? false,
      extracted: parsed.extracted ?? null
    });

  } catch (err) {
    console.error("[interview-chat]", err);
    // Graceful fallback so candidate is never blocked
    return NextResponse.json({
      message: "Hi there! I'm your AI career coach. To help build your first tailored resume for this job, what is your full name and current role (or field of study if you're a student)?",
      done: false,
      extracted: null
    });
  }
}
