"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle, Bot, Loader2, ShieldAlert, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { matchJobDescription, JobMatchResult } from "@/lib/actions/ai-matching";

type Resume = { id: string; version_tag: string | null };
type Job = { id: string; title: string; company: string; description: string | null };

export default function JobMatchClient({ initialResumes, initialJobs }: { initialResumes: Resume[], initialJobs: Job[] }) {
  const [jobDescription, setJobDescription] = useState("");
  // Always default to the first resume if it exists
  const [resumeId, setResumeId] = useState<string>(
    initialResumes.length > 0 ? initialResumes[0].id : ""
  );
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResumeSelect = (val: string | null) => {
    setResumeId(val === "none" || !val ? "" : val);
  };

  const handleJobSelect = (val: string | null) => {
    const jobId = val === "none" || !val ? "" : val;
    setSelectedJobId(jobId);
    if (!jobId) {
      setJobDescription("");
      return;
    }
    
    const job = initialJobs.find(j => j.id === jobId);
    if (job) {
      if (job.description) {
        setJobDescription(job.description);
      } else {
        setJobDescription(`Role: ${job.title}\nCompany: ${job.company}\n\n(No detailed description was saved for this job)`);
      }
    }
  };

  const handleMatch = async () => {
    if (!jobDescription.trim()) {
      setError("Please provide a job description.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    const res = await matchJobDescription(jobDescription, resumeId);
    
    if (res.success && res.result) {
      setResult(res.result);
    } else {
      setError(res.message || "Failed to process job match.");
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" style={{ display: "flex", flexDirection: "row", gap: "2rem", alignItems: "flex-start" }}>
      {/* Input Section */}
      <div style={{ flex: "1 1 0", minWidth: 0 }} className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Job Matcher</h1>
          <p className="text-slate-500">Compare your resume against any tracked job or paste a new description.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Select Resume</Label>
            <Select value={resumeId || "none"} onValueChange={handleResumeSelect}>
              <SelectTrigger className="w-full h-12 bg-white rounded-xl border-slate-200 shadow-sm text-sm focus:ring-2 focus:ring-blue-500/20 transition-all">
                <SelectValue>
                  {(val: string | null) => {
                    if (!val || val === "none") return "No Resume";
                    const r = initialResumes.find(r => r.id === val);
                    return r ? (r.version_tag || "Default") : "Select a resume";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" label="No Resume">No Resume (Extract skills only)</SelectItem>
                {initialResumes.map(r => {
                  const label = r.version_tag || "Default";
                  return <SelectItem key={r.id} value={r.id} label={label}>{label}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            {initialResumes.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">You haven't uploaded any resumes yet.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Select Saved Job</Label>
            <Select value={selectedJobId || "none"} onValueChange={handleJobSelect}>
              <SelectTrigger className="w-full h-12 bg-white rounded-xl border-slate-200 shadow-sm text-sm focus:ring-2 focus:ring-blue-500/20 transition-all">
                <SelectValue>
                  {(val: string | null) => {
                    if (!val || val === "none") return "Custom (Paste below)";
                    const j = initialJobs.find(j => j.id === val);
                    return j ? `${j.title} at ${j.company}` : "Select a saved job";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" label="Custom">Custom (Paste below)</SelectItem>
                {initialJobs.map(j => {
                  const label = `${j.title} at ${j.company}`;
                  return <SelectItem key={j.id} value={j.id} label={label}>{label}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex justify-between items-center text-sm font-medium text-slate-700">
            Job Description
            {selectedJobId && <span className="text-xs font-normal text-slate-400">Auto-filled from saved job</span>}
          </Label>
          <Textarea 
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              if (selectedJobId) setSelectedJobId(""); // Reset select if they start typing manually
            }}
            placeholder="Paste the raw text of the job posting here..."
            className="h-[400px] min-h-[400px] max-h-[400px] overflow-y-auto resize-none p-4 rounded-xl border-slate-200 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 text-sm leading-relaxed"
            style={{ fieldSizing: "fixed" } as any}
          />
        </div>

        {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

        <Button 
          onClick={handleMatch} 
          disabled={isProcessing || !jobDescription.trim()} 
          className="w-full text-white h-12 text-base rounded-xl font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ backgroundColor: "var(--color-sunset-orange)" }}
        >
          {isProcessing ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Match...</>
          ) : (
            <><Bot className="w-5 h-5 mr-2" /> Calculate Match Score</>
          )}
        </Button>
      </div>

      {/* Results Section */}
      <div style={{ flex: "1 1 0", minWidth: 0 }}>
        {result ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden relative bg-white">
              <div className="p-8 text-center relative z-10 flex flex-col items-center justify-center">
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] uppercase tracking-widest font-semibold mb-4">
                  Match Score
                </div>
                <div className={`text-7xl font-black tracking-tighter ${
                  result.match_score >= 80 ? 'text-emerald-500' :
                  result.match_score >= 50 ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {result.match_score}%
                </div>
                
                {/* Subtle colored glow effect behind the text */}
                <div className={`absolute inset-0 opacity-10 blur-3xl rounded-full scale-150 z-[-1] ${
                  result.match_score >= 80 ? 'bg-emerald-400' :
                  result.match_score >= 50 ? 'bg-amber-400' : 'bg-red-400'
                }`} />
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] z-0 pointer-events-none">
                <Bot className="w-48 h-48 text-slate-900 -rotate-12 translate-x-8 -translate-y-8" />
              </div>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Matched Skills
                </CardTitle>
                <CardDescription>Skills found in both the job and your resume.</CardDescription>
              </CardHeader>
              <CardContent>
                {result.matched_skills.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No exact matches found.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {result.matched_skills.map((skill, i) => (
                      <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" /> Missing Evidence
                </CardTitle>
                <CardDescription>Skills explicitly required that lack concrete evidence in your resume.</CardDescription>
              </CardHeader>
              <CardContent>
                {result.missing_evidence?.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">You have solid evidence for all requirements!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {result.missing_evidence?.map((skill, i) => (
                      <span key={i} className="bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {result.suspicious_requirements?.length > 0 && (
              <Card className="rounded-2xl border-amber-200 shadow-sm bg-amber-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-500" /> Suspicious Requirements
                  </CardTitle>
                  <CardDescription className="text-amber-700">Demands that appear unrealistic for this role.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.suspicious_requirements.map((req, i) => (
                      <li key={i} className="flex gap-3 text-amber-800 text-sm bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                        <span className="text-amber-500 font-bold mt-0.5">•</span> 
                        <span className="leading-relaxed">{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {result.scam_risk_signals?.length > 0 && (
              <Card className="rounded-2xl border-red-200 shadow-sm bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-red-900">
                    <ShieldAlert className="w-5 h-5 text-red-600" /> Scam Risk Signals
                  </CardTitle>
                  <CardDescription className="text-red-700">Extreme red flags detected in the job description.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.scam_risk_signals.map((signal, i) => (
                      <li key={i} className="flex gap-3 text-red-800 text-sm bg-white p-3 rounded-lg border border-red-200 shadow-sm">
                        <span className="text-red-600 font-bold mt-0.5">•</span> 
                        <span className="leading-relaxed font-semibold">{signal}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-2xl border-slate-200 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                  <AlertCircle className="w-5 h-5 text-blue-600" /> Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-3 text-slate-700 text-sm bg-white/60 p-3 rounded-lg border border-blue-100/50 shadow-sm">
                      <span className="text-blue-500 font-bold mt-0.5">•</span> 
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-dashed border-slate-300 shadow-inner min-h-[500px]">
            <div className="bg-blue-50 p-4 rounded-full mb-6">
              <Bot className="w-12 h-12 text-blue-500 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Awaiting Job Selection</h3>
            <p className="text-slate-500 mt-3 max-w-sm leading-relaxed">
              Select a job from your pipeline or paste a new description. Our AI will analyze your fit and suggest tailored improvements.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
