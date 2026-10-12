import { NextResponse } from "next/server";
import { createClient, createAuthClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    const supabase = token ? createAuthClient(token) : await createClient();
    const { data: { user } } = await (token ? supabase.auth.getUser(token) : supabase.auth.getUser());
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const jobUrl = body.jobUrl || body.job_link || null;
    const description = body.description || body.jobDescription || body.job_description || "";
    const company = body.company?.trim() || body.preComputedAnalysis?.company?.trim() || "Company Not Specified";
    const title = body.title?.trim() || body.jobTitle?.trim() || body.preComputedAnalysis?.jobTitle?.trim() || "Position Not Specified";
    const preComputedAnalysis = body.preComputedAnalysis;

    // 1. Create or reuse job record in jobs table (P0-D: consistency with createApplication)
    let jobId: string | null = null;
    try {
      const { data: existingJob } = await supabase
        .from("jobs")
        .select("id")
        .eq("user_id", user.id)
        .eq("company", company)
        .eq("title", title)
        .eq("url", jobUrl || "")
        .maybeSingle();

      if (existingJob) {
        jobId = existingJob.id;
      } else {
        const { data: newJob } = await supabase
          .from("jobs")
          .insert({
            user_id: user.id,
            company,
            title,
            url: jobUrl,
            description: description || null,
          })
          .select("id")
          .single();

        if (newJob) {
          jobId = newJob.id;
        }
      }
    } catch (jobErr) {
      console.warn("[/api/applications/create] Job persistence warning:", jobErr);
    }

    // 2. Build application record
    const appData: any = {
      user_id: user.id,
      job_id: jobId,
      job_title: title,
      company: company,
      company_name: company,
      job_description: description || null,
      job_link: jobUrl,
      status: "analyzing",
      resume_version_id: body.resumeVersionId || body.resume_version_id || null,
    };

    if (preComputedAnalysis) {
      appData.fit_score = typeof preComputedAnalysis.fitScore === "number" ? preComputedAnalysis.fitScore : null;
      appData.fit_summary = preComputedAnalysis.whatIsHoldingBack || preComputedAnalysis.verdict || null;
      appData.matched_skills = preComputedAnalysis.matched || [];
      appData.partial_skills = preComputedAnalysis.partial || [];
      appData.missing_skills = preComputedAnalysis.missing || [];
      appData.improvements = preComputedAnalysis.improvements || [];
    }

    // 3. Deduplicate application creation from onboarding (prevent duplicate applications on retry or double-click)
    if (body.fromOnboarding && company && title) {
      const { data: existingApp } = await (supabase
        .from("applications")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_name", company)
        .eq("job_title", title)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle() as any);

      if (existingApp) {
        return NextResponse.json({
          applicationId: existingApp.id,
          id: existingApp.id,
          reused: true,
        });
      }
    }

    // Insert Application record
    const { data: application, error: appError } = await (supabase
      .from("applications")
      .insert(appData as any) as any)
      .select()
      .single();

    if (appError) throw appError;

    // Record timeline creation event
    try {
      await (supabase as any).from("application_events").insert({
        application_id: application.id,
        event_type: "created",
        status: "analyzing",
        data: {
          company,
          job_title: title,
          created_at: new Date().toISOString(),
        },
      });
    } catch (evtErr) {
      console.warn("[/api/applications/create] application_events warning:", evtErr);
    }

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
        try {
          await (supabase as any).from("requirement_map").insert(reqEntries);
        } catch (reqErr) {
          console.warn("[/api/applications/create] requirement_map insert warning:", reqErr);
        }
      }
    }

    // 5. Enqueue background processing with Inngest (P0-D: unified background pipeline)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { inngest } = await import("@/inngest/client");
      await inngest.send({
        name: "application/added",
        data: {
          application_id: application.id,
          user_id: user.id,
          access_token: session?.access_token,
        },
      });
    } catch (err) {
      console.error("[/api/applications/create] Failed to trigger Inngest application/added event:", err);
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
