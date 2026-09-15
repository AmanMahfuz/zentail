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

    const { jobUrl, description, company, title } = await req.json();

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

    if (jobError) throw jobError;

    // 2. Create Application record (status: 'analyzing')
    const { data: application, error: appError } = await (supabase
      .from("applications")
      .insert({
        user_id: user.id,
        job_id: job.id,
        status: "analyzing"
      } as any) as any)
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
