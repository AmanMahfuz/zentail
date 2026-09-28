import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PrepareInterviewClient from "./PrepareInterviewClient";

export const metadata = {
  title: "Interview Preparation — Zentail",
};

export default async function InterviewPreparePage({
  params,
  searchParams,
}: {
  params: Promise<{ applicationId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { applicationId } = await params;
  const resolvedSearchParams = await searchParams;
  const mode = (resolvedSearchParams.mode as 'voice' | 'text' | 'pdf') || 'text';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  // Fetch the application
  const { data: app, error } = await (supabase as any)
    .from("applications")
    .select("id, job_title, company_name, job_description")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  if (error || !app) {
    redirect("/interviews");
  }

  // Fetch existing QA bank if already generated
  const { data: qaBank } = await (supabase as any)
    .from("qa_banks")
    .select("id, questions")
    .eq("application_id", applicationId)
    .maybeSingle();

  return (
    <PrepareInterviewClient
      applicationId={applicationId}
      application={{
        id: app.id,
        jobTitle: app.job_title,
        companyName: app.company_name,
        jobDescription: app.job_description,
      }}
      initialQaBank={qaBank}
      initialMode={mode}
    />
  );
}
