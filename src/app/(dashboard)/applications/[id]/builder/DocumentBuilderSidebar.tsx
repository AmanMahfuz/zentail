"use client";

import { useState } from "react";
import { Check, Edit, AlertCircle, ChevronRight, Sparkles, Layers } from "lucide-react";

export function DocumentBuilderSidebar({
  history = [],
  application,
  recommendation,
  activeResume,
}: {
  history?: any[];
  application?: any;
  recommendation?: any;
  activeResume?: any;
}) {
  const [activeSection, setActiveSection] = useState<"summary" | "experience" | "projects" | "skills">("experience");

  const company = application?.company_name || recommendation?.company_name || recommendation?.companyName || "Target Company";
  const jobTitle = application?.job_title || recommendation?.job_title || recommendation?.jobTitle || "Target Role";
  const matchScore = activeResume?.ats_score ?? application?.fit_score ?? recommendation?.match_score ?? 85;

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

  const rawSuggestions: string[] = recommendation?.tailoring_suggestions || [];
  const primarySuggestion = rawSuggestions[0] || (
    missingSkills.length > 0
      ? `Emphasize experience with ${missingSkills.slice(0, 2).join(" & ")} in your work bullets to elevate relevance for ${company}.`
      : `Resume is well aligned with ${company}. Ensure key achievements feature quantifiable metrics.`
  );

  const atsColor = matchScore >= 80 ? "text-emerald-600" : matchScore >= 60 ? "text-amber-600" : "text-red-600";
  const atsBg = matchScore >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="p-6 space-y-7 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          Document Builder
        </h2>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
          Live Synced
        </span>
      </div>

      {/* Sections Grid */}
      <div className="space-y-2.5">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resume Sections</h3>
        <div className="grid grid-cols-2 gap-2">
          {(["summary", "experience", "projects", "skills"] as const).map((sec) => {
            const isSelected = activeSection === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setActiveSection(sec)}
                className={`p-2.5 rounded-lg text-xs font-semibold capitalize flex items-center gap-2 text-left transition-all ${
                  isSelected
                    ? "bg-blue-50 border border-blue-200 text-blue-700 shadow-xs ring-1 ring-blue-600 ring-offset-1"
                    : "bg-white border border-slate-200 text-slate-700 hover:border-blue-300 shadow-xs"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-blue-600" : "bg-slate-300"}`} />
                {sec}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Focus Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg shadow-blue-900/5 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/80">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">Target Role Focus</h4>
            <p className="text-sm font-black text-slate-900 leading-tight">{jobTitle}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Targeting {company}</p>
          </div>
          <div className="text-center bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <div className={`text-sm font-black leading-none ${atsColor}`}>{matchScore}%</div>
            <div className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${atsColor}`}>ATS</div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="p-4 bg-amber-50/40">
          <div className="bg-white rounded-lg border border-amber-200/80 p-3 shadow-xs space-y-2">
            <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> AI Tailoring Recommendation
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {primarySuggestion}
            </p>
          </div>
        </div>

        {/* Target Job Keywords */}
        <div className="p-4 border-t border-slate-100 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {company} Keywords
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">
              {matchedSkills.length} matched
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {matchedSkills.slice(0, 6).map((skill, idx) => (
              <span
                key={`matched-${idx}`}
                className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-200"
              >
                <Check className="w-3 h-3 text-emerald-600" /> {skill}
              </span>
            ))}
            {missingSkills.slice(0, 4).map((skill, idx) => (
              <span
                key={`missing-${idx}`}
                className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-1 rounded-md text-[10px] font-bold border border-amber-200"
              >
                + {skill}
              </span>
            ))}
            {matchedSkills.length === 0 && missingSkills.length === 0 && (
              <span className="text-xs text-slate-400 italic">No specific skill keywords extracted yet.</span>
            )}
          </div>
        </div>
      </div>

      {/* Tailoring History */}
      <div className="space-y-3">
        <div className="flex justify-between items-end mb-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resume Tailoring History</h3>
          <span className="text-[10px] font-medium text-slate-400">
            {Math.max(history.length, 1)} {Math.max(history.length, 1) === 1 ? "iteration" : "iterations"}
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {history.length > 0 ? (
            history.map((item, idx) => {
              const isFirst = idx === 0;
              return (
                <div
                  key={item.id || idx}
                  className={`flex justify-between items-center p-2.5 rounded-lg border transition-all ${
                    isFirst
                      ? "bg-blue-50/70 border-blue-200 shadow-2xs"
                      : "bg-white border-slate-200 hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
                      {item.version_label || `Tailored v${history.length - idx}`}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Active"}
                    </span>
                  </div>
                  {isFirst ? (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500">
                      {item.match_percentage ? `${item.match_percentage}% ATS` : "Archived"}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-2.5 rounded-lg">
              <span className="text-xs font-bold text-slate-900">v1.0 {company} Tailored</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Promo Footer */}
      <div className="mt-auto bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl text-center space-y-1.5">
        <h4 className="text-xs font-bold text-blue-900">ATS Compliant Engine</h4>
        <p className="text-[10px] text-blue-700/80 leading-relaxed">
          Zentail optimizes parsing precision across Workday, Greenhouse & Lever ATS systems.
        </p>
      </div>
    </div>
  );
}
