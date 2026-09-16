import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: version, error } = await (supabase as any)
    .from("resume_versions")
    .select(`
      *,
      changes:resume_version_changes!to_version_id (
        changes,
        saved_by,
        created_at
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !version) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Flatten the changes array from the relation if it exists
  const formattedChanges = version.changes?.[0]?.changes || [];

  return Response.json({
    ...version,
    changes: formattedChanges
  });
}
