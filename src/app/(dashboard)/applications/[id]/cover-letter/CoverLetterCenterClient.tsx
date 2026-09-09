"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Download, RotateCcw, Save, CheckCircle2, ChevronRight, FileText } from "lucide-react";
import { saveCoverLetterEdits, regenerateCoverLetterWithTone } from "@/lib/actions/phase3";
import { useRouter } from "next/navigation";

const TONES = ["Professional", "Friendly", "Energetic", "Confident"] as const;
type Tone = typeof TONES[number];

type LetterData = {
  id: string;
  cover_letter_content: string | null;
  tone: string | null;
  pdf_url: string | null;
} | null;

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
function readabilityGrade(text: string) {
  const words = wordCount(text);
  const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
  const avgLen = words / sentences;
  if (avgLen < 12) return "Grade 6 (Easy)";
  if (avgLen < 18) return "Grade 8 (Good)";
  return "Grade 12 (Complex)";
}

export function CoverLetterCenterClient({
  applicationId, jobTitle, company, letter,
}: {
  applicationId: string;
  jobTitle: string;
  company: string;
  letter: LetterData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState(letter?.cover_letter_content ?? "");
  const [tone, setTone] = useState<Tone>((letter?.tone as Tone) ?? "Professional");
  const [pdfUrl, setPdfUrl] = useState(letter?.pdf_url ?? "");
  const [saved, setSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleSave = () => {
    if (!letter?.id) return;
    startTransition(async () => {
      const res = await saveCoverLetterEdits(letter.id, content);
      if (res.success && res.pdfUrl) setPdfUrl(res.pdfUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const handleRegenerate = async (newTone: Tone) => {
    setTone(newTone);
    setRegenerating(true);
    const res = await regenerateCoverLetterWithTone(applicationId, newTone);
    setRegenerating(false);
    if (res.success && res.data) {
      setContent(res.data.cover_letter_content ?? "");
      setPdfUrl(res.data.pdf_url ?? "");
    }
    router.refresh();
  };

  const wc = wordCount(content);
  const grade = readabilityGrade(content);

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
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--color-slate-body)" }}
          >
            <ArrowLeft className="w-4 h-4" /> Applications
          </Link>
          <ChevronRight className="w-3 h-3" style={{ color: "var(--color-fog-text)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--color-graphite-heading)" }}>
            Cover Letter — {jobTitle} @ {company}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRegenerate(tone)}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
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

      {/* ── Tone Selector + Stats Bar ───────────────────────────── */}
      <div
        className="flex items-center gap-6 px-6 py-2.5 shrink-0"
        style={{ backgroundColor: "var(--color-canvas-white)", borderBottom: "1px solid var(--color-ash-border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: "var(--color-fog-text)" }}>TONE</span>
          <div className="flex gap-1">
            {TONES.map(t => (
              <button
                key={t}
                onClick={() => handleRegenerate(t)}
                disabled={regenerating}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: tone === t ? "var(--color-sunset-orange)" : "var(--color-frost-tint)",
                  color: tone === t ? "#ffffff" : "var(--color-slate-body)",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="h-4 w-px" style={{ backgroundColor: "var(--color-ash-border)" }} />
        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-steel-text)" }}>
          <span><b style={{ color: "var(--color-graphite-heading)" }}>{wc}</b> words</span>
          <span><b style={{ color: "var(--color-graphite-heading)" }}>{grade}</b></span>
        </div>
      </div>

      {/* ── Editor + Preview ─────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left: Textarea */}
        <div className="w-1/2 flex flex-col border-r" style={{ borderColor: "var(--color-ash-border)" }}>
          <div
            className="px-4 py-2 shrink-0 flex items-center gap-2"
            style={{ backgroundColor: "var(--color-cloud-mist)", borderBottom: "1px solid var(--color-ash-border)" }}
          >
            <FileText className="w-3.5 h-3.5" style={{ color: "var(--color-sunset-orange)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--color-graphite-heading)" }}>Edit Cover Letter</span>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="flex-1 p-6 resize-none outline-none text-[13px] leading-loose"
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--color-graphite-heading)",
              backgroundColor: "var(--color-canvas-white)",
              letterSpacing: "-0.01em",
            }}
            placeholder="Your cover letter will appear here…"
          />
        </div>

        {/* Right: Formatted preview */}
        <div className="w-1/2 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--color-cloud-mist)" }}>
          <div
            className="px-4 py-2 shrink-0"
            style={{ borderBottom: "1px solid var(--color-ash-border)", backgroundColor: "var(--color-cloud-mist)" }}
          >
            <span className="text-xs font-semibold" style={{ color: "var(--color-graphite-heading)" }}>Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex justify-center">
            <div
              className="w-full max-w-[580px] p-10 rounded"
              style={{ backgroundColor: "var(--color-canvas-white)", boxShadow: "var(--shadow-hero)", minHeight: "780px" }}
            >
              {/* Company header */}
              <div className="mb-8 pb-6" style={{ borderBottom: "1px solid var(--color-ash-border)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)" }}>{company}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-steel-text)" }}>{jobTitle} Position</p>
                <p className="text-xs mt-3" style={{ color: "var(--color-fog-text)" }}>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              {content ? (
                content.split("\n\n").map((para, i) => (
                  <p key={i} className="text-sm mb-4 leading-loose" style={{ color: "var(--color-slate-body)", letterSpacing: "-0.01em" }}>
                    {para}
                  </p>
                ))
              ) : (
                <p className="text-sm text-center mt-12" style={{ color: "var(--color-fog-text)" }}>
                  Cover letter preview will appear here.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
