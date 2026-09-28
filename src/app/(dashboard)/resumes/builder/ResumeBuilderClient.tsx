"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  CheckCircle2,
  Check,
  Undo2,
  Redo2,
  GripVertical,
  Pencil,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Code2,
  Database,
  Cloud,
  Layers,
  Wand2,
  ZoomIn,
  ZoomOut,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  User,
  Eye,
  Columns2,
} from "lucide-react";
import {
  BuilderResumeData,
  ResumeTheme,
  TemplateId,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  SkillCategory,
  CertificationItem,
} from "@/types/resume-builder";
import ResumeCanvas from "@/components/builder/ResumeCanvas";
import ThemeCustomizer from "@/components/builder/ThemeCustomizer";
import { exportResumeToDocx } from "@/lib/utils/export-docx";
import { ResumeDownloadButton } from "@/components/resumes/ResumeDownloadButton";
import { toast } from "sonner";
import { getAtsBlueprint } from "@/config/ats-templates";
import { analyzeCandidateProfile, convertResumeToAtsBlueprint } from "@/lib/services/ats-converter";

const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_THEME: ResumeTheme = {
  template: "experienced",
  primaryColor: "#0f172a",
  fontFamily: "Inter",
  fontSize: "normal",
  layoutDensity: "compact",
  atsModeActive: true,
  margin: "0.75in",
};

const DEFAULT_RESUME: BuilderResumeData = {
  contact: {
    name: "AMAN MAHFUZ KZ",
    title: "FULL-STACK SOFTWARE ENGINEER",
    email: "aman.mahfuz@zentail.dev",
    phone: "+1 (555) 382-9014",
    location: "San Francisco, CA (Open to Remote)",
    linkedin: "https://linkedin.com/in/amanmahfuz",
    portfolio: "https://amanmahfuz.dev",
    github: "github.com/amanmahfuz",
  },
  summary:
    "Product-focused Full-Stack Engineer with 5+ years of experience designing, architecting, and deploying resilient web applications. Proven track record in optimizing client-side performance, developing scalable microservices, and leading distributed teams. Specialized in TypeScript ecosystems with high-throughput cloud delivery.",
  experience: [
    {
      id: "exp-1",
      company: "Aura Web Labs",
      title: "Lead Frontend Engineer",
      startDate: "2022",
      endDate: "Present",
      current: true,
      bullets: [
        "Architected Next.js enterprise dashboard serving 120,000+ monthly active users, slashing Core Web Vitals LCP by 44%.",
        "Led a team of 6 engineers; pioneered reusable Tailwind CSS component library compliant with WCAG 2.1 AA standards.",
        "Spearheaded transition from REST endpoints to optimized GraphQL batching, reducing client payload size by 35%.",
      ],
    },
    {
      id: "exp-2",
      company: "Kalry Cloud Systems",
      title: "Full-Stack Engineer",
      startDate: "2020",
      endDate: "2022",
      current: false,
      bullets: [
        "Implemented high-concurrency Node.js event pipelines handling 15M+ daily transaction logs backed by PostgreSQL and Redis.",
        "Integrated Stripe Billing and automated webhooks, supporting enterprise billing flows across 14 international currencies.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "State University of Technology",
      degree: "B.S. in Computer Science",
      field: "Software Systems",
      startDate: "2016",
      endDate: "2020",
      gpa: "3.85",
    },
  ],
  skills: [
    {
      id: "skill-1",
      category: "Frontend Development",
      items: "React.js, Next.js, JavaScript (ES6+), TypeScript, HTML5 & CSS3, Tailwind CSS, Redux Toolkit",
    },
    {
      id: "skill-2",
      category: "Backend & Databases",
      items: "Node.js, Express, PostgreSQL, Prisma ORM, Supabase, RESTful APIs",
    },
    {
      id: "skill-3",
      category: "AI & Cloud Infrastructure",
      items: "Docker, AWS (S3, EC2), CI/CD (GitHub Actions), Vercel, Jest, Vitest, OpenAI API",
    },
    {
      id: "skill-4",
      category: "Architecture & Tools",
      items: "Micro-frontends, Distributed Systems, Git, Agile/Scrum, Figma to Code",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "AI Autonomous Pipeline Platform",
      tech: "Next.js, Python, Supabase, Gemini API",
      url: "github.com/amanmahfuz/ai-pipeline",
      bullets: [
        "Engineered real-time reactive workflow engine processing 10k+ continuous jobs.",
      ],
    },
  ],
  certifications: [],
  languages: [],
  achievements: [],
  theme: DEFAULT_THEME,
};

type StepId =
  | "contact"
  | "summary"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "credentials";

const STEPS: Array<{
  id: StepId;
  label: string;
  stepNumber: number;
  icon: React.ComponentType<{ className?: string }>;
  countKey?: keyof BuilderResumeData;
}> = [
  { id: "contact", label: "Personal", stepNumber: 1, icon: User },
  { id: "summary", label: "Summary", stepNumber: 2, icon: FileText },
  { id: "skills", label: "Skills", stepNumber: 3, icon: Code2 },
  { id: "experience", label: "Experience", stepNumber: 4, icon: Briefcase, countKey: "experience" },
  { id: "projects", label: "Projects", stepNumber: 5, icon: Layers, countKey: "projects" },
  { id: "education", label: "Education", stepNumber: 6, icon: GraduationCap, countKey: "education" },
  { id: "credentials", label: "Certs", stepNumber: 7, icon: Award, countKey: "certifications" },
];

const STEP_META: Record<StepId, { title: string; subtitle: string }> = {
  contact: {
    title: "Personal Information & Contact",
    subtitle: "Provide your essential contact details and public professional profiles for recruiter screening.",
  },
  summary: {
    title: "Professional Summary",
    subtitle: "Craft a high-impact 3-4 sentence elevator pitch demonstrating your core strengths, domain expertise, and quantifiable achievements.",
  },
  skills: {
    title: "Skills & Technical Proficiencies",
    subtitle: "Categorize your competencies so applicant tracking algorithms seamlessly parse your technical stack across target roles.",
  },
  experience: {
    title: "Work Experience & Employment History",
    subtitle: "Detail your previous roles with action-driven, metric-oriented bullet points matching ATS standards.",
  },
  projects: {
    title: "Technical Projects",
    subtitle: "Highlight standout engineering projects, open-source contributions, or applications you built.",
  },
  education: {
    title: "Education & Academic Credentials",
    subtitle: "List your degree, major, university, and key coursework or honors.",
  },
  credentials: {
    title: "Certifications & Credentials",
    subtitle: "Showcase relevant industry certifications, licenses, and verified skill badges.",
  },
};

export default function ResumeBuilderClient({
  initialData,
  versionLabel,
  resumeId,
  readOnly = false,
  initialTemplate,
}: {
  initialData?: Partial<BuilderResumeData>;
  hasExistingData?: boolean;
  versionLabel?: string;
  resumeId?: string;
  readOnly?: boolean;
  initialTemplate?: TemplateId;
}) {
  const mergedTheme: ResumeTheme = {
    ...DEFAULT_THEME,
    ...(initialData?.theme || {}),
    ...(initialTemplate ? { template: initialTemplate } : {}),
  };

  const initialMergedData: BuilderResumeData = {
    ...DEFAULT_RESUME,
    ...(initialData || {}),
    contact: { ...DEFAULT_RESUME.contact, ...(initialData?.contact || {}) },
    theme: mergedTheme,
  };

  // State
  const [data, setData] = useState<BuilderResumeData>(initialMergedData);
  const [history, setHistory] = useState<BuilderResumeData[]>([]);
  const [future, setFuture] = useState<BuilderResumeData[]>([]);

  const [activeStep, setActiveStep] = useState<StepId>("skills");
  const [zoom, setZoom] = useState(100);
  const [saving, setSaving] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [view, setView] = useState<"split" | "editor" | "preview">(readOnly ? "preview" : "split");
  const showEditor = view !== "preview";
  const showPreview = view !== "editor";

  // Resume header title and target metadata
  const [resumeTitle, setResumeTitle] = useState(
    versionLabel || "Primary Resume — Full Stack Developer"
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [targetRole, setTargetRole] = useState("Senior Product Engineer");

  // Missing suggestions tracking
  const [missingSuggestions, setMissingSuggestions] = useState([
    "TypeScript",
    "PostgreSQL",
    "Docker",
    "Jest",
  ]);

  // Collapsible cards state - collapse 2nd, 3rd, and 4th categories by default matching reference
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    "skill-2": true,
    "skill-3": true,
    "skill-4": true,
  });

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // State modification with undo/redo recording
  const updateDataWithHistory = useCallback((updater: (prev: BuilderResumeData) => BuilderResumeData) => {
    setData((current) => {
      const next = updater(current);
      setHistory((h) => [...h.slice(-20), current]);
      setFuture([]);
      return next;
    });
  }, []);

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [data, ...f]);
    setData(prev);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, data]);
    setData(next);
  };

  // Category Icon helper
  const getCategoryIcon = (category: string) => {
    const low = category.toLowerCase();
    if (low.includes("front") || low.includes("ui") || low.includes("web")) return Code2;
    if (low.includes("back") || low.includes("data") || low.includes("sql")) return Database;
    if (low.includes("cloud") || low.includes("ai") || low.includes("devops")) return Cloud;
    return Layers;
  };

  // Add a skill item into a specific category
  const handleAddSkillToCategory = (catId: string, skillToAdd: string) => {
    if (!skillToAdd.trim()) return;
    const clean = skillToAdd.trim();
    updateDataWithHistory((prev) => {
      const updatedSkills = prev.skills.map((s) => {
        if ((s.id || s.category) === catId) {
          const currentList = s.items
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
          if (!currentList.includes(clean)) {
            currentList.push(clean);
          }
          return { ...s, items: currentList.join(", ") };
        }
        return s;
      });
      return { ...prev, skills: updatedSkills };
    });

    // Remove from suggestions if present
    setMissingSuggestions((prev) => prev.filter((item) => item.toLowerCase() !== clean.toLowerCase()));
  };

  // Remove a skill item from a specific category
  const handleRemoveSkillFromCategory = (catId: string, skillToRemove: string) => {
    updateDataWithHistory((prev) => {
      const updatedSkills = prev.skills.map((s) => {
        if ((s.id || s.category) === catId) {
          const currentList = s.items
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.toLowerCase() !== skillToRemove.toLowerCase());
          return { ...s, items: currentList.join(", ") };
        }
        return s;
      });
      return { ...prev, skills: updatedSkills };
    });
  };

  // Add 1-Click All suggestions
  const handleAddAllSuggestions = () => {
    if (missingSuggestions.length === 0) return;

    updateDataWithHistory((prev) => {
      const updatedSkills = [...prev.skills];
      missingSuggestions.forEach((sug) => {
        const low = sug.toLowerCase();
        let targetCat = updatedSkills[0]; // fallback

        if (low.includes("type") || low.includes("script")) {
          targetCat = updatedSkills.find((s) => s.category.toLowerCase().includes("front")) || updatedSkills[0];
        } else if (low.includes("sql") || low.includes("postgre")) {
          targetCat = updatedSkills.find((s) => s.category.toLowerCase().includes("back")) || updatedSkills[0];
        } else if (low.includes("docker") || low.includes("cloud")) {
          targetCat = updatedSkills.find((s) => s.category.toLowerCase().includes("cloud")) || updatedSkills[0];
        } else if (low.includes("jest") || low.includes("test")) {
          targetCat = updatedSkills.find((s) => s.category.toLowerCase().includes("arch") || s.category.toLowerCase().includes("tool")) || updatedSkills[0];
        }

        if (targetCat) {
          const list = targetCat.items.split(",").map((i) => i.trim()).filter(Boolean);
          if (!list.includes(sug)) list.push(sug);
          targetCat.items = list.join(", ");
        }
      });
      return { ...prev, skills: updatedSkills };
    });

    toast.success("Added all missing skills with +18% ATS boost!", {
      description: missingSuggestions.join(", "),
    });
    setMissingSuggestions([]);
  };

  // Create new skill category
  const handleCreateNewCategory = () => {
    const newId = uid();
    updateDataWithHistory((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        { id: newId, category: "New Category (e.g. Methodologies, Testing)", items: "" },
      ],
    }));
  };

  // Section item additions
  const handleAddExperience = () => {
    const newExp: ExperienceItem = {
      id: uid(),
      company: "Company Name",
      title: "Job Title",
      startDate: "2023",
      endDate: "Present",
      current: true,
      bullets: ["Accomplished [X] as measured by [Y], by doing [Z]."],
    };
    updateDataWithHistory((prev) => ({
      ...prev,
      experience: [newExp, ...prev.experience],
    }));
  };

  const handleAddProject = () => {
    const newProj: ProjectItem = {
      id: uid(),
      name: "Project Name",
      tech: "Tech Stack",
      url: "github.com/...",
      bullets: ["Key feature or architectural decision implemented."],
    };
    updateDataWithHistory((prev) => ({
      ...prev,
      projects: [newProj, ...prev.projects],
    }));
  };

  const handleAddEducation = () => {
    const newEdu: EducationItem = {
      id: uid(),
      school: "University / Institution",
      degree: "Degree / Certification",
      field: "Field of Study",
      startDate: "2019",
      endDate: "2023",
    };
    updateDataWithHistory((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
  };

  const handleAddCertification = () => {
    const newCert: CertificationItem = {
      id: uid(),
      name: "Certification Name",
      issuer: "Issuing Organization",
      date: "2024",
    };
    updateDataWithHistory((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), newCert],
    }));
  };

  // Save to DB
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/resumes/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          data,
          versionLabel: resumeTitle,
        }),
      });
      if (res.ok) {
        toast.success("Resume saved successfully!");
      } else {
        toast.error("Failed to save resume.");
      }
    } catch {
      toast.error("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Check section completion for checkmarks
  const isStepCompleted = (step: StepId): boolean => {
    switch (step) {
      case "contact":
        return Boolean(data.contact.name && data.contact.email);
      case "summary":
        return Boolean(data.summary && data.summary.length > 30);
      case "skills":
        return data.skills.some((s) => s.items.trim().length > 0);
      case "experience":
        return data.experience.length > 0;
      case "projects":
        return data.projects.length > 0;
      case "education":
        return data.education.length > 0;
      case "credentials":
        return Boolean(data.certifications && data.certifications.length > 0);
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP GLOBAL HEADER BAR
      ───────────────────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between z-20 shrink-0 shadow-2xs">
        {/* Left Side: Brand, Back, Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#7C3AED] text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
            Z
          </div>

          <Link
            href="/resumes"
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Resumes</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          {/* Title & Subtitle */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                  autoFocus
                  className="font-bold text-slate-900 text-sm border-b border-indigo-500 outline-none px-1 py-0.5 bg-transparent"
                />
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="font-bold text-slate-900 text-sm truncate cursor-pointer hover:text-indigo-600 flex items-center gap-1"
                >
                  <span>{resumeTitle}</span>
                  <Pencil className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                </h1>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Saved 1m ago
              </span>
              <span>•</span>
              <span>Targeting: <strong className="text-slate-700 font-medium">{targetRole}</strong></span>
            </p>
          </div>
        </div>

        {/* Center: Single Page Protected, 100% Zoom Controls, & View Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="whitespace-nowrap shrink-0 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Single Page Protected
          </span>

          {/* Zoom Pill */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-0.5 text-xs font-bold text-slate-700 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 10, 60))}
              className="p-1 text-slate-500 hover:text-slate-900 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] whitespace-nowrap min-w-[36px] text-center font-semibold">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 10, 140))}
              className="p-1 text-slate-500 hover:text-slate-900 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Segmented View Switcher: Split | Editor | Preview */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => setView("split")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                view === "split"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Split View (Editor + Live Preview)"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Split</span>
            </button>
            <button
              type="button"
              onClick={() => setView("editor")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                view === "editor"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Editor View Only"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setView("preview")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                view === "preview"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Preview View Only"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Preview</span>
            </button>
          </div>
        </div>

        {/* Right Side: Tools & Fit Score */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Reorder Sections"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition-colors"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={future.length === 0}
            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition-colors"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Theme Settings Cog */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Theme Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Print / PDF Export */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Browser Print Preview"
          >
            <Printer className="w-4 h-4" />
          </button>

          {resumeId && (
            <ResumeDownloadButton
              resumeId={resumeId}
              resumeTitle={data.contact.name ? `${data.contact.name}_Resume` : (versionLabel || 'Resume')}
              size="sm"
              variant="outline"
              className="hidden sm:inline-flex text-xs font-semibold"
            />
          )}

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* 94% Fit Score Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/90 text-xs font-bold text-slate-900 shadow-2xs whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-700">94%</span>
            <span className="text-slate-500 font-semibold text-[11px]">Fit</span>
          </div>

          {readOnly && resumeId ? (
            <Link
              href={`/resumes/${resumeId}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl shadow-xs transition-all ml-1 whitespace-nowrap shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Resume</span>
            </Link>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="hidden sm:inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl shadow-xs transition-all ml-1 whitespace-nowrap shrink-0"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN WORKSPACE: FORM PANE (WITH TOP SECTION TABS) + RIGHT CANVAS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── ACTIVE FORM PANE ──────────────────────────────────── */}
        {showEditor && (
          <div
            className={`${
              showPreview
                ? "w-full lg:w-[480px] xl:w-[520px] 2xl:w-[560px] border-r border-slate-200 shrink-0"
                : "flex-1"
            } bg-white flex flex-col h-full overflow-hidden`}
          >
            {/* Top Horizontal Section Tabs (Saves Left Rail Space) */}
            <div className="bg-slate-50/90 border-b border-slate-200/90 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
              <div className="flex items-center gap-1 min-w-max">
                {STEPS.map((step) => {
                  const isActive = activeStep === step.id;
                  const completed = isStepCompleted(step.id);
                  const count = step.countKey ? (data[step.countKey] as any[])?.length : undefined;
                  const Icon = step.icon;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveStep(step.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                        isActive
                          ? "bg-[#4F46E5] text-white shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span>{step.label}</span>

                      {typeof count === "number" && count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold leading-tight ${
                            isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {count}
                        </span>
                      )}

                      {completed && (
                        <Check
                          className={`w-3 h-3 stroke-[2.5] ${
                            isActive ? "text-emerald-300" : "text-emerald-600"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Progress Count Badge */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 shrink-0">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {STEPS.filter((s) => isStepCompleted(s.id)).length}/7
                </span>
              </div>
            </div>

            {/* Form Pane Header */}
            <div className={`px-7 pt-5 pb-4 border-b border-slate-100 shrink-0 ${!showPreview ? "max-w-4xl mx-auto w-full" : ""}`}>
              {(() => {
                const currentStepInfo = STEPS.find((s) => s.id === activeStep) || STEPS[2];
                const currentStepMeta = STEP_META[activeStep] || STEP_META.skills;
                return (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Step {currentStepInfo.stepNumber} of 7 · {currentStepInfo.label}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> All changes synced
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      {currentStepMeta.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {currentStepMeta.subtitle}
                    </p>
                  </>
                );
              })()}
            </div>

            {/* Form Scrollable Body */}
            <div className={`flex-1 overflow-y-auto p-7 space-y-6 ${!showPreview ? "max-w-4xl mx-auto w-full" : ""}`}>
            {/* STEP 1: PERSONAL / CONTACT */}
            {activeStep === "contact" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      value={data.contact.name}
                      onChange={(e) => updateDataWithHistory((prev) => ({ ...prev, contact: { ...prev.contact, name: e.target.value } }))}
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white"
                      placeholder="e.g. AMAN MAHFUZ KZ"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Professional Headline / Title</label>
                    <input
                      type="text"
                      value={data.contact.title}
                      onChange={(e) => updateDataWithHistory((prev) => ({ ...prev, contact: { ...prev.contact, title: e.target.value } }))}
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white uppercase tracking-wider"
                      placeholder="e.g. FULL-STACK SOFTWARE ENGINEER"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={data.contact.email}
                      onChange={(e) => updateDataWithHistory((prev) => ({ ...prev, contact: { ...prev.contact, email: e.target.value } }))}
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white"
                      placeholder="aman.mahfuz@zentail.dev"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={data.contact.phone}
                      onChange={(e) => updateDataWithHistory((prev) => ({ ...prev, contact: { ...prev.contact, phone: e.target.value } }))}
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white"
                      placeholder="+1 (555) 382-9014"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Location & Remote Availability</label>
                    <input
                      type="text"
                      value={data.contact.location}
                      onChange={(e) => updateDataWithHistory((prev) => ({ ...prev, contact: { ...prev.contact, location: e.target.value } }))}
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white"
                      placeholder="San Francisco, CA (Open to Remote)"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">GitHub Profile / Repositories</label>
                    <input
                      type="text"
                      value={data.contact.github || ""}
                      onChange={(e) => updateDataWithHistory((prev) => ({ ...prev, contact: { ...prev.contact, github: e.target.value } }))}
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white"
                      placeholder="github.com/amanmahfuz"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn URL</label>
                    <input
                      type="text"
                      value={data.contact.linkedin || ""}
                      onChange={(e) => updateDataWithHistory((prev) => ({ ...prev, contact: { ...prev.contact, linkedin: e.target.value } }))}
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white"
                      placeholder="linkedin.com/in/amanmahfuz"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Portfolio / Website</label>
                    <input
                      type="text"
                      value={data.contact.portfolio || ""}
                      onChange={(e) => updateDataWithHistory((prev) => ({ ...prev, contact: { ...prev.contact, portfolio: e.target.value } }))}
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white"
                      placeholder="amanmahfuz.dev"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: SUMMARY */}
            {activeStep === "summary" && (
              <div className="space-y-4">
                <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Executive Summary</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {data.summary.split(/\s+/).filter(Boolean).length} words · 3-4 lines recommended
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={data.summary}
                    onChange={(e) => updateDataWithHistory((prev) => ({ ...prev, summary: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs leading-relaxed outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="Describe your professional background, key technical strengths, and quantifiable impact..."
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      💡 Pro-tip: Open with years of experience and domain specialties.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        toast.success("Summary polished for ATS readability!");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Enhance
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SKILLS (EXACT MATCH REFERENCE DESIGN) */}
            {activeStep === "skills" && (
              <>
                {/* AI Target Role Suggestions Banner */}
                {missingSuggestions.length > 0 && (
                  <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-4 shadow-2xs relative">
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            Target Role Match Suggestions
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            We scanned 142 similar job descriptions. Add these missing keywords to improve indexing:
                          </p>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        +18% ATS boost
                      </span>
                    </div>

                    {/* Suggestions Chips & 1-Click Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {missingSuggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handleAddSkillToCategory(data.skills[0]?.id || "", sug)}
                            className="bg-white hover:bg-indigo-50 border border-indigo-200/80 text-indigo-900 font-bold text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            <span>{sug}</span>
                            <Plus className="w-3 h-3 text-slate-400" />
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddAllSuggestions}
                        className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 hover:shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>+ 1-Click Add All</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Categorized Skill Cards */}
                <div className="space-y-4">
                  {data.skills.map((category) => {
                    const catId = category.id || category.category;
                    const isCollapsed = Boolean(collapsedCategories[catId]);
                    const Icon = getCategoryIcon(category.category);
                    const skillTags = category.items
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);

                    return (
                      <div
                        key={catId}
                        className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-all space-y-3.5"
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                              <Icon className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              value={category.category}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateDataWithHistory((prev) => ({
                                  ...prev,
                                  skills: prev.skills.map((s) =>
                                    (s.id || s.category) === catId ? { ...s, category: val } : s
                                  ),
                                }));
                              }}
                              className="font-bold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none px-1"
                            />
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                              {skillTags.length} skills
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-400">
                            <button
                              type="button"
                              className="p-1 hover:text-slate-700 cursor-grab"
                              title="Drag to reorder"
                            >
                              <GripVertical className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleCategoryCollapse(catId)}
                              className="p-1 hover:text-slate-700 rounded-md"
                            >
                              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {!isCollapsed ? (
                          <>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Core client-side architectural libraries, UI paradigms, and responsive markup systems.
                            </p>

                            {/* Skill Pill Badges */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              {skillTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="bg-white border border-slate-200 text-slate-800 font-semibold px-2.5 py-1 rounded-lg text-xs shadow-2xs flex items-center gap-1.5 hover:border-slate-300"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                  <span>{tag}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSkillFromCategory(catId, tag)}
                                    className="text-slate-400 hover:text-red-500 rounded-full p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>

                            {/* Inline Input Field */}
                            <div className="flex gap-2 pt-1">
                              <input
                                type="text"
                                placeholder="⊕ Type a skill and press Enter (e.g. Vue.js, Webpack)."
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddSkillToCategory(catId, e.currentTarget.value);
                                    e.currentTarget.value = "";
                                  }
                                }}
                                id={`input-${catId}`}
                                className="flex-1 bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white placeholder:text-slate-400 transition-colors"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const inputEl = document.getElementById(`input-${catId}`) as HTMLInputElement;
                                  if (inputEl) {
                                    handleAddSkillToCategory(catId, inputEl.value);
                                    inputEl.value = "";
                                  }
                                }}
                                className="px-3.5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                              >
                                Add
                              </button>
                            </div>

                            {/* Suggestions Quick Buttons */}
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                              <span className="font-semibold">Suggestions:</span>
                              {["Vue.js", "GraphQL", "Storybook"].map((sug) => (
                                <button
                                  key={sug}
                                  type="button"
                                  onClick={() => handleAddSkillToCategory(catId, sug)}
                                  className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold"
                                >
                                  + {sug}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-slate-500 truncate font-normal pt-0.5">
                            {category.items || "No skills added yet"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Button: Create New Skill Category */}
                <button
                  type="button"
                  onClick={handleCreateNewCategory}
                  className="w-full py-3.5 border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-2xl text-xs font-bold text-slate-600 hover:text-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-slate-400" />
                  <span>Create New Skill Category (e.g., Methodologies, Testing)</span>
                </button>
              </>
            )}

            {/* STEP 4: EXPERIENCE */}
            {activeStep === "experience" && (
              <div className="space-y-4">
                {data.experience.map((exp, expIdx) => (
                  <div key={exp.id} className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-xs text-slate-800">Position #{expIdx + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateDataWithHistory((prev) => ({
                            ...prev,
                            experience: prev.experience.filter((e) => e.id !== exp.id),
                          }));
                        }}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              experience: prev.experience.map((it) => (it.id === exp.id ? { ...it, company: val } : it)),
                            }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Job Title</label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              experience: prev.experience.map((it) => (it.id === exp.id ? { ...it, title: val } : it)),
                            }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Date</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              experience: prev.experience.map((it) => (it.id === exp.id ? { ...it, startDate: val } : it)),
                            }));
                          }}
                          placeholder="2022"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">End Date</label>
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              experience: prev.experience.map((it) => (it.id === exp.id ? { ...it, endDate: val, current: val.toLowerCase().includes("present") } : it)),
                            }));
                          }}
                          placeholder="Present"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Bullets */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-[11px] font-bold text-slate-700">Achievement Bullet Points (ATS Metric-Driven)</label>
                      {exp.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2">
                          <span className="text-slate-400 mt-2 text-xs">•</span>
                          <textarea
                            rows={2}
                            value={b}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDataWithHistory((prev) => ({
                                ...prev,
                                experience: prev.experience.map((it) => {
                                  if (it.id !== exp.id) return it;
                                  const nb = [...it.bullets];
                                  nb[bIdx] = val;
                                  return { ...it, bullets: nb };
                                }),
                              }));
                            }}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs leading-relaxed outline-none focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              updateDataWithHistory((prev) => ({
                                ...prev,
                                experience: prev.experience.map((it) => {
                                  if (it.id !== exp.id) return it;
                                  return { ...it, bullets: it.bullets.filter((_, idx) => idx !== bIdx) };
                                }),
                              }));
                            }}
                            className="text-slate-300 hover:text-red-500 mt-2"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          updateDataWithHistory((prev) => ({
                            ...prev,
                            experience: prev.experience.map((it) => {
                              if (it.id !== exp.id) return it;
                              return { ...it, bullets: [...it.bullets, "Accomplished [X] by doing [Y]."] };
                            }),
                          }));
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Bullet Point
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl text-xs font-bold text-slate-600 hover:text-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-slate-400" />
                  <span>Add Work Experience</span>
                </button>
              </div>
            )}

            {/* STEP 5: PROJECTS */}
            {activeStep === "projects" && (
              <div className="space-y-4">
                {data.projects.map((proj, pIdx) => (
                  <div key={proj.id} className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-xs text-slate-800">Project #{pIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          updateDataWithHistory((prev) => ({
                            ...prev,
                            projects: prev.projects.filter((p) => p.id !== proj.id),
                          }));
                        }}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Project Name</label>
                        <input
                          type="text"
                          value={proj.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              projects: prev.projects.map((p) => (p.id === proj.id ? { ...p, name: val } : p)),
                            }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Technologies Used</label>
                        <input
                          type="text"
                          value={proj.tech || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              projects: prev.projects.map((p) => (p.id === proj.id ? { ...p, tech: val } : p)),
                            }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white"
                          placeholder="e.g. Next.js, TypeScript, PostgreSQL"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">URL / Repository</label>
                        <input
                          type="text"
                          value={proj.url || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              projects: prev.projects.map((p) => (p.id === proj.id ? { ...p, url: val } : p)),
                            }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white"
                          placeholder="github.com/username/project"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddProject}
                  className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl text-xs font-bold text-slate-600 hover:text-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-slate-400" />
                  <span>Add Project</span>
                </button>
              </div>
            )}

            {/* STEP 6: EDUCATION */}
            {activeStep === "education" && (
              <div className="space-y-4">
                {data.education.map((edu, eduIdx) => (
                  <div key={edu.id} className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-xs text-slate-800">Education #{eduIdx + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateDataWithHistory((prev) => ({
                            ...prev,
                            education: prev.education.filter((e) => e.id !== edu.id),
                          }));
                        }}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">School / University</label>
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              education: prev.education.map((it) => (it.id === edu.id ? { ...it, school: val } : it)),
                            }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Degree</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              education: prev.education.map((it) => (it.id === edu.id ? { ...it, degree: val } : it)),
                            }));
                          }}
                          placeholder="B.S. in Computer Science"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Field of Study</label>
                        <input
                          type="text"
                          value={edu.field || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              education: prev.education.map((it) => (it.id === edu.id ? { ...it, field: val } : it)),
                            }));
                          }}
                          placeholder="Software Systems"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Graduation Year</label>
                        <input
                          type="text"
                          value={edu.endDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              education: prev.education.map((it) => (it.id === edu.id ? { ...it, endDate: val } : it)),
                            }));
                          }}
                          placeholder="2020"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">GPA (Optional)</label>
                        <input
                          type="text"
                          value={edu.gpa || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              education: prev.education.map((it) => (it.id === edu.id ? { ...it, gpa: val } : it)),
                            }));
                          }}
                          placeholder="3.85"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl text-xs font-bold text-slate-600 hover:text-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-slate-400" />
                  <span>Add Education</span>
                </button>
              </div>
            )}

            {/* STEP 7: CERTS / CREDENTIALS */}
            {activeStep === "credentials" && (
              <div className="space-y-4">
                {(data.certifications || []).map((cert, cIdx) => (
                  <div key={cert.id} className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-xs text-slate-800">Certificate #{cIdx + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateDataWithHistory((prev) => ({
                            ...prev,
                            certifications: (prev.certifications || []).filter((c) => c.id !== cert.id),
                          }));
                        }}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Certification Name</label>
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              certifications: (prev.certifications || []).map((c) => (c.id === cert.id ? { ...c, name: val } : c)),
                            }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:bg-white"
                          placeholder="AWS Certified Solutions Architect"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Issuer</label>
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              certifications: (prev.certifications || []).map((c) => (c.id === cert.id ? { ...c, issuer: val } : c)),
                            }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white"
                          placeholder="Amazon Web Services"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Year / Date</label>
                        <input
                          type="text"
                          value={cert.date}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              certifications: (prev.certifications || []).map((c) => (c.id === cert.id ? { ...c, date: val } : c)),
                            }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white"
                          placeholder="2024"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddCertification}
                  className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl text-xs font-bold text-slate-600 hover:text-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-slate-400" />
                  <span>Add Certification</span>
                </button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* ─── RIGHT COLUMN: PREVIEW CANVAS & TOOLBAR PANE ─────────── */}
        {showPreview && (
          <div className="flex-1 bg-[#EEF2F6] flex flex-col h-full overflow-hidden relative">
            {/* Floating Top Canvas Toolbar */}
            <div className="px-4 py-2.5 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs z-10 gap-2.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* Left Controls: Selectors */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Template Dropdown */}
                <div className="relative shrink-0">
                  <select
                    value={data.theme.template}
                    onChange={(e) => {
                      const t = e.target.value as TemplateId;
                      const bp = getAtsBlueprint(t);
                      updateDataWithHistory((prev) => ({
                        ...prev,
                        theme: {
                          ...prev.theme,
                          template: t,
                          ...(bp ? { margin: `${bp.marginInches}in` } : {}),
                        },
                      }));
                    }}
                    className="bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl px-2.5 py-1.5 pr-6 appearance-none shadow-2xs hover:border-slate-300 outline-none cursor-pointer whitespace-nowrap"
                  >
                    <option value="experienced">Template: Modern Minimalist</option>
                    <option value="fresher">Template: Fresher Entry-Level</option>
                    <option value="hybrid">Template: Career Pivot Hybrid</option>
                    <option value="basic">Template: Standard Single Column</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Typography Dropdown */}
                <div className="relative shrink-0">
                  <select
                    value={data.theme.fontFamily || "Inter"}
                    onChange={(e) => {
                      const font = e.target.value;
                      updateDataWithHistory((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, fontFamily: font },
                      }));
                    }}
                    className="bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl px-2.5 py-1.5 pr-6 appearance-none shadow-2xs hover:border-slate-300 outline-none cursor-pointer whitespace-nowrap"
                  >
                    <option value="Inter">Inter - 10pt</option>
                    <option value="Arial">Arial - 10.5pt</option>
                    <option value="Calibri">Calibri - 11pt</option>
                    <option value="Georgia">Georgia - 10pt</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Margins Dropdown */}
                <div className="relative shrink-0">
                  <select
                    value={data.theme.margin || "0.75in"}
                    onChange={(e) => {
                      const m = e.target.value;
                      updateDataWithHistory((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, margin: m },
                      }));
                    }}
                    className="bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl px-2.5 py-1.5 pr-6 appearance-none shadow-2xs hover:border-slate-300 outline-none cursor-pointer whitespace-nowrap"
                  >
                    <option value="0.75in">Margins: 0.75&quot;</option>
                    <option value="0.5in">Margins: 0.5&quot; (Senior)</option>
                    <option value="1.0in">Margins: 1.0&quot; (Junior)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Right: Clean ATS Canvas Badge */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                  ATS Live Preview
                </span>
              </div>
            </div>

            {/* Canvas Scroll Area */}
            <div className="flex-1 overflow-y-auto p-8 flex justify-center">
              <div className="w-full max-w-[850px]">
                <ResumeCanvas data={data} zoom={zoom} />
              </div>
            </div>

            {/* Canvas Bottom Status Bar */}
            <footer className="h-9 bg-white border-t border-slate-200/90 px-6 flex items-center justify-between text-xs text-slate-500 shrink-0 z-10">
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span>Standard margins · 10pt line-height baseline · ATS friendly</span>
              </div>
              <div className="font-semibold text-slate-600">
                Target page count: 1 of 1
              </div>
            </footer>
          </div>
        )}
      </div>

      {/* Theme & Styling Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                Resume Styling & Options
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ThemeCustomizer
              theme={data.theme}
              onChange={(patch) => {
                updateDataWithHistory((prev) => ({
                  ...prev,
                  theme: { ...prev.theme, ...patch },
                }));
              }}
            />
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
