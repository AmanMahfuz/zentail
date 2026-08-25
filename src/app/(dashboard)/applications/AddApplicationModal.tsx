"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Plus } from "lucide-react";
import { createApplication } from "@/lib/actions/applications";
import { extractJobDetails } from "@/lib/actions/ai-matching";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AddApplicationModal({ resumes = [] }: { resumes?: { id: string; version_tag: string | null }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [initialStatus, setInitialStatus] = useState<string | null>("saved");
  const [resumeId, setResumeId] = useState<string | null>("none");

  const resetForm = () => {
    setCompany("");
    setJobTitle("");
    setLocation("");
    setJobDescription("");
    setJobUrl("");
    setInitialStatus("saved");
    setResumeId("none");
    setError(null);
  };

  async function handleAutoFill() {
    if ((!jobDescription || jobDescription.length < 20) && !jobUrl) {
      setError("Please paste a job description or a URL so AI can read it.");
      return;
    }

    setIsAutoFilling(true);
    setError(null);

    // We pass both to the server action
    const result = await extractJobDetails(jobDescription, jobUrl);
    if (result.success && result.result) {
      if (result.result.company) setCompany(result.result.company);
      if (result.result.jobTitle) setJobTitle(result.result.jobTitle);
      if (result.result.location) setLocation(result.result.location);
    } else {
      setError(result.message || "Failed to extract details automatically.");
    }

    setIsAutoFilling(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("initialStatus", initialStatus || "saved");
    if (resumeId && resumeId !== "none") {
      formData.set("resumeId", resumeId);
    }

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
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm h-11 px-6 text-sm font-medium transition-colors">
        <Plus className="w-5 h-5 mr-2" /> Add Application
      </button>
    );
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm h-11 px-6 text-sm font-medium transition-colors">
        <Plus className="w-5 h-5 mr-2" /> Add Application
      </button>

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
            <h2 className="text-xl font-bold text-slate-800">Track New Application</h2>
            <button type="button" onClick={() => { setIsOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 text-2xl font-light">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 flex flex-col">
            {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobUrl">Job Posting URL (Optional)</Label>
                <Input id="jobUrl" name="jobUrl" type="text" placeholder="https://..." value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description (Optional)</Label>
                <Textarea
                  id="jobDescription"
                  name="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the raw text of the job description here..."
                  className="h-[200px] min-h-[200px] max-h-[200px] resize-none overflow-y-auto text-sm bg-slate-50"
                  style={{ fieldSizing: "fixed" } as any}
                />
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={isAutoFilling}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors mt-2"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAutoFilling ? 'animate-pulse' : ''}`} />
                  {isAutoFilling ? "Extracting..." : "Auto-fill with AI"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company <span className="text-red-500">*</span></Label>
                <Input id="company" name="company" required placeholder="e.g. Acme Corp" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title <span className="text-red-500">*</span></Label>
                <Input id="jobTitle" name="jobTitle" required placeholder="e.g. Frontend Engineer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="e.g. Remote, SF" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={initialStatus || "saved"} onValueChange={setInitialStatus}>
                  <SelectTrigger className="w-full h-10 bg-white">
                    <SelectValue>
                      {(val: string | null) => {
                        const map: Record<string, string> = { saved: "Saved", applied: "Applied", assessment: "Assessment", interview: "Interview", offer: "Offer" };
                        return map[val || "saved"] || "Status";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saved" label="Saved">Saved</SelectItem>
                    <SelectItem value="applied" label="Applied">Applied</SelectItem>
                    <SelectItem value="assessment" label="Assessment">Assessment</SelectItem>
                    <SelectItem value="interview" label="Interview">Interview</SelectItem>
                    <SelectItem value="offer" label="Offer">Offer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label>Resume Used (Optional)</Label>
              <Select value={resumeId || "none"} onValueChange={setResumeId}>
                <SelectTrigger className="w-full h-10 bg-white">
                  <SelectValue>
                    {(val: string | null) => {
                      if (!val || val === "none") return "No Resume Tracked";
                      const r = resumes?.find(r => r.id === val);
                      return r ? (r.version_tag || "Default") : "Select a resume";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" label="No Resume Tracked">No Resume Tracked</SelectItem>
                  {resumes?.map((r) => {
                    const label = r.version_tag || "Default";
                    return <SelectItem key={r.id} value={r.id} label={label}>{label}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-500">Track which resume you applied with to see your analytics.</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting ? "Saving..." : "Save Application"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
