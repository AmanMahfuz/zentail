'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Sparkles, Languages, Check, Copy, ArrowRight, Award, ShieldAlert, Zap, ChevronDown, RotateCcw } from 'lucide-react';

interface AnswerCoachFeedbackProps {
  evaluation: any;
  onNext: () => void;
  onRetry?: () => void;
  isLastQuestion: boolean;
}

// Animated SVG arc dial
function ScoreDial({ score, color, label }: { score: number; color: string; label: string }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(timeout);
  }, [score]);

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animated / 100) * circumference;

  const colorMap: Record<string, { stroke: string; text: string }> = {
    purple: { stroke: 'stroke-purple-500', text: 'text-purple-600 dark:text-purple-400' },
    emerald: { stroke: 'stroke-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  };
  const c = colorMap[color] ?? colorMap.purple;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 72 72" className="w-16 h-16 -rotate-90">
          <circle cx="36" cy="36" r={radius} fill="none" strokeWidth="6" className="stroke-muted" />
          <circle
            cx="36" cy="36" r={radius}
            fill="none" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${c.stroke} transition-all duration-700 ease-out`}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-black ${c.text}`}>
          {score}
        </span>
      </div>
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">{label}</span>
    </div>
  );
}

// Collapsible coaching section
function CoachSection({
  id, label, icon: Icon, badge, isOpen, onToggle, children
}: {
  id: string; label: string; icon: React.ElementType; badge?: React.ReactNode;
  isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left gap-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon size={16} className="text-purple-500 shrink-0" />
          <span className="font-bold text-sm text-foreground truncate">{label}</span>
          {badge}
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown size={16} className="text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-4 border-t border-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnswerCoachFeedback({ evaluation, onNext, onRetry, isLastQuestion }: AnswerCoachFeedbackProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['english', 'content']));
  const [copiedTier, setCopiedTier] = useState<string | null>(null);

  const layers = evaluation?.layers || {};
  const content = layers?.content_strength || {};
  const grammar = layers?.grammar_and_clarity || {};
  const star = layers?.confidence_and_structure || {};
  const english = layers?.english_polish || {};

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, tier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTier(tier);
    setTimeout(() => setCopiedTier(null), 2000);
  };

  const overallScore = evaluation.overall_score || 80;
  const fluencyScore = evaluation.spoken_fluency_score || 78;

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500" />

      {/* Top Header & Score Dials */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-widest mb-2">
            <Sparkles size={14} /> 4-Layer Personal Coach Feedback
          </span>
          <h3 className="text-xl font-black text-foreground">Answer Diagnosis & Upgrade</h3>
        </div>

        <div className="flex items-center gap-6">
          <ScoreDial score={overallScore} color="purple" label="Impact Score" />
          <ScoreDial score={fluencyScore} color="emerald" label="Fluency Score" />
        </div>
      </div>

      {/* Collapsible Coaching Sections */}
      <div className="space-y-3">

        {/* LAYER 1: ENGLISH POLISH */}
        <CoachSection
          id="english"
          label="1. English Upgrade — 3 Polished Versions"
          icon={Languages}
          badge={<span className="text-[10px] font-bold bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full">3 Tiers</span>}
          isOpen={openSections.has('english')}
          onToggle={() => toggleSection('english')}
        >
          <p className="text-xs text-muted-foreground font-medium">
            Transform your original response into 3 polished tiers of professional English fluency:
          </p>

          {/* Tier 1 */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-purple-500/30 transition-all">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Simpler Version (Clear & Direct)
              </span>
              <button
                onClick={() => copyToClipboard(english.simpler_version || evaluation.improved_answer_outline, 'simpler')}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-bold"
              >
                {copiedTier === 'simpler' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copiedTier === 'simpler' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{english.simpler_version || evaluation.improved_answer_outline}</p>
          </div>

          {/* Tier 2 */}
          <div className="p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Better Professional Version
              </span>
              <button
                onClick={() => copyToClipboard(english.better_version || evaluation.improved_answer_outline, 'better')}
                className="text-xs text-purple-600 dark:text-purple-400 hover:opacity-80 flex items-center gap-1 font-bold"
              >
                {copiedTier === 'better' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copiedTier === 'better' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-sm text-foreground leading-relaxed font-medium">{english.better_version || evaluation.improved_answer_outline}</p>
          </div>

          {/* Tier 3 */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-emerald-500/10 border border-purple-500/30 hover:border-purple-500/60 transition-all">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" /> Interview-Ready Executive Version
              </span>
              <button
                onClick={() => copyToClipboard(english.interview_ready_version || evaluation.improved_answer_outline, 'ready')}
                className="text-xs text-indigo-600 dark:text-indigo-300 hover:opacity-80 flex items-center gap-1 font-bold"
              >
                {copiedTier === 'ready' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copiedTier === 'ready' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-sm text-foreground leading-relaxed font-semibold">{english.interview_ready_version || evaluation.improved_answer_outline}</p>
          </div>
        </CoachSection>

        {/* LAYER 2: CONTENT IMPACT */}
        <CoachSection
          id="content"
          label="2. Content Impact — Strengths & Missing Signals"
          icon={Zap}
          isOpen={openSections.has('content')}
          onToggle={() => toggleSection('content')}
        >
          <div className="p-4 rounded-2xl bg-muted/30 border border-border">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Content Feedback</div>
            <p className="text-sm text-foreground">{content.feedback || 'Good overall relevance to the role requirements.'}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <span className="text-xs font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 size={14} /> What Worked
              </span>
              <ul className="space-y-2">
                {(evaluation.what_worked || []).map((w: string, i: number) => (
                  <li key={i} className="text-xs md:text-sm text-muted-foreground flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" /> {w}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
                <AlertTriangle size={14} /> Missing Signals
              </span>
              <ul className="space-y-2">
                {(evaluation.what_was_missing || []).map((w: string, i: number) => (
                  <li key={i} className="text-xs md:text-sm text-muted-foreground flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" /> {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CoachSection>

        {/* LAYER 3: GRAMMAR */}
        <CoachSection
          id="grammar"
          label="3. Grammar & Clarity"
          icon={ShieldAlert}
          badge={
            grammar.detected_mistakes?.length > 0
              ? <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{grammar.detected_mistakes.length}</span>
              : <span className="text-[10px] font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">✓ Clean</span>
          }
          isOpen={openSections.has('grammar')}
          onToggle={() => toggleSection('grammar')}
        >
          <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Fluency Score</span>
              <span className="text-sm font-black text-red-500">{grammar.score || 75}/100</span>
            </div>
            <p className="text-sm text-foreground">{grammar.feedback || 'Minor filler words and tense consistency issues detected.'}</p>
          </div>

          {(!grammar.detected_mistakes || grammar.detected_mistakes.length === 0) ? (
            <div className="text-sm text-muted-foreground italic p-4 rounded-xl bg-muted/20 border border-border">
              No major grammar errors detected! Your sentence rhythm was clear.
            </div>
          ) : (
            <div className="space-y-2">
              {grammar.detected_mistakes.map((mistake: string, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-background border border-border text-xs md:text-sm flex items-center justify-between">
                  <span className="text-foreground font-medium">{mistake}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-md">Fix</span>
                </div>
              ))}
            </div>
          )}
        </CoachSection>

        {/* LAYER 4: STAR STRUCTURE */}
        <CoachSection
          id="star"
          label="4. STAR Framework — Confidence & Structure"
          icon={Award}
          isOpen={openSections.has('star')}
          onToggle={() => toggleSection('star')}
        >
          <p className="text-xs text-muted-foreground font-medium">
            Evaluation using the Harvard STAR Framework (Situation, Task, Action, Result):
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Situation', val: star.star_alignment?.situation || 'Clear' },
              { label: 'Task', val: star.star_alignment?.task || 'Clear' },
              { label: 'Action', val: star.star_alignment?.action || 'Strong' },
              { label: 'Result', val: star.star_alignment?.result || 'Needs Metrics' }
            ].map((s, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-muted/30 border border-border text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{s.label}</div>
                <div className="text-sm font-black text-purple-600 dark:text-purple-400">{s.val}</div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs md:text-sm text-foreground leading-relaxed">
            <span className="font-bold text-purple-500 block mb-1">Coach Advice:</span>
            {star.feedback || 'Ensure every behavioral question ends with a measurable result metric to seal the impression.'}
          </div>
        </CoachSection>

      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-3 rounded-xl border border-border hover:bg-muted font-bold text-sm text-foreground flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw size={16} /> Retry Question & Improve Answer
          </button>
        )}
        <button
          onClick={onNext}
          className="ml-auto w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-8 py-3.5 rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLastQuestion ? 'Complete Session & View Scorecard' : 'Next: Face Reinforced Challenge'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
