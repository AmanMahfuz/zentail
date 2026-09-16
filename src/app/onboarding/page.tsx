// src/app/onboarding/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PublicStep = "confirm_skills" | "creating_account";

import { Suspense } from "react";

function OnboardingContent() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [publicStep, setPublicStep] = useState<PublicStep>("confirm_skills");
  const [parsedResume, setParsedResume] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [additionalSkills, setAdditionalSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);

      if (user) {
        // LOGGED IN: save data and redirect
        handleLoggedInSave(user.id);
      } else {
        // NOT LOGGED IN: load session data
        const parsed = sessionStorage.getItem("parsed_resume");
        const analysis = sessionStorage.getItem("analysis_result");
        if (parsed) setParsedResume(JSON.parse(parsed));
        if (analysis) setAnalysisResult(JSON.parse(analysis));
      }
    });
  }, []);

  // Called when user just signed up and landed back here
  const handleLoggedInSave = async (userId: string) => {
    setSaving(true);
    try {
      const parsed = sessionStorage.getItem("parsed_resume");
      const pendingJD = sessionStorage.getItem("pending_jd");
      const analysis = sessionStorage.getItem("analysis_result");
      const extraSkills = sessionStorage.getItem("additional_skills");

      if (!parsed) {
        // No data — just go to dashboard
        router.push("/dashboard");
        return;
      }

      const resumeData = JSON.parse(parsed);
      const allSkills = [
        ...(resumeData.skills || []),
        ...(extraSkills ? JSON.parse(extraSkills) : [])
      ];

      // Save profile
      await supabase.from("profiles").update({
        full_name: String(resumeData.name || ""),
        current_role: String(resumeData.currentRole || ""),
        onboarding_completed: true
      } as any).eq("id", userId);

      // Save skills
      if (allSkills.length > 0) {
        await supabase.from("user_skills").insert(
          allSkills.map((skill: string) => ({
            user_id: userId,
            skill_name: skill,
            proof_status: "self_reported"
          }))
        );
      }

      // Save projects
      if (resumeData.projects?.length > 0) {
        await supabase.from("user_projects").insert(
          resumeData.projects.map((p: any) => ({
            user_id: userId,
            title: p.title,
            description: p.description
          }))
        );
      }

      // Create first application from pending JD
      let applicationId: string | null = null;
      if (pendingJD) {
        const response = await fetch("/api/applications/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobDescription: pendingJD,
            fromOnboarding: true,
            preComputedAnalysis: analysis ? JSON.parse(analysis) : null
          })
        });
        const data = await response.json();
        applicationId = data.applicationId;
      }

      // Clear session storage
      sessionStorage.removeItem("pending_jd");
      sessionStorage.removeItem("parsed_resume");
      sessionStorage.removeItem("analysis_result");
      sessionStorage.removeItem("additional_skills");

      // Redirect to their first application workspace
      if (applicationId) {
        router.push(`/applications/${applicationId}`);
      } else {
        router.push("/dashboard");
      }
    } finally {
      setSaving(false);
    }
  };

  // SAVING STATE
  if (saving || isLoggedIn === null) return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-sans)"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>
          Setting up your workspace...
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          This takes just a moment
        </div>
      </div>
    </div>
  );

  // NOT LOGGED IN: Show skill confirmation + signup prompt
  if (!isLoggedIn) {
    const allSkills = [...(parsedResume?.skills || []), ...additionalSkills];

    return (
      <div style={{
        minHeight: "100vh",
        fontFamily: "var(--font-sans)"
      }}>
        <nav style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          borderBottom: "0.5px solid var(--border)"
        }}>
          <div style={{ fontWeight: 600 }}>Zentail</div>
          <a href="/signin" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}>
            Already have an account? Sign in
          </a>
        </nav>

        <div style={{ maxWidth: 520, margin: "0 auto", padding: "2rem" }}>

          {/* Progress */}
          <div style={{
            display: "flex",
            gap: 6,
            marginBottom: 32
          }}>
            {["Your skills", "Create account", "Application workspace"].map((label, i) => (
              <div key={label} style={{ flex: 1 }}>
                <div style={{
                  height: 3,
                  borderRadius: 99,
                  background: i === 0
                    ? "var(--fill-accent)"
                    : "var(--surface-1)",
                  marginBottom: 4
                }} />
                <div style={{
                  fontSize: 11,
                  color: i === 0
                    ? "var(--text-accent)"
                    : "var(--text-muted)"
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            {parsedResume?.name
              ? `Here's what we found, ${parsedResume.name.split(" ")[0]}`
              : "Here's what we found"
            }
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
            We extracted {parsedResume?.skills?.length || 0} skills and{" "}
            {parsedResume?.projects?.length || 0} projects from your resume.
            Add anything we missed.
          </p>

          {/* Skills */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
              Skills from your resume
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {parsedResume?.skills?.map((skill: string) => (
                <span key={skill} style={{
                  fontSize: 13,
                  padding: "4px 10px",
                  background: "var(--bg-success)",
                  color: "var(--text-success)",
                  borderRadius: 99
                }}>
                  ✓ {skill}
                </span>
              ))}
              {additionalSkills.map(skill => (
                <span
                  key={skill}
                  onClick={() => setAdditionalSkills(prev => prev.filter(s => s !== skill))}
                  style={{
                    fontSize: 13,
                    padding: "4px 10px",
                    background: "var(--bg-accent)",
                    color: "var(--text-accent)",
                    borderRadius: 99,
                    cursor: "pointer"
                  }}
                >
                  + {skill} ×
                </span>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && newSkill.trim()) {
                    setAdditionalSkills(prev => [...prev, newSkill.trim()]);
                    setNewSkill("");
                  }
                }}
                placeholder="Add a missing skill..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "0.5px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 13
                }}
              />
              <button
                onClick={() => {
                  if (newSkill.trim()) {
                    setAdditionalSkills(prev => [...prev, newSkill.trim()]);
                    setNewSkill("");
                  }
                }}
                style={{
                  padding: "8px 14px",
                  border: "0.5px solid var(--border)",
                  borderRadius: "var(--radius)",
                  background: "transparent",
                  fontSize: 13,
                  cursor: "pointer"
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Projects */}
          {parsedResume?.projects?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
                Projects detected
              </div>
              {parsedResume.projects.map((p: any, i: number) => (
                <div key={i} style={{
                  padding: "10px 12px",
                  border: "0.5px solid var(--border)",
                  borderRadius: "var(--radius)",
                  marginBottom: 6,
                  fontSize: 13
                }}>
                  <div style={{ fontWeight: 500 }}>{p.title}</div>
                  <div style={{ color: "var(--text-secondary)", marginTop: 2, fontSize: 12 }}>
                    {p.description?.slice(0, 80)}...
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA - save analysis = create account */}
          <button
            onClick={() => {
              // Save additional skills to session before redirecting
              sessionStorage.setItem("additional_skills", JSON.stringify(additionalSkills));
              router.push("/signup?from=onboarding");
            }}
            style={{
              width: "100%",
              padding: "14px",
              background: "var(--fill-accent)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius)",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            Save analysis and create account →
          </button>

          <div style={{
            fontSize: 12,
            color: "var(--text-muted)",
            textAlign: "center",
            marginTop: 10
          }}>
            Free · Your data is saved · No credit card needed
          </div>
        </div>
      </div>
    );
  }

  return null; // Will redirect
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}