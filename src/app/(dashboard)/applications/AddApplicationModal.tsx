"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { createApplication } from "@/lib/actions/applications";
import { extractJobDetails } from "@/lib/actions/ai-matching";

export function AddApplicationModal({ triggerClassName }: { triggerClassName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  function resetForm() {
    setJobUrl("");
    setJobDescription("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!jobUrl.trim() && !jobDescription.trim()) {
      setError("Please paste a job link or description.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.set("initialStatus", "saved");

    // Auto-extract details using AI
    const extractResult = await extractJobDetails(jobDescription, jobUrl);
    let extractedCompany = "Unknown Company";
    let extractedTitle = "Unknown Role";
    let extractedLocation = "";

    if (extractResult.success && extractResult.result) {
      extractedCompany = extractResult.result.company || extractedCompany;
      extractedTitle = extractResult.result.jobTitle || extractedTitle;
      extractedLocation = extractResult.result.location || extractedLocation;
    } else {
      console.warn("Auto-fill extraction failed or was incomplete.", extractResult.message);
    }

    formData.set("company", extractedCompany);
    formData.set("jobTitle", extractedTitle);
    formData.set("location", extractedLocation);
    formData.set("jobUrl", jobUrl);
    formData.set("jobDescription", jobDescription);

    const result = await createApplication({ success: false }, formData);

    if (result.success) {
      setIsOpen(false);
      resetForm();
    } else {
      setError(result.message || "Failed to create application.");
    }
    setIsSubmitting(false);
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className={triggerClassName || "inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-sm h-11 px-6 text-sm font-semibold transition-colors"}>
        <Plus className="w-5 h-5 mr-2" /> Add Application
      </button>
    );
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={triggerClassName || "inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-sm h-11 px-6 text-sm font-semibold transition-colors"}>
        <Plus className="w-5 h-5 mr-2" /> Add Application
      </button>

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[24px] w-full max-w-[420px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          <div className="px-6 pt-6 pb-2 flex justify-between items-start">
            <div>
               <h2 className="text-[22px] font-bold text-[#111827] tracking-tight">Add Application</h2>
               <p className="text-zinc-500 text-[15px] mt-1">Add a job you want to apply to</p>
            </div>
            <button type="button" onClick={() => { setIsOpen(false); resetForm(); }} className="text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-full p-2 transition-colors -mr-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5 flex flex-col">
            {error && <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100 font-medium">{error}</div>}

            <div className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  id="jobDescription"
                  name="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste Description"
                  className="h-[140px] min-h-[140px] max-h-[240px] resize-none overflow-y-auto text-[15px] bg-zinc-50/80 border-zinc-200 focus-visible:ring-zinc-900 rounded-xl px-4 py-3 placeholder:text-zinc-400"
                  style={{ fieldSizing: "fixed" } as any}
                />
              </div>

              <div className="flex items-center gap-4 py-1">
                <div className="h-px bg-zinc-100 flex-1"></div>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">OR</span>
                <div className="h-px bg-zinc-100 flex-1"></div>
              </div>

              <div className="space-y-2">
                <Input 
                   id="jobUrl" 
                   name="jobUrl" 
                   type="text" 
                   placeholder="Paste Link" 
                   value={jobUrl} 
                   onChange={(e) => setJobUrl(e.target.value)} 
                   className="h-12 bg-zinc-50/80 border-zinc-200 focus-visible:ring-zinc-900 rounded-xl px-4 text-[15px] placeholder:text-zinc-400"
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl bg-[#5e4cff] hover:bg-[#4b3cce] text-white font-semibold text-[15px] mt-4 transition-all">
              {isSubmitting ? (
                 <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                 </span>
              ) : "Quick Add"}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
