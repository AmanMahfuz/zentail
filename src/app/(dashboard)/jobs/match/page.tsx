import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JobMatchClient from "./JobMatchClient";

export default async function JobMatchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Fetch resumes
  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, version_tag")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch jobs (from applications and standalone jobs)
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, company, description")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <JobMatchClient initialResumes={resumes || []} initialJobs={jobs || []} />;
}
