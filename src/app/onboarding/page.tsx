// src/app/onboarding/page.tsx
"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
type OnboardStep = 1 | 2 | 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: OnboardStep }) {
  const labels = ["Confirm your profile", "Skills & target role", "Create account"];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 36 }}>
      {labels.map((label, i) => {
        const s = (i + 1) as OnboardStep;
        const active = s === step;
        const done = s < step;
        return (
          <div key={label} style={{ flex: 1 }}>
            <div style={{
              height: 4, borderRadius: 99, marginBottom: 6,
              background: done || active ? "var(--fill-accent)" : "var(--surface-1)",
              opacity: done ? 0.5 : 1, transition: "all 0.3s"
            }} />
            <div style={{
              fontSize: 11, fontWeight: 600,
              color: active ? "var(--fill-accent)" : "var(--text-muted)"
            }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function SkillTag({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 13, padding: "5px 11px",
        background: "var(--bg-success)", color: "var(--text-success)",
        borderRadius: 99, fontWeight: 500, cursor: onRemove ? "pointer" : "default"
      }}
      onClick={onRemove}
      title={onRemove ? "Click to remove" : undefined}
    >
      ✓ {label}{onRemove && <span style={{ opacity: 0.6 }}>×</span>}
    </span>
  );
}

function SuggestionChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 13, padding: "5px 12px",
        background: "var(--surface-1)", color: "var(--text-secondary)",
        border: "1px dashed var(--border)", borderRadius: 99,
        fontWeight: 500, cursor: "pointer", transition: "all 0.15s"
      }}
    >
      + {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function OnboardingContent() {
  const router = useRouter();
  const supabase = createClient();

  const [parsedResume, setParsedResume] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [onboardingPath, setOnboardingPath] = useState<"resume" | "fresh">("resume");
  const [step, setStep] = useState<OnboardStep>(1);

  // Step 1
  const [name, setName] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  // Step 2
  const [targetRole, setTargetRole] = useState("");
  const [addedSkills, setAddedSkills] = useState<string[]>([]);
  const [newMissing, setNewMissing] = useState("");

  // Step 3
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStep, setSaveStep] = useState("");
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSkipToDashboard = async () => {
    if (currentUser) {
      await (supabase.from("profiles") as any)
        .upsert({
          id: currentUser.id,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        }, { onConflict: "id" });
    }
    router.replace("/dashboard");
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) { 
        setCurrentUser(user);
        
        // Auto-heal / bypass if user already completed onboarding or has existing data
        const { data: prof } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        if (prof?.onboarding_completed) {
          router.replace("/dashboard");
          return;
        }

        const { count: resCount } = await supabase
          .from("resume_versions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (resCount && resCount > 0) {
          await (supabase.from("profiles") as any)
            .upsert({ id: user.id, onboarding_completed: true, onboarding_completed_at: new Date().toISOString() }, { onConflict: "id" });
          router.replace("/dashboard");
          return;
        }

        const { count: appCount } = await supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (appCount && appCount > 0) {
          await (supabase.from("profiles") as any)
            .upsert({ id: user.id, onboarding_completed: true, onboarding_completed_at: new Date().toISOString() }, { onConflict: "id" });
          router.replace("/dashboard");
          return;
        }
      }

      const path = sessionStorage.getItem("onboarding_path") as "resume" | "fresh" | null;
      if (path === "fresh") setOnboardingPath("fresh");

      let parsed: any = null;
      let analysis: any = null;
      try { parsed = JSON.parse(sessionStorage.getItem("parsed_resume") || "null"); } catch {}
      try { analysis = JSON.parse(sessionStorage.getItem("analysis_result") || "null"); } catch {}

      setParsedResume(parsed);
      setAnalysisResult(analysis);
      setName(parsed?.name || "");
      setCurrentRole(parsed?.currentRole || parsed?.current_role || "");
      setSkills(parsed?.skills || []);
      setTargetRole(parsed?.currentRole || parsed?.current_role || "");
      setIsInitializing(false);
    });
  }, []);

  const missingSuggestions: string[] = (() => {
    if (!analysisResult?.missing) return [];
    const all = new Set([...skills, ...addedSkills].map(s => s.toLowerCase()));
    return (analysisResult.missing as string[]).filter(s => !all.has(s.toLowerCase()));
  })();

  const handleStep1Next = () => {
    if (!name.trim() || !currentRole.trim()) return;
    const updated = { ...parsedResume, name: name.trim(), currentRole: currentRole.trim(), skills };
    sessionStorage.setItem("parsed_resume", JSON.stringify(updated));
    setParsedResume(updated);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStep2Next = () => {
    const allSkills = [...skills, ...addedSkills];
    const updated = { ...parsedResume, skills: allSkills, targetRole: targetRole.trim() };
    sessionStorage.setItem("parsed_resume", JSON.stringify(updated));
    setParsedResume(updated);
    setSkills(allSkills);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSignup = async () => {
    if (!email.trim() || password.length < 6) return;
    setSaving(true);
    setSignupError(null);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name } }
    });

    if (error) { setSignupError(error.message); setSaving(false); return; }

    const userId = data.user?.id;
    if (!userId) {
      setSignupError("Signup succeeded but no user ID returned. Please try signing in.");
      setSaving(false);
      return;
    }

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Setup timed out. Your account is created — go to your dashboard.")), 25000)
    );
    try {
      await Promise.race([runSave(userId, data.user?.email || email.trim()), timeout]);
    } catch (err: any) {
      setSaving(false);
      setOnboardingError(err?.message || "Setup failed. Your account was created — please sign in.");
    }
  };

  const clearSession = () => {
    ["pending_jd","parsed_resume","analysis_result","additional_skills","onboarding_path","interview_transcript"]
      .forEach(k => sessionStorage.removeItem(k));
  };

  const runSave = async (userId: string, userEmail: string) => {
    setSaving(true);
    setOnboardingError(null);

    let parsed: any = null;
    try { parsed = JSON.parse(sessionStorage.getItem("parsed_resume") || "null"); } catch {}
    const pendingJD = sessionStorage.getItem("pending_jd");
    let analysis: any = null;
    try { analysis = JSON.parse(sessionStorage.getItem("analysis_result") || "null"); } catch {}

    const resumeData = parsed || {};
    const allSkills: string[] = resumeData.skills || [];

    setSaveStep("Saving your profile...");
    const { error: profileError } = await (supabase.from("profiles") as any)
      .update({
        full_name: resumeData.name || name || "User",
        target_role: resumeData.targetRole || targetRole || null,
        onboarding_completed: true
      })
      .eq("id", userId);
      
    if (profileError) throw new Error(profileError.message);

    if (allSkills.length > 0) {
      setSaveStep("Saving your skills...");
      const { error: skillsError } = await (supabase.from("evidence_skills") as any).upsert(
        allSkills.map((s: string) => ({ user_id: userId, skill_name: s, proof_status: "self_reported" })),
        { onConflict: 'user_id,skill_name' }
      );
      // Ignore skills error if it's a conflict or something minor
      if (skillsError) console.warn("Skills insert error:", skillsError);
    }

    if (resumeData.projects?.length > 0) {
      setSaveStep("Saving your projects...");
      const { error: projectsError } = await (supabase.from("evidence_projects") as any).insert(
        resumeData.projects.map((p: any) => ({ user_id: userId, title: p.title || "Project", description: p.description || "" }))
      );
      if (projectsError) console.warn("Projects insert error:", projectsError);
    }

    setSaveStep("Building your resume...");
    const { data: newResume, error: resumeError } = await (supabase.from("resume_versions") as any).insert({
      user_id: userId,
      version_label: `${resumeData.name || "Master"} Resume`,
      origin_type: "master",
      version_number: 1,
      is_latest: true,
      content: {
        personal: { fullName: resumeData.name || "", email: resumeData.email || email || "", jobTitle: resumeData.currentRole || "" },
        skills: allSkills,
        projects: resumeData.projects || [],
        experience: resumeData.experience || [],
        education: resumeData.education || []
      }
    }).select().single();
    if (resumeError) console.warn("Resume insert error:", resumeError);

    let applicationId: string | null = null;
    if (pendingJD) {
      setSaveStep("Creating your application workspace...");
      try {
        const res = await fetch("/api/applications/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            jobDescription: pendingJD, 
            fromOnboarding: true, 
            preComputedAnalysis: analysis,
            resumeVersionId: newResume?.id
          })
        });
        const d = await res.json();
        applicationId = d.applicationId || d.id || null;
      } catch (e) { console.warn("Application create failed:", e); }
    }

    clearSession();
    setSaveStep("Redirecting...");
    router.push("/dashboard");
  };

  // ── Loading / Saving ─────────────────────────────────────────────────────────
  if (isInitializing || (saving && !onboardingError)) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-sans)", background:"var(--background)" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:32, height:32, borderRadius:"50%", border:"3px solid var(--fill-accent)", borderTopColor:"transparent", animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }} />
          <div style={{ fontSize:16, fontWeight:600, color:"var(--foreground)", marginBottom:6 }}>Setting up your workspace...</div>
          <div style={{ fontSize:13, color:"var(--text-muted)" }}>{saveStep || "Just a moment"}</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (onboardingError) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-sans)", background:"var(--background)" }}>
        <div style={{ textAlign:"center", maxWidth:380, padding:"0 1.5rem" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--foreground)", marginBottom:8 }}>Setup took too long</div>
          <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:24 }}>{onboardingError}</div>
          <button onClick={() => { clearSession(); router.push("/dashboard"); }}
            style={{ width:"100%", padding:"13px", background:"var(--fill-accent)", color:"white", border:"none", borderRadius:"var(--radius)", fontSize:14, fontWeight:600, cursor:"pointer" }}>
            Go to dashboard →
          </button>
        </div>
      </div>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", fontFamily:"var(--font-sans)", background:"var(--background)", color:"var(--foreground)" }}>
      <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1rem 2rem", borderBottom:"1px solid var(--border)", background:"var(--card)" }}>
        <div style={{ fontWeight:700, fontSize:18 }}>Zentail</div>
        {currentUser ? (
          <button
            onClick={handleSkipToDashboard}
            style={{ background: "none", border: "none", fontSize: 13, color: "var(--fill-accent)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            Go to Dashboard →
          </button>
        ) : (
          <a href="/signin" style={{ fontSize:13, color:"var(--text-secondary)", textDecoration:"none", fontWeight:500 }}>
            Already have an account? Sign in
          </a>
        )}
      </nav>

      <div style={{ maxWidth:560, margin:"0 auto", padding:"2.5rem 1.5rem" }}>
        {currentUser && (
          <div style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13
          }}>
            <span style={{ color: "var(--text-secondary)" }}>
              Signed in as <strong style={{ color: "var(--foreground)" }}>{currentUser.email}</strong>
            </span>
            <button
              onClick={handleSkipToDashboard}
              style={{
                background: "var(--fill-accent)",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer"
              }}
            >
              Skip to Dashboard →
            </button>
          </div>
        )}

        <ProgressBar step={step} />

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize:24, fontWeight:700, marginBottom:6, letterSpacing:"-0.02em" }}>
              {onboardingPath === "fresh" ? "Here's what we found out about you"
                : parsedResume?.name ? `Here's what we extracted, ${parsedResume.name.split(" ")[0]}`
                : "Confirm your profile"}
            </h1>
            <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:28, lineHeight:1.6 }}>
              {onboardingPath === "fresh"
                ? "Review what we learned from your conversation. Fix anything that looks off."
                : "We read your resume. Review and correct anything before we build your workspace."}
            </p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
              {[
                { label:"FULL NAME", value:name, set:setName, placeholder:"Your name" },
                { label:"CURRENT ROLE", value:currentRole, set:setCurrentRole, placeholder:"e.g. Software Engineer" }
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:6 }}>{label}</label>
                  <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                    style={{ width:"100%", padding:"10px 12px", border:"1px solid var(--border)", borderRadius:"var(--radius)", fontSize:14, background:"var(--surface-2)", color:"var(--foreground)", outline:"none", boxSizing:"border-box" }} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:10 }}>
                YOUR SKILLS <span style={{ fontWeight:400, color:"var(--text-muted)" }}>— click to remove</span>
              </label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                {skills.length === 0
                  ? <span style={{ fontSize:13, color:"var(--text-muted)" }}>No skills extracted — add them below</span>
                  : skills.map(s => <SkillTag key={s} label={s} onRemove={() => setSkills(p => p.filter(x => x !== s))} />)
                }
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => { if (e.key==="Enter" && newSkill.trim()) { setSkills(p=>[...p,newSkill.trim()]); setNewSkill(""); } }}
                  placeholder="Add a skill (Enter to add)"
                  style={{ flex:1, padding:"9px 12px", border:"1px solid var(--border)", borderRadius:"var(--radius)", fontSize:13, background:"var(--surface-2)", color:"var(--foreground)", outline:"none" }} />
                <button onClick={() => { if(newSkill.trim()){setSkills(p=>[...p,newSkill.trim()]);setNewSkill("");} }}
                  style={{ padding:"9px 14px", border:"1px solid var(--border)", borderRadius:"var(--radius)", background:"var(--surface-1)", color:"var(--foreground)", fontSize:13, fontWeight:500, cursor:"pointer" }}>Add</button>
              </div>
            </div>

            {Array.isArray(parsedResume?.experience) && parsedResume.experience.length > 0 && (
              <div style={{ marginBottom:24 }}>
                <label style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:10 }}>EXPERIENCE DETECTED</label>
                {parsedResume.experience.slice(0,3).map((exp: any, i: number) => (
                  <div key={i} style={{ padding:"10px 12px", border:"1px solid var(--border)", borderRadius:"var(--radius)", marginBottom:6, background:"var(--surface-2)", fontSize:13 }}>
                    <span style={{ fontWeight:600, color:"var(--foreground)" }}>{exp.title}</span>
                    {exp.company && <span style={{ color:"var(--text-muted)" }}> · {exp.company}</span>}
                    {exp.dates && <span style={{ color:"var(--text-muted)", fontSize:12 }}> · {exp.dates}</span>}
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleStep1Next} disabled={!name.trim() || !currentRole.trim()}
              style={{ width:"100%", padding:"14px", background: name.trim()&&currentRole.trim() ? "var(--fill-accent)" : "var(--surface-1)", color: name.trim()&&currentRole.trim() ? "white" : "var(--text-muted)", border:"none", borderRadius:"var(--radius)", fontSize:15, fontWeight:600, cursor: name.trim()&&currentRole.trim() ? "pointer" : "not-allowed", transition:"all 0.15s" }}>
              Looks good → Next
            </button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize:24, fontWeight:700, marginBottom:6, letterSpacing:"-0.02em" }}>Fill the gaps</h1>
            <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:28, lineHeight:1.6 }}>
              Add any skills you have that we missed, and tell us where you want to go next.
            </p>

            {missingSuggestions.length > 0 && (
              <div style={{ marginBottom:24 }}>
                <label style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:10 }}>
                  FROM THE JOB — DO YOU HAVE THESE?
                </label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                  {missingSuggestions.map(s => (
                    <SuggestionChip key={s} label={s} onClick={() => setAddedSkills(p => p.includes(s) ? p : [...p, s])} />
                  ))}
                </div>
                {addedSkills.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                    {addedSkills.map(s => <SkillTag key={s} label={s} onRemove={() => setAddedSkills(p => p.filter(x => x !== s))} />)}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom:24 }}>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:8 }}>ANY OTHER SKILLS TO ADD?</label>
              <div style={{ display:"flex", gap:8 }}>
                <input value={newMissing} onChange={e => setNewMissing(e.target.value)}
                  onKeyDown={e => { if(e.key==="Enter"&&newMissing.trim()){setAddedSkills(p=>p.includes(newMissing.trim())?p:[...p,newMissing.trim()]);setNewMissing("");} }}
                  placeholder="e.g. GraphQL, Figma, Kubernetes..."
                  style={{ flex:1, padding:"9px 12px", border:"1px solid var(--border)", borderRadius:"var(--radius)", fontSize:13, background:"var(--surface-2)", color:"var(--foreground)", outline:"none" }} />
                <button onClick={() => { if(newMissing.trim()){setAddedSkills(p=>p.includes(newMissing.trim())?p:[...p,newMissing.trim()]);setNewMissing("");} }}
                  style={{ padding:"9px 14px", border:"1px solid var(--border)", borderRadius:"var(--radius)", background:"var(--surface-1)", color:"var(--foreground)", fontSize:13, fontWeight:500, cursor:"pointer" }}>Add</button>
              </div>
            </div>

            <div style={{ marginBottom:28 }}>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:6 }}>WHERE DO YOU WANT TO GO?</label>
              <input value={targetRole} onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer, Engineering Manager..."
                style={{ width:"100%", padding:"10px 12px", border:"1px solid var(--border)", borderRadius:"var(--radius)", fontSize:14, background:"var(--surface-2)", color:"var(--foreground)", outline:"none", boxSizing:"border-box" }} />
              <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:5 }}>Used to tailor your job matches and recommendations.</div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setStep(1)}
                style={{ padding:"13px 20px", border:"1px solid var(--border)", borderRadius:"var(--radius)", background:"none", color:"var(--text-secondary)", fontSize:14, cursor:"pointer" }}>← Back</button>
              <button onClick={handleStep2Next}
                style={{ flex:1, padding:"13px", background:"var(--fill-accent)", color:"white", border:"none", borderRadius:"var(--radius)", fontSize:15, fontWeight:600, cursor:"pointer" }}>
                {addedSkills.length > 0 ? `Add ${addedSkills.length} skill${addedSkills.length>1?"s":""} → Create account` : "Continue → Create account"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div>
            <h1 style={{ fontSize:24, fontWeight:700, marginBottom:6, letterSpacing:"-0.02em" }}>Save your workspace</h1>
            <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:28, lineHeight:1.6 }}>
              Create a free account to save your profile, resume, and application. Your analysis is waiting.
            </p>

            <div style={{ background:"var(--surface-1)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 16px", marginBottom:24, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:"50%", background:"var(--fill-accent)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, flexShrink:0 }}>
                {name ? name[0].toUpperCase() : "?"}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:"var(--foreground)" }}>{name || "Your profile"}</div>
                <div style={{ fontSize:12, color:"var(--text-muted)" }}>
                  {currentRole} · {skills.length + addedSkills.length} skills
                  {targetRole && targetRole !== currentRole ? ` · → ${targetRole}` : ""}
                </div>
              </div>
            </div>

            {signupError && (
              <div style={{ background:"var(--bg-danger)", border:"1px solid var(--border-danger,#fca5a5)", borderRadius:10, padding:"11px 14px", marginBottom:16, fontSize:13, color:"var(--text-danger)", display:"flex", gap:8 }}>
                <span style={{ flexShrink:0 }}>⚠️</span><span>{signupError}</span>
              </div>
            )}

            {currentUser ? (
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px", marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>SIGNED IN AS</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>{currentUser.email}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>You can now save your workspace.</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:6 }}>EMAIL</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && passwordRef.current?.focus()}
                    placeholder="you@example.com" autoComplete="email"
                    style={{ width:"100%", padding:"11px 12px", border:"1px solid var(--border)", borderRadius:"var(--radius)", fontSize:14, background:"var(--surface-2)", color:"var(--foreground)", outline:"none", boxSizing:"border-box" }} />
                </div>

                <div style={{ marginBottom:24 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:6 }}>
                    PASSWORD <span style={{ fontWeight:400, color:"var(--text-muted)" }}>(min 6 characters)</span>
                  </label>
                  <input ref={passwordRef} type="password" value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && handleSignup()}
                    placeholder="Create a password" autoComplete="new-password"
                    style={{ width:"100%", padding:"11px 12px", border:"1px solid var(--border)", borderRadius:"var(--radius)", fontSize:14, background:"var(--surface-2)", color:"var(--foreground)", outline:"none", boxSizing:"border-box" }} />
                </div>
              </>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setStep(2)}
                style={{ padding:"13px 20px", border:"1px solid var(--border)", borderRadius:"var(--radius)", background:"none", color:"var(--text-secondary)", fontSize:14, cursor:"pointer" }}>← Back</button>
              
              {currentUser ? (
                <button onClick={() => {
                  runSave(currentUser.id, currentUser.email || "").catch(err => {
                    setSaving(false);
                    setOnboardingError(err?.message || "Failed to resume setup.");
                  });
                }} disabled={saving}
                  style={{ flex:1, padding:"13px", background: "var(--fill-accent)", color: "white", border:"none", borderRadius:"var(--radius)", fontSize:15, fontWeight:600, cursor: saving ? "not-allowed" : "pointer", transition:"all 0.15s" }}>
                  {saving ? "Saving your workspace..." : "Complete Setup →"}
                </button>
              ) : (
                <button onClick={handleSignup} disabled={!email.trim() || password.length<6 || saving}
                  style={{ flex:1, padding:"13px", background: email.trim()&&password.length>=6&&!saving ? "var(--fill-accent)" : "var(--surface-1)", color: email.trim()&&password.length>=6&&!saving ? "white" : "var(--text-muted)", border:"none", borderRadius:"var(--radius)", fontSize:15, fontWeight:600, cursor: email.trim()&&password.length>=6&&!saving ? "pointer" : "not-allowed", transition:"all 0.15s" }}>
                  {saving ? "Creating your workspace..." : "Create my account →"}
                </button>
              )}
            </div>

            {!currentUser && <div style={{ fontSize:12, color:"var(--text-muted)", textAlign:"center", marginTop:14 }}>Free · No credit card · Your data is yours</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:32, height:32, borderRadius:"50%", border:"3px solid #6366f1", borderTopColor:"transparent", animation:"spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
