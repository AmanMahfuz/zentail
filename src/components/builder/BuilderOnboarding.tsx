"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Sparkles, ArrowRight, Wand2, X, GraduationCap,
  Briefcase, UserCheck, RefreshCw, CheckCircle2
} from "lucide-react";
import { TemplateId } from "@/types/resume-builder";

interface BuilderOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyConfig: (config: {
    targetRole: string;
    seniority: "fresher" | "student" | "professional" | "switcher";
    recommendedTemplate: TemplateId;
  }) => void;
}

export default function BuilderOnboarding({
  isOpen,
  onClose,
  onApplyConfig,
}: BuilderOnboardingProps) {
  const [step, setStep] = useState(1);
  const [targetRole, setTargetRole] = useState("");
  const [seniority, setSeniority] = useState<"fresher" | "student" | "professional" | "switcher">("professional");
  const [targetJobDescription, setTargetJobDescription] = useState("");
  const [recommendedTemplate, setRecommendedTemplate] = useState<TemplateId>("basic");

  if (!isOpen) return null;

  const handleNextFromStep1 = () => {
    // Determine recommended template based on seniority
    if (seniority === "fresher" || seniority === "student") {
      setRecommendedTemplate("fresher");
    } else if (seniority === "switcher") {
      setRecommendedTemplate("fresher");
    } else {
      setRecommendedTemplate("basic");
    }
    setStep(2);
  };

  const handleFinish = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zentail_builder_onboarded", "true");
    }
    onApplyConfig({
      targetRole: targetRole.trim() || "Software Engineer",
      seniority,
      recommendedTemplate,
    });
    onClose();
  };

  const quickRoles = [
    "Full Stack Engineer",
    "Frontend Developer",
    "Backend Engineer",
    "Cloud / DevOps Architect",
    "AI / ML Engineer",
    "Product Manager",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative my-6">
        {/* Top Progress Ribbon */}
        <div className="h-1.5 w-full bg-slate-100 flex">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          title="Skip or Close"
        >
          <X className="w-4 h-4" />
        </button>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Target Role & Seniority ───────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 sm:p-10"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">What role are you targeting?</h2>
                <p className="text-xs text-slate-500 mt-1">
                  We'll customize your layout, ATS keyword emphasis, and section hierarchy.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Target Job Title
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Full Stack Engineer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {quickRoles.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTargetRole(r)}
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        + {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Which best describes your experience level?
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      {
                        id: "professional",
                        label: "Experienced Professional",
                        desc: "2+ years in industry",
                        icon: Briefcase,
                      },
                      {
                        id: "fresher",
                        label: "Recent Graduate / Fresher",
                        desc: "Early career & projects",
                        icon: GraduationCap,
                      },
                      {
                        id: "student",
                        label: "Student / Intern",
                        desc: "Internships & coursework",
                        icon: UserCheck,
                      },
                      {
                        id: "switcher",
                        label: "Career Switcher",
                        desc: "Transferable skills focus",
                        icon: RefreshCw,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = seniority === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSeniority(item.id as any)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            active
                              ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600 shadow-xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} />
                            <span className="text-xs font-bold text-slate-900">{item.label}</span>
                          </div>
                          <p className="text-[10px] text-slate-500">{item.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Skip Onboarding
                </button>
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Optional Job Description ──────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 sm:p-10"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Target Job Description (Optional)</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Paste the requirements to automatically calculate your ATS match score in real-time.
                </p>
              </div>

              <div className="mb-6">
                <textarea
                  value={targetJobDescription}
                  onChange={(e) => setTargetJobDescription(e.target.value)}
                  placeholder="Paste the job requirements, responsibilities, or tech stack here (or skip)..."
                  rows={6}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs"
                >
                  Configure Studio <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Recommended Architecture & Confirmation ───── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 sm:p-10"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Wand2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Configuration Ready</h2>
                <p className="text-xs text-slate-500 mt-1">
                  We've tailored the studio framework to your target role.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Target Role</span>
                  <span className="font-bold text-slate-900">{targetRole || "Software Engineer"}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Experience Track</span>
                  <span className="font-bold capitalize text-slate-900">{seniority}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Recommended Template</span>
                  <span className="font-bold text-blue-600 uppercase tracking-wider">
                    {recommendedTemplate === "fresher"
                      ? "Fresher / Skills-First"
                      : recommendedTemplate === "balanced"
                      ? "Balanced Executive"
                      : "Modern Basic ATS"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
              >
                Launch Interactive Studio <CheckCircle2 className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
