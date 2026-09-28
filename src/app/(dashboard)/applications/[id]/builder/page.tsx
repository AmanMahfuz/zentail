import { createClient } from "@/lib/supabase/server";
import { ResumeBuilderClient } from "./ResumeBuilderClient";
import { redirect } from "next/navigation";

export default async function ApplicationResumeBuilderPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await params;
  const applicationId = resolved.id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // 1. Fetch application and associated job
  const { data: application } = await (supabase as any)
    .from("applications")
    .select(`
      id,
      status,
      fit_score,
      fit_level,
      job_title,
      company_name,
      job_description,
      matched_skills,
      missing_skills,
      resume_version_id,
      job:jobs ( title, company, location, salary_min, salary_max, description )
    `)
    .eq("id", applicationId)
    .single();

  if (!application) {
    redirect("/applications");
  }

  // 2. Fetch latest recommendation if available
  const { data: recommendation } = await (supabase as any)
    .from("resume_recommendations")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Look for any generated resumes or versions for this application
  const { data: generatedResumes } = await supabase
    .from("resumes_generated")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  const { data: resumeVersions } = await (supabase as any)
    .from("resume_versions")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  let activeResume: any = generatedResumes && generatedResumes.length > 0 ? generatedResumes[0] : null;

  if (!activeResume && resumeVersions && resumeVersions.length > 0) {
    const v = resumeVersions[0];
    activeResume = {
      id: v.id,
      content: v.content,
      resume_markdown: v.content?.markdown || JSON.stringify(v.content, null, 2),
      ats_score: application.fit_score || 85,
      match_percentage: application.fit_score || 85,
      skills_matched: application.matched_skills ?? recommendation?.matched_skills ?? [],
      skills_missing: application.missing_skills ?? recommendation?.missing_skills ?? [],
      pdf_url: v.pdf_url ?? null,
      created_at: v.created_at,
    };
  }

  // If still none, check application's linked resume_version or latest user resume
  if (!activeResume) {
    let verQuery = (supabase as any).from("resume_versions").select("*");
    if (application.resume_version_id) {
      verQuery = verQuery.eq("id", application.resume_version_id);
    } else {
      verQuery = verQuery
        .eq("user_id", user.id)
        .order("is_latest", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);
    }
    const { data: fallbackVer } = await verQuery.maybeSingle();
    if (fallbackVer) {
      activeResume = {
        id: fallbackVer.id,
        content: fallbackVer.content,
        resume_markdown: fallbackVer.content?.markdown || JSON.stringify(fallbackVer.content, null, 2),
        ats_score: application.fit_score || 80,
        match_percentage: application.fit_score || 80,
        skills_matched: application.matched_skills ?? recommendation?.matched_skills ?? [],
        skills_missing: application.missing_skills ?? recommendation?.missing_skills ?? [],
        pdf_url: fallbackVer.pdf_url ?? null,
        created_at: fallbackVer.created_at,
      };
    }
  }

  const history = [
    ...(generatedResumes || []).map((r: any) => ({
      id: r.id,
      version_label: `Tailored v${r.ats_score || 85}`,
      match_percentage: r.match_percentage || r.ats_score || 85,
      created_at: r.created_at,
      pdf_url: r.pdf_url,
    })),
    ...(resumeVersions || []).map((v: any) => ({
      id: v.id,
      version_label: v.version_label || `Version ${v.version_number}`,
      match_percentage: application.fit_score || 85,
      created_at: v.created_at,
      pdf_url: v.pdf_url,
    })),
  ];

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50">
      <ResumeBuilderClient
        application={application}
        recommendation={recommendation}
        activeResume={activeResume}
        history={history}
      />
    </div>
  );
}
