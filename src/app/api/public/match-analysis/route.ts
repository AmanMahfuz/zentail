import { NextRequest, NextResponse } from "next/server";
import { getCachedAIResult, setCachedAIResult, CACHE_TTL_DAYS } from "@/lib/cache";
import { generateContentWithRetry } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile, jobDescription, forceRefresh } = body;

    if (!profile || !jobDescription) {
      return NextResponse.json(
        { error: "Both profile and jobDescription are required" },
        { status: 400 }
      );
    }

    // 1. Check AI Cache
    const cacheInput = { profile, jobDescription };
    const cached = await getCachedAIResult<any>("match_analysis", cacheInput, {
      forceRefresh: !!forceRefresh,
      tokensToAdd: 1200,
    });

    if (cached) {
      return NextResponse.json(
        {
          success: true,
          analysis: cached.data,
          cached: true,
          tokensSaved: cached.tokensSaved,
        },
        {
          status: 200,
          headers: {
            "X-Cache": "HIT",
            "X-Cache-Type": "match_analysis",
            "X-Tokens-Saved": String(cached.tokensSaved || 1200),
          },
        }
      );
    }

    // 2. Cache Miss: Execute Resilient Inference with Local Fallback
    const prompt = `
      You are an expert talent scout and ATS matching engine. Compare this candidate's verified profile and career evidence against the target job description.
      
      Candidate Profile:
      ${JSON.stringify(profile, null, 2)}
      
      Job Description:
      ${jobDescription.slice(0, 5000)}
      
      Instructions:
      1. Extract Job Title and Company Name from the Job Description (fallback to "Target Role" and "Target Company" if omitted).
      2. Objectively score candidate fit (0-100). Be realistic and honest: do not hallucinate matches.
      3. Classify requirements into:
         - matched: skills/technologies candidate explicitly demonstrated.
         - partial: skills candidate has adjacent experience with or mentioned without depth.
         - missing: essential requirements candidate does not show evidence for.
      4. Highlight what is holding them back and provide 3 concrete, high-impact resume improvements.
      
      Return ONLY a JSON object with this exact shape:
      {
        "fitScore": 75,
        "jobTitle": "Senior Software Engineer",
        "company": "Tech Corp",
        "matched": ["React", "TypeScript", "Node.js"],
        "partial": ["Docker", "GraphQL"],
        "missing": ["Kubernetes", "AWS ECS"],
        "verdict": "Strong engineering foundation, but needs to highlight containerization and cloud orchestration.",
        "whatIsHoldingBack": "The role specifically requires Kubernetes production operations, which is missing from recent project bullets.",
        "improvements": [
          "Reframe backend services to emphasize container deployment workflows.",
          "Surface cloud infrastructure and CI/CD contributions prominently.",
          "Add quantifiable metrics to recent leadership or architecture responsibilities."
        ]
      }
    `;

    const result = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const rawText = typeof (result as any).text === "function" ? (result as any).text() : ((result as any).text || "");
    let text = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.slice(jsonStart, jsonEnd + 1);
    }

    const analysis = JSON.parse(text);

    // 3. Store in persistent AI Cache (14 days TTL, ~1200 estimated tokens saved on subsequent hits)
    await setCachedAIResult("match_analysis", cacheInput, analysis, {
      ttlDays: CACHE_TTL_DAYS.MATCH_ANALYSIS,
      tokens: 1200,
      model: "gemini-2.5-flash",
    });

    return NextResponse.json(
      { success: true, analysis, cached: false },
      {
        status: 200,
        headers: {
          "X-Cache": "MISS",
          "X-Cache-Type": "match_analysis",
        },
      }
    );
  } catch (error: any) {
    console.error("Match analysis error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to analyze job match" },
      { status: 500 }
    );
  }
}
