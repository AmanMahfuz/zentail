"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft, Download, RotateCcw, Save, CheckCircle2,
  Sparkles, Target, AlertTriangle, ChevronRight
} from "lucide-react";
import { saveResumeEdits, generateTailoredResume } from "@/lib/actions/phase3";
import { useRouter } from "next/navigation";

type ResumeData = {
  id: string;
  resume_markdown: string | null;
  ats_score: number | null;
  match_percentage: number | null;
  skills_matched: string[] | null;
  skills_missing: string[] | null;
  pdf_url: string | null;
} | null;

function renderMarkdown(md: string) {
  return md
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold mb-1" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{line.slice(2)}</h1>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-sm font-semibold mt-4 mb-1 pb-0.5 uppercase tracking-widest" style={{ color: "var(--color-graphite-heading)", borderBottom: "1px solid var(--color-ash-border)" }}>{line.slice(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-semibold mt-2" style={{ color: "var(--color-graphite-heading)" }}>{line.slice(4)}</h3>;
      if (line.startsWith("- ")) return <p key={i} className="text-xs ml-3" style={{ color: "var(--color-slate-body)" }}>• {line.slice(2)}</p>;
      if (line.trim() === "") return <div key={i} className="h-1.5" />;
      return <p key={i} className="text-xs" style={{ color: "var(--color-slate-body)" }}>{line}</p>;
    });
}

export function ResumeCenterClient({
  applicationId, jobTitle, company, resume,
}: {
  applicationId: string;
  jobTitle: string;
  company: string;
  resume: ResumeData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [markdown, setMarkdown] = useState(resume?.resume_markdown ?? "");
  const [pdfUrl, setPdfUrl] = useState(resume?.pdf_url ?? "");
  const [saved, setSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const atsScore = resume?.ats_score ?? 0;
  const matchPct = resume?.match_percentage ?? 0;
  const matched = (resume?.skills_matched as string[]) ?? [];
  const missing = (resume?.skills_missing as string[]) ?? [];

  const handleSave = () => {
    if (!resume?.id) return;
    startTransition(async () => {
      const res = await saveResumeEdits(resume.id, markdown);
      if (res.success && res.pdfUrl) setPdfUrl(res.pdfUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    const res = await generateTailoredResume(applicationId);
    setRegenerating(false);
    if (res.success) router.refresh();
  };

  const atsColor = atsScore >= 80 ? "#16a34a" : atsScore >= 60 ? "#d97706" : "#dc2626";

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "var(--color-cloud-mist)" }}>

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 h-14 shrink-0"
        style={{ backgroundColor: "var(--color-canvas-white)", borderBottom: "1px solid var(--color-ash-border)" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/applications"
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "var(--color-slate-body)" }}
          >
            <ArrowLeft className="w-4 h-4" /> Applications
          </Link>
          <ChevronRight className="w-3 h-3" style={{ color: "var(--color-fog-text)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--color-graphite-heading)" }}>
            Resume Center — {jobTitle} @ {company}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{ border: "1px solid var(--color-ash-border)", color: "var(--color-slate-body)", backgroundColor: "var(--color-canvas-white)" }}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
            {regenerating ? "Regenerating…" : "Regenerate"}
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-all"
            style={{ backgroundColor: saved ? "#16a34a" : "var(--color-sunset-orange)" }}
          >
            {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? "Saved!" : isPending ? "Saving…" : "Save"}
          </button>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-midnight-ink)" }}
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </a>
          )}
        </div>
      </div>

      {/* ── Score Bar ───────────────────────────────────────────── */}
      <div
        className="flex items-center gap-6 px-6 py-2.5 shrink-0"
        style={{ backgroundColor: "var(--color-canvas-white)", borderBottom: "1px solid var(--color-ash-border)" }}
      >
        {/* ATS Score */}
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-frost-tint)" strokeWidth="4" />
              <circle cx="18" cy="18" r="14" fill="none" stroke={atsColor} strokeWidth="4"
                strokeDasharray={`${(atsScore / 100) * 87.96} 87.96`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: atsColor }}>{atsScore}</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-fog-text)" }}>ATS Score</p>
            <p className="text-xs font-semibold" style={{ color: atsColor }}>{atsScore >= 80 ? "Excellent" : atsScore >= 60 ? "Good" : "Needs Work"}</p>
          </div>
        </div>

        <div className="h-6 w-px" style={{ backgroundColor: "var(--color-ash-border)" }} />

        {/* Match % */}
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: "var(--color-sunset-orange)" }} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-fog-text)" }}>Job Match</p>
            <p className="text-xs font-semibold" style={{ color: "var(--color-sunset-orange)" }}>{matchPct}%</p>
          </div>
        </div>

        <div className="h-6 w-px" style={{ backgroundColor: "var(--color-ash-border)" }} />

        {/* Skills Matched */}
        <div className="flex items-center gap-2 flex-wrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#16a34a" }} />
          {matched.slice(0, 4).map(s => (
            <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>{s}</span>
          ))}
          {matched.length > 4 && <span className="text-[10px]" style={{ color: "var(--color-fog-text)" }}>+{matched.length - 4} more</span>}
        </div>

        {missing.length > 0 && (
          <>
            <div className="h-6 w-px" style={{ backgroundColor: "var(--color-ash-border)" }} />
            <div className="flex items-center gap-2 flex-wrap">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: "#d97706" }} />
              {missing.slice(0, 3).map(s => (
                <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>{s}</span>
              ))}
              {missing.length > 3 && <span className="text-[10px]" style={{ color: "var(--color-fog-text)" }}>+{missing.length - 3} missing</span>}
              <Link href="/skills" className="text-[10px] font-semibold underline" style={{ color: "var(--color-sunset-orange)" }}>Learn →</Link>
            </div>
          </>
        )}
      </div>

      {/* ── Main Editor + Preview ────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left: Editor */}
        <div className="w-1/2 flex flex-col border-r" style={{ borderColor: "var(--color-ash-border)" }}>
          <div
            className="px-4 py-2 flex items-center gap-2 shrink-0"
            style={{ backgroundColor: "var(--color-cloud-mist)", borderBottom: "1px solid var(--color-ash-border)" }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--color-sunset-orange)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--color-graphite-heading)" }}>Edit Resume (Markdown)</span>
          </div>
          <textarea
            value={markdown}
            onChange={e => setMarkdown(e.target.value)}
            className="flex-1 p-5 resize-none outline-none text-[13px] leading-relaxed"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--color-graphite-heading)",
              backgroundColor: "var(--color-canvas-white)",
              letterSpacing: "-0.01em",
            }}
            placeholder="Your resume content will appear here…"
          />
        </div>

        {/* Right: Preview */}
        <div className="w-1/2 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--color-cloud-mist)" }}>
          <div
            className="px-4 py-2 flex items-center gap-2 shrink-0"
            style={{ borderBottom: "1px solid var(--color-ash-border)", backgroundColor: "var(--color-cloud-mist)" }}
          >
            <span className="text-xs font-semibold" style={{ color: "var(--color-graphite-heading)" }}>Preview</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--color-frost-tint)", color: "var(--color-steel-text)" }}>ATS Safe</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex justify-center">
            {/* 8.5×11 paper */}
            <div
              className="w-full max-w-[600px] p-10 rounded"
              style={{
                backgroundColor: "var(--color-canvas-white)",
                boxShadow: "var(--shadow-hero)",
                minHeight: "780px",
              }}
            >
              {markdown ? renderMarkdown(markdown) : (
                <p className="text-sm text-center mt-12" style={{ color: "var(--color-fog-text)" }}>
                  Resume preview will appear here as you edit.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
