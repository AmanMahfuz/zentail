import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JobMatchClient from "./JobMatchClient";

export default async function JobMatchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Fetch resumes from resume_versions
  const { data: resumesRaw } = await (supabase as any)
    .from("resume_versions")
    .select("id, version_label, version_number")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const resumes = (resumesRaw || []).map((r: any) => ({
    id: r.id,
    version_tag: r.version_label || `V${r.version_number}`,
  }));

  // Fetch jobs (from applications and standalone jobs)
  const { data: jobs } = await (supabase as any)
    .from("jobs")
    .select("id, title, company, description")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <JobMatchClient initialResumes={resumes} initialJobs={jobs || []} />;
}
