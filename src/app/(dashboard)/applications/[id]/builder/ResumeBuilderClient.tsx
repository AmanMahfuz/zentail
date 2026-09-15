"use client";

import { useState } from "react";
import { DocumentBuilderSidebar } from "./DocumentBuilderSidebar";
import { ResumeCanvas } from "./ResumeCanvas";
import { IntelligenceSidebar } from "./IntelligenceSidebar";
import { Button } from "@/components/ui/button";
import { ChevronRight, Download, Send, Zap, Loader2 } from "lucide-react";
import Link from "next/link";
import { exportResumeToDocx } from "@/lib/utils/export-docx";

export function ResumeBuilderClient({ application, activeResume, history }: { application: any, activeResume: any, history: any[] }) {
  const [zoom, setZoom] = useState(100);
  const [isExporting, setIsExporting] = useState(false);

  const job = application.job || {};

  const handleExportDocx = async () => {
    if (!activeResume?.content?.resume_markdown) return;
    setIsExporting(true);
    try {
      await exportResumeToDocx(activeResume.content.resume_markdown, `resume-${job.company || "zentail"}.docx`);
    } catch (err) {
      console.error(err);
      alert("Failed to export DOCX.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Header Navigation */}
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Link href="/dashboard" className="text-blue-600 flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1 rounded">
              <Zap className="w-4 h-4" />
            </div>
            Zentail
          </Link>
          <ChevronRight className="w-4 h-4 mx-1" />
          <Link href="/jobs/match" className="hover:text-slate-900 transition-colors">Jobs</Link>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-slate-900">{job.company || "Company"}</span>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-slate-900">{job.title || "Role"}</span>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold border border-blue-100 flex items-center gap-1.5">
            Tailored Resume v{history.length || 1} <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="text-slate-600 border-slate-200 hover:bg-slate-50"
            onClick={handleExportDocx}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export .DOCX
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            Attach & Apply to {job.company || "Company"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 ml-2">
            AJ
          </div>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-80 shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto">
          <DocumentBuilderSidebar history={history} />
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 bg-slate-100 overflow-y-auto relative flex flex-col items-center p-8 bg-[url('https://transparenttextures.com/patterns/cubes.png')]">
          {/* Toolbar */}
          <div className="sticky top-0 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-2 mb-6 flex items-center gap-4 shadow-sm z-20">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs tracking-wide">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> ATS Safe Clean Parse
            </div>
            <div className="w-px h-4 bg-slate-300" />
            <div className="text-slate-500 text-xs font-medium">Standard US Letter (8.5" × 11")</div>
            <div className="w-px h-4 bg-slate-300" />
            <div className="flex items-center gap-3 text-slate-500 text-xs font-medium">
              <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="hover:text-slate-900">−</button>
              <span className="w-8 text-center">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="hover:text-slate-900">+</button>
            </div>
          </div>

          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center", transition: "transform 0.2s ease" }}>
            <ResumeCanvas activeResume={activeResume} />
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 shrink-0 bg-white border-l border-slate-200 overflow-y-auto">
          <IntelligenceSidebar job={job} activeResume={activeResume} />
        </aside>
      </div>

      <footer className="h-10 shrink-0 bg-white border-t border-slate-200 flex items-center justify-between px-6 text-[11px] font-medium text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" /> All changes saved to Zentail Cloud
          <span className="mx-2">•</span>
          Last modified: Just now
        </div>
        <div className="flex items-center gap-6">
          <span className="hover:text-slate-600 cursor-pointer transition-colors">Interview Prep Flashcards</span>
          <span className="hover:text-slate-600 cursor-pointer transition-colors">ATS Benchmark Reports</span>
          <span className="flex items-center gap-1">Powered by <strong className="text-slate-500">Zentail Engine</strong></span>
        </div>
      </footer>
    </div>
  );
}
