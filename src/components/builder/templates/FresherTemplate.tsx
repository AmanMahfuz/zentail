import React from "react";
import { BuilderResumeData } from "@/types/resume-builder";

interface TemplateProps {
  data: BuilderResumeData;
}

/**
 * 1. THE FRESHER / ENTRY-LEVEL ATS TEMPLATE
 * - Single-column cleanly parsed text layout (zero tables, zero multi-column grids).
 * - Priority: SUMMARY ➔ EDUCATION ➔ TECHNICAL SKILLS ➔ ACADEMIC PROJECTS.
 * - Standard 1-inch margins (25.4mm / 72px).
 * - Typography: 18–22pt Name, 12–14pt Bold Headings, 10–12pt Body (11pt optimal).
 * - Standard round bullet points (•), 1.15 line spacing, 8–10pt item gap, 12–16pt section gap.
 */
export default function FresherTemplate({ data }: TemplateProps) {
  const {
    contact,
    summary,
    education = [],
    skills = [],
    projects = [],
    certifications = [],
    languages = [],
    theme,
  } = data;

  const fontName = theme.fontFamily || "Arial";

  // Build contact line items
  const contactParts: string[] = [];
  if (contact.location) contactParts.push(contact.location);
  if (contact.phone) contactParts.push(contact.phone);
  if (contact.email) contactParts.push(contact.email);
  if (contact.linkedin) {
    const cleanLinkedin = contact.linkedin.replace(/^https?:\/\/(www\.)?/, "");
    contactParts.push(cleanLinkedin);
  }
  const webLink = contact.portfolio || contact.github || contact.website;
  if (webLink) {
    const cleanWeb = webLink.replace(/^https?:\/\/(www\.)?/, "");
    contactParts.push(cleanWeb);
  }

  return (
    <div
      className="text-slate-900 bg-white"
      style={{
        fontFamily: `${fontName}, Arial, sans-serif`,
        fontSize: "11pt",
        lineHeight: "1.15",
      }}
    >
      {/* HEADER: 18-22pt Bold Name at top + single-line contact */}
      <header className="text-center mb-[14pt]">
        <h1
          className="font-bold tracking-tight text-slate-950 uppercase"
          style={{ fontSize: "20pt", lineHeight: "1.1", marginBottom: "4pt" }}
        >
          {contact.name || "Candidate Name"}
        </h1>
        {contactParts.length > 0 && (
          <p
            className="text-slate-700"
            style={{ fontSize: "10pt", lineHeight: "1.3" }}
          >
            {contactParts.join(" | ")}
          </p>
        )}
      </header>

      {/* SUMMARY */}
      {summary && (
        <section className="mb-[14pt]">
          <h2
            className="font-bold text-slate-950 uppercase tracking-wide border-b border-slate-900 pb-[1pt] mb-[6pt]"
            style={{ fontSize: "12pt" }}
          >
            SUMMARY
          </h2>
          <p className="text-slate-800 text-justify" style={{ fontSize: "10.5pt" }}>
            {summary}
          </p>
        </section>
      )}

      {/* EDUCATION (Priority for Fresher) */}
      {education.length > 0 && (
        <section className="mb-[14pt]">
          <h2
            className="font-bold text-slate-950 uppercase tracking-wide border-b border-slate-900 pb-[1pt] mb-[6pt]"
            style={{ fontSize: "12pt" }}
          >
            EDUCATION
          </h2>
          <div className="space-y-[8pt]">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline font-bold text-slate-950">
                  <span style={{ fontSize: "11pt" }}>
                    {edu.degree}
                    {edu.field ? ` – ${edu.field}` : ""}
                  </span>
                  <span className="text-slate-700 font-normal" style={{ fontSize: "10pt" }}>
                    {edu.endDate ? (edu.endDate.toLowerCase().includes("expected") ? edu.endDate : `Graduated: ${edu.endDate}`) : ""}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-slate-700" style={{ fontSize: "10.5pt" }}>
                  <span>{edu.school}</span>
                  {edu.gpa && <span>GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TECHNICAL SKILLS */}
      {skills.length > 0 && (
        <section className="mb-[14pt]">
          <h2
            className="font-bold text-slate-950 uppercase tracking-wide border-b border-slate-900 pb-[1pt] mb-[6pt]"
            style={{ fontSize: "12pt" }}
          >
            TECHNICAL SKILLS
          </h2>
          <ul className="space-y-[3pt] text-slate-800" style={{ fontSize: "10.5pt" }}>
            {skills.map((skill) => (
              <li key={skill.id || skill.category} className="flex items-start">
                <span className="mr-2 select-none">•</span>
                <span>
                  <strong>{skill.category}:</strong> {skill.items}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ACADEMIC PROJECTS */}
      {projects.length > 0 && (
        <section className="mb-[14pt]">
          <h2
            className="font-bold text-slate-950 uppercase tracking-wide border-b border-slate-900 pb-[1pt] mb-[6pt]"
            style={{ fontSize: "12pt" }}
          >
            ACADEMIC PROJECTS
          </h2>
          <div className="space-y-[9pt]">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline font-bold text-slate-950 mb-[2pt]">
                  <span style={{ fontSize: "11pt" }}>
                    {proj.name}
                    {proj.tech ? (
                      <span className="font-normal text-slate-700"> | {proj.tech}</span>
                    ) : null}
                  </span>
                  {proj.url && (
                    <span className="text-slate-600 font-normal text-xs">
                      {proj.url.replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                  )}
                </div>
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="space-y-[2pt] text-slate-800" style={{ fontSize: "10.5pt" }}>
                    {proj.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2 select-none">•</span>
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

      {/* CERTIFICATIONS (Optional) */}
      {certifications.length > 0 && (
        <section className="mb-[14pt]">
          <h2
            className="font-bold text-slate-950 uppercase tracking-wide border-b border-slate-900 pb-[1pt] mb-[6pt]"
            style={{ fontSize: "12pt" }}
          >
            CERTIFICATIONS
          </h2>
          <ul className="space-y-[2pt] text-slate-800" style={{ fontSize: "10.5pt" }}>
            {certifications.map((c) => (
              <li key={c.id} className="flex items-start">
                <span className="mr-2 select-none">•</span>
                <span>
                  <strong>{c.name}</strong> – {c.issuer} ({c.date})
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* LANGUAGES (Optional) */}
      {languages.length > 0 && (
        <section className="mb-[14pt]">
          <h2
            className="font-bold text-slate-950 uppercase tracking-wide border-b border-slate-900 pb-[1pt] mb-[6pt]"
            style={{ fontSize: "12pt" }}
          >
            LANGUAGES
          </h2>
          <p className="text-slate-800" style={{ fontSize: "10.5pt" }}>
            {languages.map((l) => `${l.name} (${l.proficiency})`).join(" • ")}
          </p>
        </section>
      )}
    </div>
  );
}
