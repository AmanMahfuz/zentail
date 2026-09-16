import { createClient } from "@/lib/supabase/server";
import { RequirementMap } from "@/components/applications/RequirementMap";
import { redirect } from "next/navigation";

export default async function ApplicationDetailPage({
  params
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: appDataRaw } = await supabase
    .from("applications")
    .select(`
      *,
      job:jobs(*)
    `)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!appDataRaw) redirect("/applications");

  const appData = appDataRaw as any;

  // Temporarily map legacy schema to new requirements while waiting for DB migration
  // Convert simple string arrays from db (matched_skills, etc) into RequirementMap shapes
  const requirements: any[] = [];
  
  if (appData.matched_skills) {
    appData.matched_skills.forEach((skill: string) => {
      requirements.push({
        requirement: skill,
        type: "Skill",
        importance: "high",
        evidence: "Mentioned in resume",
        status: "found",
        suggestedAction: ""
      });
    });
  }

  if (appData.partial_skills) {
    appData.partial_skills.forEach((skill: string) => {
      requirements.push({
        requirement: skill,
        type: "Skill",
        importance: "medium",
        evidence: null,
        status: "partial",
        suggestedAction: "Strengthen this on your resume or prep for questions."
      });
    });
  }

  if (appData.missing_skills || appData.critical_missing) {
    const missing = [...(appData.missing_skills || []), ...(appData.critical_missing || [])];
    // Deduplicate
    const uniqueMissing = Array.from(new Set(missing));
    uniqueMissing.forEach((skill: string) => {
      requirements.push({
        requirement: skill,
        type: "Skill",
        importance: "high",
        evidence: null,
        status: "missing",
        suggestedAction: "Consider how to frame adjacent experience or start learning this."
      });
    });
  }

  const app = {
    ...appData,
    company_name: appData.company_name || appData.job?.company || "Unknown Company",
    job_title: appData.job_title || appData.job?.title || "Unknown Role",
    fit_score: appData.fit_score || null,
    company_type: appData.company_type || null,
    status: appData.status || "review_needed",
    requirement_maps: {
      matched_count: (appData.matched_skills || []).length,
      missing_count: (appData.missing_skills || []).length + (appData.critical_missing || []).length,
      requirements: requirements.length > 0 ? requirements : [
        // Fallback mock if nothing is found
        { requirement: "React", type: "Skill", importance: "high", evidence: "Built 5 apps", status: "found", suggestedAction: "" },
        { requirement: "GraphQL", type: "Skill", importance: "medium", evidence: null, status: "missing", suggestedAction: "Build a small project to show GraphQL knowledge" }
      ]
    },
    resumes_generated: { status: "ready", match_percentage: appData.fit_score || 92 },
    cover_letters_generated: { status: "ready" },
    interview_prep: { status: "generating" }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <a
          href="/applications"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 no-underline transition-colors"
        >
          ← Applications
        </a>
        <h1 className="text-2xl font-semibold mt-2 mb-1">
          {app.job_title}
        </h1>
        <div className="text-sm text-zinc-500 flex items-center gap-2">
          {app.company_name}
          {app.company_type && (
            <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
              {app.company_type}
            </span>
          )}
        </div>
      </div>

      {/* Fit Score Banner */}
      {app.fit_score != null && (
        <div className={`flex items-center gap-4 p-5 rounded-2xl mb-6 ${
          app.fit_score >= 80 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100" :
          app.fit_score >= 60 ? "bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100" :
          "bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100"
        }`}>
          <div className="shrink-0">
            <div className="text-4xl font-semibold leading-none">{app.fit_score}%</div>
            <div className="text-xs opacity-80 mt-1 font-medium">
              fit score
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium mb-1">
              {app.fit_score >= 80
                ? "Strong match. Apply with confidence."
                : app.fit_score >= 60
                ? "Good match. Review gaps before applying."
                : "Weak match. Fix critical gaps first."
              }
            </div>
            <div className="text-xs opacity-80">
              {app.requirement_maps?.matched_count || 0} matched ·{" "}
              {app.requirement_maps?.missing_count || 0} gaps
            </div>
          </div>
        </div>
      )}

      {/* Requirement Map */}
      <RequirementMap
        applicationId={app.id}
        requirementMap={app.requirement_maps}
        status={app.status}
      />

      {/* Deliverables */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <a
          href={`/applications/${app.id}/resume`}
          className="block p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl no-underline text-inherit hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
        >
          <div className="text-2xl mb-2">📄</div>
          <div className="text-sm font-medium">Tailored resume</div>
          <div className="text-xs text-zinc-500 mt-1">
            {app.resumes_generated?.status === "ready"
              ? `${app.resumes_generated.match_percentage}% match → View`
              : "Generating..."}
          </div>
        </a>

        <a
          href={`/applications/${app.id}/cover-letter`}
          className="block p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl no-underline text-inherit hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
        >
          <div className="text-2xl mb-2">✉️</div>
          <div className="text-sm font-medium">Cover letter</div>
          <div className="text-xs text-zinc-500 mt-1">
            {app.cover_letters_generated?.status === "ready"
              ? "Ready → Copy"
              : "Generating..."}
          </div>
        </a>

        <a
          href={`/applications/${app.id}/interview`}
          className="block p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl no-underline text-inherit hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
        >
          <div className="text-2xl mb-2">🎯</div>
          <div className="text-sm font-medium">Interview prep</div>
          <div className="text-xs text-zinc-500 mt-1">
            {app.interview_prep?.status === "ready"
              ? `${app.company_type || "Role"}-specific → Start`
              : "Generating..."}
          </div>
        </a>
      </div>
    </div>
  );
}
