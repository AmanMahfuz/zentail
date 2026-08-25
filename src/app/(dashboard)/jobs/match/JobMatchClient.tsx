"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle, Bot, Loader2 } from "lucide-react";
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
            <Label>Select Resume</Label>
            <Select value={resumeId || "none"} onValueChange={handleResumeSelect}>
              <SelectTrigger className="w-full h-10 bg-white">
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
            <Label>Select Saved Job</Label>
            <Select value={selectedJobId || "none"} onValueChange={handleJobSelect}>
              <SelectTrigger className="w-full h-10 bg-white">
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
          <Label className="flex justify-between items-center">
            Job Description
            {selectedJobId && <span className="text-[11px] font-normal text-slate-400">Auto-filled from saved job</span>}
          </Label>
          <Textarea 
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              if (selectedJobId) setSelectedJobId(""); // Reset select if they start typing manually
            }}
            placeholder="Paste the raw text of the job posting here..."
            className="h-[400px] min-h-[400px] max-h-[400px] overflow-y-auto resize-none"
            style={{ fieldSizing: "fixed" } as any}
          />
        </div>

        {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

        <Button 
          onClick={handleMatch} 
          disabled={isProcessing || !jobDescription.trim()} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg rounded-xl"
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
            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden relative">
              <div className={`p-8 text-center text-white relative z-10 ${
                result.match_score >= 80 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                result.match_score >= 50 ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-red-400 to-red-600'
              }`}>
                <h3 className="text-sm uppercase tracking-widest font-bold opacity-90 mb-2">Match Score</h3>
                <div className="text-7xl font-black tracking-tight drop-shadow-sm">{result.match_score}%</div>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-[0.15] z-0">
                <Bot className="w-48 h-48 text-white -rotate-12 translate-x-8 -translate-y-8" />
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
                      <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">
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
                  <XCircle className="w-5 h-5 text-red-500" /> Missing Skills
                </CardTitle>
                <CardDescription>Skills required but missing from your resume.</CardDescription>
              </CardHeader>
              <CardContent>
                {result.missing_skills.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">You hit all the requirements!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {result.missing_skills.map((skill, i) => (
                      <span key={i} className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
