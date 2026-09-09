"use client";

import { Check, Edit, AlertCircle, ChevronRight, History } from "lucide-react";

export function DocumentBuilderSidebar({ history }: { history: any[] }) {
  return (
    <div className="p-6 space-y-8 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          Document Builder
        </h2>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
          Ready to sync
        </span>
      </div>

      {/* Sections Grid */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resume Sections</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-sm cursor-pointer hover:border-blue-300">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Summary
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs font-semibold text-blue-700 flex items-center gap-2 shadow-sm cursor-pointer ring-1 ring-blue-600 ring-offset-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Experience
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-sm cursor-pointer hover:border-blue-300">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Projects
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-sm cursor-pointer hover:border-blue-300">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Skills
          </div>
        </div>
      </div>

      {/* Section Focus Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl shadow-blue-900/5 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">Section Focus</h4>
            <p className="text-sm font-black text-slate-900 leading-tight">Interactive E-Commerce Library</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Targeting Acme's Component Stack</p>
          </div>
          <div className="text-center">
            <div className="text-sm font-black text-emerald-600 leading-none">92%</div>
            <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">ATS</div>
          </div>
        </div>
        
        <div className="p-4 bg-amber-50/50">
          <div className="bg-white rounded-lg border border-amber-200 p-3 shadow-sm">
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold mb-2">
              <AlertCircle className="w-3.5 h-3.5" /> AI Recommendation
            </div>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              Add quantifiable metric to bullet 2 (e.g., <em>"reduced page load by 320ms"</em>) to match Acme's performance requirements.
            </p>
            <button className="mt-3 text-[11px] font-bold text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors">
              Apply Suggestion <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white space-y-3">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identified Acme Keywords</h4>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-200">
              <Check className="w-3 h-3" /> TypeScript
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-200">
              <Check className="w-3 h-3" /> Tailwind v3
            </span>
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-[10px] font-bold border border-amber-200">
              + Next.js 14
            </span>
          </div>
          
          <button className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
            <Edit className="w-3.5 h-3.5" /> Edit Section Content
          </button>
        </div>
      </div>

      {/* History */}
      <div className="space-y-3">
        <div className="flex justify-between items-end mb-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resume Tailoring History</h3>
          <span className="text-[10px] font-medium text-slate-400">{history.length || 3} iterations</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-2.5 rounded-lg">
            <span className="text-xs font-bold text-slate-900">v3.0 Acme Custom</span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Active</span>
          </div>
          <div className="flex justify-between items-center bg-transparent border border-transparent p-2.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
            <span className="text-xs font-medium text-slate-600">v2.0 Generic Tech</span>
            <span className="text-[10px] text-slate-400">2d ago</span>
          </div>
          <div className="flex justify-between items-center bg-transparent border border-transparent p-2.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
            <span className="text-xs font-medium text-slate-600">v1.0 Base Resume</span>
            <span className="text-[10px] text-slate-400">5d ago</span>
          </div>
        </div>
      </div>

      {/* Promo Footer */}
      <div className="mt-auto bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-center space-y-2">
        <h4 className="text-xs font-bold text-blue-900">Never get lost in the ATS black hole</h4>
        <p className="text-[10px] text-blue-700/80 leading-relaxed">
          Zentail parses resumes with 99.8% precision across Workday, Greenhouse & Lever.
        </p>
      </div>
    </div>
  );
}
