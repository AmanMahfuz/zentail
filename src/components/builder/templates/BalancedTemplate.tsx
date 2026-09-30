import React from "react";
import { BuilderResumeData } from "@/types/resume-builder";
import { Mail, Phone, MapPin, Globe } from "lucide-react";
import { categorizeSkills } from "@/lib/resume/skills-categorizer";

interface TemplateProps {
  data: BuilderResumeData;
}

export default function BalancedTemplate({ data }: TemplateProps) {
  const {
    contact,
    summary,
    experience = [],
    education = [],
    skills = [],
    projects = [],
    certifications = [],
    languages = [],
    achievements = [],
    theme,
  } = data;

  const displayedSkills = categorizeSkills(skills);
  const isAts = theme.atsModeActive;
  const primaryColor = isAts ? "#111827" : theme.primaryColor || "#1e1b4b";

  const getFontFamily = () => {
    if (isAts) return "Arial, Helvetica, sans-serif";
    switch (theme.fontFamily) {
      case "Inter":
        return "'Inter', sans-serif";
      case "Roboto":
        return "'Roboto', sans-serif";
      case "Outfit":
        return "'Outfit', sans-serif";
      case "Playfair Display":
      case "Merriweather":
      default:
        return "'Playfair Display', Georgia, serif";
    }
  };

  const getDensity = () => {
    switch (theme.layoutDensity) {
      case "compact":
        return { sectionGap: "16px", itemGap: "8px", textLeading: "1.4" };
      case "spacious":
        return { sectionGap: "28px", itemGap: "16px", textLeading: "1.65" };
      case "normal":
      default:
        return { sectionGap: "22px", itemGap: "12px", textLeading: "1.5" };
    }
  };

  const getFontSizeClass = () => {
    switch (theme.fontSize) {
      case "compact":
        return "text-[10.5px]";
      case "large":
        return "text-[12px]";
      case "normal":
      default:
        return "text-[11px]";
    }
  };

  const density = getDensity();

  return (
    <div
      className={`w-full text-slate-800 ${getFontSizeClass()}`}
      style={{
        fontFamily: getFontFamily(),
        lineHeight: density.textLeading,
        color: "#1e293b",
      }}
    >
      {/* ── Executive Header ─────────────────────────────────────── */}
      <header className="text-center mb-6">
        <h1
          className="text-2xl font-serif font-bold tracking-normal uppercase mb-1"
          style={{ color: primaryColor, letterSpacing: "0.06em" }}
        >
          {contact.name || "Your Name"}
        </h1>
        {contact.title && (
          <p className="text-xs font-medium tracking-widest uppercase text-slate-600 mb-2">
            {contact.title}
          </p>
        )}
        <div className="flex flex-wrap justify-center items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-600 border-t border-b border-slate-300 py-1.5 mt-1">
          {contact.location && !contact.location.toLowerCase().includes("remote") && (
            <span>{contact.location}</span>
          )}
          {contact.phone && (
            <>
              <span className="text-slate-300">•</span>
              <span>{contact.phone}</span>
            </>
          )}
          {contact.email && (
            <>
              <span className="text-slate-300">•</span>
              <span>{contact.email}</span>
            </>
          )}
          {contact.linkedin && (
            <>
              <span className="text-slate-300">•</span>
              <span>{contact.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
            </>
          )}
          {contact.portfolio && (
            <>
              <span className="text-slate-300">•</span>
              <span>{contact.portfolio.replace(/^https?:\/\/(www\.)?/, "")}</span>
            </>
          )}
        </div>
      </header>

      {/* ── Executive Summary ───────────────────────────────────── */}
      {summary && (
        <section style={{ marginBottom: density.sectionGap }}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px bg-slate-300 flex-1" />
            <h2
              className="text-[11px] font-bold uppercase tracking-widest text-center"
              style={{ color: primaryColor }}
            >
              Executive Summary
            </h2>
            <div className="h-px bg-slate-300 flex-1" />
          </div>
          <p className="text-slate-700 text-justify italic leading-relaxed px-2">{summary}</p>
        </section>
      )}

      {/* ── Experience ─────────────────────────────────────────── */}
      {experience.length > 0 && (
        <section style={{ marginBottom: density.sectionGap }}>
          <div className="flex items-center justify-center gap-3 mb-2.5">
            <div className="h-px bg-slate-300 flex-1" />
            <h2
              className="text-[11px] font-bold uppercase tracking-widest text-center"
              style={{ color: primaryColor }}
            >
              Professional Experience
            </h2>
            <div className="h-px bg-slate-300 flex-1" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: density.itemGap }}>
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-[12px] text-slate-900">{exp.company}</span>
                    {exp.location && <span className="text-[10px] text-slate-500 font-normal">, {exp.location}</span>}
                  </div>
                  <span className="text-[10.5px] italic text-slate-600">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-700 italic mb-0.5">
                  {exp.title}
                </div>
                {exp.bullets && exp.bullets.filter(Boolean).length > 0 && (
                  <ul className="list-disc ml-5 mt-1 space-y-0.5 text-slate-700 text-[10.5px]">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Key Projects ───────────────────────────────────────── */}
      {projects.length > 0 && (
        <section style={{ marginBottom: density.sectionGap }}>
          <div className="flex items-center justify-center gap-3 mb-2.5">
            <div className="h-px bg-slate-300 flex-1" />
            <h2
              className="text-[11px] font-bold uppercase tracking-widest text-center"
              style={{ color: primaryColor }}
            >
              Selected Engagements & Projects
            </h2>
            <div className="h-px bg-slate-300 flex-1" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: density.itemGap }}>
            {projects.map((p) => (
              <div key={p.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[11.5px] text-slate-900">{p.name}</span>
                  {p.url && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {p.url.replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                  )}
                </div>
                {p.tech && <p className="text-[10px] text-slate-500 italic">Core Stack: {p.tech}</p>}
                {p.bullets && p.bullets.filter(Boolean).length > 0 && (
                  <ul className="list-disc ml-5 mt-0.5 space-y-0.5 text-slate-700 text-[10.5px]">
                    {p.bullets.filter(Boolean).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Education & Credentials ────────────────────────────── */}
      {education.length > 0 && (
        <section style={{ marginBottom: density.sectionGap }}>
          <div className="flex items-center justify-center gap-3 mb-2.5">
            <div className="h-px bg-slate-300 flex-1" />
            <h2
              className="text-[11px] font-bold uppercase tracking-widest text-center"
              style={{ color: primaryColor }}
            >
              Education & Academic Honors
            </h2>
            <div className="h-px bg-slate-300 flex-1" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: density.itemGap }}>
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-[11.5px] text-slate-900">{edu.school}</span>
                  <div className="text-slate-700 text-[10.5px]">
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                    {edu.gpa ? ` • GPA: ${edu.gpa}` : ""}
                  </div>
                </div>
                <span className="text-[10px] italic text-slate-600">
                  {edu.startDate} – {edu.endDate}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Skills & Expertise ─────────────────────────────────── */}
      {displayedSkills.some((s) => s.items.trim()) && (
        <section style={{ marginBottom: density.sectionGap }}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px bg-slate-300 flex-1" />
            <h2
              className="text-[11px] font-bold uppercase tracking-widest text-center"
              style={{ color: primaryColor }}
            >
              Areas of Expertise
            </h2>
            <div className="h-px bg-slate-300 flex-1" />
          </div>
          <div className="space-y-1">
            {displayedSkills.filter((s) => s.items.trim()).map((s, idx) => (
              <div key={idx} className="text-[10.5px]">
                <strong className="text-slate-900">{s.category}: </strong>
                <span className="text-slate-700">{s.items}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Certifications & Languages ─────────────────────────── */}
      {(certifications.length > 0 || languages.length > 0) && (
        <section>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px bg-slate-300 flex-1" />
            <h2
              className="text-[11px] font-bold uppercase tracking-widest text-center"
              style={{ color: primaryColor }}
            >
              Credentials & Languages
            </h2>
            <div className="h-px bg-slate-300 flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-[10px]">
            {certifications.length > 0 && (
              <div>
                <span className="font-semibold text-slate-800 uppercase block mb-1">Certifications</span>
                <ul className="space-y-0.5 text-slate-700">
                  {certifications.map((c) => (
                    <li key={c.id}>• {c.name} — {c.issuer} ({c.date})</li>
                  ))}
                </ul>
              </div>
            )}
            {languages.length > 0 && (
              <div>
                <span className="font-semibold text-slate-800 uppercase block mb-1">Languages</span>
                <div className="flex flex-wrap gap-2 text-slate-700">
                  {languages.map((l) => (
                    <span key={l.id}>• {l.name} ({l.proficiency})</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Achievements & Honors ──────────────────────────────── */}
      {achievements.length > 0 && (
        <section className="mt-3">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px bg-slate-300 flex-1" />
            <h2
              className="text-[11px] font-bold uppercase tracking-widest text-center"
              style={{ color: primaryColor }}
            >
              Honors & Achievements
            </h2>
            <div className="h-px bg-slate-300 flex-1" />
          </div>
          <ul className="space-y-1 text-[10px] text-slate-700 ml-4 list-disc">
            {achievements.map((a) => (
              <li key={a.id}>
                <strong className="text-slate-900">{a.title}: </strong>
                <span>{a.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
