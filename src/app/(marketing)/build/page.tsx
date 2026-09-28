// src/app/(marketing)/build/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ExtractedProfileCard, ExtractedProfile } from "@/components/landing/ExtractedProfileCard";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User as UserIcon,
  Mail,
  Lock,
  Briefcase,
  Target,
  Bot,
  Send,
  Check,
  FileText,
  ShieldAlert,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Award
} from "lucide-react";

type Message = {
  role: "ai" | "user";
  text: string;
};

type InterviewState = "no-jd" | "loading" | "chatting" | "wrapping" | "done" | "error";

interface MatchAnalysis {
  fitScore: number;
  jobTitle?: string;
  company?: string;
  verdict?: string;
  whatIsHoldingBack?: string;
  matched?: string[];
  partial?: string[];
  missing?: string[];
  improvements?: string[];
}

const SAMPLE_JD = `Staff / Senior Frontend Engineer
Company: CloudScale AI
Location: Remote (US/Canada/EU)

Requirements:
- 5+ years of experience building high-scale web applications with React, Next.js, and TypeScript.
- Strong knowledge of state management, performance optimization, and responsive design systems.
- Experience collaborating with backend APIs (REST, GraphQL) and cloud databases.
- Passion for user experience, accessibility, and clean component architecture.`;

export default function BuildPage() {
  const [jd, setJd] = useState("");
  const [customJdInput, setCustomJdInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<InterviewState>("loading");
  const [sending, setSending] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState<ExtractedProfile | null>(null);
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);

  // Auth & Save state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSavingApp, setIsSavingApp] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Check auth user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
      }
    });
  }, [supabase]);

  // Load JD and start interview
  useEffect(() => {
    const storedJd = sessionStorage.getItem("pending_jd") || "";
    if (!storedJd) {
      setState("no-jd");
      return;
    }
    setJd(storedJd);
    startInterview(storedJd);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (state === "chatting" || state === "wrapping") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, state]);

  const startInterview = async (jobDescription: string) => {
    setState("loading");
    try {
      const res = await fetch("/api/public/interview-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          jobDescription,
          action: "start"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start");
      setMessages([{ role: "ai", text: data.message }]);
      setState("chatting");
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error(err);
      setState("error");
    }
  };

  const handleStartWithJd = () => {
    const targetJd = customJdInput.trim() || SAMPLE_JD;
    setJd(targetJd);
    sessionStorage.setItem("pending_jd", targetJd);
    sessionStorage.setItem("onboarding_path", "fresh");
    startInterview(targetJd);
  };

  const mapToExtractedProfile = (extracted: any): ExtractedProfile => {
    const parsed = extracted?.parsedProfile || {};
    const rawPersonal = parsed?.personal || {};

    const rawSkills = Array.isArray(parsed.skills) ? parsed.skills : [];
    const skillsList = rawSkills.map((s: any) => {
      if (typeof s === "string") {
        return { name: s, category: "core", proficiency: "intermediate" };
      }
      return {
        name: s.name || "Skill",
        category: s.category || "core",
        proficiency: s.proficiency || "intermediate"
      };
    });

    return {
      personal: {
        fullName: rawPersonal.fullName || parsed.name || "Candidate",
        email: rawPersonal.email || parsed.email || "",
        phone: rawPersonal.phone || "",
        location: rawPersonal.location || parsed.location || "Remote",
        githubUrl: rawPersonal.githubUrl || parsed.github || "",
        portfolioUrl: rawPersonal.portfolioUrl || parsed.portfolio || "",
        linkedinUrl: rawPersonal.linkedinUrl || parsed.linkedin || ""
      },
      summary: parsed.summary || parsed.experienceSummary || `Motivated professional targeting ${parsed.targetRole || "engineering roles"} with hands-on project experience.`,
      skills: skillsList.length > 0 ? skillsList : [
        { name: "JavaScript", category: "core", proficiency: "intermediate" },
        { name: "React", category: "core", proficiency: "intermediate" },
        { name: "Problem Solving", category: "core", proficiency: "intermediate" }
      ],
      experience: parsed.experience || [],
      projects: parsed.projects || [],
      education: parsed.education || []
    };
  };

  const sendMessage = async (overrideAction?: "continue" | "finish") => {
    const text = input.trim();
    if ((!text && overrideAction !== "finish") || sending || (state !== "chatting" && state !== "wrapping")) return;

    let newMessages: Message[] = [...messages];
    if (text) {
      newMessages.push({ role: "user", text });
      setMessages(newMessages);
      setInput("");
    }

    if (overrideAction === "finish") {
      setState("wrapping");
    }
    setSending(true);

    try {
      const res = await fetch("/api/public/interview-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          jobDescription: jd,
          action: overrideAction || "continue"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat request failed");

      if (data.message && !data.done) {
        setMessages(prev => [...prev, { role: "ai", text: data.message }]);
      }

      if (data.done && data.extracted) {
        const formatted = mapToExtractedProfile(data.extracted);
        setExtractedProfile(formatted);
        setAnalysis(data.extracted.analysis || {
          fitScore: 75,
          verdict: "Promising match based on hands-on project experience.",
          whatIsHoldingBack: "Demonstrate deeper production scale metrics.",
          matched: formatted.skills.slice(0, 3).map(s => s.name),
          partial: formatted.skills.slice(3, 5).map(s => s.name),
          missing: ["Cloud Architecture", "Automated CI/CD"],
          improvements: [
            "Highlight measurable impacts in your project descriptions",
            "Add public repository or live demo links to evidence cards",
            "Prepare STAR-format answers for targeted interview questions"
          ]
        });

        // Set auth form pre-fills
        if (formatted.personal.fullName) setAuthName(formatted.personal.fullName);
        if (formatted.personal.email) setAuthEmail(formatted.personal.email);

        setState("done");
        sessionStorage.setItem("parsed_resume", JSON.stringify(formatted));
        sessionStorage.setItem("analysis_result", JSON.stringify(data.extracted.analysis));
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: "ai", text: "I ran into a connection glitch. Please try sending your reply again!" }
      ]);
      setState("chatting");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage("continue");
    }
  };

  const handleSaveAndCreate = async () => {
    if (!currentUser) {
      if (extractedProfile?.personal.fullName) setAuthName(extractedProfile.personal.fullName);
      if (extractedProfile?.personal.email) setAuthEmail(extractedProfile.personal.email);
      setShowAuthModal(true);
      return;
    }

    await executeApplicationCreation();
  };

  const executeApplicationCreation = async () => {
    if (!extractedProfile || !analysis) return;
    setIsSavingApp(true);

    try {
      const res = await fetch("/api/applications/create-from-landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            ...extractedProfile,
            origin_type: "built",
            isBuilt: true
          },
          jobDescription: jd,
          analysis,
          originType: "built"
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save application");

      router.push(`/applications/${data.applicationId}`);
    } catch (err: any) {
      console.error("Save application error:", err);
      alert(err.message || "Failed to save application. Please try again.");
      setIsSavingApp(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSavingApp(true);

    try {
      if (authMode === "signup") {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              full_name: authName
            }
          }
        });
        if (signUpError) throw signUpError;
        if (authData.user) {
          setCurrentUser(authData.user);
          setShowAuthModal(false);
          await executeApplicationCreation();
        }
      } else {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });
        if (signInError) throw signInError;
        if (authData.user) {
          setCurrentUser(authData.user);
          setShowAuthModal(false);
          await executeApplicationCreation();
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setAuthError(err.message || "Authentication failed. Please verify your credentials.");
      setIsSavingApp(false);
    }
  };

  const userMessageCount = messages.filter(m => m.role === "user").length;

  // ── NO JD STATE ──
  if (state === "no-jd") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5">
            <Bot className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Build Your First Master Resume with AI
          </h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Don't have a resume yet? No problem. Paste a job description you are targeting, and our AI Career Coach will interview you for 3–5 minutes to extract your real skills, projects, and telemetry.
          </p>

          <div className="space-y-4 mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Target Job Description
            </label>
            <textarea
              rows={6}
              value={customJdInput}
              onChange={(e) => setCustomJdInput(e.target.value)}
              placeholder="Paste job posting text here (title, requirements, tech stack)..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
            <button
              type="button"
              onClick={() => setCustomJdInput(SAMPLE_JD)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              + Use sample Software Engineer job description
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => router.push("/")}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
            >
              ← Back to home
            </button>
            <button
              onClick={handleStartWithJd}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              Start Intake Interview
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LOADING STATE ──
  if (state === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Analyzing Target Job Description...
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our AI Career Coach is preparing tailored questions based on this role's specific requirements.
          </p>
        </div>
      </div>
    );
  }

  // ── ERROR STATE ──
  if (state === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">
            Could not start intake session
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            There was a temporary network issue connecting to the AI coach. Please try again.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Return Home
            </button>
            <button
              onClick={() => startInterview(jd)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
            >
              Retry Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CHATTING & WRAPPING STATES ──
  if (state === "chatting" || state === "wrapping") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Navigation Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              title="Return home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-slate-900 text-base">Zentail</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Master Resume Builder
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Conversational Intake • Question {Math.min(userMessageCount + 1, 5)} of 5</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userMessageCount >= 2 && (
              <button
                onClick={() => sendMessage("finish")}
                disabled={sending}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                Finish & Build Profile
              </button>
            )}
          </div>
        </header>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl w-full mx-auto space-y-4">
          {/* Welcome coaching card */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-indigo-900">AI Career Coach Intake</div>
              <p className="text-indigo-800/90 leading-relaxed">
                Answer these 4–5 short questions about your background, skills, and projects. Don't worry about perfect wording — just talk naturally, and we will extract your master telemetry and tailor it to this target job!
              </p>
            </div>
          </div>

          {/* Messages */}
          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={i}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-200`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs text-xs font-bold mt-1">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-tr-xs shadow-xs font-medium"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {(sending || state === "wrapping") && (
            <div className="flex items-center gap-3 justify-start animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs text-xs font-bold">
                AI
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.3s]" />
                </div>
                <span className="text-xs text-slate-500 font-medium ml-1">
                  {state === "wrapping" ? "Extracting profile telemetry & matching..." : "AI coach is thinking..."}
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-20">
          <div className="max-w-2xl mx-auto flex items-end gap-2.5">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending || state === "wrapping"}
              placeholder="Type your reply... (Press Enter to send)"
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none max-h-32"
            />
            <button
              onClick={() => sendMessage("continue")}
              disabled={!input.trim() || sending || state === "wrapping"}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-2xl text-sm font-bold shadow-xs transition-all flex items-center justify-center cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DONE STATE: PROFILE REVIEW & JOB MATCH BREAKDOWN ──
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-black tracking-tight text-slate-900 text-lg">Zentail</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Telemetry Extracted
          </span>
        </div>
        <div className="text-xs text-slate-500">
          Step 2 of 2: Review Profile & Save Application
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Intake Complete • Master Profile Ready
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Review Your Extracted Details & Match
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              We parsed your background into a structured Master Profile card. You can edit any field, review your honest ATS match breakdown, and save your application with 1 click.
            </p>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Extracted Profile Card */}
          <div className="lg:col-span-7">
            {extractedProfile && (
              <ExtractedProfileCard
                profile={extractedProfile}
                onUpdate={setExtractedProfile}
                onProceed={handleSaveAndCreate}
              />
            )}
          </div>

          {/* Right Column: Job Match Scorecard */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Target Job Match Score
                </div>
                {analysis?.fitScore !== undefined && (
                  <span className="text-2xl font-black text-indigo-600">
                    {analysis.fitScore}%
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (analysis?.fitScore || 70) >= 80
                        ? "bg-emerald-500"
                        : (analysis?.fitScore || 70) >= 60
                        ? "bg-indigo-600"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(analysis?.fitScore || 70, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                  <span>Match Probability</span>
                  <span>
                    {(analysis?.fitScore || 70) >= 80
                      ? "Strong Candidate"
                      : (analysis?.fitScore || 70) >= 60
                      ? "Competitive"
                      : "Developing"}
                  </span>
                </div>
              </div>

              {/* Honest Verdict */}
              {analysis?.verdict && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Honest AI Verdict
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    "{analysis.verdict}"
                  </p>
                </div>
              )}

              {/* What is holding back */}
              {analysis?.whatIsHoldingBack && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Key Gap / Nuance
                  </span>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    {analysis.whatIsHoldingBack}
                  </p>
                </div>
              )}

              {/* Matched Skills */}
              {analysis?.matched && analysis.matched.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Matched Skills ({analysis.matched.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.matched.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {analysis?.missing && analysis.missing.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    Missing / Desired Skills ({analysis.missing.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.missing.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Improvements */}
              {analysis?.improvements && analysis.improvements.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                    Recommended Next Steps
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {analysis.improvements.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold shrink-0">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* One-click Action button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleSaveAndCreate}
                  disabled={isSavingApp}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSavingApp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Resume & Application...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Application & Generate Resumes</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Saves Master Resume V1 (`built`) + Tailored Application Resume + Prepares Interview Prep
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Quick Auth Modal for Guest Visitors */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {authMode === "signup" ? "Save your master resume" : "Sign in to save"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  We pre-filled your details from the AI intake session.
                </p>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "signup" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingApp}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSavingApp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account & Saving...</span>
                  </>
                ) : (
                  <span>{authMode === "signup" ? "Create Account & Open Application" : "Sign In & Open Application"}</span>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode((m) => (m === "signup" ? "signin" : "signup"));
                  setAuthError(null);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                {authMode === "signup"
                  ? "Already have an account? Sign in here"
                  : "Need an account? Sign up here"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
