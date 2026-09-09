"use client";

import { useState } from "react";
import Link from "next/link";
import { analyzeSkillGaps, generateLearningPath } from "@/lib/actions/phase3";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles, BookOpen, Clock, Tag, GraduationCap, CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function SkillsClient({
  initialGaps, initialPaths, coveragePercent, matchedSkills, totalUnique,
}: {
  initialGaps: any[];
  initialPaths: any[];
  coveragePercent: number;
  matchedSkills: string[];
  totalUnique: number;
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const router = useRouter();

  const coverageColor = coveragePercent >= 75 ? "#16a34a" : coveragePercent >= 50 ? "#d97706" : "var(--color-sunset-orange)";
  const circumference = 2 * Math.PI * 40;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    await analyzeSkillGaps();
    setIsAnalyzing(false);
    router.refresh();
  };

  const handleGeneratePath = async (skillId: string) => {
    setGeneratingFor(skillId);
    await generateLearningPath(skillId);
    setGeneratingFor(null);
    router.refresh();
  };

  const pathSkillIds = new Set(initialPaths.map((p: any) => p.skill?.id));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-[120px] pointer-events-none z-[-1]" />
      {/* ── Coverage Card ──────────────────────────────────────────── */}
      <div
        className="rounded-xl p-6 flex items-center gap-8"
        style={{ backgroundColor: "var(--color-canvas-white)", boxShadow: "var(--shadow-card)" }}
      >
        {/* Ring gauge */}
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-frost-tint)" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={coverageColor}
              strokeWidth="10"
              strokeDasharray={`${(coveragePercent / 100) * circumference} ${circumference}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: coverageColor, fontFamily: "var(--font-display)", lineHeight: 1 }}>{coveragePercent}%</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-fog-text)" }}>Coverage</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-0.5" style={{ fontFamily: "var(--font-display)", color: "var(--color-graphite-heading)", letterSpacing: "-0.02em" }}>
            Skill Coverage
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-slate-body)" }}>
            You have <strong style={{ color: "var(--color-graphite-heading)" }}>{matchedSkills.length}</strong> of{" "}
            <strong style={{ color: "var(--color-graphite-heading)" }}>{totalUnique}</strong> skills required across your target jobs.
          </p>

          {/* Matched skills */}
          {matchedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {matchedSkills.slice(0, 10).map(s => (
                <span key={s} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-default" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                  <CheckCircle2 className="w-2.5 h-2.5" />{s}
                </span>
              ))}
              {matchedSkills.length > 10 && (
                <span className="px-2 py-0.5 rounded-full text-[11px]" style={{ backgroundColor: "var(--color-frost-tint)", color: "var(--color-steel-text)" }}>
                  +{matchedSkills.length - 10} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="text-white"
            style={{ backgroundColor: "var(--color-sunset-orange)", borderRadius: "var(--radius-buttons)" }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isAnalyzing ? "Analyzing…" : "Run AI Analysis"}
          </Button>

        </div>
      </div>

      {/* ── Missing Skills Grid ─────────────────────────────────────── */}
      {initialGaps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-graphite-heading)", letterSpacing: "-0.02em" }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "#d97706" }} />
              Missing Skills ({initialGaps.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialGaps.map((gap, i) => {
              const hasPaths = pathSkillIds.has(gap.id);
              return (
                <div
                  key={gap.id}
                  className="rounded-xl p-4 flex flex-col justify-between"
                  style={{ backgroundColor: "var(--color-canvas-white)", boxShadow: "var(--shadow-card)" }}
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: "var(--color-sunset-whisper)", color: "var(--color-sunset-orange)" }}
                      >
                        {i + 1}
                      </div>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
                      >
                        Priority {gap.priority}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base mt-2" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>{gap.skill_name}</h3>
                    {/* Job count bar */}
                    <div className="mt-2 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px]" style={{ color: "var(--color-fog-text)" }}>Required in jobs</span>
                        <span className="text-[10px] font-semibold" style={{ color: "#d97706" }}>{gap.required_in_count}</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-frost-tint)" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min((gap.required_in_count / 10) * 100, 100)}%`, backgroundColor: "#d97706" }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {initialGaps.length === 0 && (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: "var(--color-canvas-white)", boxShadow: "var(--shadow-card)" }}
        >
          <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-fog-text)" }} />
          <p className="font-semibold" style={{ color: "var(--color-graphite-heading)" }}>No skill gaps found</p>
          <p className="text-sm mt-1" style={{ color: "var(--color-slate-body)" }}>Run an AI analysis to check your recent job matches.</p>
        </div>
      )}
    </div>
  );
}
