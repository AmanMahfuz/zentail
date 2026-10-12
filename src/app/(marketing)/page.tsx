"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Target,
  Video,
  FileText,
  Upload,
  CheckCircle2,
  ChevronRight,
  Briefcase,
  Layers,
} from "lucide-react";

export default function LandingPage() {
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentStep, setAgentStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, [supabase]);

  const handleAnalyze = async () => {
    if (!jobDesc.trim()) {
      alert("Please paste a job description");
      return;
    }

    setLoading(true);
    setAgentStep(1);

    const stepInterval = setInterval(() => {
      setAgentStep((prev) => (prev < 6 ? prev + 1 : prev));
    }, 700);

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      // Not logged in → redirect to signup/signin with preserved job description
      if (!currentUser) {
        clearInterval(stepInterval);
        sessionStorage.setItem("pendingJobDesc", jobDesc);
        router.push("/signup");
        return;
      }

      // Logged in: submit job (auto-creates starter resume if none exists)
      const res = await fetch("/api/jobs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jobDesc }),
      });

      const data = await res.json();

      if (!res.ok || !data.application_id) {
        throw new Error(data.error || "Failed to process job description");
      }

      setAgentStep(6);
      clearInterval(stepInterval);

      setTimeout(() => {
        // Redirect directly to job workspace hub
        router.push(`/applications/${data.application_id}`);
      }, 500);
    } catch (err: any) {
      clearInterval(stepInterval);
      setLoading(false);
      console.error("Job analysis error:", err);
      alert("Error analyzing job: " + (err.message || "Please try again."));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/50 text-slate-900 font-sans">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-lg">
              Z
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Zentail
            </span>
          </div>

          <nav className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push("/applications")}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  Applications
                </button>
                <button
                  onClick={() => router.push("/resume")}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  Career Profile
                </button>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setUser(null);
                    router.refresh();
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/signin"
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 py-14 sm:py-20">
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Your AI Agent for Every Job Application
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Give me a job. <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              I'll help you apply.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Add any job. We'll analyze your fit, choose or tailor your resume,
            prepare you for the interview, and track everything in one command center.
          </p>
        </div>

        {/* Primary Agent Input Box */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-blue-500/5 p-6 sm:p-8 mb-10 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-900">
              Paste Job Description
            </label>
            <span className="text-xs text-slate-400">
              From LinkedIn, Indeed, Greenhouse, or any company portal
            </span>
          </div>

          <textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste the job description here... (e.g. Senior Frontend Engineer at Stripe)"
            className="w-full px-4 py-3.5 bg-slate-50/60 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed min-h-36 resize-none transition"
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                ⚡ Takes ~30 seconds to analyze
              </span>
              <span className="text-slate-300">·</span>
              <span>Have a resume?</span>
              <button
                onClick={() => router.push(user ? "/resume" : "/signup")}
                className="font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                Upload Resume
              </button>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !jobDesc.trim()}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Analyze My Fit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 🔐 Social Proof & Quick Wins Banner */}
        <div className="mb-14 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Join 5,000+ candidates using Zentail</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Real recent candidate analyses</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:shadow-sm transition">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">Sarah M.</span>
                <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">87% Match</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">Software Engineer @ Google</p>
              <p className="text-[11px] text-slate-400 mt-1">Matched 9/11 core requirements</p>
            </div>

            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:shadow-sm transition">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">Raj P.</span>
                <span className="text-[11px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">Interviewed</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">Frontend Lead @ Stripe</p>
              <p className="text-[11px] text-slate-400 mt-1">Found 4 missing skills & practiced Q&A</p>
            </div>

            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:shadow-sm transition">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">Emma W.</span>
                <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Cover Letter</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">Full Stack Dev @ Linear</p>
              <p className="text-[11px] text-slate-400 mt-1">Tailored narrative letter in 2 minutes</p>
            </div>
          </div>
        </div>

        {/* Section 9: Agent Processing Modal Overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
                <Sparkles className="w-7 h-7 animate-pulse" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Preparing your application...
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Our autonomous application agent is analyzing requirements and your profile.
                </p>
              </div>

              {/* Agent Checklist from Section 9 */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-2.5 text-xs font-semibold">
                <div
                  className={`flex items-center gap-2.5 transition-colors ${
                    agentStep >= 1 ? "text-emerald-700 font-bold" : "text-slate-400"
                  }`}
                >
                  {agentStep >= 1 ? (
                    <span className="text-emerald-600">✓</span>
                  ) : (
                    <span className="w-3 text-center">○</span>
                  )}
                  <span>Reading job description</span>
                </div>

                <div
                  className={`flex items-center gap-2.5 transition-colors ${
                    agentStep >= 2 ? "text-emerald-700 font-bold" : "text-slate-400"
                  }`}
                >
                  {agentStep >= 2 ? (
                    <span className="text-emerald-600">✓</span>
                  ) : (
                    <span className="w-3 text-center">○</span>
                  )}
                  <span>Identifying requirements & skills</span>
                </div>

                <div
                  className={`flex items-center gap-2.5 transition-colors ${
                    agentStep >= 3 ? "text-emerald-700 font-bold" : "text-slate-400"
                  }`}
                >
                  {agentStep >= 3 ? (
                    <span className="text-emerald-600">✓</span>
                  ) : (
                    <span className="w-3 text-center">○</span>
                  )}
                  <span>Checking your career profile</span>
                </div>

                <div
                  className={`flex items-center gap-2.5 transition-colors ${
                    agentStep >= 4 ? "text-emerald-700 font-bold" : "text-slate-400"
                  }`}
                >
                  {agentStep >= 4 ? (
                    <span className="text-emerald-600">✓</span>
                  ) : (
                    <span className="w-3 text-center">○</span>
                  )}
                  <span>Comparing & tailoring your resume</span>
                </div>

                <div
                  className={`flex items-center gap-2.5 transition-colors ${
                    agentStep >= 5 ? "text-blue-700 font-bold" : "text-slate-400"
                  }`}
                >
                  {agentStep >= 5 ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping inline-block mr-0.5" />
                  ) : (
                    <span className="w-3 text-center">○</span>
                  )}
                  <span>Preparing your application workspace</span>
                </div>

                <div
                  className={`flex items-center gap-2.5 transition-colors ${
                    agentStep >= 6 ? "text-purple-700 font-bold" : "text-slate-400"
                  }`}
                >
                  {agentStep >= 6 ? (
                    <span className="text-purple-600">✓</span>
                  ) : (
                    <span className="w-3 text-center">○</span>
                  )}
                  <span>Interview preparation ready</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visual Agent Workflow */}
        <div className="mb-16">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Autonomous Application Workflow
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
            {[
              { step: "1", title: "Add Job", desc: "Paste description" },
              { step: "2", title: "Understand Fit", desc: "Skills match score" },
              { step: "3", title: "Tailor Application", desc: "Resume & letter" },
              { step: "4", title: "Prepare Interview", desc: "15 targeted Q&A" },
              { step: "5", title: "Track Progress", desc: "Unified command hub" },
            ].map((s, idx) => (
              <div
                key={s.step}
                className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs relative"
              >
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-black flex items-center justify-center mx-auto mb-1.5">
                  {s.step}
                </div>
                <p className="text-xs font-bold text-slate-900">{s.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Trust / Value Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Know where you stand
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transparent match score breaking down verified strengths and flagged skill gaps before you apply.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Get the right resume for each job
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              1-click alignment highlights exact keywords from your master background for ATS systems.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              Prepare for the actual role
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              15 targeted technical, behavioral, and situational questions generated directly from the job spec.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-slate-700" />
              Never lose track of an application
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Centralized workspace for every role with status tracking, practice scores, and tailored assets.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}