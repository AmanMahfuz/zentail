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
      .select("id, requirement_maps") as any)
      .eq("id", resolvedParams.id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Evidence table does not exist in schema. Skip inserting for now.

    // 3. Update the specific requirement map
    // We update the local requirement map for this specific app so the UI reflects the new evidence immediately
    let reqMap = application.requirement_maps as any;
    if (reqMap && reqMap.requirements) {
      reqMap.requirements = reqMap.requirements.map((r: any) => {
        if (r.requirement === requirement) {
          return {
            ...r,
            evidence: evidence,
            status: "found", // Optimistically mark as found since user provided evidence
            suggestedAction: ""
          };
        }
        return r;
      });

      // Recalculate counts
      reqMap.matched_count = reqMap.requirements.filter((r: any) => r.status === "found").length;
      reqMap.missing_count = reqMap.requirements.filter((r: any) => r.status !== "found").length;

      await (supabase
        .from("applications")
        .update({ requirement_maps: reqMap } as any) as any)
        .eq("id", resolvedParams.id);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Add evidence error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add evidence" },
      { status: 500 }
    );
  }
}
