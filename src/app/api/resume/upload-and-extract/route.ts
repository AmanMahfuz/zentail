import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File;
    const userId = formData.get("userId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

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
        ]
      }
    `;

    const result = await model.generateContent([
      extractPrompt,
      { inlineData: { mimeType: file.type || "application/pdf", data: base64 } }
    ]);

    const text = result.response.text()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const extracted = JSON.parse(text);

    if (userId) {
      // Save to evidence base
      await saveToEvidenceBase(userId, extracted);

      // Create Resume V1
      const resumeV1 = await createResumeVersion(userId, extracted, "upload", 1);

      return NextResponse.json({
        success: true,
        extracted,
        resumeVersionId: resumeV1.id
      });
    }

    // No userId (public/onboarding) — just return extracted data
    return NextResponse.json({ success: true, extracted });
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
  versionNumber: number
) {
  const supabase = await createClient();

  // Mark all existing as not latest
  await (supabase as any)
    .from("resume_versions")
    .update({ is_latest: false })
    .eq("user_id", userId);

  // Create new version
  const { data: version, error } = await (supabase as any)
    .from("resume_versions")
    .insert({
      user_id: userId,
      version_number: versionNumber,
      version_label: `V${versionNumber} ${originType === "upload" ? "Original" : ""}`,
      is_latest: true,
      origin_type: originType,
      content: {
        personal: data.personal,
        summary: data.summary,
        skills: data.skills,
        experience: data.experience,
        projects: data.projects,
        education: data.education,
        certifications: data.certifications,
        sections_order: ["summary", "skills", "experience", "projects", "education"]
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
