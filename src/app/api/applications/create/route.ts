import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobUrl, description, company, title, preComputedAnalysis } = await req.json();

    // 1. Create Job record
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        user_id: user.id,
        title: title || "New Role",
        company: company || "Unknown Company",
        url: jobUrl,
        description: description,
      })
      .select()
      .single();

    if (jobError) console.warn("Job creation error (may be ignored if schema uses flattened fields):", jobError);

    // 2. Map precomputed analysis if available
    const appData: any = {
      user_id: user.id,
      job_title: title || "New Role",
      company_name: company || "Unknown Company",
      job_description: description,
      job_link: jobUrl,
      status: "analyzing",
    };

    if (job) {
      appData.job_id = job.id;
    }

    if (preComputedAnalysis) {
      appData.status = "review_needed";
      appData.fit_score = preComputedAnalysis.fitScore;
      appData.fit_summary = preComputedAnalysis.whatIsHoldingBack || preComputedAnalysis.verdict;
      appData.matched_skills = preComputedAnalysis.matched || [];
      appData.partial_skills = preComputedAnalysis.partial || [];
      appData.missing_skills = preComputedAnalysis.missing || [];
      appData.improvements = preComputedAnalysis.improvements || [];
    }

    // 3. Create Application record
    const { data: application, error: appError } = await (supabase
      .from("applications")
      .insert(appData as any) as any)
      .select()
      .single();

    if (appError) throw appError;

    // 3. Kick off async analysis (don't await)
    // We would hit a pub/sub or background queue here in production, 
    // but for MVP we will trigger the agent API endpoint synchronously or return and fetch
    // To keep it simple, we just return the application and let the UI poll
    // In a real app we'd dispatch to Inngest/Trigger.dev

    return NextResponse.json(application);

  } catch (error: any) {
    console.error("Create application error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create application" },
      { status: 500 }
    );
  }
}
