// src/app/(marketing)/page.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NeuralRadarLoader } from "@/components/ui/NeuralRadarLoader";
import { ExtractedProfileCard, ExtractedProfile } from "@/components/landing/ExtractedProfileCard";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, ArrowLeft, CheckCircle2, Lock, Mail, User as UserIcon, Loader2, ArrowRight, LogIn, LogOut } from "lucide-react";

type PathMode = "resume" | "fresh";

type Step = "input" | "extracting" | "review_profile" | "paste_jd" | "analyzing" | "result";

const EXTRACTION_MESSAGES = [
  "Gemini is reading your resume in detail...",
  "Extracting contact information, location & portfolio links...",
  "Parsing verified skill categories and proficiency...",
  "Mapping projects, deliverables and work history...",
  "Structuring candidate evidence base...",
];

const MATCH_MESSAGES = [
  "Analyzing job requirements and responsibilities...",
  "Cross-referencing your real skills against the job...",
  "Honest scoring — no hallucinated matches...",
  "Identifying critical gaps and differentiators...",
  "Drafting resume tailoring recommendations...",
  "Finalizing your application fit analysis...",
];

function ProgressWait({ messages, label }: { messages: string[]; label: string }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 3500);
    const secTimer = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    return () => {
      clearInterval(msgTimer);
      clearInterval(secTimer);
    };
  }, [messages.length]);

  return (
    <div className="mt-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
        <div className="text-sm font-semibold text-slate-900">
          {messages[msgIndex]}
        </div>
      </div>
      <div className="text-xs text-slate-500 pl-5">
        {elapsed}s elapsed · {label}
      </div>
    </div>
  );
}

function MarketingNav({
  currentUser,
  onOpenSignIn,
  onOpenSignUp,
  onSignOut,
  onReset,
}: {
  currentUser: any;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
  onSignOut: () => void;
  onReset?: () => void;
}) {
  return (
    <nav className="h-16 px-4 sm:px-8 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div
        onClick={onReset}
        className="flex items-center gap-2.5 cursor-pointer select-none"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="font-bold text-lg tracking-tight text-slate-900">
          Zentail
        </span>
      </div>

      <div className="flex items-center gap-3">
        {currentUser ? (
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/90 text-xs text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400">Signed in as</span>
              <strong className="text-slate-900 truncate max-w-[170px]">
                {currentUser.user_metadata?.full_name || currentUser.email}
              </strong>
            </div>

            <a
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={onSignOut}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Sign out or switch accounts"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSignIn}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Sign in
            </button>
            <a
              href="/signin"
              className="hidden md:inline-block text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1"
            >
              Login page
            </a>
            <button
              type="button"
              onClick={onOpenSignUp}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Get started
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function LandingPage() {
  const [step, setStep] = useState<Step>("input");
  const [pathMode, setPathMode] = useState<PathMode>("resume");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [jd, setJd] = useState("");
  const [freshJd, setFreshJd] = useState("");
  
  // Extracted telemetry
  const [extractedProfile, setExtractedProfile] = useState<ExtractedProfile | null>(null);
  const [result, setResult] = useState<any>(null);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSavingApp, setIsSavingApp] = useState(false);

  // Auth modal for saving as guest
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleStartFresh = () => {
    if (!freshJd.trim()) return;
    sessionStorage.setItem("pending_jd", freshJd);
    sessionStorage.setItem("onboarding_path", "fresh");
    router.push("/build");
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setResumeFile(file);
      setResumeName(file.name);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setResumeName(file.name);
    }
  };

  // 1. EXTRACT RESUME DETAILS
  const handleExtractResume = async () => {
    if (!resumeFile) return;
    setStep("extracting");
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      if (currentUser?.id) {
        formData.append("userId", currentUser.id);
      }

      const res = await fetch("/api/resume/upload-and-extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to extract resume details");
      }

      const extracted: ExtractedProfile = data.extracted;
      setExtractedProfile(extracted);
      setAuthName(extracted.personal?.fullName || "");
      setAuthEmail(extracted.personal?.email || "");
      setStep("review_profile");
    } catch (err: any) {
      console.error("Extraction error:", err);
      setErrorMsg(err.message || "Could not extract resume. Please check the file and try again.");
      setStep("input");
    }
  };

  // 2. ANALYZE MATCH AGAINST JD
  const handleAnalyzeMatch = async () => {
    if (!extractedProfile || !jd.trim()) return;
    setStep("analyzing");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/public/match-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: extractedProfile,
          jobDescription: jd,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error || !data.analysis) {
        throw new Error(data.error || "Failed to calculate job match");
      }

      setResult(data.analysis);
      setStep("result");
    } catch (err: any) {
      console.error("Match analysis error:", err);
      setErrorMsg(err.message || "Failed to analyze match against job description.");
      setStep("paste_jd");
    }
  };

  // 3. SAVE APPLICATION & GENERATE TAILORED RESUME
  const executeSaveApplication = async () => {
    if (!extractedProfile || !jd.trim() || !result) return;
    setIsSavingApp(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/applications/create-from-landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: extractedProfile,
          jobDescription: jd,
          analysis: result,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Could not create application");
      }

      // Success! Navigate directly to the application workspace
      router.push(`/applications/${data.applicationId}`);
    } catch (err: any) {
      console.error("Save application error:", err);
      setErrorMsg(err.message || "Failed to save application.");
      setIsSavingApp(false);
    }
  };

  const handleSaveClick = async () => {
    if (currentUser) {
      // User is already authenticated
      await executeSaveApplication();
    } else {
      // Prompt user to sign up or sign in
      setAuthName(extractedProfile?.personal?.fullName || "");
      setAuthEmail(extractedProfile?.personal?.email || "");
      setShowAuthModal(true);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSavingApp(true);

    try {
      if (authMode === "signup") {
        if (!authEmail.trim() || authPassword.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: { full_name: authName.trim() },
          },
        });
        if (error) throw error;
        if (!data.user) throw new Error("Could not initialize user session.");
        setCurrentUser(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        if (!data.user) throw new Error("Could not sign in.");
        setCurrentUser(data.user);
      }

      setShowAuthModal(false);
      setIsSavingApp(false);

      if (step === "result" && result && extractedProfile) {
        await executeSaveApplication();
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed. Please check your credentials.");
      setIsSavingApp(false);
    }
  };

  const renderAuthModal = () => {
    if (!showAuthModal) return null;
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {authMode === "signup"
                  ? (step === "result" ? "Save your application" : "Create your Zentail account")
                  : (step === "result" ? "Sign in to save application" : "Welcome back to Zentail")}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {authMode === "signup"
                  ? (step === "result" ? "We pre-filled your details from the extracted resume." : "Start tailoring your resumes and applications.")
                  : "Sign in to access your dashboard, saved resumes, and applications."}
              </p>
            </div>
            <button
              onClick={() => setShowAuthModal(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1 cursor-pointer"
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
                  <span>{authMode === "signup" ? "Creating Account..." : "Signing In..."}</span>
                </>
              ) : (
                <span>
                  {authMode === "signup"
                    ? (step === "result" ? "Create Account & Save Application" : "Create Account")
                    : (step === "result" ? "Sign In & Save Application" : "Sign In to Zentail")}
                </span>
              )}
            </button>
          </form>

          <div className="text-center pt-2 flex flex-col items-center gap-2">
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
            <a
              href={authMode === "signup" ? "/signup" : "/signin"}
              className="text-[11.5px] text-slate-400 hover:text-slate-600 underline"
            >
              Or open full dedicated {authMode === "signup" ? "sign up" : "sign in"} page
            </a>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // STEP: INPUT (Upload Resume or Fresh)
  // ─────────────────────────────────────────────────────────────
  if (step === "input") {
    return (
      <div style={{ minHeight: "100vh", fontFamily: "var(--font-sans)", background: "var(--background)", color: "var(--foreground)" }}>
        <MarketingNav
          currentUser={currentUser}
          onOpenSignIn={() => {
            setAuthMode("signin");
            setAuthError(null);
            setShowAuthModal(true);
          }}
          onOpenSignUp={() => {
            setAuthMode("signup");
            setAuthError(null);
            setShowAuthModal(true);
          }}
          onSignOut={handleSignOut}
        />

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "3rem 1.5rem" }}>
          {/* Welcome back banner if already signed in */}
          {currentUser && (
            <div className="mb-6 p-4 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    Welcome back, {currentUser.user_metadata?.full_name || currentUser.email}!
                  </div>
                  <p className="text-emerald-800/80 text-[11.5px] mt-0.5">
                    You are signed in. Any resume you upload or tailor will automatically sync to your dashboard.
                  </p>
                </div>
              </div>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs whitespace-nowrap shadow-xs transition-all shrink-0 self-start sm:self-auto"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <h1 style={{
            fontSize: "clamp(28px, 4.5vw, 42px)",
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: 14,
            letterSpacing: "-0.025em"
          }}>
            Stop sending the same resume to every job.
          </h1>
          <p style={{
            fontSize: 16,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 36,
            maxWidth: 580
          }}>
            Upload your resume, extract your verified skills and portfolio, check your honest match with any job, and create a tailored application with on-demand interview simulation.
          </p>

          {/* Error banner */}
          {errorMsg && (
            <div style={{
              background: "var(--bg-danger)",
              border: "1px solid var(--border-danger, #fca5a5)",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 14,
              color: "var(--text-danger)",
              display: "flex",
              alignItems: "flex-start",
              gap: 8
            }}>
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* THE FORM */}
          <div style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "1.75rem",
            boxShadow: "var(--shadow-card)"
          }}>
            {/* TAB TOGGLE */}
            <div style={{
              display: "flex",
              background: "var(--surface-1)",
              borderRadius: 10,
              padding: 4,
              marginBottom: 24,
              gap: 4
            }}>
              <button
                onClick={() => setPathMode("resume")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: pathMode === "resume" ? "var(--card)" : "transparent",
                  color: pathMode === "resume" ? "var(--foreground)" : "var(--text-muted)",
                  boxShadow: pathMode === "resume" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}
              >
                📄 I have a resume
              </button>
              <button
                onClick={() => setPathMode("fresh")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: pathMode === "fresh" ? "var(--card)" : "transparent",
                  color: pathMode === "fresh" ? "var(--foreground)" : "var(--text-muted)",
                  boxShadow: pathMode === "fresh" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}
              >
                ✨ Starting fresh
              </button>
            </div>

            {/* PATH B: Fresh start */}
            {pathMode === "fresh" && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--foreground)" }}>
                  Paste the job you want
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.5 }}>
                  We'll ask you a few questions about your experience and build your first resume from scratch.
                </div>
                <textarea
                  value={freshJd}
                  onChange={e => setFreshJd(e.target.value)}
                  placeholder="Paste the job description — responsibilities, requirements, qualifications..."
                  style={{
                    width: "100%",
                    minHeight: 140,
                    padding: 14,
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 14,
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                    background: "var(--cloud-mist, #fafafa)",
                    color: "var(--foreground)",
                    outline: "none",
                    marginBottom: 16
                  }}
                />
                <button
                  onClick={handleStartFresh}
                  disabled={!freshJd.trim()}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: freshJd.trim() ? "var(--fill-accent)" : "var(--surface-1)",
                    color: freshJd.trim() ? "white" : "var(--text-muted)",
                    border: "none",
                    borderRadius: "var(--radius)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: freshJd.trim() ? "pointer" : "not-allowed",
                    transition: "all 0.2s"
                  }}
                >
                  Start building my resume →
                </button>
              </div>
            )}

            {/* PATH A: Has a resume */}
            {pathMode === "resume" && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--foreground)" }}>
                    1. Upload your resume (PDF or Word)
                  </div>

                  <label
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleFileDrop}
                    style={{
                      display: "block",
                      border: resumeFile
                        ? "1.5px solid var(--border-accent)"
                        : "1.5px dashed var(--border)",
                      borderRadius: 12,
                      padding: "2.25rem 1.5rem",
                      textAlign: "center",
                      cursor: "pointer",
                      background: resumeFile ? "var(--bg-accent)" : "var(--surface-1)",
                      transition: "all 0.2s"
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileInput}
                      style={{ display: "none" }}
                    />
                    {resumeFile ? (
                      <div>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
                          {resumeName}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                          {(resumeFile.size / 1024).toFixed(0)} KB · Click to change file
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>☁️</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>
                          Drop your resume here, or <span style={{ color: "var(--fill-accent)", textDecoration: "underline" }}>browse</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          PDF or Word document · Privacy guaranteed
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                <button
                  onClick={handleExtractResume}
                  disabled={!resumeFile}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: resumeFile ? "var(--fill-accent)" : "var(--surface-1)",
                    color: resumeFile ? "white" : "var(--text-muted)",
                    border: "none",
                    borderRadius: "var(--radius)",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: resumeFile ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8
                  }}
                >
                  <span>Extract Profile Telemetry</span>
                  <span>→</span>
                </button>
              </div>
            )}
          </div>

          {/* Sign in prompt if guest / not logged in */}
          {!currentUser && (
            <div className="mt-5 p-4 bg-white/80 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Already have a Zentail account?</span>
                  <p className="text-[11.5px] text-slate-500">Sign in to access your existing resumes, applications & interview simulations.</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthError(null);
                    setShowAuthModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Sign in here
                </button>
                <a
                  href="/signin"
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Sign in page →
                </a>
              </div>
            </div>
          )}
        </div>
        {renderAuthModal()}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STEP: EXTRACTING
  // ─────────────────────────────────────────────────────────────
  if (step === "extracting") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-sm">
          <div className="flex justify-center mb-6">
            <NeuralRadarLoader />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Extracting your resume details</h2>
          <p className="text-sm text-slate-500 mt-1">
            Analyzing your career telemetry, contact links, and verified competencies.
          </p>
          <ProgressWait messages={EXTRACTION_MESSAGES} label="Takes ~10–15 seconds" />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STEP: REVIEW PROFILE
  // ─────────────────────────────────────────────────────────────
  if (step === "review_profile" && extractedProfile) {
    return (
      <div className="min-h-screen bg-slate-50/40">
        <MarketingNav
          currentUser={currentUser}
          onOpenSignIn={() => {
            setAuthMode("signin");
            setAuthError(null);
            setShowAuthModal(true);
          }}
          onOpenSignUp={() => {
            setAuthMode("signup");
            setAuthError(null);
            setShowAuthModal(true);
          }}
          onSignOut={handleSignOut}
          onReset={() => setStep("input")}
        />
        <div className="p-4 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <button
              onClick={() => setStep("input")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Upload a different resume</span>
            </button>

            <ExtractedProfileCard
              profile={extractedProfile}
              onUpdate={setExtractedProfile}
              onProceed={() => setStep("paste_jd")}
            />
          </div>
        </div>
        {renderAuthModal()}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STEP: PASTE JOB DESCRIPTION
  // ─────────────────────────────────────────────────────────────
  if (step === "paste_jd" && extractedProfile) {
    return (
      <div className="min-h-screen bg-slate-50/40">
        <MarketingNav
          currentUser={currentUser}
          onOpenSignIn={() => {
            setAuthMode("signin");
            setAuthError(null);
            setShowAuthModal(true);
          }}
          onOpenSignUp={() => {
            setAuthMode("signup");
            setAuthError(null);
            setShowAuthModal(true);
          }}
          onSignOut={handleSignOut}
          onReset={() => setStep("input")}
        />
        <div className="p-4 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <button
              onClick={() => setStep("review_profile")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to candidate review</span>
            </button>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Candidate Profile Connected: {extractedProfile.personal?.fullName || "Verified"}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Connect target Job Description
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Paste the full job post requirements to check your ATS match and highlight exact gaps.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Paste Job Description
                </label>
                <textarea
                  rows={10}
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the full job description here (Responsibilities, Technical Requirements, Qualifications)..."
                  className="w-full p-4 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y shadow-2xs"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  {jd.length > 50 ? `${jd.length} characters pasted` : "Paste at least 50 characters for deep matching"}
                </span>
                <button
                  type="button"
                  onClick={handleAnalyzeMatch}
                  disabled={jd.trim().length < 40}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 ${
                    jd.trim().length >= 40
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <span>Calculate Job Match & Fit</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {renderAuthModal()}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STEP: ANALYZING MATCH
  // ─────────────────────────────────────────────────────────────
  if (step === "analyzing") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-sm">
          <div className="flex justify-center mb-6">
            <NeuralRadarLoader />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Comparing your resume against the job</h2>
          <p className="text-sm text-slate-500 mt-1">
            Running multi-layer ATS verification and scoring each requirement individually.
          </p>
          <ProgressWait messages={MATCH_MESSAGES} label="This takes 15–25 seconds" />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STEP: RESULT (Match Breakdown + Save Application)
  // ─────────────────────────────────────────────────────────────
  if (step === "result" && result) {
    return (
      <div className="min-h-screen bg-slate-50/40">
        <MarketingNav
          currentUser={currentUser}
          onOpenSignIn={() => {
            setAuthMode("signin");
            setAuthError(null);
            setShowAuthModal(true);
          }}
          onOpenSignUp={() => {
            setAuthMode("signup");
            setAuthError(null);
            setShowAuthModal(true);
          }}
          onSignOut={handleSignOut}
          onReset={() => setStep("input")}
        />
        <div className="p-4 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Top nav */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep("paste_jd")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Modify job description</span>
              </button>
            <div className="text-xs text-slate-400">
              Candidate: <span className="font-semibold text-slate-700">{extractedProfile?.personal?.fullName}</span>
            </div>
          </div>

          {/* Fit Score Hero */}
          <div className={`rounded-2xl p-6 border shadow-xs ${
            result.fitScore >= 75
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
              : result.fitScore >= 55
              ? "bg-amber-50/70 border-amber-200 text-amber-950"
              : "bg-rose-50/70 border-rose-200 text-rose-950"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                  Job Match Telemetry · {result.company} ({result.jobTitle})
                </span>
                <div className="text-5xl font-extrabold tracking-tight mt-1 mb-2">
                  {result.fitScore}%
                </div>
                <p className="text-sm font-medium leading-relaxed max-w-xl">
                  {result.verdict}
                </p>
              </div>
            </div>
          </div>

          {/* Skills Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matched */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Strong Matches ({result.matched?.length || 0})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.matched?.map((skill: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing or Gaps */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Missing or Low Evidence ({result.missing?.length || 0})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.missing?.map((skill: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-rose-50 text-rose-800 rounded-full text-xs font-semibold border border-rose-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* What's holding back */}
          {result.whatIsHoldingBack && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Critical Evaluation & Gap Analysis
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {result.whatIsHoldingBack}
              </p>
            </div>
          )}

          {/* 3 Improvements */}
          {result.improvements && result.improvements.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tailored Resume Opportunities
              </div>
              <div className="space-y-2">
                {result.improvements.map((imp: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Action Banner */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-md">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                Ready to generate application
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Save Application & Generate Tailored Resume
              </h3>
              <p className="text-sm text-indigo-200/80 leading-relaxed max-w-xl">
                We'll store your original resume in your library, generate a new version tailored for {result.company}, and prepare your text-based interview questions with on-demand simulation.
              </p>
            </div>

            <button
              onClick={handleSaveClick}
              disabled={isSavingApp}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSavingApp ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing Application & Tailoring Resume...</span>
                </>
              ) : (
                <>
                  <span>Create Application & Open Workspace</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {renderAuthModal()}
    </div>
  );
}

  return null;
}