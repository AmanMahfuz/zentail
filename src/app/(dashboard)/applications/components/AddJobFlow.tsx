"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Link as LinkIcon, FileText, Zap } from "lucide-react";
import { createApplication } from "@/lib/actions/applications";

export function AddJobFlow({ 
  onComplete,
  resumes = []
}: { 
  onComplete?: () => void;
  resumes?: { id: string; version_tag: string | null }[]
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<"paste" | "link" | "quick">("paste");
  
  // Inputs
  const [jd, setJd] = useState("");
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");

  // Analysis State
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  async function handleQuickSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createApplication({ success: false }, formData);

    if (result.success) {
      if (onComplete) onComplete();
      router.refresh();
    } else {
      setError(result.message || "Failed to create application.");
    }
    setIsSubmitting(false);
  }

  const startAnalysis = async () => {
    if (activeTab === "paste" && jd.length < 50) return;
    if (activeTab === "link" && link.length < 5) return;
    if (activeTab === "quick" && (title.length < 2 || company.length < 2)) return;

    setStep(2);
    setLoadingStep(0);
    setError(null);

    // Simulate steps for UI feedback
    const timers = [
      setTimeout(() => setLoadingStep(1), 1500),
      setTimeout(() => setLoadingStep(2), 3000),
      setTimeout(() => setLoadingStep(3), 4500),
    ];

    try {
      // If we pasted JD, actually call the API
      let finalTitle = title;
      let finalCompany = company;
      
      if (activeTab === "paste") {
        const response = await fetch("/api/public/analyze-jd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription: jd })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setAnalysisResult(data);
        finalTitle = data.jobTitle || "Unknown Role";
        finalCompany = data.company || "Unknown Company";
      } else {
        // Mock result for Link or Quick Add
        finalTitle = title || "Unknown Role";
        finalCompany = company || "Unknown Company";
        setAnalysisResult({
          fitScore: 68,
          verdict: "Needs work to pass ATS",
        });
      }

      setLoadingStep(4); // Finished

      // Automatically create the job in Supabase
      const formData = new FormData();
      formData.append("jobTitle", finalTitle);
      formData.append("company", finalCompany);
      if (activeTab === "paste") formData.append("jobDescription", jd);
      if (activeTab === "link") formData.append("jobUrl", link);
      
      const result = await createApplication({ success: false }, formData);
      if (!result.success || !result.applicationId) {
        throw new Error(result.message || "Failed to save job");
      }
      
      // Save the created application ID to state so we can redirect to it later
      setAnalysisResult((prev: any) => ({ ...prev, applicationId: result.applicationId }));

    } catch (err: any) {
      timers.forEach(clearTimeout);
      setError(err.message || "Something went wrong.");
      setLoadingStep(4);
    }
  };

  if (step === 2) {
    return (
      <div className="w-full">
        <h2 className="text-xl font-bold mb-6 text-zinc-900 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Analyzing {analysisResult?.company || company || "Job"}...
        </h2>

        <div className="space-y-4 mb-8">
          <div className={`flex items-center gap-3 ${loadingStep >= 1 ? "text-emerald-600" : "text-zinc-400"}`}>
            {loadingStep >= 1 ? <CheckCircle2 className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
            <span className="font-medium text-sm">Extracted requirements</span>
          </div>
          <div className={`flex items-center gap-3 ${loadingStep >= 2 ? "text-emerald-600" : "text-zinc-400"}`}>
            {loadingStep >= 2 ? <CheckCircle2 className="h-5 w-5" /> : loadingStep === 1 ? <Loader2 className="h-5 w-5 animate-spin" /> : <div className="h-5 w-5 rounded-full border-2 border-zinc-200" />}
            <span className="font-medium text-sm">Found evidence in your profile</span>
          </div>
          <div className={`flex items-center gap-3 ${loadingStep >= 3 ? "text-emerald-600" : "text-zinc-400"}`}>
            {loadingStep >= 3 ? <CheckCircle2 className="h-5 w-5" /> : loadingStep === 2 ? <Loader2 className="h-5 w-5 animate-spin" /> : <div className="h-5 w-5 rounded-full border-2 border-zinc-200" />}
            <span className="font-medium text-sm">Generating tailored resume</span>
          </div>
        </div>

        {loadingStep === 4 && !error && analysisResult && (
          <div className="bg-white border border-zinc-200 rounded-xl p-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">Your Estimated Fit</div>
            <div className={`text-5xl font-bold mb-2 ${
              analysisResult.fitScore >= 70 ? 'text-emerald-600' : 
              analysisResult.fitScore >= 50 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {analysisResult.fitScore}%
            </div>
            <p className="text-zinc-600 text-sm mb-6 font-medium">{analysisResult.verdict}</p>
            
            <Button 
              onClick={() => {
                if (onComplete) onComplete();
                if (analysisResult.applicationId) {
                  router.push(`/applications/${analysisResult.applicationId}`);
                } else {
                  router.refresh();
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              View Full Breakdown →
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm mb-6">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-6 text-zinc-900 tracking-tight">Add a job you want to apply to</h2>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-zinc-200 pb-px">
        <button 
          onClick={() => setActiveTab("paste")}
          className={`pb-2 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "paste" ? "border-blue-600 text-blue-600" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}
        >
          Paste Description
        </button>
        <button 
          onClick={() => setActiveTab("link")}
          className={`pb-2 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "link" ? "border-blue-600 text-blue-600" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}
        >
          Paste Link
        </button>
        <button 
          onClick={() => setActiveTab("quick")}
          className={`pb-2 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "quick" ? "border-blue-600 text-blue-600" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}
        >
          Quick Add
        </button>
      </div>

      {activeTab === "paste" && (
        <div>
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="Paste the full job description here..."
            className="w-full min-h-[160px] p-4 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y mb-4 bg-white"
          />
          <Button 
            onClick={startAnalysis}
            disabled={jd.length < 50}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Analyze This Job →
          </Button>
        </div>
      )}

      {activeTab === "link" && (
        <div>
          <div className="relative mb-4">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              type="url"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://linkedin.com/jobs/..."
              className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>
          <Button 
            onClick={startAnalysis}
            disabled={link.length < 5}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Analyze This Job →
          </Button>
        </div>
      )}

      {activeTab === "quick" && (
        <form onSubmit={handleQuickSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Company <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="company"
                required
                placeholder="e.g. TechCorp"
                className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Job Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="jobTitle"
                required
                placeholder="e.g. Senior Frontend Developer"
                className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Location</label>
              <input
                type="text"
                name="location"
                placeholder="e.g. Remote, SF"
                className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Job URL</label>
              <input
                type="url"
                name="jobUrl"
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Status</label>
              <select
                name="initialStatus"
                className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white appearance-none"
              >
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="assessment">Assessment</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Resume Used</label>
              <select
                name="resumeId"
                className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white appearance-none"
              >
                <option value="none">No Resume Tracked</option>
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.version_tag || "Default"}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mt-2">{error}</div>}

          <Button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold mt-4"
          >
            {isSubmitting ? "Saving..." : "Save Application"}
          </Button>
        </form>
      )}
    </div>
  );
}
