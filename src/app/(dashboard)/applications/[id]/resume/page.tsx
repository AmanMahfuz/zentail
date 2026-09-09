import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateTailoredResume } from "@/lib/actions/phase3";
import { ResumeCenterClient } from "./ResumeCenterClient";

export default async function ResumeCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: applicationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Fetch application + job info
  const { data: application } = await supabase
    .from("applications")
    .select("id, job:jobs(title, company, description)")
    .eq("id", applicationId)
    .single();

  if (!application) redirect("/applications");
  const job = application.job as any;

  // Fetch existing generated resume for this application
  let { data: resumeRaw } = await supabase
    .from("resumes_generated")
    .select("*")
    .eq("application_id", applicationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let resume: any = resumeRaw ?? null;

  // Auto-generate if none exists yet
  if (!resume) {
    const result = await generateTailoredResume(applicationId);
    if (result.success) resume = result.data ?? null;
  }

  return (
    <ResumeCenterClient
      applicationId={applicationId}
      jobTitle={job?.title ?? ""}
      company={job?.company ?? ""}
      resume={resume}
    />
  );
}
