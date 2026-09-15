import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { versionId, changes } = await request.json();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the version being promoted
    const { data: newLatest, error: getError } = await supabase
      .from("resume_versions")
      .select("*, user_id")
      .eq("id", versionId)
      .single();

    if (getError || !newLatest) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    if (newLatest.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get current latest (to compare)
    const { data: currentLatest } = await supabase
      .from("resume_versions")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_latest", true)
      .single();

    // Demote all existing latest
    await supabase
      .from("resume_versions")
      .update({ is_latest: false })
      .eq("user_id", user.id);

    // Promote this version to latest
    await supabase
      .from("resume_versions")
      .update({
        is_latest: true,
        saved_as_latest_at: new Date().toISOString()
      })
      .eq("id", versionId);

    // Record what changed (user may have edited further after AI tailoring)
    if (currentLatest && changes?.length > 0) {
      await supabase.from("resume_version_changes").insert({
        from_version_id: currentLatest.id,
        to_version_id: versionId,
        changes: changes,
        saved_by: "user"
      });
    }

    // Sync evidence base with new latest
    await syncEvidenceFromVersion(user.id, newLatest.content);

    return NextResponse.json({
      success: true,
      message: "This resume is now your starting point for future applications"
    });
  } catch (error: any) {
    console.error("Save as latest error:", error);
    return NextResponse.json({ error: error.message || "Failed to save as latest" }, { status: 500 });
  }
}

// When user saves a new latest, update evidence base too
async function syncEvidenceFromVersion(userId: string, content: any) {
  const supabase = createClient();

  // Update skills from this version
  if (content.skills?.length > 0) {
    for (const skill of content.skills) {
      await supabase.from("evidence_skills").upsert({
        user_id: userId,
        skill_name: skill.name || skill,
        category: skill.category || null,
        proof_status: skill.proofStatus || "self_reported"
      }, { onConflict: "user_id,skill_name" });
    }
  }

  // Update summary
  if (content.summary) {
    await supabase.from("user_evidence")
      .update({ summary: content.summary, last_synced_at: new Date().toISOString() })
      .eq("user_id", userId);
  }
}
