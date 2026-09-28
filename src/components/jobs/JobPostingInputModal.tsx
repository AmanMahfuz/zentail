"use client";

import { useState } from "react";
import { 
  X, 
  Sparkles, 
  Briefcase, 
  Building2, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MatchAndPrepResult } from "@/types/resume-matching";

interface ResumeOption {
  id: string;
  version_tag: string | null;
}

interface JobPostingInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumes?: ResumeOption[];
  onComplete: (result: MatchAndPrepResult) => void;
}

export function JobPostingInputModal({
  isOpen,
  onClose,
  resumes = [],
  onComplete
}: JobPostingInputModalProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [targetResumeId, setTargetResumeId] = useState<string>("auto");

  const [loading, setLoading] = useState(false);
  const [progressStage, setProgressStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobDescription.trim()) {
      setError("Please paste the job description to run automated matching.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setProgressStage("Analyzing job requirements & skills...");

      const timer1 = setTimeout(() => {
        setProgressStage("Matching against your candidate resumes...");
      }, 1500);

      const timer2 = setTimeout(() => {
        setProgressStage("Generating 15 tailored interview questions...");
      }, 3500);

      const res = await fetch("/api/jobs/match-and-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobTitle.trim() || "Software Engineer",
          company: companyName.trim() || "Target Company",
          description: jobDescription.trim(),
          targetResumeId: targetResumeId === "auto" ? undefined : targetResumeId
        })
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to process match and Q&A");
      }

      onComplete(data);
      onClose();
    } catch (err: any) {
      console.error("Match error:", err);
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setLoading(false);
      setProgressStage("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Automated Resume Match & Q&A Prep</h2>
              <p className="text-xs text-slate-300">
                Paste any job posting to evaluate your fit and generate 15 interview answers
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            disabled={loading}
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Job Title
              </Label>
              <Input 
                value={jobTitle} 
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                disabled={loading}
                className="h-10 text-sm rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Company Name
              </Label>
              <Input 
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe, OpenAI, Vercel"
                disabled={loading}
                className="h-10 text-sm rounded-xl border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Resume to Match Against
            </Label>
            <Select 
              value={targetResumeId} 
              onValueChange={(val) => setTargetResumeId(val || "auto")}
              disabled={loading}
            >
              <SelectTrigger className="w-full h-10 bg-white rounded-xl border-slate-200 text-sm">
                <SelectValue>
                  {(val: string | null) => {
                    if (!val || val === "auto") return "Auto-Select (Compare all my uploaded resumes)";
                    const r = resumes.find(r => r.id === val);
                    return r ? (r.version_tag || "Resume") : "Selected Resume";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <span className="font-semibold text-indigo-600">Auto-Select</span> (Compare all my uploaded resumes)
                </SelectItem>
                {resumes.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.version_tag || "Resume"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                Job Description <span className="text-rose-500">*</span>
              </Label>
              <span className="text-[11px] text-slate-400">Paste responsibilities & requirements</span>
            </div>
            <Textarea 
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              disabled={loading}
              rows={8}
              className="resize-none text-xs sm:text-sm p-3.5 rounded-xl border-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
            />
          </div>

          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          {loading && (
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
              <div className="text-xs text-indigo-950 font-medium">
                {progressStage || "Processing job analysis..."}
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="rounded-xl text-xs font-medium"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !jobDescription.trim()}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Match & Q&A...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Run Automated Matching
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
