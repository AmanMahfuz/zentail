// src/app/api/interview/start/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startAdaptiveInterview } from "@/lib/interview/adaptive-engine";
import { InterviewRoleFamily } from "@/config/interviewTracks";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      role,
      company,
      jobDescription,
      roleFamily,
      tracks,
      difficulty,
      simulationMode,
      goal,
      budgetLimit,
      applicationId,
      voice,
    } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let targetRole = role;
    let targetCompany = company || "Target Company";
    let targetJd = jobDescription || "";
    let resumeContent = "";

    // If linked to an application, load context from DB if missing
    if (applicationId && user) {
      const { data: app } = await supabase
        .from("applications")
        .select("job_title, company_name, job_description, resume_versions(content)")
        .eq("id", applicationId)
        .eq("user_id", user.id)
        .single();

      if (app) {
        if (!targetRole) targetRole = app.job_title;
        if (!company) targetCompany = app.company_name;
        if (!targetJd) targetJd = app.job_description || "";
        const resumeVer = Array.isArray(app.resume_versions) ? app.resume_versions[0] : app.resume_versions;
        if (resumeVer?.content) {
          resumeContent = JSON.stringify(resumeVer.content);
        }
      }
    }

    if (!targetRole) {
      targetRole = "Software Engineer";
    }

    // Call adaptive engine
    const { questions } = await startAdaptiveInterview({
      role: targetRole,
      company: targetCompany,
      jobDescription: targetJd,
      resumeDataJson: resumeContent || "Candidate profile",
      goal: goal || "full_mock",
      mode: goal || "behavioral",
      roleFamily: (roleFamily as InterviewRoleFamily) || "technology",
      tracks: tracks || ["behavioral", "technical"],
      difficulty: difficulty || "Intermediate",
      budgetLimit: budgetLimit || 5,
      voice: voice || "Kore",
    });

    const sessionId = crypto.randomUUID();

    // Record session if user is logged in
    if (user) {
      try {
        await (supabase as any).from("interview_sessions").insert({
          id: sessionId,
          user_id: user.id,
          application_id: applicationId || null,
          questions: questions,
          difficulty: (difficulty || "intermediate").toLowerCase(),
          mode: simulationMode || "text",
          tracks: tracks || ["behavioral", "technical"],
          status: "active",
        });
      } catch (dbErr) {
        console.warn("interview_sessions record warning:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      questions,
      sessionId,
    });
  } catch (error: any) {
    console.error("Start interview error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to start interview session" },
      { status: 500 }
    );
  }
}
