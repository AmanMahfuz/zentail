"use client";

import { CheckCircle2, MessageCircle, Info } from "lucide-react";

export function IntelligenceSidebar({ job, activeResume }: { job: any, activeResume: any }) {
  // Using dummy values to match the mockup exactness if backend data doesn't have it
  const matchScore = activeResume?.match_percentage || 78;

  return (
    <div className="p-6 space-y-8 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          Acme Corp Intelligence
        </h2>
        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-wider">
          Urgent
        </span>
      </div>

      {/* Role Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-blue-700">
            {job.company?.[0]?.toUpperCase() || "A"}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">{job.title || "Frontend Developer"}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{job.company || "Acme Corp Inc."} • {job.location || "San Francisco"}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <div className="w-2 h-2 rounded-full bg-blue-500" /> Applied stage
          </div>
          <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded border border-emerald-100">
            $120k - $135k/yr
          </div>
        </div>
      </div>

      {/* Match Confidence */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-end">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Match Confidence</h4>
          <span className="text-3xl font-black text-slate-900 leading-none">{matchScore}%</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${matchScore}%` }} />
        </div>
        
        <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
          <div className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> Interview Rate +12%
          </div>
          <span>6 of 8 Requirements met</span>
        </div>
      </div>

      {/* Skill Verification */}
      <div className="space-y-3">
        <div className="flex justify-between items-end mb-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-900">Skill Verification</h4>
          <span className="text-[9px] font-medium text-slate-400">Parsed from Posting</span>
        </div>

        <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> TypeScript & Clean React
          </div>
          <span className="text-[9px] font-bold text-emerald-600 uppercase border border-emerald-200 px-1.5 py-0.5 rounded">Matched</span>
        </div>

        <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Tailwind CSS Production
          </div>
          <span className="text-[9px] font-bold text-emerald-600 uppercase border border-emerald-200 px-1.5 py-0.5 rounded">Matched</span>
        </div>

        <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Design Systems & WCAG
          </div>
          <span className="text-[9px] font-bold text-emerald-600 uppercase border border-emerald-200 px-1.5 py-0.5 rounded">Matched</span>
        </div>

        <div className="flex items-center justify-between bg-white border border-amber-200 p-3 rounded-lg shadow-sm bg-amber-50/30">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <div className="w-2 h-2 rounded-full bg-amber-500" /> GraphQL Schema Design
          </div>
          <span className="text-[9px] font-bold text-amber-600 uppercase border border-amber-200 px-1.5 py-0.5 rounded bg-white">Recommended</span>
        </div>
      </div>

      {/* Networking CRM Sneak Peek */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-900">Networking CRM Match</h4>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">1 Contact</span>
        </div>
        
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">MS</div>
            <div>
              <div className="text-xs font-bold text-slate-900">Mike Smith</div>
              <div className="text-[10px] text-slate-500">Frontend Lead @ Acme Corp</div>
            </div>
          </div>
          <button className="text-slate-400 hover:text-blue-600 transition-colors">
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
          Connected via Career Fair 2024. Mention Mike in your cover note.
        </p>
      </div>

      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all">
        Send Application via Zentail &rarr;
      </button>

    </div>
  );
}
