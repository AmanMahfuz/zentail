"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  GraduationCap,
  FolderGit2,
  Briefcase,
  Code2,
  User as UserIcon,
  Check
} from "lucide-react";
import { generateMasterResume } from "@/lib/actions/ai-resume-generator";
import { cn } from "@/lib/utils";

const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python",
  "HTML/CSS", "Tailwind CSS", "PostgreSQL", "MongoDB", "Git", "REST APIs",
  "Supabase", "Docker", "SQL"
];

export function AIGenerateModal({
  children,
  forceOpen = false,
  onClose
}: {
  children?: React.ReactElement;
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalStep, setModalStep] = useState<number>(1);

  // ─── Box 1: Basics & Target ───────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [targetRole, setTargetRole] = useState("Frontend Developer");
  const [location, setLocation] = useState("");

  // ─── Box 2: Education ─────────────────────────────────────────────────────
  const [educations, setEducations] = useState([
    { id: "1", degree: "B.Tech Computer Science", institution: "State University", graduationYear: "2025" }
  ]);

  // ─── Box 3: Projects ──────────────────────────────────────────────────────
  const [projects, setProjects] = useState([
    {
      id: "1",
      title: "Interactive Web App",
      description: "Built a responsive web application featuring real-time dashboard analytics, authentication, and REST API integration.",
      techStack: "React, TypeScript, Tailwind CSS"
    }
  ]);

  // ─── Box 4: Skills ────────────────────────────────────────────────────────
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "JavaScript", "TypeScript", "React", "Tailwind CSS", "Git"
  ]);
  const [customSkill, setCustomSkill] = useState("");

  // ─── Box 5: Experience ────────────────────────────────────────────────────
  const [isFresher, setIsFresher] = useState(true);
  const [experiences, setExperiences] = useState([
    {
      id: "1",
      title: "Software Intern",
      company: "Tech Solutions",
      duration: "06/2024 - 08/2024",
      description: "Assisted in building frontend components and resolving user interface tickets."
    }
  ]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onClose) {
      onClose();
    }
  };

  const handleNext = () => {
    if (modalStep === 1 && !fullName.trim()) {
      setError("Please enter your name to continue.");
      return;
    }
    setError(null);
    setModalStep(prev => Math.min(5, prev + 1));
  };

  const handleBack = () => {
    setError(null);
    setModalStep(prev => Math.max(1, prev - 1));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    const structuredPayload = {
      fullName: fullName.trim() || "Candidate",
      targetRole: targetRole.trim(),
      location: location.trim() || "Remote",
      education: educations.map(e => ({
        degree: e.degree,
        university: e.institution,
        graduationYear: e.graduationYear
      })),
      projects: projects.map(p => ({
        title: p.title,
        description: p.description,
        techStack: p.techStack.split(",").map(t => t.trim()).filter(Boolean)
      })),
      skills: selectedSkills.map(s => ({ name: s, proficiency: "Intermediate" })),
      experience: isFresher ? [] : experiences.map(exp => ({
        title: exp.title,
        company: exp.company,
        startDate: exp.duration.split("-")[0]?.trim() || "01/2024",
        endDate: exp.duration.split("-")[1]?.trim() || "Present",
        currentlyWorking: exp.duration.toLowerCase().includes("present"),
        description: exp.description
      }))
    };

    const result = await generateMasterResume(structuredPayload);

    if (result.success) {
      handleOpenChange(false);
      if (result.resumeId) {
        router.push(`/resumes/builder?resumeId=${result.resumeId}`);
      } else {
        router.push("/resumes/builder");
      }
    } else {
      setError(result.message || "Failed to generate resume.");
    }
    setIsGenerating(false);
  };

  const STEP_LABELS = [
    { num: 1, label: "Basics" },
    { num: 2, label: "Education" },
    { num: 3, label: "Projects" },
    { num: 4, label: "Skills" },
    { num: 5, label: "Experience" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!forceOpen && (
        <DialogTrigger
          nativeButton={true}
          render={
            children || (
              <button className={cn(buttonVariants(), "bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl shadow-sm h-11 px-6 font-medium")}>
                <Sparkles className="w-4 h-4 mr-2" /> AI Generate
              </button>
            )
          }
        />
      )}
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-3xl border border-slate-200">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 text-white">
          <DialogTitle className="flex items-center gap-2 text-white text-lg font-bold">
            <Sparkles className="w-5 h-5 text-indigo-200" />
            AI Resume Builder Wizard
          </DialogTitle>
          <p className="text-indigo-100 text-xs mt-1">
            Fill in each structured section. Our AI will compile and format it into a complete Master Resume.
          </p>

          {/* Stepper Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-indigo-500/40">
            {STEP_LABELS.map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setModalStep(s.num)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  modalStep === s.num
                    ? "bg-white text-indigo-700 shadow-sm"
                    : modalStep > s.num
                    ? "bg-indigo-500/50 text-white"
                    : "bg-indigo-700/60 text-indigo-200 opacity-60"
                }`}
              >
                {modalStep > s.num ? <Check className="w-3 h-3" /> : <span>{s.num}.</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
          {error && (
            <div className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* ── BOX 1: BASICS & TARGET ── */}
          {modalStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-indigo-600" /> 1. Basics & Target Direction
                </h3>
                <p className="text-xs text-slate-500">Who is this resume for and what role are you aiming for?</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Role Title
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Frontend Developer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Location / Work Preference
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco or Remote"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── BOX 2: EDUCATION ── */}
          {modalStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-600" /> 2. Education
                  </h3>
                  <p className="text-xs text-slate-500">Add your college degree and graduation year.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEducations([...educations, { id: String(Date.now()), degree: "", institution: "", graduationYear: "" }])}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another
                </button>
              </div>

              {educations.map((edu) => (
                <div key={edu.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                  {educations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setEducations(educations.filter(e => e.id !== edu.id))}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Degree / Course</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEducations(educations.map(ed => ed.id === edu.id ? { ...ed, degree: val } : ed));
                        }}
                        placeholder="e.g. MCA, B.S. Computer Science"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">College / University</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEducations(educations.map(ed => ed.id === edu.id ? { ...ed, institution: val } : ed));
                        }}
                        placeholder="e.g. Jai Bharath College"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Graduation Year / Range</label>
                    <input
                      type="text"
                      value={edu.graduationYear}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEducations(educations.map(ed => ed.id === edu.id ? { ...ed, graduationYear: val } : ed));
                      }}
                      placeholder="e.g. 2025 - 2027"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── BOX 3: PROJECTS ── */}
          {modalStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <FolderGit2 className="w-4 h-4 text-indigo-600" /> 3. Key Projects
                  </h3>
                  <p className="text-xs text-slate-500">Crucial proof of skills for students and developers.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setProjects([...projects, { id: String(Date.now()), title: "", description: "", techStack: "" }])}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              </div>

              {projects.map((proj) => (
                <div key={proj.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setProjects(projects.filter(p => p.id !== proj.id))}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Project Name</label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProjects(projects.map(p => p.id === proj.id ? { ...p, title: val } : p));
                      }}
                      placeholder="e.g. AI Fitness Tracker"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      What did you build & what does it do?
                    </label>
                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProjects(projects.map(p => p.id === proj.id ? { ...p, description: val } : p));
                      }}
                      placeholder="e.g. Created a full-stack mobile app with custom workout tracking, meal plans, and real-time database sync."
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Technologies Used (comma separated)
                    </label>
                    <input
                      type="text"
                      value={proj.techStack}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProjects(projects.map(p => p.id === proj.id ? { ...p, techStack: val } : p));
                      }}
                      placeholder="e.g. React Native, Supabase, Node.js"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── BOX 4: SKILLS ── */}
          {modalStep === 4 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-indigo-600" /> 4. Core Skills
                </h3>
                <p className="text-xs text-slate-500">Pick or type the technical skills you want on your resume.</p>
              </div>

              {/* Custom input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const t = customSkill.trim();
                      if (t && !selectedSkills.includes(t)) {
                        setSelectedSkills([...selectedSkills, t]);
                        setCustomSkill("");
                      }
                    }
                  }}
                  placeholder="Type a skill and press Enter..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const t = customSkill.trim();
                    if (t && !selectedSkills.includes(t)) {
                      setSelectedSkills([...selectedSkills, t]);
                      setCustomSkill("");
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                >
                  + Add
                </button>
              </div>

              {/* Selected Skill Tags */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">
                  Selected Skills ({selectedSkills.length})
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-medium"
                    >
                      ✓ {s}
                      <button
                        type="button"
                        onClick={() => setSelectedSkills(selectedSkills.filter(item => item !== s))}
                        className="hover:text-red-500 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick suggestions */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Quick Add</label>
                <div className="flex flex-wrap gap-1">
                  {COMMON_SKILLS.filter(s => !selectedSkills.includes(s)).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => setSelectedSkills([...selectedSkills, skill])}
                      className="text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── BOX 5: EXPERIENCE (OPTIONAL) ── */}
          {modalStep === 5 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-indigo-600" /> 5. Experience / Internships
                </h3>
                <p className="text-xs text-slate-500">Optional for freshers and students.</p>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-900">Are you a Fresher / Student?</span>
                  <p className="text-[11px] text-indigo-700">Skip formal job experience and focus on projects.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-indigo-900">
                  <input
                    type="checkbox"
                    checked={isFresher}
                    onChange={(e) => setIsFresher(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  I am a fresher (Skip)
                </label>
              </div>

              {!isFresher && (
                <div className="space-y-3">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Job Title</label>
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setExperiences(experiences.map(ex => ex.id === exp.id ? { ...ex, title: val } : ex));
                            }}
                            placeholder="e.g. Software Intern"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => {
                              const val = e.target.value;
                              setExperiences(experiences.map(ex => ex.id === exp.id ? { ...ex, company: val } : ex));
                            }}
                            placeholder="e.g. Acme Inc"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Duration</label>
                        <input
                          type="text"
                          value={exp.duration}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExperiences(experiences.map(ex => ex.id === exp.id ? { ...ex, duration: val } : ex));
                          }}
                          placeholder="e.g. 06/2024 - 08/2024"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">What did you work on?</label>
                        <textarea
                          rows={2}
                          value={exp.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExperiences(experiences.map(ex => ex.id === exp.id ? { ...ex, description: val } : ex));
                          }}
                          placeholder="Key responsibilities and achievements..."
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Modal Footer Controls ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          {modalStep > 1 ? (
            <Button type="button" variant="outline" size="sm" onClick={handleBack} className="rounded-xl">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="rounded-xl text-slate-500">
              Cancel
            </Button>
          )}

          {modalStep < 5 ? (
            <Button type="button" size="sm" onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
              Next: {STEP_LABELS[modalStep]?.label} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md font-bold text-xs"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Master Resume...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" /> Generate Master Resume →
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
