import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Rate limit: max 3 analyses per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  // Basic IP rate limiting
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (limit && limit.count >= 3 && now < limit.resetAt) {
    return Response.json(
      { error: "Please sign up to analyze more jobs" },
      { status: 429 }
    );
  }

  // Update rate limit
  if (!limit || now >= limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
  } else {
    rateLimitMap.set(ip, { ...limit, count: limit.count + 1 });
  }

  const { jobDescription, resumeText } = await request.json();

  if (!jobDescription || jobDescription.length < 50) {
    return Response.json({ error: "Job description too short" }, { status: 400 });
  }

  if (!genAI) {
    return Response.json({ error: "API Key not configured" }, { status: 500 });
  }

  const prompt = resumeText
    ? `
      You are an expert AI recruiter. Analyze this job description against the provided user resume.
      Calculate a highly realistic fitScore (0-100) based strictly on how well the resume matches the job requirements.
      Be extremely honest and critical. If they are missing key skills, the score should be low.

      Job Description:
      ${jobDescription.slice(0, 3000)}

      User's Resume:
      ${resumeText.slice(0, 3000)}

      Extract the topRequirements of the job.
      List exactly which requirements are 'matched' in their resume, and which are 'missing'.
      Provide a 1-sentence 'verdict' summarizing their chances.
    `
    : `
      Analyze this job description and extract key requirements.
      Return a general fit analysis WITHOUT knowing the user's profile.
      
      Job Description:
      ${jobDescription.slice(0, 2000)}
      
      For fitScore: estimate based on common applicant profiles (not specific user).
      For matched: list skills commonly found in frontend devs.
      For missing: list skills that are harder to have.
      Keep it realistic and encouraging.
    `;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fitScore: { type: Type.INTEGER },
            topRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            matched: { type: Type.ARRAY, items: { type: Type.STRING } },
            missing: { type: Type.ARRAY, items: { type: Type.STRING } },
            verdict: { type: Type.STRING },
            jobTitle: { type: Type.STRING },
            company: { type: Type.STRING },
            difficulty: { type: Type.STRING }
          },
          required: ["fitScore", "topRequirements", "matched", "missing", "verdict", "jobTitle", "company", "difficulty"]
        }
      }
    });

    const text = response.text || "{}";
    const analysis = JSON.parse(text);

    return Response.json(analysis);
  } catch (error: any) {
    console.error("[analyze-jd] Error:", error);
    return Response.json(
      { error: error.message || "Analysis failed" },
      { status: 500 }
    );
  }
}
