import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Rate limit: max 5 parses per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  // Basic IP rate limiting
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (limit && limit.count >= 5 && now < limit.resetAt) {
    return Response.json(
      { error: "Too many parse requests. Please try again later." },
      { status: 429 }
    );
  }

  // Update rate limit
  if (!limit || now >= limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
  } else {
    rateLimitMap.set(ip, { ...limit, count: limit.count + 1 });
  }

  const formData = await request.formData();
  const file = formData.get("resume") as File;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (!genAI) {
    return Response.json({ error: "API Key not configured" }, { status: 500 });
  }

  // Convert file to base64
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const prompt = `
    Extract all information from this resume PDF.
    Extract ALL skills mentioned anywhere in the resume.
    Extract ALL projects with their descriptions.
    Return JSON matching the schema.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: file.type || "application/pdf",
            data: base64
          }
        },
        prompt
      ],
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            currentRole: { type: Type.STRING },
            experience: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  technologies: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            education: { type: Type.STRING },
            linkedinUrl: { type: Type.STRING },
            githubUrl: { type: Type.STRING }
          },
          required: ["name", "email", "phone", "currentRole", "experience", "skills", "projects", "education"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return Response.json(data);
  } catch (err) {
    console.error("Parse error", err);
    return Response.json({
      name: "",
      email: "",
      phone: "",
      currentRole: "",
      experience: "",
      skills: [],
      projects: [],
      education: ""
    });
  }
}
