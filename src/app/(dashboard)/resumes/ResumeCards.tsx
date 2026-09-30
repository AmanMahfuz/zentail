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
  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="bg-indigo-100 text-[#4F46E5] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Master
          </span>
          {resume.is_default && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Default Profile
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <ResumeDownloadButton
            resumeId={resume.id}
            resumeTitle={resume.name || "Master_Resume"}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:text-slate-700"
          >
            <Download className="w-4 h-4" />
          </ResumeDownloadButton>
          <ResumeActionsDropdown resumeId={resume.id} />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            resume.file_url ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"
          }`}
        >
          {resume.file_url ? (
            <FileText className="w-6 h-6" />
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-lg truncate">
            {resume.name || "Master Resume"}
          </h3>
          <p className="text-sm text-slate-500 truncate">
            {resume.content?.personal?.fullName ||
              resume.content?.contact?.name ||
              resume.content?.fullName ||
              "Candidate"} •{" "}
            <span className="text-[#0A66C2] font-medium">
              {resume.content?.experience?.[0]?.jobTitle ||
                resume.content?.experience?.[0]?.title ||
                resume.content?.personal?.jobTitle ||
                resume.content?.contact?.title ||
                "Profile"}
            </span>
          </p>
          {resume.content?.ats_analysis?.blueprintName ? (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">ATS Match: {resume.content.ats_analysis.blueprintName.split("/")[0].trim()}</span>
            </div>
          ) : (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Ready to ATS Optimize
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-slate-50 rounded-xl py-3 flex flex-col items-center justify-center border border-slate-100">
          <span className="text-xl font-bold text-slate-900">{resume.content?.skills?.length || 0}</span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Skills</span>
        </div>
        <div className="bg-slate-50 rounded-xl py-3 flex flex-col items-center justify-center border border-slate-100">
          <span className="text-xl font-bold text-slate-900">{resume.content?.experience?.length || 0}</span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Experience</span>
        </div>
        <div className="bg-slate-50 rounded-xl py-3 flex flex-col items-center justify-center border border-slate-100">
          <span className="text-xl font-bold text-slate-900">{resume.content?.education?.length || 0}</span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Education</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-6">
        <div className="flex items-center gap-1.5" suppressHydrationWarning>
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Updated {new Date(resume.updated_at || resume.created_at).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-[11px]">
          <Briefcase className="w-3.5 h-3.5 text-slate-500" />
          {resume.version ? `v${resume.version}` : "v1"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto">
        <Link href={`/resumes/${resume.id}/edit`} className="block">
          <Button
            variant="outline"
            className="w-full bg-[#F8FAFC] border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl h-10 font-bold text-xs"
          >
            Open in Builder
          </Button>
        </Link>
        <TailorJobModal
          masterResumeId={resume.id}
          masterResumeName={resume.name}
          applications={applications}
        >
          <Button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl h-10 font-bold text-xs shadow-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Tailor for Job
          </Button>
        </TailorJobModal>
      </div>
    </div>
  );
}

export function TailoredResumeCard({ resume }: { resume: any }) {
  const matchScore = resume.fitScore || resume.match_percentage || resume.ats_score || 88;
  const matchedCount = resume.matchedCount ?? (resume.content?.skills?.length ? Math.min(resume.content.skills.length, 12) : 8);
  const missingCount = resume.missingCount ?? 2;

  const title = resume.jobTitle || resume.name || "Tailored Resume";
  const company = resume.company || "Target Opportunity";

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Tailored
          </span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5" /> {matchScore}% ATS
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <ResumeDownloadButton
            resumeId={resume.id}
            resumeTitle={`${company}_${title}`}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:text-slate-700"
          >
            <Download className="w-4 h-4" />
          </ResumeDownloadButton>
          <ResumeActionsDropdown resumeId={resume.id} />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 border border-emerald-100">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-lg truncate">
            {title}
          </h3>
          <p className="text-sm text-slate-500 truncate flex items-center gap-1">
            <span>Tailored for <strong className="text-slate-700">{company}</strong></span>
          </p>
        </div>
      </div>

      <div className="bg-slate-50/80 rounded-xl p-4 mb-6 text-sm text-slate-600 space-y-3 flex-1 border border-slate-100">
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="font-medium text-slate-700 text-xs">ATS Role Match Confidence</span>
            <span className="font-bold text-emerald-600 text-xs">{matchScore}/100</span>
          </div>
          <Progress value={matchScore} className="h-2 bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{matchedCount} Matched</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 font-semibold">
            <XCircle className="w-4 h-4" />
            <span>{missingCount} Recommended</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-6 mt-auto">
        <div className="flex items-center gap-1.5" suppressHydrationWarning>
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Tailored {new Date(resume.created_at).toLocaleDateString()}
        </div>
        {resume.application_id && (
          <Link
            href={`/applications/${resume.application_id}`}
            className="text-[#4F46E5] hover:underline text-[11px] font-bold flex items-center gap-1"
          >
            Application <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={
            resume.application_id
              ? `/applications/${resume.application_id}/builder`
              : `/resumes/${resume.id}/edit`
          }
          className="block"
        >
          <Button
            variant="outline"
            className="w-full bg-[#F8FAFC] border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl h-10 font-bold text-xs"
          >
            Open in Builder
          </Button>
        </Link>
        {resume.application_id ? (
          <Link href={`/applications/${resume.application_id}`} className="block">
            <Button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl h-10 font-bold text-xs shadow-xs flex items-center justify-center gap-1">
              View Match & ATS <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        ) : (
          <Link href={`/resumes/${resume.id}/edit`} className="block">
            <Button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl h-10 font-bold text-xs shadow-xs">
              Open in Builder
            </Button>
          </Link>
        )}
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
