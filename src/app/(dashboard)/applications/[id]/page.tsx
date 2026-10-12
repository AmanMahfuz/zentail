import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JobHubClient } from "./JobHubClient";
import { getUserResume } from "@/lib/resume/user-resume-helper";
import { BrainCircuit, Loader2, Layers, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  // Fetch application
  const { data: rawApplication, error: appErr } = await supabase
    .from("applications")
    .select("*, job:jobs(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (appErr || !rawApplication) {
    redirect("/applications");
  }

  // Normalize application with linked job details
  const application = {
    ...rawApplication,
    location: (rawApplication as any).job?.location || (rawApplication as any).location || "Remote",
    salary_min: (rawApplication as any).job?.salary_min ?? null,
    salary_max: (rawApplication as any).job?.salary_max ?? null,
    currency: (rawApplication as any).job?.currency || "USD",
    deadline: (rawApplication as any).job?.deadline ?? null,
    job_url: (rawApplication as any).job?.url || (rawApplication as any).job_link || (rawApplication as any).job_url || null,
  };

  // Load all connected resources in parallel for instant 0-waterfall render
  const [
    userResume,
    { data: tailoredResume },
    { data: qaBank },
    { data: interviewSessions },
    { data: coverLetter },
    { data: applicationEvents },
  ] = await Promise.all([
    getUserResume(user.id),
    supabase
      .from("tailored_resumes")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("qa_banks")
      .select("*")
      .eq("application_id", id)
      .maybeSingle(),
    supabase
      .from("interview_sessions")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("cover_letters_generated")
      .select("*")
      .eq("application_id", id)
      .maybeSingle(),
    supabase
      .from("application_events")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
  ]);

  // Resolve linked or tailored resume from tailored_resumes, resume_versions, or resumes_generated
  let resolvedTailoredResume: any = null;
  if (tailoredResume) {
    resolvedTailoredResume = {
      id: tailoredResume.id,
      match_score: tailoredResume.ats_score ?? tailoredResume.match_percentage ?? application.fit_score ?? null,
      ...(typeof tailoredResume.tailored_content === "object" && tailoredResume.tailored_content !== null ? (tailoredResume.tailored_content as Record<string, any>) : {}),
    };
  } else if (application.resume_version_id) {
    const { data: ver } = await (supabase as any)
      .from("resume_versions")
      .select("*")
      .eq("id", application.resume_version_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (ver) {
      resolvedTailoredResume = {
        id: ver.id,
        match_score: ver.content?.ats_score ?? ver.content?.match_percentage ?? application.fit_score ?? null,
        ...(ver.content || {}),
      };
    }
  }

  if (!resolvedTailoredResume) {
    const { data: appVer } = await (supabase as any)
      .from("resume_versions")
      .select("*")
      .eq("application_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (appVer) {
      resolvedTailoredResume = {
        id: appVer.id,
        match_score: appVer.content?.ats_score ?? appVer.content?.match_percentage ?? application.fit_score ?? null,
        ...(appVer.content || {}),
      };
    } else {
      const { data: gen } = await (supabase as any)
        .from("resumes_generated")
        .select("*")
        .eq("application_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (gen) {
        resolvedTailoredResume = {
          id: gen.id,
          match_score: gen.ats_score ?? gen.match_percentage ?? application.fit_score ?? null,
        };
      }
    }
  }

  return (
    <JobHubClient
      application={application}
      userResume={userResume}
      initialTailoredResume={resolvedTailoredResume}
      initialQaBank={qaBank || null}
      initialInterviewSessions={interviewSessions || []}
      initialCoverLetter={coverLetter || null}
      initialEvents={applicationEvents || []}
    />
  );
}
