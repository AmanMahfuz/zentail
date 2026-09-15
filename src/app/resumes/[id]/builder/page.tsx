"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ResumeBuilderProps {
  params: { id: string };
}

export default function ResumeBuilderPage({ params }: ResumeBuilderProps) {
  const [version, setVersion] = useState<any>(null);
  const [changes, setChanges] = useState<any[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"review" | "edit">("review");
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/resume/version/${params.id}`)
      .then(r => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(data => {
        setVersion(data);
        setChanges(data.changes || []);
      })
      .catch(e => console.error(e));
  }, [params.id]);

  const handleSaveAsLatest = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/resume/save-as-latest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: params.id, changes })
      });
      if (res.ok) {
        // Redirect to dashboard or success page
        router.push("/dashboard");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!version) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      Loading resume...
    </div>
  );

  const content = version.content;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font-sans)", background: "var(--background)", color: "var(--foreground)" }}>

      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 1.5rem",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        background: "var(--background)",
        zIndex: 50
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            {version.version_label || `Resume V${version.version_number}`}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            Resume Builder
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Mode toggle */}
          <div style={{
            display: "flex",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            overflow: "hidden"
          }}>
            {["review", "edit"].map(m => (
              <button
                key={m}
                onClick={() => setMode(m as any)}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  background: mode === m ? "var(--primary)" : "transparent",
                  color: mode === m ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {m === "review" ? "Review changes" : "Edit manually"}
              </button>
            ))}
          </div>

          <button style={{
            padding: "6px 14px",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            background: "transparent",
            color: "var(--foreground)",
            fontSize: 13,
            cursor: "pointer"
          }}>
            Download PDF
          </button>

          <button
            onClick={handleSaveAsLatest}
            disabled={saving}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "var(--radius)",
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              fontSize: 13,
              fontWeight: 500,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? "Saving..." : "⭐ Save as latest resume"}
          </button>
        </div>
      </div>

      {/* MAIN: 3-PANEL LAYOUT (2 panels in this view) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        height: "calc(100vh - 65px)"
      }}>

        {/* LEFT: Resume Preview */}
        <div style={{
          overflowY: "auto",
          padding: "2rem",
          borderRight: "1px solid var(--border)",
          background: "var(--muted)",
          display: "flex",
          justifyContent: "center"
        }}>
          <div style={{
            background: "white",
            padding: "3rem",
            width: "100%",
            maxWidth: 800,
            borderRadius: 8,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
            fontFamily: "Georgia, serif",
            fontSize: 13,
            lineHeight: 1.6,
            color: "#111"
          }}>
            {/* Name */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                {content.personal?.fullName || "Your Name"}
              </div>
              <div style={{ fontSize: 13, color: "#666" }}>
                {[
                  content.personal?.email,
                  content.personal?.phone,
                  content.personal?.location,
                  content.personal?.linkedinUrl
                ].filter(Boolean).join(" · ")}
              </div>
            </div>

            {/* Summary */}
            {content.summary && (
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  borderBottom: "1px solid #ddd",
                  paddingBottom: 4,
                  marginBottom: 8
                }}>
                  Professional Summary
                </div>
                <div>{content.summary}</div>
              </div>
            )}

            {/* Skills */}
            {content.skills?.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: 1,
                  borderBottom: "1px solid #ddd", paddingBottom: 4, marginBottom: 8
                }}>
                  Skills
                </div>
                <div>
                  {content.skills.map((s: any) => s.name || s).join(" · ")}
                </div>
              </div>
            )}

            {/* Experience */}
            {content.experience?.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: 1,
                  borderBottom: "1px solid #ddd", paddingBottom: 4, marginBottom: 8
                }}>
                  Experience
                </div>
                {content.experience.map((exp: any, i: number) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontWeight: 700 }}>{exp.jobTitle}</span>
                      <span style={{ color: "#666", fontSize: 12 }}>
                        {exp.startDate} – {exp.isCurrent ? "Present" : (exp.endDate || "Present")}
                      </span>
                    </div>
                    <div style={{ color: "#444", fontWeight: 500, marginBottom: 4 }}>
                      {exp.company}{exp.location ? `, ${exp.location}` : ""}
                    </div>
                    {exp.bullets?.map((b: string, j: number) => (
                      <div key={j} style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <span>•</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {content.projects?.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: 1,
                  borderBottom: "1px solid #ddd", paddingBottom: 4, marginBottom: 8
                }}>
                  Projects
                </div>
                {content.projects.map((proj: any, i: number) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontWeight: 700 }}>{proj.title}</span>
                      {proj.startDate && (
                        <span style={{ color: "#666", fontSize: 12 }}>
                          {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""}
                        </span>
                      )}
                    </div>
                    {proj.techStack && proj.techStack.length > 0 && (
                      <div style={{ color: "#555", fontSize: 12, marginBottom: 4, fontStyle: "italic" }}>
                        Tech Stack: {proj.techStack.join(", ")}
                      </div>
                    )}
                    {proj.bullets?.map((b: string, j: number) => (
                      <div key={j} style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <span>•</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {content.education?.length > 0 && (
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: 1,
                  borderBottom: "1px solid #ddd", paddingBottom: 4, marginBottom: 8
                }}>
                  Education
                </div>
                {content.education.map((edu: any, i: number) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontWeight: 700 }}>{edu.institution}</span>
                      <span style={{ color: "#666", fontSize: 12 }}>
                        {edu.startYear} – {edu.isCurrent ? "Present" : (edu.endYear || "Present")}
                      </span>
                    </div>
                    <div>
                      {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                      {edu.grade ? `, ${edu.grade}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Review Changes OR Edit Controls */}
        <div style={{ overflowY: "auto", padding: "2rem", background: "var(--background)" }}>

          {mode === "review" ? (
            /* REVIEW CHANGES MODE */
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                What the AI changed
              </div>
              <div style={{ fontSize: 14, color: "var(--muted-foreground)", marginBottom: 24 }}>
                Review each change. Everything is editable on the left.
              </div>

              {changes?.length > 0 ? changes.map((change: any, i: number) => (
                <div key={i} style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "16px",
                  marginBottom: 16,
                  boxShadow: "var(--shadow-sm)"
                }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <span style={{
                      fontSize: 11,
                      padding: "4px 10px",
                      background: "var(--primary)",
                      color: "var(--primary-foreground)",
                      borderRadius: 99,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>
                      {change.section}
                    </span>
                    <span style={{
                      fontSize: 11,
                      padding: "4px 10px",
                      background: "var(--muted)",
                      color: "var(--muted-foreground)",
                      borderRadius: 99,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>
                      {change.type}
                    </span>
                  </div>

                  {change.before && (
                    <div style={{ fontSize: 13, color: "#dc2626", marginBottom: 8, background: "#fef2f2", padding: "8px 12px", borderRadius: 8 }}>
                      <span style={{ fontWeight: 600, marginRight: 4 }}>Before:</span>
                      "{change.before}"
                    </div>
                  )}
                  {change.after && (
                    <div style={{ fontSize: 13, color: "#16a34a", marginBottom: 12, background: "#f0fdf4", padding: "8px 12px", borderRadius: 8 }}>
                      <span style={{ fontWeight: 600, marginRight: 4 }}>After:</span>
                      "{change.after}"
                    </div>
                  )}

                  <div style={{ fontSize: 13, color: "var(--muted-foreground)", display: "flex", gap: 6 }}>
                    <span>💡</span>
                    <span>{change.reason}</span>
                  </div>
                </div>
              )) : (
                <div style={{
                  padding: "2rem",
                  textAlign: "center",
                  border: "1px dashed var(--border)",
                  borderRadius: 12,
                  color: "var(--muted-foreground)"
                }}>
                  No changes were recorded for this version.
                </div>
              )}

              {/* Save as latest CTA */}
              <div style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "24px",
                marginTop: 32,
                textAlign: "center",
                boxShadow: "var(--shadow-sm)"
              }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                  Happy with this resume?
                </div>
                <div style={{ fontSize: 14, color: "var(--muted-foreground)", marginBottom: 20, lineHeight: 1.5 }}>
                  Save it as your latest resume — it will be your starting point
                  for future job applications.
                </div>
                <button
                  onClick={handleSaveAsLatest}
                  disabled={saving}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    border: "none",
                    borderRadius: "var(--radius)",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                    transition: "all 0.2s"
                  }}
                >
                  ⭐ {saving ? "Saving..." : "Save as latest resume"}
                </button>
              </div>
            </div>

          ) : (
            /* EDIT MODE */
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                Edit your resume
              </div>
              <div style={{ fontSize: 14, color: "var(--muted-foreground)", marginBottom: 24 }}>
                All changes are reflected in the preview instantly.
              </div>

              {/* Section edit controls */}
              {["summary", "skills", "experience", "projects", "education"].map(section => (
                <div key={section} style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: "hidden",
                  background: "var(--card)"
                }}>
                  <button
                    onClick={() => setEditingSection(
                      editingSection === section ? null : section
                    )}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px 20px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 500,
                      textTransform: "capitalize",
                      color: "var(--foreground)"
                    }}
                  >
                    {section}
                    <span style={{ fontSize: 12, color: "var(--muted-foreground)", transition: "transform 0.2s", transform: editingSection === section ? "rotate(180deg)" : "rotate(0deg)" }}>
                      ▼
                    </span>
                  </button>

                  {editingSection === section && (
                    <div style={{ padding: "0 20px 20px" }}>
                      {/* Placeholder edit area */}
                      <div style={{ fontSize: 13, color: "var(--muted-foreground)", background: "var(--muted)", padding: "16px", borderRadius: 8 }}>
                        Click items in the preview to edit them directly, or use
                        AI to improve this section. (Manual editing coming soon).
                      </div>
                      <button style={{
                        marginTop: 12,
                        padding: "8px 16px",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        background: "transparent",
                        color: "var(--foreground)",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s",
                        ":hover": {
                          background: "var(--muted)"
                        }
                      } as any}>
                        ✨ AI improve this section
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
