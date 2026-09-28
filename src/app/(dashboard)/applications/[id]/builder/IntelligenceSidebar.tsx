"use client";

import { CheckCircle2, AlertCircle, Sparkles, Building2, MapPin } from "lucide-react";

export function IntelligenceSidebar({
  job,
  activeResume,
  application,
  recommendation,
}: {
  job: any;
  activeResume: any;
  application?: any;
  recommendation?: any;
}) {
  const company = application?.company_name || job?.company || recommendation?.company_name || "Company";
  const jobTitle = application?.job_title || job?.title || recommendation?.job_title || "Target Role";
  const location = job?.location || "Remote / Flexible";
  const status = application?.status ? application.status.replace(/_/g, " ") : "Drafting";

  const matchScore = activeResume?.ats_score ?? application?.fit_score ?? recommendation?.match_score ?? 78;

  const matchedSkills: string[] = (
    activeResume?.skills_matched?.length
      ? activeResume.skills_matched
      : recommendation?.matched_skills?.length
      ? recommendation.matched_skills
      : application?.matched_skills
  ) || [];

  const missingSkills: string[] = (
    activeResume?.skills_missing?.length
      ? activeResume.skills_missing
      : recommendation?.missing_skills?.length
      ? recommendation.missing_skills
      : application?.missing_skills
  ) || [];

  const totalReqs = matchedSkills.length + missingSkills.length;
  const reqsText = totalReqs > 0 ? `${matchedSkills.length} of ${totalReqs} Requirements met` : "Alignment assessed";

  let salaryDisplay = "Competitive";
  if (job?.salary_min && job?.salary_max) {
    salaryDisplay = `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max / 1000)}k/yr`;
  } else if (job?.salary_min) {
    salaryDisplay = `$${Math.round(job.salary_min / 1000)}k+/yr`;
  }

  const interviewRateText = matchScore >= 80 
    ? "Interview Rate +18% (Strong Match)" 
    : matchScore >= 60 
    ? "Interview Rate +8% (Good Match)" 
    : "Tailoring Recommended";

  const barColor = matchScore >= 80 ? "bg-emerald-500" : matchScore >= 60 ? "bg-blue-600" : "bg-amber-500";

  return (
    <div className="p-6 space-y-7 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          {company} Intelligence
        </h2>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider capitalize">
          {status}
        </span>
      </div>

      {/* Role Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-start gap-3 mb-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-blue-700 shrink-0">
            {company?.[0]?.toUpperCase() || <Building2 className="w-5 h-5 text-slate-500" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 leading-tight text-sm truncate">{jobTitle}</h3>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <span className="truncate">{company}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 shrink-0"><MapPin className="w-3 h-3 text-slate-400" /> {location}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 capitalize">
            <div className="w-2 h-2 rounded-full bg-blue-500" /> {status} stage
          </div>
          <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded border border-emerald-100">
            {salaryDisplay}
          </div>
        </div>
      </div>

      {/* Match Confidence */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
        <div className="flex justify-between items-end">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Match Confidence</h4>
          <span className="text-3xl font-black text-slate-900 leading-none">{matchScore}%</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${Math.min(matchScore, 100)}%` }} />
        </div>

        <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
          <div className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> {interviewRateText}
          </div>
          <span>{reqsText}</span>
        </div>
      </div>

      {/* Skill Verification */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-end mb-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-900">Skill Verification</h4>
          <span className="text-[9px] font-medium text-slate-400">Parsed from Job Posting</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {matchedSkills.map((skill, idx) => (
            <div key={`match-${idx}`} className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-lg shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 truncate mr-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{skill}</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-600 uppercase border border-emerald-200 px-1.5 py-0.5 rounded bg-emerald-50/50 shrink-0">
                Matched
              </span>
            </div>
          ))}

          {missingSkills.map((skill, idx) => (
            <div key={`rec-${idx}`} className="flex items-center justify-between bg-white border border-amber-200 p-2.5 rounded-lg shadow-2xs bg-amber-50/20">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 truncate mr-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate">{skill}</span>
              </div>
              <span className="text-[9px] font-bold text-amber-600 uppercase border border-amber-200 px-1.5 py-0.5 rounded bg-white shrink-0">
                Recommended
              </span>
            </div>
          ))}

          {matchedSkills.length === 0 && missingSkills.length === 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
              No skills extracted yet. Generate a match to view competencies.
            </div>
          )}
        </div>
      </div>

      {/* AI Job Intelligence / Role Explanation */}
      {recommendation?.explanation && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Match Rationale
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {recommendation.explanation}
          </p>
        </div>
      )}

      {/* Footer CTA */}
      <a
        href={`/applications/${application?.id || ""}/resume`}
        className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-semibold shadow-sm flex items-center justify-center gap-2 transition-all text-center"
      >
        Open Tailored Resume View &rarr;
      </a>
    </div>
  );
}
