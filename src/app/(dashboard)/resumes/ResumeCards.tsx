import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Calendar, Briefcase, Plus, Search, MoreVertical, Star, CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { ResumeActionsDropdown } from "./ResumeActions";

export function MasterResumeCard({ resume }: { resume: any }) {
  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="bg-indigo-100 text-[#4F46E5] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Master</span>
          {resume.is_default && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Default Profile
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-slate-600 rounded-md">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-slate-600 rounded-md">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </Button>
          <ResumeActionsDropdown resumeId={resume.id} />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${resume.file_url ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
          {resume.file_url ? (
            <FileText className="w-6 h-6" />
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-lg truncate">
            {resume.name || "Master Resume"}
          </h3>
          <p className="text-sm text-slate-500 truncate">
            {resume.content?.fullName || "No Name"} • <span className="text-[#0A66C2] font-medium">{resume.content?.experience?.[0]?.title || "Add Experience"}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-slate-50 rounded-xl py-3 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{resume.content?.skills?.length || 0}</span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Skills</span>
        </div>
        <div className="bg-slate-50 rounded-xl py-3 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{resume.content?.experience?.length || 0}</span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Experience</span>
        </div>
        <div className="bg-slate-50 rounded-xl py-3 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{resume.content?.education?.length || 0}</span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Education</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-6">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Updated {new Date(resume.updated_at || resume.created_at).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
          <Briefcase className="w-3.5 h-3.5" />
          {resume.applications?.length || 0} Used
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto">
        <Link href={`/resumes/${resume.id}/view`} className="block">
          <Button variant="outline" className="w-full bg-[#F8FAFC] border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl h-10 font-bold">
            Preview
          </Button>
        </Link>
        <Link href={`/resumes/${resume.id}/edit`} className="block">
          <Button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl h-10 font-bold shadow-sm">
            Tailor
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function TailoredResumeCard({ resume }: { resume: any }) {
  const matchScore = 92; // Mock for now until we link real scores
  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Tailored</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> {matchScore}% Match
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <ResumeActionsDropdown resumeId={resume.id} />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-500">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-lg truncate">
            {resume.name}
          </h3>
          <p className="text-sm text-slate-500 truncate">
            Based on Master Resume
          </p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-600 space-y-3 flex-1 border border-emerald-50">
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="font-medium text-slate-700">ATS Score</span>
            <span className="font-bold text-emerald-600">{matchScore}/100</span>
          </div>
          <Progress value={matchScore} className="h-2 bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>12 Matched</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-500 font-medium">
            <XCircle className="w-4 h-4" />
            <span>3 Missing</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-6 mt-auto">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Tailored {new Date(resume.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href={`/resumes/${resume.id}/view`} className="block">
          <Button variant="outline" className="w-full bg-[#F8FAFC] border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl h-10 font-bold">
            Preview
          </Button>
        </Link>
        <Link href={`/resumes/${resume.id}/edit`} className="block">
          <Button className="w-full bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-xl h-10 font-bold">
            Edit
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function AddNewResumePlaceholder() {
  return (
    <Link href="/resumes/builder" className="bg-slate-50/50 rounded-[24px] border-2 border-dashed border-slate-200 hover:border-[#4F46E5] hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center p-8 min-h-[360px] cursor-pointer group">
      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Plus className="w-8 h-8 text-slate-400 group-hover:text-[#4F46E5]" />
      </div>
      <h3 className="font-bold text-slate-900 text-lg mb-1">Add New Resume</h3>
      <p className="text-sm text-slate-500 text-center max-w-[200px]">Create from scratch or upload an existing PDF</p>
    </Link>
  );
}
