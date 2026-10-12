import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApplicationsHubClient } from "@/components/applications-hub/ApplicationsHubClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName =
    profile?.full_name?.split(" ")[0] ||
    (user.user_metadata as any)?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";

  const { data: rawApplications, error: appError } = await supabase
    .from("applications")
    .select(`
      id,
      job_title,
      company,
      company_name,
      job_description,
      match_score,
      fit_score,
      status,
      present_skills,
      matched_skills,
      missing_skills,
      created_at
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (appError) {
    console.error("Applications query error:", appError);
  }

  const applications = (rawApplications || []).map((app: any) => ({
    id: app.id,
    job_title: app.job_title || "Target Role",
    company: app.company || app.company_name || "Target Company",
    job_description: app.job_description || null,
    match_score: app.match_score || app.fit_score || 0,
    status: app.status || "saved",
    present_skills: Array.isArray(app.present_skills)
      ? app.present_skills
      : Array.isArray(app.matched_skills)
      ? app.matched_skills
      : [],
    missing_skills: Array.isArray(app.missing_skills) ? app.missing_skills : [],
    created_at: app.created_at || new Date().toISOString(),
  }));

  return (
    <ApplicationsHubClient
      initialApplications={applications}
      userName={userName}
      userId={user.id}
    />
  );
}
