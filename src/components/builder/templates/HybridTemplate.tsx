import React from "react";
import { BuilderResumeData } from "@/types/resume-builder";

interface TemplateProps {
  data: BuilderResumeData;
}

/**
 * 3. THE CAREER PIVOT / HYBRID RESUME (TECH + DESIGN)
 * - Single-column functional/chronological hybrid layout.
 * - Priority: SUMMARY ➔ CORE COMPETENCIES ➔ RELEVANT EXPERIENCE & PROJECTS ➔ EDUCATION & CERTIFICATIONS.
 * - Standard 0.75-inch margins (19.05mm / 54px).
 * - Typography: 18–22pt Name, 12–14pt Bold Headings, 10.5–11pt Body.
 * - Leading: 1.05, 8–10pt item gap, 12–16pt section gap, standard round bullets (•).
 */
export default function HybridTemplate({ data }: TemplateProps) {
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

  // Build contact line items
  const contactParts: string[] = [];
  if (contact.location) contactParts.push(contact.location);
  if (contact.phone) contactParts.push(contact.phone);
  if (contact.email) contactParts.push(contact.email);
  if (contact.linkedin) {
    const cleanLinkedin = contact.linkedin.replace(/^https?:\/\/(www\.)?/, "");
    contactParts.push(cleanLinkedin);
  }
  const portfolioLink = contact.portfolio || contact.website || contact.github;
  if (portfolioLink) {
    const cleanPort = portfolioLink.replace(/^https?:\/\/(www\.)?/, "");
    contactParts.push(cleanPort);
  }

  return (
    <div
      className="text-slate-900 bg-white"
      style={{
        fontFamily: `${fontName}, Arial, sans-serif`,
        fontSize: "11pt",
        lineHeight: "1.05",
      }}
    >
      {/* HEADER: 18-22pt Bold Name at top + single-line contact */}
      <header className="text-center mb-[12pt]">
        <h1
          className="font-bold tracking-tight text-slate-950 uppercase"
          style={{ fontSize: "20pt", lineHeight: "1.1", marginBottom: "3.5pt" }}
        >
          {contact.name || "Candidate Name"}
        </h1>
        {contactParts.length > 0 && (
          <p
            className="text-slate-700"
            style={{ fontSize: "10pt", lineHeight: "1.25" }}
          >
            {contactParts.join(" | ")}
          </p>
        )}
      </header>

      {/* SUMMARY */}
      {summary && (
        <section className="mb-[14pt]">
          <h2
            className="font-bold text-slate-950 uppercase tracking-wide border-b border-slate-900 pb-[1pt] mb-[5pt]"
            style={{ fontSize: "12pt" }}
          >
            SUMMARY
          </h2>
          <p
            className="text-slate-800 text-justify"
            style={{ fontSize: "10.5pt", lineHeight: "1.2" }}
          >
            {summary}
          </p>
        </section>
      )}

      {/* CORE COMPETENCIES */}
      {skills.length > 0 && (
        <section className="mb-[14pt]">
          <h2
            className="font-bold text-slate-950 uppercase tracking-wide border-b border-slate-900 pb-[1pt] mb-[5pt]"
            style={{ fontSize: "12pt" }}
          >
            CORE COMPETENCIES
          </h2>
          <ul className="space-y-[3pt] text-slate-800" style={{ fontSize: "10.5pt", lineHeight: "1.2" }}>
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

      {/* RELEVANT EXPERIENCE & PROJECTS */}
      {(experience.length > 0 || projects.length > 0) && (
        <section className="mb-[14pt]">
          <h2
            className="font-bold text-slate-950 uppercase tracking-wide border-b border-slate-900 pb-[1pt] mb-[5pt]"
            style={{ fontSize: "12pt" }}
          >
            RELEVANT EXPERIENCE & PROJECTS
          </h2>

          <div className="space-y-[9pt]">
            {/* Render projects that act as key builds */}
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline font-bold text-slate-950">
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
                  <ul className="space-y-[2pt] text-slate-800 mt-[2pt]" style={{ fontSize: "10.5pt", lineHeight: "1.2" }}>
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

            {/* Render commercial experience */}
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline font-bold text-slate-950">
                  <span style={{ fontSize: "11pt" }}>
                    {exp.title}{" "}
                    <span className="font-normal text-slate-700">
                      | {exp.company}
                      {exp.location ? ` | ${exp.location}` : ""}
                    </span>
                  </span>
                  <span className="text-slate-700 font-normal" style={{ fontSize: "10pt" }}>
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="space-y-[2pt] text-slate-800 mt-[2pt]" style={{ fontSize: "10.5pt", lineHeight: "1.2" }}>
                    {exp.bullets.map((b, idx) => (
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

      {/* EDUCATION & CERTIFICATIONS */}
      {(education.length > 0 || certifications.length > 0) && (
        <section className="mb-[12pt]">
          <h2
            className="font-bold text-slate-950 uppercase tracking-wide border-b border-slate-900 pb-[1pt] mb-[5pt]"
            style={{ fontSize: "12pt" }}
          >
            EDUCATION & CERTIFICATIONS
          </h2>
          <div className="space-y-[6pt]">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline font-bold text-slate-950">
                  <span style={{ fontSize: "10.5pt" }}>
                    {edu.degree}
                    {edu.field ? ` – ${edu.field}` : ""}
                  </span>
                  <span className="text-slate-700 font-normal" style={{ fontSize: "10pt" }}>
                    Graduated: {edu.endDate}
                  </span>
                </div>
                <div className="text-slate-700" style={{ fontSize: "10pt" }}>
                  <span>{edu.school}</span>
                  {edu.gpa && <span> • GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}

            {certifications.map((c) => (
              <div key={c.id} className="flex justify-between items-baseline text-slate-800" style={{ fontSize: "10pt" }}>
                <span>
                  <strong>{c.name}</strong> – {c.issuer}
                </span>
                <span className="text-slate-600">{c.date}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
