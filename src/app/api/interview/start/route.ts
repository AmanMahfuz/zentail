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

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    const { createAuthClient } = await import("@/lib/supabase/server");
    const supabase = token ? createAuthClient(token) : await createClient();
    const { data: { user } } = await (token ? supabase.auth.getUser(token) : supabase.auth.getUser());

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let targetRole = role;
    let targetCompany = company || "Target Company";
    let targetJd = jobDescription || "";
    let resumeContent = "";

    // If linked to an application, verify user ownership and load context
    if (applicationId) {
      const { data: app, error: appErr } = await supabase
        .from("applications")
        .select("job_title, company, company_name, job_description")
        .eq("id", applicationId)
        .eq("user_id", user.id)
        .single();

      if (appErr || !app) {
        return NextResponse.json(
          { error: "Application not found or unauthorized" },
          { status: 404 }
        );
      }

      if (!targetRole) targetRole = app.job_title;
      if (!company) targetCompany = app.company || app.company_name;
      if (!targetJd) targetJd = app.job_description || "";
    }

    // Always fetch candidate's master resume from user_resume
    if (user) {
      const { getUserResume, formatResumeToMarkdown } = await import("@/lib/resume/user-resume-helper");
      const userRes = await getUserResume(user.id);
      if (userRes) {
        resumeContent = formatResumeToMarkdown(userRes);
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
        let targetAppId = applicationId;
        if (!targetAppId) {
          const { data: latestApp } = await supabase
            .from("applications")
            .select("id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestApp?.id) {
            targetAppId = latestApp.id;
          } else {
            const { data: defaultApp } = await supabase
              .from("applications")
              .insert({
                user_id: user.id,
                job_title: targetRole || "General Practice",
                company_name: targetCompany || "Practice Arena",
                status: "saved",
              })
              .select("id")
              .single();
            if (defaultApp?.id) {
              targetAppId = defaultApp.id;
            }
          }
        }

        if (targetAppId) {
          const insertPayload: any = {
            id: sessionId,
            user_id: user.id,
            application_id: targetAppId,
            mode: simulationMode === "voice" ? "voice" : "text",
            answers: [],
          };

          await (supabase as any).from("interview_sessions").insert(insertPayload);
        }
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
