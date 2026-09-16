"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, GripVertical, Download, Save, Eye,
  User, Briefcase, GraduationCap, Code2, FolderGit2, ChevronDown,
  ChevronUp, Sparkles, CheckCircle2, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────
type ContactInfo = {
  name: string; email: string; phone: string;
  location: string; linkedin: string; portfolio: string;
};

type Experience = {
  id: string; company: string; title: string;
  startDate: string; endDate: string; current: boolean;
  bullets: string[];
};

type Education = {
  id: string; school: string; degree: string;
  field: string; startDate: string; endDate: string; gpa: string;
};

type Project = {
  id: string; name: string; tech: string; url: string; bullets: string[];
};

type ResumeData = {
  contact: ContactInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: { category: string; items: string }[];
  projects: Project[];
};

const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_RESUME: ResumeData = {
  contact: { name: "John Doe", email: "johndoe@example.com", phone: "(555) 123-4567", location: "San Francisco, CA", linkedin: "linkedin.com/in/johndoe", portfolio: "github.com/johndoe" },
  summary: "Results-driven Software Engineer with 5+ years of experience building scalable web applications. Proven ability to lead teams, optimize performance, and deliver high-quality software solutions on time.",
  experience: [
    {
      id: uid(),
      company: "Tech Corp",
      title: "Senior Software Engineer",
      startDate: "Jan 2021",
      endDate: "Present",
      current: true,
      bullets: [
        "Led the migration of a legacy monolithic architecture to microservices, improving system uptime by 99.9%.",
        "Mentored 3 junior developers and established code review guidelines."
      ]
    },
    {
      id: uid(),
      company: "Startup Inc",
      title: "Software Engineer",
      startDate: "Jun 2018",
      endDate: "Dec 2020",
      current: false,
      bullets: [
        "Developed and maintained a high-traffic React application serving 100k+ monthly active users.",
        "Optimized database queries, reducing average API response time by 30%."
      ]
    }
  ],
  education: [
    {
      id: uid(),
      school: "University of Technology",
      degree: "Bachelor of Science",
      field: "Computer Science",
      startDate: "Aug 2014",
      endDate: "May 2018",
      gpa: "3.8/4.0"
    }
  ],
  skills: [
    { category: "Languages", items: "JavaScript, TypeScript, Python, Java" },
    { category: "Frameworks", items: "React, Next.js, Node.js, Express" },
    { category: "Tools", items: "Git, Docker, AWS, CI/CD" },
  ],
  projects: [
    {
      id: uid(),
      name: "Open Source CMS",
      tech: "React, Node.js, PostgreSQL",
      url: "github.com/johndoe/cms",
      bullets: [
        "Built a headless CMS from scratch, adopted by 500+ developers.",
        "Implemented role-based access control and comprehensive API documentation."
      ]
    }
  ],
};

// ─── ATS Score Calculator ──────────────────────────────────────────
function calcATS(data: ResumeData): number {
  let score = 0;
  if (data.contact.name) score += 10;
  if (data.contact.email) score += 10;
  if (data.contact.phone) score += 5;
  if (data.contact.linkedin) score += 5;
  if (data.summary.length > 50) score += 10;
  if (data.experience.length > 0) score += 20;
  if (data.experience.some(e => e.bullets.some(b => b.length > 20))) score += 10;
  if (data.education.length > 0) score += 10;
  if (data.skills.some(s => s.items.trim())) score += 10;
  if (data.projects.length > 0) score += 10;
  return Math.min(score, 100);
}

// ─── Preview Renderer ─────────────────────────────────────────────
function ResumePreview({ data }: { data: ResumeData }) {
  const { contact, summary, experience, education, skills, projects } = data;
  const hasSkills = skills.some(s => s.items.trim());

  return (
    <div className="font-sans text-[11px] leading-relaxed" style={{ color: "#1e293b" }}>
      {/* Header */}
      <div className="text-center mb-3 pb-3" style={{ borderBottom: "2px solid #1e293b" }}>
        <h1 className="text-xl font-bold" style={{ letterSpacing: "-0.02em", color: "#0f172a" }}>
          {contact.name || "Your Name"}
        </h1>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 mt-1 text-[10px]" style={{ color: "#475569" }}>
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>• {contact.phone}</span>}
          {contact.location && <span>• {contact.location}</span>}
          {contact.linkedin && <span>• {contact.linkedin}</span>}
          {contact.portfolio && <span>• {contact.portfolio}</span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-1 pb-0.5" style={{ color: "#0f172a", borderBottom: "1px solid #cbd5e1" }}>Summary</h2>
          <p style={{ color: "#374151" }}>{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-1.5 pb-0.5" style={{ color: "#0f172a", borderBottom: "1px solid #cbd5e1" }}>Experience</h2>
          {experience.map(exp => (
            <div key={exp.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-[11px]">{exp.title || "Role"}</span>
                  {exp.company && <span style={{ color: "#475569" }}> — {exp.company}</span>}
                </div>
                <span className="text-[10px]" style={{ color: "#64748b" }}>
                  {exp.startDate}{exp.startDate && (exp.current ? " – Present" : exp.endDate ? ` – ${exp.endDate}` : "")}
                </span>
              </div>
              {exp.bullets.filter(b => b).map((b, i) => (
                <p key={i} className="ml-2 text-[10px]" style={{ color: "#374151" }}>• {b}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-1.5 pb-0.5" style={{ color: "#0f172a", borderBottom: "1px solid #cbd5e1" }}>Education</h2>
          {education.map(edu => (
            <div key={edu.id} className="mb-1.5">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-[11px]">{edu.school || "University"}</span>
                </div>
                <span className="text-[10px]" style={{ color: "#64748b" }}>
                  {edu.startDate}{edu.startDate && edu.endDate ? ` – ${edu.endDate}` : ""}
                </span>
              </div>
              <p style={{ color: "#475569" }}>
                {edu.degree}{edu.field ? `, ${edu.field}` : ""}
                {edu.gpa ? ` • GPA: ${edu.gpa}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {hasSkills && (
        <div className="mb-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-1.5 pb-0.5" style={{ color: "#0f172a", borderBottom: "1px solid #cbd5e1" }}>Skills</h2>
          {skills.filter(s => s.items.trim()).map((s, i) => (
            <p key={i} className="text-[10px]"><span className="font-semibold">{s.category}:</span> {s.items}</p>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-1.5 pb-0.5" style={{ color: "#0f172a", borderBottom: "1px solid #cbd5e1" }}>Projects</h2>
          {projects.map(p => (
            <div key={p.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-[11px]">{p.name || "Project"}</span>
                {p.url && <span className="text-[10px]" style={{ color: "#6366f1" }}>{p.url}</span>}
              </div>
              {p.tech && <p className="text-[10px] italic" style={{ color: "#475569" }}>Tech: {p.tech}</p>}
              {p.bullets.filter(b => b).map((b, i) => (
                <p key={i} className="ml-2 text-[10px]" style={{ color: "#374151" }}>• {b}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section Wrapper ───────────────────────────────────────────────
function Section({ icon: Icon, title, children, onAdd, addLabel }: {
  icon: any; title: string; children: React.ReactNode;
  onAdd?: () => void; addLabel?: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-canvas-white)", boxShadow: "var(--shadow-card)" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ borderBottom: open ? "1px solid var(--color-ash-border)" : "none" }}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: "var(--color-sunset-orange)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: "var(--color-fog-text)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--color-fog-text)" }} />}
      </button>
      {open && (
        <div className="p-4 space-y-3">
          {children}
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-1.5 text-xs font-semibold mt-1"
              style={{ color: "var(--color-sunset-orange)" }}
            >
              <Plus className="w-3.5 h-3.5" /> {addLabel ?? "Add"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Form Fields ───────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text", half = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; half?: boolean;
}) {
  return (
    <div className={half ? "flex-1" : "w-full"}>
      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-steel-text)" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
        style={{ border: "1.5px solid var(--color-ash-border)", backgroundColor: "var(--color-cloud-mist)", color: "var(--color-graphite-heading)" }}
        onFocus={e => { e.target.style.borderColor = "var(--color-sunset-orange)"; }}
        onBlur={e => { e.target.style.borderColor = "var(--color-ash-border)"; }}
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="w-full">
      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-steel-text)" }}>{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none transition-all"
        style={{ border: "1.5px solid var(--color-ash-border)", backgroundColor: "var(--color-cloud-mist)", color: "var(--color-graphite-heading)" }}
        onFocus={e => { e.target.style.borderColor = "var(--color-sunset-orange)"; }}
        onBlur={e => { e.target.style.borderColor = "var(--color-ash-border)"; }}
      />
    </div>
  );
}

// ─── Main Builder ──────────────────────────────────────────────────
export default function ResumeBuilderClient({ initialData }: { initialData?: Partial<ResumeData> }) {
  // Merge initial data if present, otherwise use default resume
  const startingData = initialData ? { ...DEFAULT_RESUME, ...initialData, contact: { ...DEFAULT_RESUME.contact, ...(initialData.contact || {}) } } : DEFAULT_RESUME;
  const [data, setData] = useState<ResumeData>(startingData as ResumeData);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState<"split" | "editor" | "preview">("split");

  const ats = calcATS(data);
  const atsColor = ats >= 80 ? "#16a34a" : ats >= 60 ? "#d97706" : "#dc2626";
  const atsLabel = ats >= 80 ? "Excellent" : ats >= 60 ? "Good" : "Needs work";

  const set = useCallback(<K extends keyof ResumeData>(key: K, val: ResumeData[K]) => {
    setData(d => ({ ...d, [key]: val }));
  }, []);

  // Experience helpers
  const addExp = () => set("experience", [...data.experience, {
    id: uid(), company: "", title: "", startDate: "", endDate: "", current: false, bullets: ["", ""],
  }]);
  const updateExp = (id: string, patch: Partial<Experience>) =>
    set("experience", data.experience.map(e => e.id === id ? { ...e, ...patch } : e));
  const removeExp = (id: string) => set("experience", data.experience.filter(e => e.id !== id));

  // Education helpers
  const addEdu = () => set("education", [...data.education, {
    id: uid(), school: "", degree: "", field: "", startDate: "", endDate: "", gpa: "",
  }]);
  const updateEdu = (id: string, patch: Partial<Education>) =>
    set("education", data.education.map(e => e.id === id ? { ...e, ...patch } : e));
  const removeEdu = (id: string) => set("education", data.education.filter(e => e.id !== id));

  // Project helpers
  const addProject = () => set("projects", [...data.projects, {
    id: uid(), name: "", tech: "", url: "", bullets: ["", ""],
  }]);
  const updateProject = (id: string, patch: Partial<Project>) =>
    set("projects", data.projects.map(p => p.id === id ? { ...p, ...patch } : p));
  const removeProject = (id: string) => set("projects", data.projects.filter(p => p.id !== id));

  const handleSave = async () => {
    setSaving(true);
    // Convert to markdown and save via API
    const markdown = buildMarkdown(data);
    try {
      await fetch("/api/resumes/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown, name: data.contact.name || "My Resume" }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* swallow */ }
    setSaving(false);
  };

  const handleDownload = () => {
    const md = buildMarkdown(data);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.contact.name || "resume"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showEditor = view !== "preview";
  const showPreview = view !== "editor";

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "var(--color-cloud-mist)" }}>

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 h-14 shrink-0 gap-4"
        style={{ backgroundColor: "var(--color-canvas-white)", borderBottom: "1px solid var(--color-ash-border)" }}
      >
        {/* Left: back + title */}
        <div className="flex items-center gap-3">
          <Link href="/resumes" className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--color-slate-body)" }}>
            <ArrowLeft className="w-4 h-4" /> Resumes
          </Link>
          <span style={{ color: "var(--color-ash-border)" }}>/</span>
          <span className="text-sm font-semibold" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)" }}>
            Resume Builder
          </span>
        </div>

        {/* Centre: ATS Score */}
        <div className="flex items-center gap-2">
          <div className="relative w-7 h-7">
            <svg viewBox="0 0 36 36" className="w-7 h-7 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-frost-tint)" strokeWidth="4" />
              <circle cx="18" cy="18" r="14" fill="none" stroke={atsColor} strokeWidth="4"
                strokeDasharray={`${(ats / 100) * 87.96} 87.96`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: atsColor }}>{ats}</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-fog-text)" }}>ATS Score</p>
            <p className="text-xs font-semibold" style={{ color: atsColor }}>{atsLabel}</p>
          </div>
        </div>

        {/* Right: view toggle + actions */}
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ backgroundColor: "var(--color-frost-tint)" }}>
            {([["split", "Split"], ["editor", "Editor"], ["preview", "Preview"]] as const).map(([v, label]) => (
              <button
                key={v} onClick={() => setView(v)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: view === v ? "var(--color-canvas-white)" : "transparent",
                  color: view === v ? "var(--color-graphite-heading)" : "var(--color-fog-text)",
                  boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{ border: "1px solid var(--color-ash-border)", color: "var(--color-slate-body)", backgroundColor: "var(--color-canvas-white)" }}
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-all"
            style={{ backgroundColor: saved ? "#16a34a" : "var(--color-sunset-orange)" }}
          >
            {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? "Saved!" : saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* ── ATS Tips bar ─────────────────────────────────────────── */}
      {ats < 80 && (
        <div className="px-6 py-2 flex items-center gap-2 shrink-0 text-xs" style={{ backgroundColor: ats < 60 ? "#fef2f2" : "#fefce8", borderBottom: "1px solid var(--color-ash-border)" }}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: ats < 60 ? "#dc2626" : "#d97706" }} />
          <span style={{ color: ats < 60 ? "#991b1b" : "#92400e" }}>
            {!data.contact.name ? "Add your name · " : ""}
            {!data.contact.email ? "Add email · " : ""}
            {!data.summary ? "Add a professional summary · " : ""}
            {data.experience.length === 0 ? "Add at least one experience entry · " : ""}
            {data.education.length === 0 ? "Add education · " : ""}
            {!data.skills.some(s => s.items.trim()) ? "Fill in your skills" : ""}
          </span>
        </div>
      )}

      {/* ── Main Area ─────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Editor Panel ─────────────────────────────────────────── */}
        {showEditor && (
          <div
            className="flex flex-col overflow-y-auto"
            style={{ width: showPreview ? "45%" : "100%", borderRight: showPreview ? "1px solid var(--color-ash-border)" : "none" }}
          >
            <div className="p-4 space-y-3">

              {/* Contact Info */}
              <Section icon={User} title="Contact Info">
                <div className="flex gap-2">
                  <Field label="Full Name" value={data.contact.name} onChange={v => set("contact", { ...data.contact, name: v })} placeholder="Aman Mahfuz" half />
                  <Field label="Email" value={data.contact.email} onChange={v => set("contact", { ...data.contact, email: v })} placeholder="you@email.com" half type="email" />
                </div>
                <div className="flex gap-2">
                  <Field label="Phone" value={data.contact.phone} onChange={v => set("contact", { ...data.contact, phone: v })} placeholder="+91 9876543210" half />
                  <Field label="Location" value={data.contact.location} onChange={v => set("contact", { ...data.contact, location: v })} placeholder="Bangalore, IN" half />
                </div>
                <div className="flex gap-2">
                  <Field label="LinkedIn" value={data.contact.linkedin} onChange={v => set("contact", { ...data.contact, linkedin: v })} placeholder="linkedin.com/in/username" half />
                  <Field label="Portfolio / GitHub" value={data.contact.portfolio} onChange={v => set("contact", { ...data.contact, portfolio: v })} placeholder="github.com/username" half />
                </div>
              </Section>

              {/* Summary */}
              <Section icon={Sparkles} title="Professional Summary">
                <Textarea
                  label="Summary"
                  value={data.summary}
                  onChange={v => set("summary", v)}
                  placeholder="3–4 sentences: what you do, key skills, top achievement, and what you're looking for."
                  rows={4}
                />
                <p className="text-[10px]" style={{ color: "var(--color-fog-text)" }}>
                  Tip: Start with your role title, mention top 2 skills, and a quantified achievement.
                </p>
              </Section>

              {/* Experience */}
              <Section icon={Briefcase} title="Experience" onAdd={addExp} addLabel="Add Experience">
                {data.experience.length === 0 && (
                  <p className="text-xs" style={{ color: "var(--color-fog-text)" }}>No experience added yet.</p>
                )}
                {data.experience.map((exp, idx) => (
                  <div key={exp.id} className="p-3 rounded-lg space-y-2" style={{ backgroundColor: "var(--color-cloud-mist)", border: "1px solid var(--color-ash-border)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: "var(--color-sunset-orange)" }}>
                        Position {idx + 1}
                      </span>
                      <button type="button" onClick={() => removeExp(exp.id)}>
                        <Trash2 className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Field label="Job Title" value={exp.title} onChange={v => updateExp(exp.id, { title: v })} placeholder="Software Engineer" half />
                      <Field label="Company" value={exp.company} onChange={v => updateExp(exp.id, { company: v })} placeholder="Google" half />
                    </div>
                    <div className="flex gap-2 items-end">
                      <Field label="Start Date" value={exp.startDate} onChange={v => updateExp(exp.id, { startDate: v })} placeholder="Jan 2023" half />
                      {exp.current ? (
                        <div className="flex-1">
                          <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-steel-text)" }}>End Date</label>
                          <p className="px-3 py-2 text-sm font-medium rounded-lg" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>Present</p>
                        </div>
                      ) : (
                        <Field label="End Date" value={exp.endDate} onChange={v => updateExp(exp.id, { endDate: v })} placeholder="Dec 2024" half />
                      )}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox" checked={exp.current}
                        onChange={e => updateExp(exp.id, { current: e.target.checked })}
                        style={{ accentColor: "var(--color-sunset-orange)" }}
                      />
                      <span className="text-xs" style={{ color: "var(--color-slate-body)" }}>I currently work here</span>
                    </label>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-steel-text)" }}>
                        Bullet Points <span style={{ color: "var(--color-fog-text)", fontWeight: 400, textTransform: "none" }}>(start with action verb + number)</span>
                      </label>
                      {exp.bullets.map((b, bi) => (
                        <div key={bi} className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-xs" style={{ color: "var(--color-fog-text)" }}>•</span>
                          <input
                            value={b}
                            onChange={e => {
                              const bs = [...exp.bullets];
                              bs[bi] = e.target.value;
                              updateExp(exp.id, { bullets: bs });
                            }}
                            placeholder={bi === 0 ? "Led migration of monolith to microservices, reducing latency by 40%" : "Built X that resulted in Y% improvement…"}
                            className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
                            style={{ border: "1.5px solid var(--color-ash-border)", backgroundColor: "var(--color-canvas-white)", color: "var(--color-graphite-heading)" }}
                            onFocus={e => { e.target.style.borderColor = "var(--color-sunset-orange)"; }}
                            onBlur={e => { e.target.style.borderColor = "var(--color-ash-border)"; }}
                          />
                          {exp.bullets.length > 1 && (
                            <button type="button" onClick={() => updateExp(exp.id, { bullets: exp.bullets.filter((_, i) => i !== bi) })}>
                              <Trash2 className="w-3 h-3" style={{ color: "var(--color-fog-text)" }} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => updateExp(exp.id, { bullets: [...exp.bullets, ""] })}
                        className="text-[10px] font-semibold flex items-center gap-1 mt-1"
                        style={{ color: "var(--color-sunset-orange)" }}
                      >
                        <Plus className="w-3 h-3" /> Add bullet
                      </button>
                    </div>
                  </div>
                ))}
              </Section>

              {/* Education */}
              <Section icon={GraduationCap} title="Education" onAdd={addEdu} addLabel="Add Education">
                {data.education.length === 0 && (
                  <p className="text-xs" style={{ color: "var(--color-fog-text)" }}>No education added yet.</p>
                )}
                {data.education.map((edu, idx) => (
                  <div key={edu.id} className="p-3 rounded-lg space-y-2" style={{ backgroundColor: "var(--color-cloud-mist)", border: "1px solid var(--color-ash-border)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: "var(--color-sunset-orange)" }}>Entry {idx + 1}</span>
                      <button type="button" onClick={() => removeEdu(edu.id)}>
                        <Trash2 className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Field label="University / School" value={edu.school} onChange={v => updateEdu(edu.id, { school: v })} placeholder="IIT Bombay" half />
                      <Field label="GPA (optional)" value={edu.gpa} onChange={v => updateEdu(edu.id, { gpa: v })} placeholder="9.1 / 10" half />
                    </div>
                    <div className="flex gap-2">
                      <Field label="Degree" value={edu.degree} onChange={v => updateEdu(edu.id, { degree: v })} placeholder="B.Tech" half />
                      <Field label="Field of Study" value={edu.field} onChange={v => updateEdu(edu.id, { field: v })} placeholder="Computer Science" half />
                    </div>
                    <div className="flex gap-2">
                      <Field label="Start Year" value={edu.startDate} onChange={v => updateEdu(edu.id, { startDate: v })} placeholder="2020" half />
                      <Field label="End Year" value={edu.endDate} onChange={v => updateEdu(edu.id, { endDate: v })} placeholder="2024" half />
                    </div>
                  </div>
                ))}
              </Section>

              {/* Skills */}
              <Section icon={Code2} title="Skills">
                {data.skills.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-28 shrink-0">
                      <Field label="Category" value={s.category} onChange={v => {
                        const ns = [...data.skills];
                        ns[i] = { ...ns[i], category: v };
                        set("skills", ns);
                      }} placeholder="Languages" />
                    </div>
                    <div className="flex-1">
                      <Field label="Skills (comma separated)" value={s.items} onChange={v => {
                        const ns = [...data.skills];
                        ns[i] = { ...ns[i], items: v };
                        set("skills", ns);
                      }} placeholder="Python, TypeScript, Go" />
                    </div>
                    <button
                      type="button"
                      className="mt-5 self-center"
                      onClick={() => set("skills", data.skills.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--color-fog-text)" }} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => set("skills", [...data.skills, { category: "", items: "" }])}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: "var(--color-sunset-orange)" }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add category
                </button>
              </Section>

              {/* Projects */}
              <Section icon={FolderGit2} title="Projects" onAdd={addProject} addLabel="Add Project">
                {data.projects.length === 0 && (
                  <p className="text-xs" style={{ color: "var(--color-fog-text)" }}>No projects added yet.</p>
                )}
                {data.projects.map((p, idx) => (
                  <div key={p.id} className="p-3 rounded-lg space-y-2" style={{ backgroundColor: "var(--color-cloud-mist)", border: "1px solid var(--color-ash-border)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: "var(--color-sunset-orange)" }}>Project {idx + 1}</span>
                      <button type="button" onClick={() => removeProject(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Field label="Project Name" value={p.name} onChange={v => updateProject(p.id, { name: v })} placeholder="Zentail" half />
                      <Field label="URL / GitHub" value={p.url} onChange={v => updateProject(p.id, { url: v })} placeholder="github.com/you/zentail" half />
                    </div>
                    <Field label="Tech Stack" value={p.tech} onChange={v => updateProject(p.id, { tech: v })} placeholder="Next.js, Supabase, TypeScript" />
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-steel-text)" }}>Bullet Points</label>
                      {p.bullets.map((b, bi) => (
                        <div key={bi} className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-xs" style={{ color: "var(--color-fog-text)" }}>•</span>
                          <input
                            value={b}
                            onChange={e => {
                              const bs = [...p.bullets];
                              bs[bi] = e.target.value;
                              updateProject(p.id, { bullets: bs });
                            }}
                            placeholder="Built X feature that does Y…"
                            className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
                            style={{ border: "1.5px solid var(--color-ash-border)", backgroundColor: "var(--color-canvas-white)", color: "var(--color-graphite-heading)" }}
                            onFocus={e => { e.target.style.borderColor = "var(--color-sunset-orange)"; }}
                            onBlur={e => { e.target.style.borderColor = "var(--color-ash-border)"; }}
                          />
                          {p.bullets.length > 1 && (
                            <button type="button" onClick={() => updateProject(p.id, { bullets: p.bullets.filter((_, i) => i !== bi) })}>
                              <Trash2 className="w-3 h-3" style={{ color: "var(--color-fog-text)" }} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => updateProject(p.id, { bullets: [...p.bullets, ""] })}
                        className="text-[10px] font-semibold flex items-center gap-1 mt-1"
                        style={{ color: "var(--color-sunset-orange)" }}
                      >
                        <Plus className="w-3 h-3" /> Add bullet
                      </button>
                    </div>
                  </div>
                ))}
              </Section>

              {/* Bottom spacer */}
              <div className="h-8" />
            </div>
          </div>
        )}

        {/* ── Preview Panel ─────────────────────────────────────────── */}
        {showPreview && (
          <div
            className="flex flex-col overflow-hidden"
            style={{ width: showEditor ? "55%" : "100%", backgroundColor: "var(--color-cloud-mist)" }}
          >
            <div
              className="px-4 py-2 flex items-center justify-between shrink-0"
              style={{ borderBottom: "1px solid var(--color-ash-border)", backgroundColor: "var(--color-cloud-mist)" }}
            >
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" style={{ color: "var(--color-sunset-orange)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--color-graphite-heading)" }}>Live Preview</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                ATS Safe Format
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex justify-center">
              {/* A4 paper */}
              <div
                className="w-full rounded"
                style={{
                  maxWidth: "620px",
                  padding: "40px 48px",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
                  minHeight: "840px",
                }}
              >
                <ResumePreview data={data} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Markdown Builder ──────────────────────────────────────────────
function buildMarkdown(data: ResumeData): string {
  const { contact, summary, experience, education, skills, projects } = data;
  let md = "";

  md += `# ${contact.name}\n`;
  const info = [contact.email, contact.phone, contact.location, contact.linkedin, contact.portfolio].filter(Boolean);
  if (info.length) md += `${info.join(" • ")}\n\n`;

  if (summary) {
    md += `## Summary\n${summary}\n\n`;
  }

  if (experience.length) {
    md += `## Experience\n`;
    for (const e of experience) {
      md += `### ${e.title} — ${e.company}\n`;
      md += `${e.startDate}${e.current ? " – Present" : e.endDate ? ` – ${e.endDate}` : ""}\n`;
      for (const b of e.bullets.filter(Boolean)) md += `- ${b}\n`;
      md += "\n";
    }
  }

  if (education.length) {
    md += `## Education\n`;
    for (const edu of education) {
      md += `### ${edu.school}\n`;
      md += `${edu.degree}${edu.field ? `, ${edu.field}` : ""}${edu.gpa ? ` • GPA: ${edu.gpa}` : ""}\n`;
      md += `${edu.startDate}${edu.endDate ? ` – ${edu.endDate}` : ""}\n\n`;
    }
  }

  const hasSkills = skills.some(s => s.items.trim());
  if (hasSkills) {
    md += `## Skills\n`;
    for (const s of skills.filter(x => x.items.trim())) {
      md += `- **${s.category}:** ${s.items}\n`;
    }
    md += "\n";
  }

  if (projects.length) {
    md += `## Projects\n`;
    for (const p of projects) {
      md += `### ${p.name}${p.url ? ` | ${p.url}` : ""}\n`;
      if (p.tech) md += `Tech: ${p.tech}\n`;
      for (const b of p.bullets.filter(Boolean)) md += `- ${b}\n`;
      md += "\n";
    }
  }

  return md;
}
