import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: any } // Next.js 15+ changes params to Promise or similar, use any to avoid TS conflict
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requirement, evidence } = await req.json();

    if (!requirement || !evidence) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const resolvedParams = await params;
    // 1. Fetch current application to verify ownership
    const { data: application, error: fetchError } = await (supabase
      .from("applications")
      .select("id, matched_skills, missing_skills, partial_skills, critical_missing") as any)
      .eq("id", resolvedParams.id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // 2. Move skill from missing/partial to matched
    let matched = application.matched_skills || [];
    let partial = application.partial_skills || [];
    let missing = application.missing_skills || [];
    let critical = application.critical_missing || [];

    // Remove from partial/missing/critical
    partial = partial.filter((s: string) => s !== requirement);
    missing = missing.filter((s: string) => s !== requirement);
    critical = critical.filter((s: string) => s !== requirement);

    // Add to matched if not already there
    if (!matched.includes(requirement)) {
      matched.push(requirement);
    }

    // Update DB
    await (supabase
      .from("applications")
      .update({
        matched_skills: matched,
        partial_skills: partial,
        missing_skills: missing,
        critical_missing: critical
      } as any) as any)
      .eq("id", resolvedParams.id);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Add evidence error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add evidence" },
      { status: 500 }
    );
  }
}
