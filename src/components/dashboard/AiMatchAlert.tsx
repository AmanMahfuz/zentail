"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, X, ChevronRight, TrendingUp } from "lucide-react";

type Recommendation = {
  id: string;
  job_title: string;
  company_name: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  best_resume_label: string;
  application_id: string | null;
};

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 90 ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
    score >= 80 ? "bg-blue-100 text-blue-800 border-blue-200" :
    score >= 70 ? "bg-amber-100 text-amber-800 border-amber-200" :
    "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {score}%
    </span>
  );
}

export function AiMatchAlert({ recommendations }: { recommendations: Recommendation[] }) {
  const [dismissed, setDismissed] = useState(false);

  const strongMatches = recommendations.filter(r => r.match_score >= 80);
  if (dismissed || strongMatches.length === 0) return null;

  const top = strongMatches.slice(0, 3);

  return (
    <div className="mb-6 rounded-2xl border border-[#FC5C3C]/20 bg-gradient-to-r from-[#FC5C3C]/5 to-orange-50/30 p-5 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FC5C3C] flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
              {strongMatches.length} AI Match{strongMatches.length !== 1 ? "es" : ""} Ready
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strong resume fits found — act now for best results
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Preview cards */}
      <div className="flex flex-col gap-2 mb-4">
        {top.map((rec) => (
          <div key={rec.id} className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3 shadow-sm">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
              {rec.company_name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{rec.job_title}</p>
              <p className="text-xs text-slate-500 truncate">{rec.company_name}</p>
            </div>

            {/* Score + skill count */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-400 hidden sm:block">
                {Array.isArray(rec.matched_skills) ? rec.matched_skills.length : 0} matched
              </span>
              <ScoreBadge score={rec.match_score} />
            </div>

            {/* CTA */}
            <Link
              href={rec.application_id
                ? `/applications/${rec.application_id}/resume`
                : `/jobs/match`}
              className="shrink-0 flex items-center gap-1 text-[12px] font-semibold text-[#FC5C3C] hover:text-[#e04a2a] transition-colors"
            >
              Use Resume <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          Using the matched resume increases interview rate by up to 40%
        </div>
        <Link
          href="/jobs/match"
          className="text-[12px] font-semibold text-[#FC5C3C] hover:text-[#e04a2a] transition-colors flex items-center gap-1"
        >
          View all matches <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
