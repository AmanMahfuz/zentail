"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  FileText,
  Calendar,
  Briefcase,
  Plus,
  Search,
  MoreVertical,
  Star,
  CheckCircle2,
  CircleDot,
  XCircle,
  ArrowRight,
  Sparkles,
  Building2,
  ExternalLink,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { ResumeActionsDropdown } from "./ResumeActions";
import { TailorJobModal } from "./TailorJobModal";
import { ResumeDownloadButton } from "@/components/resumes/ResumeDownloadButton";

export function MasterResumeCard({
  resume,
  applications = [],
}: {
  resume: any;
  applications?: any[];
}) {
  const isReady = !!resume.content?.ats_analysis?.blueprintName;
  
  // Date parsing
  const dateObj = new Date(resume.updated_at || resume.created_at);
  const dateStr = dateObj.toLocaleDateString("en-US");
  const isToday = dateStr === new Date().toLocaleDateString("en-US");
  const displayDate = isToday ? "Today, 10:24 AM" : dateStr;

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-blue-200 hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all">
      {/* 1. Icon + Title/Subtitle */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-600 transition-colors">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900 truncate text-[15px] group-hover:text-blue-600 transition-colors">
              {resume.name || "Master Resume"}
            </h3>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
              Master
            </span>
          </div>
          <p className="text-[13px] text-slate-500 truncate">
            {resume.content?.personal?.fullName || resume.content?.contact?.name || "Your main resume"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 sm:gap-8 justify-between sm:justify-end pl-16 sm:pl-0">
        {/* 2. ATS Score */}
        <div className="flex flex-col min-w-[80px]">
          <span className="text-[11px] text-slate-400 mb-1 font-medium uppercase tracking-wider">Score</span>
          {isReady ? (
            <div className="flex items-center gap-1.5 font-bold text-emerald-600 text-[13px]">
              <CircleDot className="w-4 h-4 text-emerald-500" /> 92%
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-bold text-slate-300 text-[13px]">
              ---
            </div>
          )}
        </div>

        {/* 3. Last Edited */}
        <div className="flex flex-col min-w-[100px]">
          <span className="text-[11px] text-slate-400 mb-1 font-medium uppercase tracking-wider">Edited</span>
          <span className="text-[13px] font-medium text-slate-700" suppressHydrationWarning>
            {displayDate}
          </span>
        </div>

        {/* 4. Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/resumes/${resume.id}/edit`}>
            <Button variant="ghost" className="h-9 w-9 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/resumes/${resume.id}/edit`}>
            <Button className="h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[13px] font-semibold px-4 shadow-sm">
              Edit
            </Button>
          </Link>
          <div className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <ResumeActionsDropdown resumeId={resume.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TailoredResumeCard({ resume }: { resume: any }) {
  const matchScore = resume.fitScore || resume.match_percentage || resume.ats_score || 88;
  const title = resume.jobTitle || resume.name || "Tailored Resume";
  const company = resume.company || "Target Opportunity";

  // Date parsing
  const dateObj = new Date(resume.created_at || resume.updated_at);
  const dateStr = dateObj.toLocaleDateString("en-US");
  const isToday = dateStr === new Date().toLocaleDateString("en-US");
  const displayDate = isToday ? "Today, 10:24 AM" : dateStr;

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-indigo-200 hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all">
      {/* 1. Icon + Title/Subtitle */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900 truncate text-[15px] group-hover:text-indigo-600 transition-colors">
              {title}
            </h3>
            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
              Tailored
            </span>
          </div>
          <p className="text-[13px] text-slate-500 truncate flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" /> {company}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 sm:gap-8 justify-between sm:justify-end pl-16 sm:pl-0">
        {/* 2. ATS Score */}
        <div className="flex flex-col min-w-[80px]">
          <span className="text-[11px] text-slate-400 mb-1 font-medium uppercase tracking-wider">Match</span>
          <div className="flex items-center gap-1.5 font-bold text-emerald-600 text-[13px]">
            <Sparkles className="w-4 h-4 text-emerald-500" /> {matchScore}%
          </div>
        </div>

        {/* 3. Last Edited */}
        <div className="flex flex-col min-w-[100px]">
          <span className="text-[11px] text-slate-400 mb-1 font-medium uppercase tracking-wider">Edited</span>
          <span className="text-[13px] font-medium text-slate-700" suppressHydrationWarning>
            {displayDate}
          </span>
        </div>

        {/* 4. Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href={resume.application_id ? `/applications/${resume.application_id}/builder` : `/resumes/${resume.id}/edit`}>
            <Button variant="ghost" className="h-9 w-9 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={resume.application_id ? `/applications/${resume.application_id}/builder` : `/resumes/${resume.id}/edit`}>
            <Button className="h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[13px] font-semibold px-4 shadow-sm">
              Edit
            </Button>
          </Link>
          <div className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <ResumeActionsDropdown resumeId={resume.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

import { AddNewResumeModal } from "./AddNewResumeModal";

export function AddNewResumePlaceholder() {
  return (
    <AddNewResumeModal />
  );
}
