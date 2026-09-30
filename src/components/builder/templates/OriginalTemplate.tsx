import React from "react";
import {
  BuilderResumeData,
  ExperienceItem,
  EducationItem,
  SkillCategory,
  ProjectItem,
  CertificationItem,
  AchievementItem,
  LanguageItem,
} from "@/types/resume-builder";
import { Mail, Phone, MapPin, Globe, ExternalLink } from "lucide-react";
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

export default function OriginalTemplate({ data }: TemplateProps) {
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
    theme = {} as any,
  } = data;

  const displayedSkills = categorizeSkills(skills);

  const primaryColor = theme.primaryColor || "#0f172a";
  const accentColor = theme.accentColor || primaryColor;
  const headerStyle = theme.headerStyle || "centered";
  const sectionDividers = theme.sectionDividers || "bottom-border";
  const spacingDensity = theme.spacingDensity || theme.layoutDensity || "normal";

  const getFontFamily = () => {
    if (theme.fontFamily === "serif" || theme.fontFamily === "Merriweather" || theme.fontFamily === "Playfair Display") {
      return "'Playfair Display', 'Merriweather', Georgia, serif";
    }
    if (theme.fontFamily === "monospace") {
      return "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    }
    return "'Inter', 'Roboto', 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
  };

  const getDensity = () => {
    switch (spacingDensity) {
      case "compact":
        return { sectionGap: "14px", itemGap: "8px", textLeading: "1.35" };
      case "spacious":
        return { sectionGap: "24px", itemGap: "16px", textLeading: "1.65" };
      case "normal":
      default:
        return { sectionGap: "18px", itemGap: "12px", textLeading: "1.5" };
    }
  };

  const density = getDensity();

  // Render Heading with original section divider styling
  const renderSectionHeader = (title: string) => {
    if (sectionDividers === "pill-tags") {
      return (
        <div className="mb-2.5">
          <span
            className="inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider text-white shadow-xs"
            style={{ backgroundColor: primaryColor }}
          >
            {title}
          </span>
        </div>
      );
    }
    if (sectionDividers === "bold-uppercase") {
      return (
        <h2
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: primaryColor }}
        >
          {title}
        </h2>
      );
    }
    if (sectionDividers === "minimal-space") {
      return (
        <h2
          className="text-sm font-semibold tracking-tight mb-2"
          style={{ color: primaryColor }}
        >
          {title}
        </h2>
      );
    }
    // Default: bottom-border
    return (
      <div
        className="flex items-center gap-2 border-b pb-1 mb-2.5"
        style={{ borderColor: primaryColor }}
      >
        <h2
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: primaryColor }}
        >
          {title}
        </h2>
      </div>
    );
  };

  // Section renderers
  const renderSummary = () => {
    if (!summary || !summary.trim()) return null;
    return (
      <section style={{ marginBottom: density.sectionGap }}>
        {renderSectionHeader("Professional Summary")}
        <p className="text-slate-700 leading-relaxed text-[11px] text-justify">
          {summary}
        </p>
      </section>
    );
  };

  const renderSkills = () => {
    const validSkills = displayedSkills.filter((s) => s.items && s.items.trim());
    if (validSkills.length === 0) return null;
    return (
      <section style={{ marginBottom: density.sectionGap }}>
        {renderSectionHeader("Technical Skills")}
        <div className="space-y-1 text-[11px]">
          {validSkills.map((cat, i) => (
            <div key={cat.id || i} className="flex flex-wrap items-baseline gap-1.5">
              <span className="font-semibold text-slate-800 shrink-0">
                {cat.category}:
              </span>
              <span className="text-slate-700">{cat.items}</span>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderExperience = () => {
    if (!experience || experience.length === 0) return null;
    return (
      <section style={{ marginBottom: density.sectionGap }}>
        {renderSectionHeader("Work Experience")}
        <div className="space-y-3">
          {experience.map((exp: ExperienceItem) => (
            <div key={exp.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">
                    {exp.title}
                  </h3>
                  <div className="text-[11px] font-medium text-slate-600">
                    {exp.company}
                    {exp.location ? ` • ${exp.location}` : ""}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap shrink-0">
                  {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                </span>
              </div>
              {exp.bullets && exp.bullets.length > 0 && (
                <ul className="mt-1.5 space-y-0.5 list-disc list-outside ml-3.5 text-[10.5px] text-slate-700">
                  {exp.bullets.map((b, bi) => (
                    <li key={bi} className="leading-snug">
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderProjects = () => {
    if (!projects || projects.length === 0) return null;
    return (
      <section style={{ marginBottom: density.sectionGap }}>
        {renderSectionHeader("Key Projects")}
        <div className="space-y-2.5">
          {projects.map((proj: ProjectItem) => (
            <div key={proj.id}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-900 text-xs">
                    {proj.name}
                  </h3>
                  {proj.url && (
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-indigo-600 inline-flex items-center"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                {proj.tech && (
                  <span className="text-[10px] text-slate-500 font-medium text-right truncate max-w-[200px]">
                    {proj.tech}
                  </span>
                )}
              </div>
              {proj.bullets && proj.bullets.length > 0 && (
                <ul className="mt-1 space-y-0.5 list-disc list-outside ml-3.5 text-[10.5px] text-slate-700">
                  {proj.bullets.map((b, bi) => (
                    <li key={bi} className="leading-snug">
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderEducation = () => {
    if (!education || education.length === 0) return null;
    return (
      <section style={{ marginBottom: density.sectionGap }}>
        {renderSectionHeader("Education")}
        <div className="space-y-2">
          {education.map((edu: EducationItem) => (
            <div key={edu.id} className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">
                  {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                </h3>
                <div className="text-[11px] text-slate-600 font-medium">
                  {edu.school}
                  {edu.gpa ? ` • CGPA: ${edu.gpa}` : ""}
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap shrink-0">
                {edu.startDate} – {edu.endDate}
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderCertifications = () => {
    if (!certifications || certifications.length === 0) return null;
    return (
      <section style={{ marginBottom: density.sectionGap }}>
        {renderSectionHeader("Certifications & Licenses")}
        <div className="space-y-1.5 text-[11px]">
          {certifications.map((cert: CertificationItem) => (
            <div key={cert.id} className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                {cert.name} — <span className="font-normal text-slate-600">{cert.issuer}</span>
              </span>
              <span className="text-[10px] text-slate-500">{cert.date}</span>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderAchievements = () => {
    if (!achievements || achievements.length === 0) return null;
    return (
      <section style={{ marginBottom: density.sectionGap }}>
        {renderSectionHeader("Honors & Achievements")}
        <div className="space-y-1.5 text-[11px]">
          {achievements.map((ach: AchievementItem) => (
            <div key={ach.id}>
              <span className="font-semibold text-slate-800">• {ach.title}</span>
              {ach.description && (
                <span className="text-slate-600 ml-1.5">— {ach.description}</span>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderLanguages = () => {
    if (!languages || languages.length === 0) return null;
    return (
      <section style={{ marginBottom: density.sectionGap }}>
        {renderSectionHeader("Languages")}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          {languages.map((lang: LanguageItem) => (
            <span key={lang.id} className="text-slate-700">
              <strong className="text-slate-800">{lang.name}:</strong> {lang.proficiency}
            </span>
          ))}
        </div>
      </section>
    );
  };

  // Dynamic Section Map
  const sectionMap: Record<string, () => React.ReactNode> = {
    summary: renderSummary,
    skills: renderSkills,
    experience: renderExperience,
    projects: renderProjects,
    education: renderEducation,
    certifications: renderCertifications,
    achievements: renderAchievements,
    languages: renderLanguages,
  };

  // Section Order (Original or Default)
  const defaultOrder = ["summary", "skills", "experience", "projects", "education", "certifications", "achievements", "languages"];
  const finalOrder = Array.isArray(theme.sectionOrder) && theme.sectionOrder.length > 0
    ? [...theme.sectionOrder, ...defaultOrder.filter(s => !theme.sectionOrder.includes(s))]
    : defaultOrder;

  return (
    <div
      className="w-full text-slate-800 text-[11px]"
      style={{
        fontFamily: getFontFamily(),
        lineHeight: density.textLeading,
        color: "#1e293b",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      {headerStyle === "two-column" ? (
        <header className="flex items-start justify-between gap-4 pb-3 mb-4 border-b" style={{ borderColor: primaryColor }}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: primaryColor }}>
              {contact.name || "Your Name"}
            </h1>
            {contact.title && (
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {contact.title}
              </p>
            )}
          </div>
          <div className="text-right text-[10.5px] space-y-0.5 text-slate-600 shrink-0">
            {contact.email && <div>{contact.email}</div>}
            {contact.phone && <div>{contact.phone}</div>}
            {contact.location && !contact.location.toLowerCase().includes("remote") && <div>{contact.location}</div>}
            {contact.linkedin && <div>{contact.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</div>}
            {contact.github && <div>{contact.github.replace(/^https?:\/\/(www\.)?/, "")}</div>}
          </div>
        </header>
      ) : headerStyle === "left-aligned" ? (
        <header className="pb-3 mb-4 border-b" style={{ borderColor: primaryColor }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: primaryColor }}>
            {contact.name || "Your Name"}
          </h1>
          {contact.title && (
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              {contact.title}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-600 mt-2">
            {contact.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                {contact.email}
              </span>
            )}
            {contact.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {contact.phone}
              </span>
            )}
            {contact.location && !contact.location.toLowerCase().includes("remote") && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {contact.location}
              </span>
            )}
            {contact.linkedin && (
              <a
                href={contact.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600"
              >
                <LinkedinIcon className="text-slate-400" />
                <span>LinkedIn</span>
              </a>
            )}
            {contact.github && (
              <a
                href={contact.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600"
              >
                <GithubIcon className="text-slate-400" />
                <span>GitHub</span>
              </a>
            )}
          </div>
        </header>
      ) : (
        /* Centered Header (Default) */
        <header className="text-center pb-3 mb-4 border-b-2" style={{ borderColor: primaryColor }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: primaryColor }}>
            {contact.name || "Your Name"}
          </h1>
          {contact.title && (
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              {contact.title}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10.5px] text-slate-600 mt-2">
            {contact.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                {contact.email}
              </span>
            )}
            {contact.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {contact.phone}
              </span>
            )}
            {contact.location && !contact.location.toLowerCase().includes("remote") && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {contact.location}
              </span>
            )}
            {contact.linkedin && (
              <a
                href={contact.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600"
              >
                <LinkedinIcon className="text-slate-400" />
                <span>LinkedIn</span>
              </a>
            )}
            {contact.github && (
              <a
                href={contact.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600"
              >
                <GithubIcon className="text-slate-400" />
                <span>GitHub</span>
              </a>
            )}
          </div>
        </header>
      )}

      {/* ── Dynamic Sections in Extracted Original Order ────────────────────── */}
      <div>
        {finalOrder.map((sectionKey) => {
          const renderer = sectionMap[sectionKey];
          return renderer ? <React.Fragment key={sectionKey}>{renderer()}</React.Fragment> : null;
        })}
      </div>
    </div>
  );
}
