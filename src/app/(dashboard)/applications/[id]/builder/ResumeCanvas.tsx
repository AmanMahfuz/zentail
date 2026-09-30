"use client";

import { mapToBuilderResumeData } from "@/lib/resume/map-resume-data";

export function ResumeCanvas({ activeResume }: { activeResume: any }) {
  let content = activeResume?.content || {};
  if (!content.markdown && activeResume?.resume_markdown) {
    content = { ...content, markdown: activeResume.resume_markdown };
  }
  const data = mapToBuilderResumeData({
    versionContent: content,
  });

  const { contact, summary, experience, education, skills, projects } = data;

  return (
    <div className="bg-white shadow-2xl shadow-slate-300/50 w-[850px] aspect-[8.5/11] p-16 flex flex-col font-serif text-slate-800 relative">
      
      {/* Name and Contact (Header) */}
      <div className="flex justify-between items-end border-b-2 border-slate-300 pb-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 uppercase">
            {contact.name || "Candidate"}
          </h1>
          <h2 className="text-base font-semibold text-blue-600 mt-1">
            {contact.title || "Full-Stack Developer"}
          </h2>
        </div>
        <div className="text-right text-xs font-sans text-slate-600 space-y-0.5">
          {contact.email && <p>{contact.email} {contact.phone && `• ${contact.phone}`}</p>}
          {contact.location && <p>{contact.location} {contact.linkedin && `• ${contact.linkedin.replace(/^https?:\/\/(www\.)?/, "")}`}</p>}
          {contact.github && <p>{contact.github.replace(/^https?:\/\/(www\.)?/, "")}</p>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-2 border-b border-slate-100 pb-1">
            Professional Summary
          </h3>
          <p className="text-xs leading-relaxed text-slate-700 text-justify">
            {summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-5 relative">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-2.5 border-b border-slate-100 pb-1">
            Professional Experience
          </h3>
          
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="font-bold text-slate-900 text-xs">
                    {exp.title} — <span className="font-semibold text-slate-700">{exp.company}</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono tracking-tighter">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                  </span>
                </div>
                {exp.location && (
                  <p className="italic text-slate-500 text-[10px] mb-1">{exp.location}</p>
                )}
                {exp.description && (
                  <p className="text-slate-600 text-xs mb-1">{exp.description}</p>
                )}
                {exp.bullets && exp.bullets.filter(Boolean).length > 0 && (
                  <ul className="list-disc list-outside ml-4 text-xs text-slate-700 space-y-1 marker:text-slate-400">
                    {exp.bullets.filter(Boolean).map((bullet, bi) => (
                      <li key={bi}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-2 border-b border-slate-100 pb-1">
            Education
          </h3>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-900 text-xs">{edu.school}</span>
                  <div className="text-slate-700 text-xs">
                    {edu.degree} {edu.field && `in ${edu.field}`} {edu.gpa && `• GPA: ${edu.gpa}`}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {edu.startDate} – {edu.endDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.some(s => s.items.trim()) && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-2 border-b border-slate-100 pb-1">
            Technical Skills
          </h3>
          <div className="space-y-1 text-xs">
            {skills.filter(s => s.items.trim()).map((s, idx) => (
              <div key={idx}>
                <strong className="text-slate-900 font-semibold">{s.category}: </strong>
                <span className="text-slate-700">{s.items}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-2 border-b border-slate-100 pb-1">
            Featured Projects
          </h3>
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="font-bold text-slate-900 text-xs">{p.name}</h4>
                  {p.tech && <span className="text-[10px] font-mono text-slate-500">{p.tech}</span>}
                </div>
                {p.bullets && p.bullets.filter(Boolean).length > 0 && (
                  <ul className="list-disc list-outside ml-4 text-xs text-slate-700 space-y-0.5 marker:text-slate-400">
                    {p.bullets.filter(Boolean).map((bullet, bi) => (
                      <li key={bi}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
