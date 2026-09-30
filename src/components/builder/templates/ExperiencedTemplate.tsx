import React from "react";
import { BuilderResumeData } from "@/types/resume-builder";
import { categorizeSkills } from "@/lib/resume/skills-categorizer";

interface TemplateProps {
  data: BuilderResumeData;
}

/**
 * 2. THE EXPERIENCED / FULL-STACK DEVELOPER ATS TEMPLATE
 * - Single-column layout engineered for high content density.
 * - Matches the exact typography, header balance, and technical proficiency alignment from the reference builder.
 */
export default function ExperiencedTemplate({ data }: TemplateProps) {
  const {
    contact,
    summary,
    skills = [],
    experience = [],
    projects = [],
    education = [],
    certifications = [],
    theme,
  } = data;

  const fontName = theme.fontFamily || "Inter";
  const displayedSkills = categorizeSkills(skills);

  // Build contact items with icons/delimiters
  const contactParts: Array<{ text: string; icon?: string }> = [];
  if (contact.email) contactParts.push({ text: contact.email, icon: "✉" });
  if (contact.phone) contactParts.push({ text: contact.phone, icon: "📞" });
  if (contact.location && !contact.location.toLowerCase().includes("remote")) {
    contactParts.push({ text: contact.location, icon: "📍" });
  }
  
  const codeLink = contact.github || contact.portfolio || contact.linkedin || contact.website;
  if (codeLink) {
    const clean = codeLink.replace(/^https?:\/\/(www\.)?/, "");
    contactParts.push({ text: clean, icon: "🔗" });
  }

  return (
    <div
      className="text-slate-900 bg-white"
      style={{
        fontFamily: `${fontName}, Arial, sans-serif`,
        fontSize: "10pt",
        lineHeight: "1.15",
      }}
    >
      {/* HEADER: Name on left, uppercase role on right */}
      <header className="mb-[12pt] border-b border-slate-200 pb-[8pt]">
        <div className="flex items-baseline justify-between gap-4 mb-[4pt]">
          <h1
            className="font-bold tracking-tight text-slate-950 uppercase"
            style={{ fontSize: "20pt", lineHeight: "1.05" }}
          >
            {contact.name || "AMAN MAHFUZ KZ"}
          </h1>
          {contact.title && (
            <span
              className="font-bold tracking-wider uppercase text-blue-700 shrink-0"
              style={{ fontSize: "10pt" }}
            >
              {contact.title}
            </span>
          )}
        </div>

        {contactParts.length > 0 && (
          <div
            className="text-slate-600 flex flex-wrap items-center gap-x-2.5 gap-y-1"
            style={{ fontSize: "9pt", lineHeight: "1.2" }}
          >
            {contactParts.map((part, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-400 select-none">•</span>}
                <span className="inline-flex items-center gap-1">
                  {part.icon && <span className="text-[10px] opacity-80">{part.icon}</span>}
                  <span>{part.text}</span>
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </header>

      {/* PROFESSIONAL SUMMARY */}
      {summary && (
        <section className="mb-[12pt]">
          <div className="border-b border-slate-300 pb-[1.5pt] mb-[4pt]">
            <h2
              className="font-bold text-slate-950 uppercase tracking-wider"
              style={{ fontSize: "10.5pt" }}
            >
              PROFESSIONAL SUMMARY
            </h2>
          </div>
          <p
            className="text-slate-800 text-justify"
            style={{ fontSize: "9.5pt", lineHeight: "1.35" }}
          >
            {summary}
          </p>
        </section>
      )}

      {/* TECHNICAL PROFICIENCIES */}
      {displayedSkills.length > 0 && (
        <section className="mb-[12pt]">
          <div className="border-b border-slate-300 pb-[1.5pt] mb-[5pt]">
            <h2
              className="font-bold text-slate-950 uppercase tracking-wider"
              style={{ fontSize: "10.5pt" }}
            >
              TECHNICAL PROFICIENCIES
            </h2>
          </div>
          <div className="space-y-[3pt]" style={{ fontSize: "9.5pt", lineHeight: "1.25" }}>
            {displayedSkills.map((skill) => (
              <div key={skill.id || skill.category} className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-bold text-slate-900 shrink-0">
                  {skill.category}:
                </span>
                <span className="col-span-9 text-slate-700">
                  {skill.items}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PROFESSIONAL EXPERIENCE */}
      {experience.length > 0 && (
        <section className="mb-[12pt]">
          <div className="border-b border-slate-300 pb-[1.5pt] mb-[5pt]">
            <h2
              className="font-bold text-slate-950 uppercase tracking-wider"
              style={{ fontSize: "10.5pt" }}
            >
              PROFESSIONAL EXPERIENCE
            </h2>
          </div>
          <div className="space-y-[8pt]">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline font-bold text-slate-950">
                  <span style={{ fontSize: "10pt" }}>
                    {exp.title}{" "}
                    <span className="font-normal text-slate-600">
                      | {exp.company}
                      {exp.location ? ` (${exp.location})` : ""}
                    </span>
                  </span>
                  <span className="text-slate-600 font-normal shrink-0" style={{ fontSize: "9pt" }}>
                    {exp.startDate} — {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="space-y-[2pt] text-slate-800 mt-[2pt]" style={{ fontSize: "9.5pt", lineHeight: "1.3" }}>
                    {exp.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2 select-none text-slate-400">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PROJECTS */}
      {projects.length > 0 && (
        <section className="mb-[12pt]">
          <div className="border-b border-slate-300 pb-[1.5pt] mb-[5pt]">
            <h2
              className="font-bold text-slate-950 uppercase tracking-wider"
              style={{ fontSize: "10.5pt" }}
            >
              PROJECTS & ARCHITECTURES
            </h2>
          </div>
          <div className="space-y-[7pt]">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline font-bold text-slate-950">
                  <span style={{ fontSize: "10pt" }}>
                    {proj.name}
                    {proj.tech ? (
                      <span className="font-normal text-slate-600"> | {proj.tech}</span>
                    ) : null}
                  </span>
                  {proj.url && (
                    <span className="text-slate-500 font-normal text-xs shrink-0">
                      {proj.url.replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                  )}
                </div>
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="space-y-[1.5pt] text-slate-800 mt-[2pt]" style={{ fontSize: "9.5pt", lineHeight: "1.3" }}>
                    {proj.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2 select-none text-slate-400">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* EDUCATION */}
      {education.length > 0 && (
        <section className="mb-[10pt]">
          <div className="border-b border-slate-300 pb-[1.5pt] mb-[4pt]">
            <h2
              className="font-bold text-slate-950 uppercase tracking-wider"
              style={{ fontSize: "10.5pt" }}
            >
              EDUCATION
            </h2>
          </div>
          <div className="space-y-[4pt]">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <span className="text-slate-900" style={{ fontSize: "9.5pt" }}>
                  <strong>{edu.degree}</strong>
                  {edu.field ? ` – ${edu.field}` : ""}, {edu.school}
                  {edu.gpa ? ` (GPA: ${edu.gpa})` : ""}
                </span>
                <span className="text-slate-600 shrink-0" style={{ fontSize: "9pt" }}>
                  {edu.endDate}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CERTIFICATIONS */}
      {certifications.length > 0 && (
        <section className="mb-[10pt]">
          <div className="border-b border-slate-300 pb-[1.5pt] mb-[4pt]">
            <h2
              className="font-bold text-slate-950 uppercase tracking-wider"
              style={{ fontSize: "10.5pt" }}
            >
              CERTIFICATIONS
            </h2>
          </div>
          <ul className="space-y-[1.5pt] text-slate-800" style={{ fontSize: "9.5pt" }}>
            {certifications.map((c) => (
              <li key={c.id} className="flex items-start">
                <span className="mr-2 select-none text-slate-400">•</span>
                <span>
                  <strong>{c.name}</strong> – {c.issuer} {c.date ? `(${c.date})` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
