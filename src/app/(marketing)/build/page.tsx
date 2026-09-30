// src/app/(marketing)/build/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Code2,
  FolderGit2,
  Award,
  Layers,
  Check,
  ExternalLink,
  ChevronRight,
  Building2,
  MapPin,
  Mail,
  User as UserIcon,
  Phone,
  Globe,
  Link2,
  Loader2,
  Lock,
  Wand2,
  Eye,
  FileText
} from "lucide-react";
import { polishTextWithAI, auditProfileAgainstJob, ProfileAuditResult } from "@/lib/actions/profile-builder";
import { classifySkillName } from "@/lib/resume/skills-categorizer";

// ─── Data Types ─────────────────────────────────────────────────────────────

interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  graduationYear: string;
  specialization?: string;
}

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  isPolishing?: boolean;
}

interface ExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
  skillsUsed: string[];
  isPolishing?: boolean;
}

interface SkillItem {
  name: string;
  proficiency: "Beginner" | "Familiar" | "Proficient" | "Advanced";
}

interface AchievementItem {
  id: string;
  title: string;
  issuer: string;
  year: string;
}

interface CertificationItem {
  id: string;
  name: string;
  organization: string;
  year: string;
}

const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python", 
  "HTML5", "CSS3", "Tailwind CSS", "PostgreSQL", "MongoDB", "Git", 
  "REST APIs", "GraphQL", "Supabase", "Docker", "AWS", "SQL"
];

const DEFAULT_JD = `Role: Full Stack Software Engineer
Company: Innovate Labs
Location: Remote (US / Global)

About the Job:
We are looking for an enthusiastic Software Engineer to help build scalable web applications.
Requirements:
- Hands-on experience with modern JavaScript / TypeScript frameworks (React, Next.js).
- Understanding of backend APIs, relational databases, and state management.
- Ability to design clean UI components with modern CSS / Tailwind.
- Strong problem-solving mindset and eagerness to learn fast.`;

export default function ProfileBuilderPage() {
  const router = useRouter();
  const supabase = createClient();

  // ─── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<number>(1);
  const [jd, setJd] = useState("");
  const [extractedJdInfo, setExtractedJdInfo] = useState<{ role?: string; company?: string }>({});
  const [candidateType, setCandidateType] = useState<"fresher" | "experienced">("fresher");

  // Step 1: Basics
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // Step 2: Target
  const [targetRole, setTargetRole] = useState("Full Stack Developer");
  const [workType, setWorkType] = useState<"Remote" | "Hybrid" | "On-site">("Remote");

  // Step 3: Education
  const [educations, setEducations] = useState<EducationItem[]>([
    { id: "1", degree: "B.Tech Computer Science", institution: "State University", graduationYear: "2025", specialization: "Software Engineering" }
  ]);

  // Step 4: Projects
  const [projects, setProjects] = useState<ProjectItem[]>([
    {
      id: "1",
      title: "Interactive Web Application",
      description: "Built a responsive full-stack platform with user authentication, real-time dashboard analytics, and REST API integration.",
      techStack: ["React", "TypeScript", "Tailwind CSS", "Supabase"],
      githubUrl: "",
      liveUrl: ""
    }
  ]);
  const [newProjectTech, setNewProjectTech] = useState<{ [id: string]: string }>({});

  // Step 5: Experience
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [newExpTech, setNewExpTech] = useState<{ [id: string]: string }>({});

  // Step 6: Skills
  const [skills, setSkills] = useState<SkillItem[]>([
    { name: "JavaScript", proficiency: "Proficient" },
    { name: "TypeScript", proficiency: "Proficient" },
    { name: "React", proficiency: "Proficient" },
    { name: "Tailwind CSS", proficiency: "Proficient" },
    { name: "Git", proficiency: "Familiar" }
  ]);
  const [customSkillInput, setCustomSkillInput] = useState("");

  // Step 7: Achievements & Certifications
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);

  // Step 8: Review & Audit
  const [auditResult, setAuditResult] = useState<ProfileAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Auth & Finalization
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Lifecycle & Storage ───────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
        if (data.user.email) setEmail(data.user.email);
        if (data.user.user_metadata?.full_name) setFullName(data.user.user_metadata.full_name);
      }
    });

    const storedJd = sessionStorage.getItem("pending_jd") || DEFAULT_JD;
    setJd(storedJd);

    // Quick extraction of role/company from JD text
    const lines = storedJd.split("\n");
    let detectedRole = "";
    let detectedCompany = "";
    for (const l of lines) {
      if (/role:|title:/i.test(l)) detectedRole = l.replace(/role:|title:/i, "").trim();
      if (/company:/i.test(l)) detectedCompany = l.replace(/company:/i, "").trim();
    }
    if (detectedRole) setTargetRole(detectedRole);
    setExtractedJdInfo({ role: detectedRole, company: detectedCompany });
  }, [supabase]);

  // ─── AI Bullet Polisher ────────────────────────────────────────────────────
  const handlePolishProject = async (id: string) => {
    const proj = projects.find(p => p.id === id);
    if (!proj || !proj.description.trim()) return;

    setProjects(prev => prev.map(p => p.id === id ? { ...p, isPolishing: true } : p));
    const result = await polishTextWithAI({
      rawText: proj.description,
      title: proj.title,
      type: "project"
    });

    if (result.success && result.bullets && result.bullets.length > 0) {
      const polished = result.bullets.join("\n• ");
      const combinedSkills = Array.from(new Set([...proj.techStack, ...(result.extractedSkills || [])]));
      setProjects(prev => prev.map(p => p.id === id ? {
        ...p,
        description: "• " + polished,
        techStack: combinedSkills,
        isPolishing: false
      } : p));
    } else {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, isPolishing: false } : p));
    }
  };

  const handlePolishExperience = async (id: string) => {
    const exp = experiences.find(e => e.id === id);
    if (!exp || !exp.description.trim()) return;

    setExperiences(prev => prev.map(e => e.id === id ? { ...e, isPolishing: true } : e));
    const result = await polishTextWithAI({
      rawText: exp.description,
      title: exp.jobTitle,
      companyOrContext: exp.company,
      type: "experience"
    });

    if (result.success && result.bullets && result.bullets.length > 0) {
      const polished = result.bullets.join("\n• ");
      const combinedSkills = Array.from(new Set([...exp.skillsUsed, ...(result.extractedSkills || [])]));
      setExperiences(prev => prev.map(e => e.id === id ? {
        ...e,
        description: "• " + polished,
        skillsUsed: combinedSkills,
        isPolishing: false
      } : e));
    } else {
      setExperiences(prev => prev.map(e => e.id === id ? { ...e, isPolishing: false } : e));
    }
  };

  // ─── Step Transitions ──────────────────────────────────────────────────────
  const goToNextStep = async () => {
    if (step === 1 && !fullName.trim()) {
      alert("Please enter your full name to proceed.");
      return;
    }

    if (step === 7) {
      // Trigger AI profile audit before showing Step 8
      setIsAuditing(true);
      setStep(8);
      const builtProfile = buildProfileObject();
      const audit = await auditProfileAgainstJob({
        profile: builtProfile,
        jobDescription: jd
      });
      setAuditResult(audit);
      setIsAuditing(false);
      return;
    }

    setStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPrevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Build Profile Object ──────────────────────────────────────────────────
  const buildProfileObject = () => {
    const cleanLoc = (location && !location.toLowerCase().includes("remote")) ? location : "";
    return {
      personal: {
        fullName: fullName || "Candidate",
        email: email || "",
        phone: phone || "",
        location: cleanLoc,
        linkedinUrl: linkedinUrl || "",
        githubUrl: githubUrl || "",
        portfolioUrl: portfolioUrl || ""
      },
      currentRole: candidateType === "fresher" ? "Student / Aspiring Engineer" : targetRole,
      targetRole: targetRole,
      summary: `Motivated ${candidateType === "fresher" ? "aspiring developer" : "software professional"} targeting ${targetRole} with verified hands-on project and technical competencies.`,
      skills: skills.map(s => ({
        name: s.name,
        category: classifySkillName(s.name),
        proficiency: s.proficiency.toLowerCase()
      })),
      projects: projects.map(p => ({
        title: p.title,
        description: p.description,
        techStack: p.techStack,
        githubUrl: p.githubUrl || null,
        liveUrl: p.liveUrl || null
      })),
      experience: experiences.map(e => ({
        jobTitle: e.jobTitle,
        company: e.company,
        employmentType: e.employmentType,
        startDate: e.startDate,
        endDate: e.currentlyWorking ? "Present" : e.endDate,
        currentlyWorking: e.currentlyWorking,
        description: e.description,
        skillsUsed: e.skillsUsed
      })),
      education: educations.map(ed => ({
        degree: ed.degree,
        institution: ed.institution,
        graduationYear: ed.graduationYear,
        specialization: ed.specialization || ""
      })),
      achievements,
      certifications
    };
  };

  // ─── Final Submission ──────────────────────────────────────────────────────
  const handleFinalSubmit = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    await executeSubmission();
  };

  const executeSubmission = async () => {
    setIsSubmitting(true);
    const profile = buildProfileObject();

    try {
      const res = await fetch("/api/applications/create-from-landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            ...profile,
            origin_type: "wizard_profile",
            isBuilt: true
          },
          jobDescription: jd,
          analysis: {
            fitScore: auditResult?.fitScore || 78,
            jobTitle: auditResult?.jobTitle || targetRole,
            company: auditResult?.company || extractedJdInfo.company || "Target Company",
            verdict: auditResult?.verdict || "Structured profile matched against target requirements.",
            matched: auditResult?.matchedSkills || skills.slice(0, 3).map(s => s.name),
            partial: skills.slice(3, 5).map(s => s.name),
            missing: auditResult?.missingSkills || ["Cloud Deployment"],
            improvements: auditResult?.recommendations || ["Highlight key project outcomes in interview rounds."]
          },
          originType: "built"
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create application");

      router.push(`/applications/${data.applicationId}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to finalize profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      if (authMode === "signup") {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: authPassword,
          options: { data: { full_name: fullName } }
        });
        if (signUpError) throw signUpError;
        if (authData.user) {
          setCurrentUser(authData.user);
          setShowAuthModal(false);
          await executeSubmission();
        }
      } else {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: authPassword
        });
        if (signInError) throw signInError;
        if (authData.user) {
          setCurrentUser(authData.user);
          setShowAuthModal(false);
          await executeSubmission();
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed.");
      setIsSubmitting(false);
    }
  };

  // ─── Steps Config ──────────────────────────────────────────────────────────
  const STEPS_NAV = [
    { num: 1, label: "Basics" },
    { num: 2, label: "Target" },
    { num: 3, label: "Education" },
    { num: 4, label: "Projects" },
    { num: 5, label: "Experience" },
    { num: 6, label: "Skills" },
    { num: 7, label: "Achievements" },
    { num: 8, label: "Review & Generate" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 pb-24">
      {/* ── Top Navbar ── */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              Z
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base">Zentail</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                Profile Builder
              </span>
            </div>
          </div>

          {extractedJdInfo.company && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium bg-slate-100/90 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Targeting: <strong className="text-slate-900">{extractedJdInfo.role || targetRole}</strong> at <span>{extractedJdInfo.company}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Wizard Container ── */}
      <main className="max-w-4xl mx-auto px-4 pt-8">
        {/* Stepper Progress Bar */}
        <div className="mb-10 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Step {step} of 8: {STEPS_NAV[step - 1].label}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {Math.round((step / 8) * 100)}% Completed
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 8) * 100}%` }}
            />
          </div>

          {/* Step Pills */}
          <div className="hidden sm:grid grid-cols-8 gap-1.5">
            {STEPS_NAV.map((s) => {
              const isCurrent = s.num === step;
              const isDone = s.num < step;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => s.num < step && setStep(s.num)}
                  disabled={s.num > step}
                  className={`text-left p-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    isCurrent
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : isDone
                      ? "text-slate-700 hover:bg-slate-50 cursor-pointer"
                      : "text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {isDone ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <span>{s.num}.</span>
                    )}
                    <span className="truncate">{s.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── STEP 1: BASICS ── */}
        {step === 1 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">1. Basic Information</h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter your core contact details for your ATS master resume header.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Location (City, Country or Remote)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, CA or Remote"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Links & Profiles (Optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="linkedin.com/in/username"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="github.com/username"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="portfolio.dev"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: TARGET & EXPERIENCE LEVEL ── */}
        {step === 2 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">2. Target Role & Profile Type</h2>
              <p className="text-sm text-slate-500 mt-1">
                Customize your target direction so our AI tailors your resume bullets and matches.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  What best describes you?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCandidateType("fresher")}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      candidateType === "fresher"
                        ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      Student / Fresher / Entry Level
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Focus on college projects, coursework, self-taught stacks, and core fundamentals.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCandidateType("experienced")}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      candidateType === "experienced"
                        ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      Working Professional
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Highlight formal job experience, company achievements, leadership, and production systems.
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Target Job Title
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full Stack Developer, Frontend Engineer"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Preferred Work Mode
                </label>
                <div className="flex gap-3">
                  {(["Remote", "Hybrid", "On-site"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setWorkType(type)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        workType === type
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: EDUCATION ── */}
        {step === 3 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">3. Education</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Add your degrees, colleges, and relevant academic background.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEducations([...educations, {
                  id: String(Date.now()),
                  degree: "",
                  institution: "",
                  graduationYear: ""
                }])}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another
              </button>
            </div>

            <div className="space-y-4">
              {educations.map((edu, idx) => (
                <div key={edu.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 relative">
                  {educations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setEducations(educations.filter(e => e.id !== edu.id))}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                      title="Remove education"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Degree / Program</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEducations(prev => prev.map(ed => ed.id === edu.id ? { ...ed, degree: val } : ed));
                        }}
                        placeholder="e.g. MCA, B.Tech Computer Science"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">College / University</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEducations(prev => prev.map(ed => ed.id === edu.id ? { ...ed, institution: val } : ed));
                        }}
                        placeholder="e.g. Jai Bharath College of Management"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Graduation Year (or Range)</label>
                      <input
                        type="text"
                        value={edu.graduationYear}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEducations(prev => prev.map(ed => ed.id === edu.id ? { ...ed, graduationYear: val } : ed));
                        }}
                        placeholder="e.g. 2025 - 2027"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Specialization / GPA (Optional)</label>
                      <input
                        type="text"
                        value={edu.specialization || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEducations(prev => prev.map(ed => ed.id === edu.id ? { ...ed, specialization: val } : ed));
                        }}
                        placeholder="e.g. Artificial Intelligence, 3.8 GPA"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: PROJECTS ── */}
        {step === 4 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">4. Key Projects</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Projects are the #1 proof of skill for freshers. Add 1 to 3 projects you built.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProjects([...projects, {
                  id: String(Date.now()),
                  title: "",
                  description: "",
                  techStack: []
                }])}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            <div className="space-y-5">
              {projects.map((proj, idx) => (
                <div key={proj.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-4 relative">
                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setProjects(projects.filter(p => p.id !== proj.id))}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                      title="Remove project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Project Title</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, title: val } : p));
                        }}
                        placeholder="e.g. AI Fitness Tracker"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">GitHub Link (Optional)</label>
                      <input
                        type="url"
                        value={proj.githubUrl || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, githubUrl: val } : p));
                        }}
                        placeholder="https://github.com/..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Live Demo (Optional)</label>
                      <input
                        type="url"
                        value={proj.liveUrl || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, liveUrl: val } : p));
                        }}
                        placeholder="https://myproject.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-600">
                        What did you build & what impact did it have?
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePolishProject(proj.id)}
                        disabled={proj.isPolishing || !proj.description.trim()}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {proj.isPolishing ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Polishing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3 h-3" /> ✨ AI Polish Bullets
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={proj.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, description: val } : p));
                      }}
                      placeholder="e.g. Developed a full-stack mobile app using React Native and Supabase for tracking daily workouts. Integrated Gemini AI for custom meal recommendations..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Technologies Tags */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Technologies Used</label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {proj.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium"
                        >
                          {tech}
                          <button
                            type="button"
                            onClick={() => {
                              setProjects(prev => prev.map(p => p.id === proj.id ? {
                                ...p,
                                techStack: p.techStack.filter(t => t !== tech)
                              } : p));
                            }}
                            className="hover:text-red-500 font-bold ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newProjectTech[proj.id] || ""}
                          onChange={(e) => setNewProjectTech({ ...newProjectTech, [proj.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = (newProjectTech[proj.id] || "").trim();
                              if (val && !proj.techStack.includes(val)) {
                                setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, techStack: [...p.techStack, val] } : p));
                                setNewProjectTech({ ...newProjectTech, [proj.id]: "" });
                              }
                            }
                          }}
                          placeholder="+ Add tech tag..."
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-white w-28 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 5: EXPERIENCE ── */}
        {step === 5 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">5. Work Experience / Internships</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Add full-time roles, internships, or freelancing. (Optional if you are a fresher).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setExperiences([...experiences, {
                  id: String(Date.now()),
                  jobTitle: "",
                  company: "",
                  employmentType: "Internship",
                  startDate: "",
                  endDate: "",
                  currentlyWorking: false,
                  description: "",
                  skillsUsed: []
                }])}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Experience
              </button>
            </div>

            {experiences.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No formal experience added yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  If you are a student or fresher, your projects and education will be the star of your resume. You can skip this step!
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setExperiences([{
                      id: String(Date.now()),
                      jobTitle: "Software Intern",
                      company: "Tech Company",
                      employmentType: "Internship",
                      startDate: "06/2024",
                      endDate: "08/2024",
                      currentlyWorking: false,
                      description: "Assisted development of web features and bug fixes.",
                      skillsUsed: ["React", "JavaScript"]
                    }])}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    + Add Internship / Freelance
                  </button>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  >
                    I am a fresher (Skip) →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-4 relative">
                    <button
                      type="button"
                      onClick={() => setExperiences(experiences.filter(e => e.id !== exp.id))}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                      title="Remove experience"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Job Title</label>
                        <input
                          type="text"
                          value={exp.jobTitle}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExperiences(prev => prev.map(ex => ex.id === exp.id ? { ...ex, jobTitle: val } : ex));
                          }}
                          placeholder="e.g. Frontend Intern"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExperiences(prev => prev.map(ex => ex.id === exp.id ? { ...ex, company: val } : ex));
                          }}
                          placeholder="e.g. Acme Corp"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                        <select
                          value={exp.employmentType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExperiences(prev => prev.map(ex => ex.id === exp.id ? { ...ex, employmentType: val } : ex));
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="Internship">Internship</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Freelance">Freelance</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExperiences(prev => prev.map(ex => ex.id === exp.id ? { ...ex, startDate: val } : ex));
                          }}
                          placeholder="Start (MM/YYYY)"
                          className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        {!exp.currentlyWorking && (
                          <input
                            type="text"
                            value={exp.endDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setExperiences(prev => prev.map(ex => ex.id === exp.id ? { ...ex, endDate: val } : ex));
                            }}
                            placeholder="End (MM/YYYY)"
                            className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        )}
                      </div>

                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exp.currentlyWorking}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setExperiences(prev => prev.map(ex => ex.id === exp.id ? { ...ex, currentlyWorking: checked } : ex));
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        I currently work here
                      </label>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-600">
                          What were your main responsibilities & accomplishments?
                        </label>
                        <button
                          type="button"
                          onClick={() => handlePolishExperience(exp.id)}
                          disabled={exp.isPolishing || !exp.description.trim()}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {exp.isPolishing ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" /> Polishing...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3 h-3" /> ✨ AI Polish
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={exp.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExperiences(prev => prev.map(ex => ex.id === exp.id ? { ...ex, description: val } : ex));
                        }}
                        placeholder="e.g. Collaborated with 4 engineers to build client-facing dashboard components in React. Reduced bug ticket volume by 20%..."
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 6: SKILLS ── */}
        {step === 6 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">6. Skills & Proficiencies</h2>
              <p className="text-sm text-slate-500 mt-1">
                Select your core technical skills. We'll cross-reference these against your target Job Description.
              </p>
            </div>

            {/* Custom Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = customSkillInput.trim();
                    if (trimmed && !skills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
                      setSkills([...skills, { name: trimmed, proficiency: "Proficient" }]);
                      setCustomSkillInput("");
                    }
                  }
                }}
                placeholder="Type a skill and press Enter (e.g. Docker, GraphQL, Redis)..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = customSkillInput.trim();
                  if (trimmed && !skills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
                    setSkills([...skills, { name: trimmed, proficiency: "Proficient" }]);
                    setCustomSkillInput("");
                  }
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm"
              >
                + Add
              </button>
            </div>

            {/* Selected Skills */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Your Selected Skills ({skills.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold shadow-xs"
                  >
                    <span>✓ {skill.name}</span>
                    <select
                      value={skill.proficiency}
                      onChange={(e) => {
                        const prof = e.target.value as any;
                        setSkills(skills.map(s => s.name === skill.name ? { ...s, proficiency: prof } : s));
                      }}
                      className="text-[10px] bg-white border border-indigo-200 rounded px-1.5 py-0.5 text-indigo-700 font-medium focus:outline-none"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Familiar">Familiar</option>
                      <option value="Proficient">Proficient</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setSkills(skills.filter(s => s.name !== skill.name))}
                      className="text-slate-400 hover:text-red-500 font-bold ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Suggestions */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Quick Add Suggestions
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SKILLS.filter(s => !skills.some(userS => userS.name.toLowerCase() === s.toLowerCase())).map((suggested) => (
                  <button
                    key={suggested}
                    type="button"
                    onClick={() => setSkills([...skills, { name: suggested, proficiency: "Proficient" }])}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    + {suggested}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 7: ACHIEVEMENTS & CERTIFICATIONS ── */}
        {step === 7 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">7. Achievements & Certifications (Optional)</h2>
              <p className="text-sm text-slate-500 mt-1">
                Add competitive achievements, hackathons, or verified certifications to stand out.
              </p>
            </div>

            {/* Achievements */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" /> Competitions & Awards
                </label>
                <button
                  type="button"
                  onClick={() => setAchievements([...achievements, { id: String(Date.now()), title: "", issuer: "", year: "" }])}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  + Add Award
                </button>
              </div>

              {achievements.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No awards added (optional).</p>
              ) : (
                achievements.map((ach) => (
                  <div key={ach.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      placeholder="e.g. 1st Place Web Hackathon"
                      value={ach.title}
                      onChange={(e) => setAchievements(achievements.map(a => a.id === ach.id ? { ...a, title: e.target.value } : a))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="College / Organization"
                      value={ach.issuer}
                      onChange={(e) => setAchievements(achievements.map(a => a.id === ach.id ? { ...a, issuer: e.target.value } : a))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Year (e.g. 2024)"
                        value={ach.year}
                        onChange={(e) => setAchievements(achievements.map(a => a.id === ach.id ? { ...a, year: e.target.value } : a))}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setAchievements(achievements.filter(a => a.id !== ach.id))}
                        className="text-slate-400 hover:text-red-500 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Certifications */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-500" /> Certifications & Licenses
                </label>
                <button
                  type="button"
                  onClick={() => setCertifications([...certifications, { id: String(Date.now()), name: "", organization: "", year: "" }])}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  + Add Certification
                </button>
              </div>

              {certifications.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No certifications added (optional).</p>
              ) : (
                certifications.map((cert) => (
                  <div key={cert.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      placeholder="e.g. AWS Certified Cloud Practitioner"
                      value={cert.name}
                      onChange={(e) => setCertifications(certifications.map(c => c.id === cert.id ? { ...c, name: e.target.value } : c))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Issuing Org (e.g. Amazon)"
                      value={cert.organization}
                      onChange={(e) => setCertifications(certifications.map(c => c.id === cert.id ? { ...c, organization: e.target.value } : c))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Year (e.g. 2024)"
                        value={cert.year}
                        onChange={(e) => setCertifications(certifications.map(c => c.id === cert.id ? { ...c, year: e.target.value } : c))}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setCertifications(certifications.filter(c => c.id !== cert.id))}
                        className="text-slate-400 hover:text-red-500 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── STEP 8: AI REVIEW & GENERATION ── */}
        {step === 8 && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">AI Profile Review</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Your evidence profile is compiled. Here is how your background measures up against the target job.
                  </p>
                </div>
                {auditResult && (
                  <div className="text-right">
                    <div className="text-3xl font-extrabold text-indigo-600">
                      {auditResult.fitScore}%
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Estimated Match
                    </span>
                  </div>
                )}
              </div>

              {/* Profile Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Candidate</span>
                  <p className="text-sm font-bold text-slate-900 truncate">{fullName || "Anonymous"}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Education</span>
                  <p className="text-sm font-bold text-slate-900 truncate">{educations[0]?.degree || "Degree"}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Projects</span>
                  <p className="text-sm font-bold text-slate-900">{projects.length} Built</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Skills</span>
                  <p className="text-sm font-bold text-slate-900">{skills.length} Verified</p>
                </div>
              </div>

              {/* AI Audit Feedback */}
              {isAuditing ? (
                <div className="p-8 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">Analyzing your profile against the job description...</p>
                  <p className="text-xs text-slate-500">Finding matched requirements and high-impact evidence</p>
                </div>
              ) : auditResult ? (
                <div className="space-y-4">
                  {/* Verdict */}
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">AI Screener Verdict</h4>
                      <p className="text-sm font-semibold text-indigo-950 mt-0.5">{auditResult.verdict}</p>
                    </div>
                  </div>

                  {/* Strengths & Recommendations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Supported Strengths
                      </h4>
                      <ul className="text-xs text-slate-700 space-y-1.5">
                        {auditResult.strengths.map((str, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2">
                      <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" /> Key Recommendations
                      </h4>
                      <ul className="text-xs text-slate-700 space-y-1.5">
                        {auditResult.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Big CTA Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Generating Master Resume & Application...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" /> Generate My Master Resume & View Application →
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-slate-400 mt-2">
                  This will generate your formatted ATS resume and prepare your interview workspace.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Wizard Bottom Navigation Controls ── */}
        <div className="mt-6 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={goToPrevStep}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          {step < 8 && (
            <button
              type="button"
              onClick={goToNextStep}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-100"
            >
              Next: {STEPS_NAV[step].label} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>

      {/* ── Auth Modal (if user not signed in yet) ── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold mb-3 shadow-sm">
                Z
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {authMode === "signup" ? "Save your profile & resume" : "Welcome back"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Create an account or sign in to access your master resume and start practicing for interviews.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : authMode === "signup" ? (
                  "Create Account & View Application →"
                ) : (
                  "Sign In & View Application →"
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === "signup" ? "signin" : "signup")}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                {authMode === "signup" ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
