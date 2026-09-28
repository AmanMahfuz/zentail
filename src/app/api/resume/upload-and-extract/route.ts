import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCachedAIResult, setCachedAIResult, CACHE_TTL_DAYS } from "@/lib/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File;
    const userId = formData.get("userId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }

    // Convert to buffer and compute hash
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");
    const cacheInput = { fileHash, fileName: file.name, fileSize: file.size };

    // 1. Check AI Cache
    const cached = await getCachedAIResult<any>("resume_extract", cacheInput, {
      tokensToAdd: 2500,
    });

    if (cached) {
      const extracted = cached.data;
      if (userId) {
        await saveToEvidenceBase(userId, extracted);
        const resumeV1 = await createResumeVersion(userId, extracted, "upload", 1);
        return NextResponse.json(
          { success: true, extracted, resumeVersionId: resumeV1.id, cached: true },
          {
            headers: {
              "X-Cache": "HIT",
              "X-Cache-Type": "resume_extract",
              "X-Tokens-Saved": String(cached.tokensSaved || 2500),
            },
          }
        );
      }
      return NextResponse.json(
        { success: true, extracted, cached: true },
        {
          headers: {
            "X-Cache": "HIT",
            "X-Cache-Type": "resume_extract",
            "X-Tokens-Saved": String(cached.tokensSaved || 2500),
          },
        }
      );
    }

    const base64 = buffer.toString("base64");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const extractPrompt = `
      Extract ALL information from this resume completely and accurately.
      Do NOT invent or add anything not present.
      
      Return JSON only:
      {
        "personal": {
          "fullName": "string",
          "email": "string",
          "phone": "string",
          "location": "string",
          "linkedinUrl": "string or null",
          "githubUrl": "string or null",
          "portfolioUrl": "string or null"
        },
        "summary": "string or null",
        "skills": [
          {
            "name": "React",
            "category": "frontend",
            "proficiency": "intermediate",
            "proofStatus": "self_reported"
          }
        ],
        "experience": [
          {
            "jobTitle": "string",
            "company": "string",
            "startDate": "YYYY-MM",
            "endDate": "YYYY-MM or null",
            "isCurrent": false,
            "location": "string or null",
            "description": "string",
            "bullets": ["bullet 1", "bullet 2"],
            "skillsUsed": ["React", "Node.js"]
          }
        ],
        "projects": [
          {
            "title": "string",
            "description": "string",
            "bullets": ["bullet 1", "bullet 2"],
            "url": "string or null",
            "githubUrl": "string or null",
            "techStack": ["React", "Node.js"],
            "startDate": "YYYY-MM or null",
            "endDate": "YYYY-MM or null"
          }
        ],
        "education": [
          {
            "degree": "B.Tech",
            "institution": "XYZ University",
            "fieldOfStudy": "Computer Science",
            "startYear": 2018,
            "endYear": 2022,
            "grade": "8.5 CGPA or null",
            "isCurrent": false
          }
        ],
        "certifications": [
          {
            "name": "string",
            "issuer": "string",
            "dateObtained": "YYYY-MM or null",
            "credentialUrl": "string or null"
          }
        ],
        "theme": {
          "template": "original",
          "headerStyle": "centered|left-aligned|two-column",
          "sectionDividers": "bottom-border|pill-tags|bold-uppercase|minimal-space",
          "primaryColor": "#RRGGBB (dominant dark text/header color, default #0f172a)",
          "accentColor": "#RRGGBB (accent or brand color if any, e.g. #2563eb or null)",
          "fontFamily": "serif|sans-serif|monospace",
          "sectionOrder": ["summary", "skills", "experience", "projects", "education"],
          "spacingDensity": "compact|normal|spacious"
        }
      }
    `;

    const result = await model.generateContent([
      extractPrompt,
      { inlineData: { mimeType: file.type || "application/pdf", data: base64 } }
    ]);

    let text = result.response.text()
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.slice(jsonStart, jsonEnd + 1);
    }

    const extracted = JSON.parse(text);

    // Save to AI Cache
    await setCachedAIResult("resume_extract", cacheInput, extracted, {
      ttlDays: CACHE_TTL_DAYS.RESUME_EXTRACT,
      tokens: 2500,
      model: "gemini-2.5-flash",
    });

    if (userId) {
      // Save to evidence base
      await saveToEvidenceBase(userId, extracted);

      // Create Resume V1
      const resumeV1 = await createResumeVersion(userId, extracted, "upload", 1);

      return NextResponse.json(
        {
          success: true,
          extracted,
          resumeVersionId: resumeV1.id,
          cached: false,
        },
        {
          headers: {
            "X-Cache": "MISS",
            "X-Cache-Type": "resume_extract",
          },
        }
      );
    }

    // No userId (public/onboarding) — just return extracted data
    return NextResponse.json(
      { success: true, extracted, cached: false },
      {
        headers: {
          "X-Cache": "MISS",
          "X-Cache-Type": "resume_extract",
        },
      }
    );
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: error.message || "Failed to extract resume" }, { status: 500 });
  }
}

async function saveToEvidenceBase(userId: string, data: any) {
  const supabase = await createClient();

  // Save personal info
  await (supabase as any).from("user_evidence").upsert({
    user_id: userId,
    full_name: data.personal?.fullName,
    email: data.personal?.email,
    phone: data.personal?.phone,
    location: data.personal?.location,
    linkedin_url: data.personal?.linkedinUrl,
    github_url: data.personal?.githubUrl,
    portfolio_url: data.personal?.portfolioUrl,
    summary: data.summary
  }, { onConflict: "user_id" });

  // Save skills
  if (data.skills?.length > 0) {
    await (supabase as any).from("evidence_skills").upsert(
      data.skills.map((s: any) => ({
        user_id: userId,
        skill_name: s.name,
        category: s.category,
        proficiency: s.proficiency,
        proof_status: "self_reported"
      })),
      { onConflict: "user_id,skill_name" }
    );
  }

  // Save experience
  if (data.experience?.length > 0) {
    await (supabase as any).from("evidence_experience").insert(
      data.experience.map((e: any, i: number) => ({
        user_id: userId,
        job_title: e.jobTitle,
        company: e.company,
        start_date: e.startDate || null,
        end_date: e.endDate || null,
        is_current: e.isCurrent || false,
        description: e.description,
        bullets: e.bullets,
        skills_used: e.skillsUsed,
        sort_order: i
      }))
    );
  }

  // Save projects
  if (data.projects?.length > 0) {
    await (supabase as any).from("evidence_projects").insert(
      data.projects.map((p: any, i: number) => ({
        user_id: userId,
        title: p.title,
        description: p.description,
        bullets: p.bullets,
        url: p.url,
        github_url: p.githubUrl,
        tech_stack: p.techStack,
        sort_order: i
      }))
    );
  }

  // Save education
  if (data.education?.length > 0) {
    await (supabase as any).from("evidence_education").insert(
      data.education.map((e: any, i: number) => ({
        user_id: userId,
        degree: e.degree,
        institution: e.institution,
        field_of_study: e.fieldOfStudy,
        start_year: e.startYear,
        end_year: e.endYear,
        grade: e.grade,
        sort_order: i
      }))
    );
  }
}

async function createResumeVersion(
  userId: string,
  data: any,
  originType: string,
  versionNumber?: number
) {
  const supabase = await createClient();

  // Mark all existing as not latest
  await (supabase as any)
    .from("resume_versions")
    .update({ is_latest: false })
    .eq("user_id", userId);

  // Determine next version number dynamically to avoid UNIQUE constraint violations
  let nextVer = versionNumber;
  if (!nextVer) {
    const { data: existing } = await (supabase as any)
      .from("resume_versions")
      .select("version_number")
      .eq("user_id", userId)
      .order("version_number", { ascending: false })
      .limit(1);

    nextVer = (existing?.[0]?.version_number || 0) + 1;
  }

    const extractedTheme = data.theme || {
      template: "original",
      headerStyle: "centered",
      sectionDividers: "bottom-border",
      primaryColor: "#0f172a",
      fontFamily: "sans-serif",
      sectionOrder: ["summary", "skills", "experience", "projects", "education"],
      spacingDensity: "normal",
    };

    // Create new version
    const { data: version, error } = await (supabase as any)
      .from("resume_versions")
      .insert({
        user_id: userId,
        version_number: nextVer,
        version_label: `V${nextVer} ${originType === "upload" ? "Original" : ""}`.trim(),
        is_latest: true,
        origin_type: originType,
        template_id: "original",
        theme: extractedTheme,
        content: {
          personal: data.personal,
          summary: data.summary,
          skills: data.skills,
          experience: data.experience,
          projects: data.projects,
          education: data.education,
          certifications: data.certifications,
          theme: extractedTheme,
          sections_order: extractedTheme.sectionOrder || ["summary", "skills", "experience", "projects", "education"]
        },
        saved_as_latest_at: new Date().toISOString()
      })
      .select()
      .single();

  if (error) {
    throw new Error(`Failed to create resume version: ${error.message}`);
  }

  return version!;
}
