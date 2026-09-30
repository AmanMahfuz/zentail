import React from "react";
import { BuilderResumeData } from "@/types/resume-builder";
import { Mail, Phone, MapPin, Globe } from "lucide-react";
import { categorizeSkills } from "@/lib/resume/skills-categorizer";

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.64 1.64 0 0 0-1.64 1.64c0 .91.73 1.64 1.64 1.64s1.64-.73 1.64-1.64A1.64 1.64 0 0 0 7.83 6.2Z" />
    </svg>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" {...props}>
      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

interface TemplateProps {
  data: BuilderResumeData;
}

export default function BasicTemplate({ data }: TemplateProps) {
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

  const isAts = theme.atsModeActive;
  const primaryColor = isAts ? "#111827" : theme.primaryColor || "#0f172a";

  const getFontFamily = () => {
    if (isAts) return "Arial, Helvetica, sans-serif";
    switch (theme.fontFamily) {
      case "Playfair Display":
      case "Merriweather":
        return "'Playfair Display', Georgia, serif";
      case "Roboto":
        return "'Roboto', sans-serif";
      case "Outfit":
        return "'Outfit', sans-serif";
      case "Inter":
      default:
        return "'Inter', sans-serif";
    }
  };

  const getDensity = () => {
    switch (theme.layoutDensity) {
      case "compact":
        return { sectionGap: "14px", itemGap: "8px", textLeading: "1.4" };
      case "spacious":
        return { sectionGap: "26px", itemGap: "16px", textLeading: "1.65" };
      case "normal":
      default:
        return { sectionGap: "20px", itemGap: "12px", textLeading: "1.5" };
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
  const displayedSkills = categorizeSkills(skills);

  return (
    <div
      className={`w-full text-slate-800 ${getFontSizeClass()}`}
      style={{
        fontFamily: getFontFamily(),
        lineHeight: density.textLeading,
        color: "#1f2937",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="text-center mb-5 pb-3 border-b-2" style={{ borderColor: primaryColor }}>
        <h1
          className="text-2xl font-bold tracking-tight mb-1"
          style={{ color: primaryColor }}
        >
          {contact.name || "Your Name"}
        </h1>
        {contact.title && (
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            {contact.title}
          </p>
        )}
        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[10px] text-slate-600">
          {contact.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              {contact.email}
            </span>
          )}
          {contact.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              {contact.phone}
            </span>
          )}
          {contact.location && !contact.location.toLowerCase().includes("remote") && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {contact.location}
            </span>
          )}
          {contact.linkedin && (
            <span className="flex items-center gap-1">
              <LinkedinIcon className="text-slate-400" />
              {contact.linkedin.replace(/^https?:\/\/(www\.)?/, "")}
            </span>
          )}
          {contact.portfolio && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-400" />
              {contact.portfolio.replace(/^https?:\/\/(www\.)?/, "")}
            </span>
          )}
          {contact.github && (
            <span className="flex items-center gap-1">
              <GithubIcon className="text-slate-400" />
              {contact.github.replace(/^https?:\/\/(www\.)?/, "")}
            </span>
          )}
        </div>
      </header>

      {/* ── Summary ─────────────────────────────────────────────── */}
      {summary && (
        <section style={{ marginBottom: density.sectionGap }}>
          <h2
            className="text-[11px] font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b"
            style={{ color: primaryColor, borderColor: isAts ? "#000" : `${primaryColor}40` }}
          >
            Professional Summary
          </h2>
          <p className="text-slate-700 text-justify leading-relaxed">{summary}</p>
        </section>
      )}

      {/* ── Experience ─────────────────────────────────────────── */}
      {experience.length > 0 && (
        <section style={{ marginBottom: density.sectionGap }}>
          <h2
            className="text-[11px] font-bold uppercase tracking-wider pb-0.5 mb-2 border-b"
            style={{ color: primaryColor, borderColor: isAts ? "#000" : `${primaryColor}40` }}
          >
            Work Experience
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: density.itemGap }}>
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-[11.5px] text-slate-900">{exp.title}</span>
                    {exp.company && <span className="font-semibold text-slate-700"> — {exp.company}</span>}
                    {exp.location && <span className="text-[10px] text-slate-500"> ({exp.location})</span>}
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 shrink-0">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                  </span>
                </div>
                {(!exp.bullets || exp.bullets.filter(Boolean).length === 0) && exp.description && (
                  <p className="text-slate-600 text-[10.5px] mt-0.5">{exp.description}</p>
                )}
                {exp.bullets && exp.bullets.filter(Boolean).length > 0 && (
                  <ul className="list-disc ml-4 mt-1 space-y-0.5 text-slate-700 text-[10.5px]">
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

      {/* ── Education ──────────────────────────────────────────── */}
      {education.length > 0 && (
        <section style={{ marginBottom: density.sectionGap }}>
          <h2
            className="text-[11px] font-bold uppercase tracking-wider pb-0.5 mb-2 border-b"
            style={{ color: primaryColor, borderColor: isAts ? "#000" : `${primaryColor}40` }}
          >
            Education
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: density.itemGap }}>
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-[11.5px] text-slate-900">{edu.school}</span>
                  <div className="text-slate-700 text-[10.5px]">
                    {edu.degree}
                    {edu.field ? `, ${edu.field}` : ""}
                    {edu.gpa ? ` • GPA: ${edu.gpa}` : ""}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-600 shrink-0">
                  {edu.startDate} – {edu.endDate}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Skills ─────────────────────────────────────────────── */}
      {displayedSkills.some((s) => s.items.trim()) && (
        <section style={{ marginBottom: density.sectionGap }}>
          <h2
            className="text-[11px] font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b"
            style={{ color: primaryColor, borderColor: isAts ? "#000" : `${primaryColor}40` }}
          >
            Technical & Professional Skills
          </h2>
          <div className="space-y-1">
            {displayedSkills.filter((s) => s.items.trim()).map((s, idx) => (
              <div key={idx} className="text-[10.5px]">
                <span className="font-semibold text-slate-900">{s.category}: </span>
                <span className="text-slate-700">{s.items}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Projects ───────────────────────────────────────────── */}
      {projects.length > 0 && (
        <section style={{ marginBottom: density.sectionGap }}>
          <h2
            className="text-[11px] font-bold uppercase tracking-wider pb-0.5 mb-2 border-b"
            style={{ color: primaryColor, borderColor: isAts ? "#000" : `${primaryColor}40` }}
          >
            Key Projects
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: density.itemGap }}>
            {projects.map((p) => (
              <div key={p.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-[11.5px] text-slate-900">{p.name}</span>
                    {p.tech && <span className="text-[10px] text-slate-500 italic"> — {p.tech}</span>}
                  </div>
                  {p.url && (
                    <span className="text-[10px] text-blue-600 font-medium">
                      {p.url.replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                  )}
                </div>
                {p.bullets && p.bullets.filter(Boolean).length > 0 && (
                  <ul className="list-disc ml-4 mt-0.5 space-y-0.5 text-slate-700 text-[10.5px]">
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

      {/* ── Certifications & Languages ─────────────────────────── */}
      {(certifications.length > 0 || languages.length > 0) && (
        <section style={{ marginBottom: density.sectionGap }}>
          <div className="grid grid-cols-2 gap-4">
            {certifications.length > 0 && (
              <div>
                <h2
                  className="text-[11px] font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b"
                  style={{ color: primaryColor, borderColor: isAts ? "#000" : `${primaryColor}40` }}
                >
                  Certifications
                </h2>
                <ul className="space-y-1 text-[10px]">
                  {certifications.map((c) => (
                    <li key={c.id}>
                      <span className="font-semibold text-slate-900">{c.name}</span>
                      <span className="text-slate-600"> — {c.issuer} ({c.date})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {languages.length > 0 && (
              <div>
                <h2
                  className="text-[11px] font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b"
                  style={{ color: primaryColor, borderColor: isAts ? "#000" : `${primaryColor}40` }}
                >
                  Languages
                </h2>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {languages.map((l) => (
                    <span key={l.id} className="text-slate-700">
                      <strong className="text-slate-900">{l.name}</strong> ({l.proficiency})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Achievements / Awards ──────────────────────────────── */}
      {achievements.length > 0 && (
        <section>
          <h2
            className="text-[11px] font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b"
            style={{ color: primaryColor, borderColor: isAts ? "#000" : `${primaryColor}40` }}
          >
            Honors & Achievements
          </h2>
          <ul className="list-disc ml-4 space-y-0.5 text-[10.5px] text-slate-700">
            {achievements.map((a) => (
              <li key={a.id}>
                <span className="font-semibold text-slate-900">{a.title}: </span>
                {a.description}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
