"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, CheckCircle2, ChevronRight, ChevronLeft, Building2, Briefcase, MapPin, Link as LinkIcon, HelpCircle, Upload, FileText, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingInput, onboardingSchema } from "@/lib/validation/onboarding.schema";
import { completeOnboarding } from "@/lib/actions/onboarding";

const SUGGESTED_ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "Data Scientist",
  "Product Manager",
  "UI/UX Designer",
  "Marketing Associate",
  "Finance Analyst",
  "Business Analyst"
];

const EXPERIENCE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "fresher", label: "Fresher / Recent Grad" },
  { value: "0_1_years", label: "0-1 Years" },
  { value: "1_3_years", label: "1-3 Years" },
  { value: "3_5_years", label: "3-5 Years" },
  { value: "5_plus_years", label: "5+ Years" }
];

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [customRole, setCustomRole] = useState("");
  // Step 4 — resume upload
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Step 5 — salary
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const TOTAL_STEPS = 6;

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema) as any,
    defaultValues: {
      targetRoles: [],
      primaryTargetRole: "",
      experienceLevel: undefined,
      experienceYears: 0,
      skills: [],
      locationPreference: "",
      workPreference: [],
      linkedinUrl: "",
    },
    mode: "onChange",
  });

  const { watch, setValue, formState: { errors }, trigger } = form;
  const targetRoles = watch("targetRoles");
  const primaryTargetRole = watch("primaryTargetRole");
  const experienceLevel = watch("experienceLevel");
  const workPreference = watch("workPreference");
  const skills = watch("skills") || [];
  const [customSkill, setCustomSkill] = useState("");

  const SUGGESTED_SKILLS = [
    "React", "Node.js", "TypeScript", "Python", "SQL", "AWS", "UI/UX", "Figma", "Data Analysis", "Project Management"
  ];

  const toggleRole = (role: string) => {
    let newRoles = [...targetRoles];
    if (newRoles.includes(role)) {
      newRoles = newRoles.filter(r => r !== role);
      if (primaryTargetRole === role) {
        setValue("primaryTargetRole", newRoles.length > 0 ? newRoles[0] : "", { shouldValidate: true });
      }
    } else {
      if (newRoles.length < 3) {
        newRoles.push(role);
        if (newRoles.length === 1) {
          setValue("primaryTargetRole", role, { shouldValidate: true });
        }
      }
    }
    setValue("targetRoles", newRoles, { shouldValidate: true });
  };

  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(["targetRoles", "primaryTargetRole"]);
    } else if (step === 2) {
      isValid = await trigger(["experienceLevel", "experienceYears"]);
    } else {
      isValid = true; // steps 3, 4, 5 have optional or handled fields
    }
    if (isValid) setStep(prev => prev + 1);
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setServerError(null);

    const formData = new FormData();
    formData.append("targetRoles", JSON.stringify(data.targetRoles));
    formData.append("primaryTargetRole", data.primaryTargetRole);
    formData.append("experienceLevel", data.experienceLevel);
    formData.append("experienceYears", data.experienceYears.toString());
    formData.append("skills", JSON.stringify(data.skills));
    formData.append("locationPreference", data.locationPreference);
    formData.append("workPreference", JSON.stringify(data.workPreference));
    formData.append("linkedinUrl", data.linkedinUrl || "");
    if (salaryMin) formData.append("salaryMin", salaryMin);
    if (salaryMax) formData.append("salaryMax", salaryMax);

    const result = await completeOnboarding({ success: false }, formData);
    
    if (!result.success) {
      setServerError(result.message || "An error occurred");
      setIsSubmitting(false);
    }
    // On success, the action redirects
  };

  // Step renders
  const renderStep1 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-500" /> Which roles are you targeting?
          </Label>
          <p className="text-sm text-slate-500 mb-3">Select up to 3 roles. This helps us match your resume and track progress.</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {targetRoles.map(role => (
              <div key={role} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
                {role}
                <button type="button" onClick={() => toggleRole(role)} className="hover:text-blue-900 ml-1 font-bold">
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-6">
             <Input 
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="e.g. AI Engineer"
              className="max-w-[250px]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (customRole.trim() && !targetRoles.includes(customRole.trim()) && targetRoles.length < 3) {
                    toggleRole(customRole.trim());
                    setCustomRole("");
                  }
                }
              }}
            />
            <Button 
              type="button" 
              variant="secondary"
              disabled={!customRole.trim() || targetRoles.length >= 3}
              onClick={() => {
                if (customRole.trim() && !targetRoles.includes(customRole.trim()) && targetRoles.length < 3) {
                  toggleRole(customRole.trim());
                  setCustomRole("");
                }
              }}
            >
              Add
            </Button>
          </div>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_ROLES.filter(r => !targetRoles.includes(r)).map(role => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                disabled={targetRoles.length >= 3}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 ${targetRoles.length >= 3 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                + {role}
              </button>
            ))}
          </div>
          {errors.targetRoles && <p className="text-red-500 text-sm mt-2">{errors.targetRoles.message}</p>}
        </div>

        {targetRoles.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-4 border-t border-slate-100">
            <Label className="text-sm font-semibold mb-2 block">Primary Role</Label>
            <p className="text-xs text-slate-500 mb-3">Which of these is your absolute top priority?</p>
            <div className="flex gap-3">
              {targetRoles.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setValue("primaryTargetRole", role, { shouldValidate: true })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all border ${
                    primaryTargetRole === role 
                      ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {primaryTargetRole === role && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                  {role}
                </button>
              ))}
            </div>
            {errors.primaryTargetRole && <p className="text-red-500 text-sm mt-2">{errors.primaryTargetRole.message}</p>}
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-6">
        <div>
          <Label className="text-base font-semibold flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-blue-500" /> What's your experience level?
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {EXPERIENCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setValue("experienceLevel", opt.value as any, { shouldValidate: true });
                  if (opt.value === "student" || opt.value === "fresher") {
                    setValue("experienceYears", 0, { shouldValidate: true });
                  } else if (opt.value === "1_3_years") {
                     setValue("experienceYears", 2, { shouldValidate: true });
                  } else if (opt.value === "3_5_years") {
                     setValue("experienceYears", 4, { shouldValidate: true });
                  } else if (opt.value === "5_plus_years") {
                     setValue("experienceYears", 5, { shouldValidate: true });
                  }
                }}
                className={`p-4 rounded-xl text-left border transition-all ${
                  experienceLevel === opt.value
                    ? "bg-blue-50 border-blue-500 text-blue-800 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="font-semibold text-sm">{opt.label}</div>
              </button>
            ))}
          </div>
          {errors.experienceLevel && <p className="text-red-500 text-sm mt-2">{errors.experienceLevel.message}</p>}
        </div>

        {experienceLevel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <Label className="text-sm font-semibold mb-2 block">Exact Years of Experience</Label>
            <Input 
              type="number"
              {...form.register("experienceYears")}
              className={`max-w-[150px] ${errors.experienceYears ? "border-red-500" : ""}`}
            />
            {errors.experienceYears && <p className="text-red-500 text-sm mt-2">{errors.experienceYears.message}</p>}
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" /> What are your top skills?
          </Label>
          <p className="text-sm text-slate-500 mb-3">Add your most important skills (up to 20). This helps match you with jobs.</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map(skill => (
              <div key={skill} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                {skill}
                <button type="button" onClick={() => setValue("skills", skills.filter(s => s !== skill), { shouldValidate: true })} className="hover:text-indigo-900 ml-1 font-bold">
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-6">
             <Input 
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              placeholder="e.g. Next.js"
              className="max-w-[250px]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (customSkill.trim() && !skills.includes(customSkill.trim()) && skills.length < 20) {
                    setValue("skills", [...skills, customSkill.trim()], { shouldValidate: true });
                    setCustomSkill("");
                  }
                }
              }}
            />
            <Button 
              type="button" 
              variant="secondary"
              disabled={!customSkill.trim() || skills.length >= 20}
              onClick={() => {
                if (customSkill.trim() && !skills.includes(customSkill.trim()) && skills.length < 20) {
                  setValue("skills", [...skills, customSkill.trim()], { shouldValidate: true });
                  setCustomSkill("");
                }
              }}
            >
              Add
            </Button>
          </div>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).map(skill => (
              <button
                key={skill}
                type="button"
                onClick={() => setValue("skills", [...skills, skill], { shouldValidate: true })}
                disabled={skills.length >= 20}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 ${skills.length >= 20 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                + {skill}
              </button>
            ))}
          </div>
          {errors.skills && <p className="text-red-500 text-sm mt-2">{errors.skills.message}</p>}
        </div>
      </div>
    </motion.div>
  );

  // Step 4 — Resume Upload
  const renderStep4 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault(); setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file && (file.type === "application/pdf" || file.name.endsWith(".docx"))) setResumeFile(file);
        }}
        className="border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer"
        style={{
          borderColor: dragOver ? "var(--color-sunset-orange)" : "var(--color-ash-border)",
          backgroundColor: dragOver ? "var(--color-sunset-whisper)" : "var(--color-cloud-mist)",
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) setResumeFile(f); }}
        />
        {resumeFile ? (
          <div>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "var(--color-sunset-whisper)" }}>
              <FileText className="w-7 h-7" style={{ color: "var(--color-sunset-orange)" }} />
            </div>
            <p className="font-semibold" style={{ color: "var(--color-graphite-heading)" }}>{resumeFile.name}</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-slate-body)" }}>{(resumeFile.size / 1024).toFixed(0)} KB</p>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setResumeFile(null); }}
              className="mt-3 flex items-center gap-1 mx-auto text-xs"
              style={{ color: "#ef4444" }}
            >
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          </div>
        ) : (
          <div>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "var(--color-frost-tint)" }}>
              <Upload className="w-7 h-7" style={{ color: "var(--color-fog-text)" }} />
            </div>
            <p className="font-semibold" style={{ color: "var(--color-graphite-heading)" }}>Drop your resume here</p>
            <p className="text-sm mt-1" style={{ color: "var(--color-slate-body)" }}>PDF or DOCX, up to 5 MB</p>
            <p className="text-xs mt-3" style={{ color: "var(--color-fog-text)" }}>or click to browse files</p>
          </div>
        )}
      </div>
      <p className="text-xs text-center" style={{ color: "var(--color-fog-text)" }}>You can also skip this and upload later from the Resumes page.</p>
    </motion.div>
  );

  // Step 5 — Job Preferences
  const renderStep5 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div>
        <Label className="text-base font-semibold flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-blue-500" /> Where do you want to work?
        </Label>
        <Input 
          {...form.register("locationPreference")}
          placeholder="e.g. Remote, San Francisco, London"
          className={errors.locationPreference ? "border-red-500" : ""}
        />
        {errors.locationPreference && <p className="text-red-500 text-sm mt-2">{errors.locationPreference.message}</p>}
        
        <div className="flex gap-3 mt-4">
          {["remote", "hybrid", "onsite"].map(pref => {
            const isSelected = workPreference.includes(pref as any);
            return (
              <button
                key={pref}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setValue("workPreference", workPreference.filter(p => p !== pref), { shouldValidate: true });
                  } else {
                    setValue("workPreference", [...workPreference, pref as any], { shouldValidate: true });
                  }
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize border transition-all ${
                  isSelected 
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {isSelected && "✓ "}{pref}
              </button>
            )
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <Label className="text-base font-semibold flex items-center gap-2 mb-2">
          <LinkIcon className="w-4 h-4 text-blue-500" /> LinkedIn Profile <span className="text-slate-400 font-normal text-xs ml-2">(Optional for now)</span>
        </Label>
        <Input 
          {...form.register("linkedinUrl")}
          placeholder="https://linkedin.com/in/username"
          className={errors.linkedinUrl ? "border-red-500" : ""}
        />
        {errors.linkedinUrl && <p className="text-red-500 text-sm mt-2">{errors.linkedinUrl.message}</p>}
      </div>

      <div className="pt-4 border-t border-slate-100">
        <Label className="text-base font-semibold flex items-center gap-2 mb-3">Salary Expectation (LPA)</Label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-fog-text)" }}>Minimum</p>
            <input
              type="number" placeholder="8" value={salaryMin} onChange={e => setSalaryMin(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-sm outline-none border transition-all ${errors.salaryMin ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-blue-500"}`}
              style={{ backgroundColor: "var(--color-cloud-mist)", color: "var(--color-graphite-heading)" }}
            />
          </div>
          <span className="text-sm" style={{ color: "var(--color-fog-text)" }}>to</span>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-fog-text)" }}>Maximum</p>
            <input
              type="number" placeholder="20" value={salaryMax} onChange={e => setSalaryMax(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none border border-slate-200 focus:border-blue-500 transition-all"
              style={{ backgroundColor: "var(--color-cloud-mist)", color: "var(--color-graphite-heading)" }}
            />
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--color-slate-body)" }}>LPA</span>
        </div>
        {errors.salaryMin && <p className="text-red-500 text-sm mt-2">{errors.salaryMin.message}</p>}
      </div>
    </motion.div>
  );

  // Step 6 — Summary
  const renderStep6 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid var(--color-ash-border)" }}>
        {[
          { label: "Target Roles", value: targetRoles.join(", ") || "Not set" },
          { label: "Primary Role", value: primaryTargetRole || "Not set" },
          { label: "Experience", value: EXPERIENCE_OPTIONS.find(o => o.value === experienceLevel)?.label ?? "Not set" },
          { label: "Skills", value: skills.length > 0 ? `${skills.length} added` : "Not set" },
          { label: "Location", value: watch("locationPreference") || "Not set" },
          { label: "Work Mode", value: workPreference.join(", ") || "Not set" },
          { label: "Resume", value: resumeFile ? `✓ ${resumeFile.name}` : "Not uploaded" },
          { label: "Salary", value: salaryMin && salaryMax ? `${salaryMin}–${salaryMax} LPA` : "Not set" },
        ].map(({ label, value }, i) => (
          <div key={label}
            className="flex items-center justify-between px-5 py-3"
            style={{
              backgroundColor: i % 2 === 0 ? "var(--color-cloud-mist)" : "var(--color-canvas-white)",
              borderBottom: i < 6 ? "1px solid var(--color-ash-border)" : "none",
            }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-fog-text)" }}>{label}</span>
            <span className="text-sm font-medium" style={{ color: "var(--color-graphite-heading)" }}>{value}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 px-1">
        <Zap className="w-4 h-4" style={{ color: "var(--color-sunset-orange)" }} />
        <p className="text-xs" style={{ color: "var(--color-slate-body)" }}>You can always update these from your profile settings.</p>
      </div>
    </motion.div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 rounded p-1.5 shadow-md shadow-blue-500/20">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">Zentail</span>
          </div>
        </div>

        <Card className="w-full border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: "var(--color-frost-tint)" }}>
          <motion.div
            style={{ backgroundColor: "var(--color-sunset-orange)", height: "100%" }}
            initial={{ width: `${(1 / TOTAL_STEPS) * 100}%` }}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

          <CardHeader className="space-y-2 pb-6 pt-8 px-8">
            <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
              {step === 1 && "What roles are you looking for?"}
              {step === 2 && "Tell us about your experience."}
              {step === 3 && "What are your top skills?"}
              {step === 4 && "Upload your resume."}
              {step === 5 && "Job preferences & salary."}
              {step === 6 && "Everything looks good?"}
            </CardTitle>
            <CardDescription className="text-sm" style={{ color: "var(--color-slate-body)" }}>
              {step === 1 && "Select up to 3 roles. This personalizes your dashboard and AI suggestions."}
              {step === 2 && "We'll tailor interview prep and job matches to your experience level."}
              {step === 3 && "Add your strongest skills to help us match you with the right jobs."}
              {step === 4 && "We'll parse it to auto-fill your skills and generate tailored resumes. (Optional)"}
              {step === 5 && "Set your location, work mode, and salary expectations."}
              {step === 6 && "Review your setup before diving in. You can edit anything later."}
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="px-8 min-h-[320px]">
              {serverError && (
                <div className="mb-6 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                  {serverError}
                </div>
              )}
              
              <AnimatePresence mode="wait">
                {step === 1 && <div key="step1">{renderStep1()}</div>}
                {step === 2 && <div key="step2">{renderStep2()}</div>}
                {step === 3 && <div key="step3">{renderStep3()}</div>}
                {step === 4 && <div key="step4">{renderStep4()}</div>}
                {step === 5 && <div key="step5">{renderStep5()}</div>}
                {step === 6 && <div key="step6">{renderStep6()}</div>}
              </AnimatePresence>
            </CardContent>
            
            <CardFooter className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-between">
              {step > 1 ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(prev => prev - 1)}
                  className="rounded-xl border-slate-300"
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              ) : (
                <div /> // Placeholder for flex-between
              )}

              {step < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl"
                  style={{ backgroundColor: "var(--color-sunset-orange)" }}
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl"
                  style={{ backgroundColor: "var(--color-sunset-orange)" }}
                >
                  {isSubmitting ? "Saving…" : "Complete Setup"}
                  {!isSubmitting && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
