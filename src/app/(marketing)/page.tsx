// src/app/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Step = "input" | "analyzing" | "result";

export default function LandingPage() {
  const [step, setStep] = useState<Step>("input");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [jd, setJd] = useState("");
  const [jdMode, setJdMode] = useState<"paste" | "link">("paste");
  const [result, setResult] = useState<any>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState<string[]>([]);
  const router = useRouter();

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

  const handleAnalyze = async () => {
    if (!resumeFile || !jd.trim()) return;
    setStep("analyzing");

    const steps = [
      "Understanding job requirements...",
      "Extracting your experience...",
      "Comparing your experience...",
      "Identifying gaps...",
      "Finding resume opportunities..."
    ];

    // Show progress one by one
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setAnalyzeProgress(prev => [...prev, steps[i]]);
    }

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", jd);

      const response = await fetch("/api/public/full-analysis", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      // Save to sessionStorage for onboarding
      sessionStorage.setItem("pending_jd", jd);
      sessionStorage.setItem("parsed_resume", JSON.stringify(data.parsedResume));
      sessionStorage.setItem("analysis_result", JSON.stringify(data.analysis));

      setResult(data.analysis);
      setStep("result");
    } catch {
      setStep("input");
    }
  };

  // INPUT STEP
  if (step === "input") return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font-sans)", background: "var(--background)", color: "var(--foreground)" }}>
      <nav style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 2rem",
        background: "#171717",
        color: "white"
      }}>
        <div style={{ fontWeight: 600 }}>Zentail</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/signin" style={{ fontSize: 14, color: "#a1a1aa", textDecoration: "none" }}>
            Sign in
          </a>
          <a href="/signup" style={{
            fontSize: 14, padding: "6px 14px",
            background: "#2563eb", color: "white",
            borderRadius: "var(--radius)", textDecoration: "none"
          }}>
            Get started
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 2rem" }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#3b82f6",
          letterSpacing: "0.05em",
          marginBottom: 16,
          textTransform: "uppercase"
        }}>
          FOR STUDENTS · FRESHERS · PLACEMENT SEASON
        </div>
        <h1 style={{
          fontSize: "clamp(32px, 5vw, 48px)",
          fontWeight: 600,
          lineHeight: 1.1,
          color: "var(--foreground)",
          marginBottom: 20
        }}>
          Stop sending the same resume to every job.
        </h1>
        <p style={{
          fontSize: 18,
          color: "var(--muted-foreground)",
          lineHeight: 1.6,
          marginBottom: 48,
          maxWidth: 600
        }}>
          Understand what a job actually requires, see where you match,
          and build a stronger application from your real experience.
        </p>

        {/* THE FORM - DARK CARD */}
        <div style={{
          background: "#171717",
          color: "white",
          borderRadius: 20,
          padding: "2rem",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)"
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div style={{
              flex: 1,
              background: "#0f172a",
              border: "1px solid #1e3a8a",
              borderRadius: 12,
              padding: "16px",
              cursor: "pointer"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ color: "#60a5fa", fontSize: 18 }}>☑</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#60a5fa" }}>I have a resume</span>
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", paddingLeft: 28 }}>
                Upload it and we'll analyze your fit
              </div>
            </div>
            
            <div style={{
              flex: 1,
              background: "transparent",
              border: "1px solid #333",
              borderRadius: 12,
              padding: "16px",
              cursor: "pointer",
              opacity: 0.7
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ color: "#71717a", fontSize: 18 }}>☐</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "white" }}>I don't have one</span>
              </div>
              <div style={{ fontSize: 13, color: "#a1a1aa", paddingLeft: 28 }}>
                Build your first resume with AI
              </div>
            </div>
          </div>

          {/* Resume upload */}
          <div style={{ marginBottom: 24 }}>
            <label
              onDragOver={e => e.preventDefault()}
              onDrop={handleFileDrop}
              style={{
                display: "block",
                border: resumeFile
                  ? "1px solid #22c55e"
                  : "1px dashed #333",
                borderRadius: 12,
                padding: resumeFile ? "16px" : "32px",
                textAlign: "center",
                cursor: "pointer",
                background: resumeFile ? "#064e3b" : "transparent",
                transition: "all 0.2s"
              }}
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileInput}
                style={{ display: "none" }}
              />
              {resumeFile ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <span style={{ fontSize: 18, color: "#4ade80" }}>✓</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "white" }}>{resumeName}</span>
                  <button
                    onClick={e => { e.preventDefault(); setResumeFile(null); setResumeName(""); }}
                    style={{
                      marginLeft: 12, fontSize: 12, color: "#a1a1aa",
                      background: "none", border: "none", cursor: "pointer", textDecoration: "underline"
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 20, marginBottom: 8, color: "#a1a1aa" }}>□</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "white" }}>
                    Drop your resume here
                  </div>
                  <div style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>
                    PDF, DOC, DOCX
                  </div>
                </>
              )}
            </label>
          </div>

          {/* JD input */}
          <div style={{ marginBottom: 24 }}>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="Paste the job description here — requirements, skills, responsibilities..."
              style={{
                width: "100%",
                minHeight: 120,
                padding: 16,
                background: "transparent",
                border: "1px solid #333",
                borderRadius: 12,
                fontSize: 14,
                color: "white",
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!resumeFile || !jd.trim()}
            style={{
              width: "100%",
              padding: "16px",
              background: resumeFile && jd.trim()
                ? "#2563eb"
                : "#09090b",
              color: resumeFile && jd.trim() ? "white" : "#52525b",
              border: resumeFile && jd.trim() ? "none" : "1px solid #27272a",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 500,
              cursor: resumeFile && jd.trim() ? "pointer" : "not-allowed",
              transition: "all 0.2s"
            }}
          >
            Analyze my fit →
          </button>

          <div style={{
            fontSize: 13,
            color: "#71717a",
            textAlign: "center",
            marginTop: 16
          }}>
            No signup · Free · 15 seconds
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginTop: 80, textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.05em", marginBottom: 40 }}>
            HOW IT WORKS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: "#171717", color: "white", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                □
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: "var(--foreground)" }}>Upload resume</div>
              <div style={{ fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.5 }}>We read your real skills and experience</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: "#171717", color: "white", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                □
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: "var(--foreground)" }}>Paste job</div>
              <div style={{ fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.5 }}>We extract every requirement from it</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: "#171717", color: "white", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                □
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: "var(--foreground)" }}>See exact fit</div>
              <div style={{ fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.5 }}>Know your gaps and how to close them</div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: "flex", justifyContent: "center", gap: 60, marginTop: 80, paddingBottom: 40 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>10K+</div>
            <div style={{ fontSize: 14, color: "var(--muted-foreground)" }}>Students</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>87%</div>
            <div style={{ fontSize: 14, color: "var(--muted-foreground)" }}>Better match</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>3x</div>
            <div style={{ fontSize: 14, color: "var(--muted-foreground)" }}>More interviews</div>
          </div>
        </div>

      </div>
    </div>
  );

  // ANALYZING STEP
  if (step === "analyzing") return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-sans)"
    }}>
      <div style={{ maxWidth: 400, width: "100%", padding: "2rem" }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 20 }}>
          Analyzing your application...
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {analyzeProgress.map((s, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              color: "var(--muted-foreground)"
            }}>
              <span style={{ color: "#16a34a", fontSize: 16 }}>✓</span>
              {s}
            </div>
          ))}
          {analyzeProgress.length < 5 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              color: "var(--muted-foreground)"
            }}>
              <div style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "2px solid var(--primary)",
                borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite"
              }} />
              {["Understanding job requirements...",
                "Extracting your experience...",
                "Comparing your experience...",
                "Identifying gaps...",
                "Finding resume opportunities..."][analyzeProgress.length]}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // RESULT STEP
  if (step === "result" && result) return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font-sans)" }}>
      <nav style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 2rem",
        borderBottom: "0.5px solid var(--border)"
      }}>
        <div style={{ fontWeight: 600 }}>Zentail</div>
        <button
          onClick={() => setStep("input")}
          style={{
            fontSize: 13, color: "var(--muted-foreground)",
            background: "none", border: "none", cursor: "pointer"
          }}
        >
          ← Try another job
        </button>
      </nav>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem" }}>

        {/* Fit score */}
        <div style={{
          background: result.fitScore >= 70
            ? "#dcfce7"
            : result.fitScore >= 50
            ? "#fef08a"
            : "#fee2e2",
          borderRadius: 16,
          padding: "1.5rem",
          marginBottom: "1.5rem"
        }}>
          <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 4 }}>
            Your job fit
          </div>
          <div style={{ fontSize: 48, fontWeight: 600, marginBottom: 4 }}>
            {result.fitScore}%
          </div>
          <div style={{ fontSize: 14 }}>{result.verdict}</div>
        </div>

        {/* Matched */}
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
          borderRadius: 16,
          padding: "1.25rem",
          marginBottom: "1rem"
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#166534", marginBottom: 12 }}>
            ✅ Strong matches
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {result.matched?.map((s: string) => (
              <span key={s} style={{
                fontSize: 13,
                padding: "4px 10px",
                background: "#dcfce7",
                color: "#166534",
                borderRadius: 99
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Partial */}
        {result.partial?.length > 0 && (
          <div style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card)",
            borderRadius: 16,
            padding: "1.25rem",
            marginBottom: "1rem"
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#854d0e", marginBottom: 12 }}>
              ◐ Partial matches — needs more evidence
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {result.partial.map((s: string) => (
                <span key={s} style={{
                  fontSize: 13,
                  padding: "4px 10px",
                  background: "#fef08a",
                  color: "#854d0e",
                  borderRadius: 99
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing */}
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
          borderRadius: 16,
          padding: "1.25rem",
          marginBottom: "1.5rem"
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#991b1b", marginBottom: 12 }}>
            ○ Missing or unclear
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {result.missing?.map((s: string) => (
              <span key={s} style={{
                fontSize: 13,
                padding: "4px 10px",
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: 99
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* What's holding you back */}
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
          borderRadius: 16,
          padding: "1.25rem",
          marginBottom: "1rem"
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
            What is holding your application back?
          </div>
          <div style={{
            fontSize: 14,
            color: "var(--muted-foreground)",
            lineHeight: 1.6
          }}>
            {result.whatIsHoldingBack}
          </div>
        </div>

        {/* 3 improvements */}
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
          borderRadius: 16,
          padding: "1.25rem",
          marginBottom: "2rem"
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
            3 things you can improve
          </div>
          {result.improvements?.map((imp: string, i: number) => (
            <div key={i} style={{
              display: "flex",
              gap: 10,
              padding: "8px 0",
              borderBottom: i < 2 ? "1px solid var(--border)" : "none"
            }}>
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--primary)",
                flexShrink: 0,
                marginTop: 1
              }}>
                {i + 1}.
              </span>
              <span style={{ fontSize: 14, lineHeight: 1.5 }}>{imp}</span>
            </div>
          ))}
        </div>

        {/* THE CTA - not "sign up", but "save this" */}
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--primary)",
          boxShadow: "var(--shadow-card)",
          borderRadius: 16,
          padding: "1.5rem",
          textAlign: "center"
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Turn this analysis into your application
          </div>
          <div style={{
            fontSize: 14,
            color: "var(--muted-foreground)",
            marginBottom: 20,
            lineHeight: 1.5
          }}>
            Save this job, create a tailored resume, track your application
            and keep your preparation in one place.
          </div>
          <button
            onClick={() => router.push("/onboarding?from=analysis")}
            style={{
              width: "100%",
              padding: "14px",
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              border: "none",
              borderRadius: "var(--radius)",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            Create my application →
          </button>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 10 }}>
            Free · No credit card needed
          </div>
        </div>

      </div>
    </div>
  );

  return null;
}