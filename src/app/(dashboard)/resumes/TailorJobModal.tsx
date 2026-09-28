"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Building2, Briefcase, FileText, Loader2, ArrowRight } from "lucide-react";
import { tailorMasterResumeForJob } from "@/lib/actions/resumes";
import { toast } from "sonner";

interface ApplicationOption {
  id: string;
  company_name: string;
  job_title: string;
  job_description?: string;
  fit_score?: number;
}

interface TailorJobModalProps {
  masterResumeId: string;
  masterResumeName: string;
  applications?: ApplicationOption[];
  children?: React.ReactNode;
}

export function TailorJobModal({
  masterResumeId,
  masterResumeName,
  applications = [],
  children,
}: TailorJobModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">(
    applications.length > 0 ? "existing" : "new"
  );

  const [selectedAppId, setSelectedAppId] = useState<string>(
    applications[0]?.id || ""
  );
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [isTailoring, setIsTailoring] = useState(false);
  const [stepMessage, setStepMessage] = useState("");

  const handleTailor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTailoring(true);
    setStepMessage("Scanning job requirements & matching skills...");

    try {
      let result;
      if (mode === "existing") {
        if (!selectedAppId) {
          toast.error("Please select a target application.");
          setIsTailoring(false);
          return;
        }
        setStepMessage("Aligning master resume with target role...");
        result = await tailorMasterResumeForJob({
          masterResumeId,
          applicationId: selectedAppId,
        });
      } else {
        if (!companyName.trim() || !jobTitle.trim()) {
          toast.error("Please provide both company name and job title.");
          setIsTailoring(false);
          return;
        }
        setStepMessage("Creating target application and tailoring...");
        result = await tailorMasterResumeForJob({
          masterResumeId,
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim(),
          jobDescription: jobDescription.trim(),
        });
      }

      if (result.success && result.applicationId) {
        toast.success("Tailored resume generated successfully!");
        setIsOpen(false);
        router.push(`/applications/${result.applicationId}/builder`);
      } else {
        toast.error(result.message || "Failed to tailor resume.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsTailoring(false);
      setStepMessage("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        nativeButton={false}
        render={
          children ? (
            children as React.ReactElement
          ) : (
            <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl h-10 px-4 font-semibold shadow-xs">
              <Sparkles className="w-4 h-4 mr-2" /> Tailor for Job
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-2xl bg-white border border-slate-200">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> AI Job-Tailoring
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-white">
            Tailor for Target Opportunity
          </DialogTitle>
          <p className="text-xs text-slate-300 mt-1">
            Using foundation: <strong className="text-white">{masterResumeName}</strong>
          </p>
        </div>

        {/* Tab Selector */}
        {applications.length > 0 && (
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "existing"
                  ? "bg-white text-indigo-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Select Existing Application ({applications.length})
            </button>
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "new"
                  ? "bg-white text-indigo-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              + Add New Job Posting
            </button>
          </div>
        )}

        <form onSubmit={handleTailor} className="p-6 space-y-4">
          {mode === "existing" && applications.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Target Application
              </Label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {applications.map((app) => {
                  const isSelected = selectedAppId === app.id;
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-[#4F46E5] bg-indigo-50/30 ring-1 ring-[#4F46E5]"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                          {app.company_name?.[0]?.toUpperCase() || "J"}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{app.job_title}</h4>
                          <p className="text-[11px] text-slate-500">{app.company_name}</p>
                        </div>
                      </div>
                      {app.fit_score && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {app.fit_score}% Match
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Company Name
                  </Label>
                  <Input
                    placeholder="e.g. Stripe, Google, Acme"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Job Title / Role
                  </Label>
                  <Input
                    placeholder="e.g. Senior Frontend Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Job Description / Requirements (Optional)
                </Label>
                <Textarea
                  placeholder="Paste the job description or bullet requirements to maximize ATS matching keywords..."
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="text-xs leading-relaxed"
                />
              </div>
            </div>
          )}

          {isTailoring && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-[#4F46E5] animate-spin shrink-0" />
              <p className="text-xs text-indigo-900 font-medium">{stepMessage}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isTailoring}
              className="text-xs h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isTailoring}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold h-9 px-5 rounded-xl shadow-xs"
            >
              {isTailoring ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Tailoring...
                </>
              ) : (
                <>
                  Generate Tailored Resume <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
