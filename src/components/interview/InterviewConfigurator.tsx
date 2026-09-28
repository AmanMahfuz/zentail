"use client";

import React, { useState, useEffect } from "react";
import { useInterviewStore, InterviewGoal } from "@/store/useInterviewStore";
import { Target, Mic, Keyboard, Zap, ChevronRight, Play } from "lucide-react";
import {
  getInterviewConfigForRole,
  InterviewRoleFamily,
  InterviewTrack,
} from "@/config/interviewTracks";

const ROLE_FAMILIES: { value: InterviewRoleFamily; label: string }[] = [
  { value: "technology", label: "Technology / Engineering" },
  { value: "data", label: "Data & Analytics" },
  { value: "design", label: "Design & UX" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "finance", label: "Finance" },
  { value: "human_resources", label: "Human Resources" },
  { value: "business", label: "Business / Strategy" },
  { value: "operations", label: "Operations" },
  { value: "general", label: "General / Other" },
];

interface InterviewConfiguratorProps {
  initialRole?: string;
  initialCompany?: string;
  initialJobDescription?: string;
  applicationId?: string | null;
  onSessionStarted?: () => void;
}

export default function InterviewConfigurator({
  initialRole = "",
  initialCompany = "",
  initialJobDescription = "",
  applicationId = null,
  onSessionStarted,
}: InterviewConfiguratorProps) {
  const { setConfig, startInterview } = useInterviewStore();

  const [roleFamily, setRoleFamily] = useState<InterviewRoleFamily>("technology");
  const [targetRole, setTargetRole] = useState(initialRole || "");
  const [company, setCompany] = useState(initialCompany || "");
  const [jobDescription, setJobDescription] = useState(initialJobDescription || "");

  const [goal, setGoal] = useState<InterviewGoal>("full_mock");
  const [simulationMode, setSimulationMode] = useState<"voice" | "text">("text");
  const [difficulty, setDifficulty] = useState("Intermediate");

  const [selectedTracks, setSelectedTracks] = useState<InterviewTrack[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  // Infer role family if role contains keywords
  useEffect(() => {
    if (initialRole) {
      setTargetRole(initialRole);
      const lower = initialRole.toLowerCase();
      if (lower.includes("market") || lower.includes("growth") || lower.includes("seo")) {
        setRoleFamily("marketing");
      } else if (lower.includes("sales") || lower.includes("account executive") || lower.includes("bdr")) {
        setRoleFamily("sales");
      } else if (lower.includes("data") || lower.includes("ml") || lower.includes("ai")) {
        setRoleFamily("data");
      } else if (lower.includes("design") || lower.includes("ui") || lower.includes("ux")) {
        setRoleFamily("design");
      } else if (lower.includes("finance") || lower.includes("accountant")) {
        setRoleFamily("finance");
      } else if (lower.includes("hr") || lower.includes("people") || lower.includes("talent")) {
        setRoleFamily("human_resources");
      } else {
        setRoleFamily("technology");
      }
    }
    if (initialCompany) setCompany(initialCompany);
    if (initialJobDescription) setJobDescription(initialJobDescription);
  }, [initialRole, initialCompany, initialJobDescription]);

  // Update recommended tracks when role family changes
  useEffect(() => {
    const config = getInterviewConfigForRole(roleFamily);
    setSelectedTracks(config.defaultTracks);
  }, [roleFamily]);

  const toggleTrack = (track: InterviewTrack) => {
    if (selectedTracks.includes(track)) {
      setSelectedTracks(selectedTracks.filter((t) => t !== track));
    } else {
      setSelectedTracks([...selectedTracks, track]);
    }
  };

  const handleStart = async () => {
    if (!targetRole.trim()) {
      alert("Please enter a Target Role title");
      return;
    }

    setIsStarting(true);
    let budgetLimit = 5;

    if (goal === "practice_question") budgetLimit = 2;
    else if (goal === "fix_weakness") budgetLimit = 4;
    else if (goal === "full_mock") budgetLimit = selectedTracks.length * 2 + 2;
    else if (goal === "technical_round") budgetLimit = 5;

    const newConfig = {
      goal,
      mode: goal,
      role: targetRole,
      roleFamily,
      tracks: selectedTracks,
      difficulty,
      simulationMode,
      budgetLimit,
      jobDescription,
      company,
      applicationId,
    };

    setConfig(newConfig as any);

    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });

      const data = await res.json();

      if (data.success && data.questions) {
        startInterview(data.questions, data.sessionId);
        if (onSessionStarted) onSessionStarted();
      } else {
        alert(data.error || "Failed to start interview session");
        setIsStarting(false);
      }
    } catch (e: any) {
      console.error(e);
      alert("An error occurred while starting the session.");
      setIsStarting(false);
    }
  };

  const roleConfig = getInterviewConfigForRole(roleFamily);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Interactive AI Interview Simulation
          </h2>
          <p className="text-sm text-slate-500">
            Configure your target role competencies, choose between Voice or Text chat, and practice adaptive questions.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row gap-8">
          {/* Left Column: Role Details & Form */}
          <div className="flex-1 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Role Family
              </label>
              <select
                value={roleFamily}
                onChange={(e) => setRoleFamily(e.target.value as InterviewRoleFamily)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {ROLE_FAMILIES.map((rf) => (
                  <option key={rf.value} value={rf.value}>
                    {rf.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Target Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Target Company
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stripe, Google, or Startup"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Job Description (Optional Context)
              </label>
              <textarea
                rows={3}
                placeholder="Paste key responsibilities or leave empty for general role questions..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Simulation Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSimulationMode("text")}
                  className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    simulationMode === "text"
                      ? "border-indigo-600 bg-indigo-50/70 text-indigo-700 font-bold"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Keyboard size={20} />
                  <span className="text-xs">Text & Code Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationMode("voice")}
                  className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    simulationMode === "voice"
                      ? "border-indigo-600 bg-indigo-50/70 text-indigo-700 font-bold"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Mic size={20} />
                  <span className="text-xs">Live Voice Call</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as InterviewGoal)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="practice_question">Practice Questions (2-3)</option>
                  <option value="technical_round">Technical & Coding (5)</option>
                  <option value="fix_weakness">Targeted Weakness Fixing</option>
                  <option value="full_mock">Full Mock Interview</option>
                  <option value="final_round">Executive Final Round</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Difficulty
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {["Beginner", "Intermediate", "Advanced"].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
                        difficulty === diff
                          ? "bg-white shadow-xs text-indigo-600"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tracks & Competencies */}
          <div className="flex-1 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-8">
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                  <Zap size={14} className="text-amber-500" />
                  Interview Tracks
                </h3>
                <p className="text-xs text-slate-500">
                  Select which competencies to evaluate during this simulation:
                </p>
              </div>

              <div className="space-y-2">
                {roleConfig.defaultTracks.map((track) => {
                  const isSelected = selectedTracks.includes(track);
                  const trackLabels: Record<string, string> = {
                    behavioral: "Behavioral & Culture Fit",
                    technical: "Technical Concepts",
                    coding: "Live Coding & Algorithms",
                    project_deep_dive: "Architecture & Project Deep Dive",
                    system_design: "System Design",
                    campaign_strategy: "Campaign Strategy",
                    marketing_analytics: "Marketing Analytics",
                    communication: "Communication Skills",
                    product_pitch: "Product Pitch",
                    objection_handling: "Objection Handling",
                    customer_roleplay: "Customer Roleplay",
                    portfolio_review: "Portfolio Review",
                  };

                  return (
                    <div
                      key={track}
                      onClick={() => toggleTrack(track)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/60"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white font-bold"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && "✓"}
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? "text-indigo-950 font-bold" : "text-slate-700"
                        }`}
                      >
                        {trackLabels[track] || track}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Core Evaluation Signals
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {roleConfig.competencies.map((comp) => (
                    <span
                      key={comp}
                      className="text-[10px] font-medium bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700"
                    >
                      {comp.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={handleStart}
                disabled={isStarting}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {isStarting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Dynamic Plan...
                  </span>
                ) : (
                  <>
                    <span>Start Interview Session</span>
                    <Play size={16} className="fill-current" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
