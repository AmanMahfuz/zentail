import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInterviewPrep } from "@/lib/actions/phase3";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const jobUrl = body.jobUrl || body.job_link;
    const description = body.description || body.jobDescription || body.job_description || "";
    const company = body.company || body.preComputedAnalysis?.company || "Target Company";
    const title = body.title || body.preComputedAnalysis?.jobTitle || "Target Role";
    const preComputedAnalysis = body.preComputedAnalysis;

    // Build application record — all job data lives directly on applications
    const appData: any = {
      user_id: user.id,
      job_title: title,
      company_name: company,
      job_description: description,
      job_link: jobUrl,
      status: "review_needed",
      resume_version_id: body.resumeVersionId || body.resume_version_id || null,
    };

    if (preComputedAnalysis) {
      appData.fit_score = preComputedAnalysis.fitScore ?? 70;
      appData.fit_summary = preComputedAnalysis.whatIsHoldingBack || preComputedAnalysis.verdict;
      appData.matched_skills = preComputedAnalysis.matched || [];
      appData.partial_skills = preComputedAnalysis.partial || [];
      appData.missing_skills = preComputedAnalysis.missing || [];
      appData.improvements = preComputedAnalysis.improvements || [];
    }

    // Create Application record
    const { data: application, error: appError } = await (supabase
      .from("applications")
      .insert(appData as any) as any)
      .select()
      .single();

    if (appError) throw appError;

    // 4. If preComputedAnalysis is present, insert requirement_map entries
    if (preComputedAnalysis && application) {
      const reqEntries: any[] = [];
      (preComputedAnalysis.matched || []).forEach((req: string) => {
        reqEntries.push({
          application_id: application.id,
          requirement_text: req,
          status: "matched",
          notes: "Matched from initial resume analysis"
        });
      });
      (preComputedAnalysis.partial || []).forEach((req: string) => {
        reqEntries.push({
          application_id: application.id,
          requirement_text: req,
          status: "partial",
          notes: "Identified as partial match"
        });
      });
      (preComputedAnalysis.missing || []).forEach((req: string) => {
        reqEntries.push({
          application_id: application.id,
          requirement_text: req,
          status: "missing",
          notes: "Missing from initial resume"
        });
      });

      if (reqEntries.length > 0) {
        await (supabase as any).from("requirement_map").insert(reqEntries);
      }
    }

    // Auto-tailor the resume for this application (scans user collection, selects best base, tailors to JD, links to app, and generates interview prep)
    try {
      const { ResumeAgent } = await import("@/lib/agents/resume-agent");
      const tailorResult = await ResumeAgent.tailorForJob(application.id);
      if (tailorResult.success) {
        const { data: updatedApp } = await (supabase as any)
          .from("applications")
          .select("resume_version_id, fit_score")
          .eq("id", application.id)
          .single();
        if (updatedApp?.resume_version_id) {
          application.resume_version_id = updatedApp.resume_version_id;
          application.fit_score = updatedApp.fit_score ?? application.fit_score;
        }
      }
    } catch (tailorErr) {
      console.warn("Auto-tailoring warning on app creation:", tailorErr);
    }

    // Automatically trigger normal text-based interview question prep if not already done
    try {
      await generateInterviewPrep(application.id);
    } catch (prepErr) {
      console.warn("Interview prep auto-generation warning:", prepErr);
    }

    // Automatically generate 15-question interview Q&A bank if not already done
    try {
      const { generateQABank } = await import("@/lib/actions/phase3");
      await generateQABank(application.id);
    } catch (qaErr) {
      console.warn("Interview QA bank auto-generation warning:", qaErr);
    }

    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/dashboard");
      revalidatePath("/applications");
      revalidatePath("/resumes");
      revalidatePath(`/applications/${application.id}`);
    } catch (_) {}

    return NextResponse.json({
      ...application,
      applicationId: application.id
    });

  } catch (error: any) {
    console.error("Create application error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create application" },
      { status: 500 }
    );
  }
}
