"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { ChevronLeft, Calendar, Building2, BrainCircuit, CheckSquare, MessageSquare, Briefcase, Play, ExternalLink, Layers, ChevronRight, ChevronLeft as ChevLeft, RotateCcw, Check, SkipForward } from "lucide-react";
import { generateAITopics, evaluateAIPracticeAnswer, updateChecklist } from "@/lib/actions/interviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function PrepWorkspaceClient({ interview, prep }: { interview: any; prep: any }) {
  const [activeTab, setActiveTab] = useState("topics");
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number } | null>(null);

  useEffect(() => {
    const target = new Date(interview.scheduled_at);
    const updateTimer = () => {
      const now = new Date();
      if (target <= now) {
        setTimeLeft({ d: 0, h: 0, m: 0 });
        return;
      }
      setTimeLeft({
        d: differenceInDays(target, now),
        h: differenceInHours(target, now) % 24,
        m: differenceInMinutes(target, now) % 60,
      });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [interview.scheduled_at]);

  const tabs = [
    { id: "topics", label: "AI Topics", icon: BrainCircuit },
    { id: "qa", label: "Q&A Practice", icon: MessageSquare },
    { id: "flashcards", label: "Flashcards", icon: Layers },
    { id: "checklist", label: "Checklist", icon: CheckSquare },
  ];

  return (
    <div className="max-w-5xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link href="/interviews" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Interviews
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-blue-200">
                Round {interview.round} ({interview.interview_type})
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">
              {interview.applications?.jobs?.company || "Unknown Company"}
            </h1>
            <p className="text-lg text-slate-600 font-medium flex items-center gap-2 mt-1">
              <Briefcase className="w-4 h-4 text-slate-400" /> {interview.applications?.jobs?.title || "Unknown Role"}
            </p>
          </div>
          
          {/* Countdown Card */}
          {timeLeft && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center gap-6 shrink-0">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Scheduled For
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {format(new Date(interview.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <div className="w-px h-10 bg-slate-100"></div>
              <div className="flex gap-3">
                <div className="text-center"><p className="text-xl font-black text-slate-900 leading-none">{timeLeft.d}</p><p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Days</p></div>
                <div className="text-center text-slate-300 font-black text-xl">:</div>
                <div className="text-center"><p className="text-xl font-black text-slate-900 leading-none">{timeLeft.h}</p><p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Hrs</p></div>
                <div className="text-center text-slate-300 font-black text-xl">:</div>
                <div className="text-center"><p className="text-xl font-black text-blue-600 leading-none">{timeLeft.m}</p><p className="text-[10px] text-blue-400 uppercase tracking-widest mt-1">Min</p></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-2 pt-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 ${
                activeTab === t.id ? "border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]" : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 rounded-t-xl"
              }`}
            >
              <t.icon className={`w-4 h-4 ${activeTab === t.id ? "text-blue-600" : "text-slate-400"}`} /> {t.label}
            </button>
          ))}
        </div>
        
        <div className="p-8 flex-1 bg-white">
          {activeTab === "topics" && <TopicsTab prep={prep} interview={interview} />}
          {activeTab === "qa" && <QATab prep={prep} />}
          {activeTab === "flashcards" && <FlashcardsTab prep={prep} />}
          {activeTab === "checklist" && <ChecklistTab prep={prep} interviewId={interview.id} />}
        </div>
      </div>
    </div>
  );
}

function TopicsTab({ prep, interview }: { prep: any; interview: any }) {
  const [topics, setTopics] = useState<string[]>(prep?.topics || []);
  const [isGenerating, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const res = await generateAITopics(
        interview.id, 
        interview.applications?.jobs?.title || "", 
        interview.applications?.jobs?.company || "",
        interview.applications?.jobs?.description || ""
      );
      if (res.success && res.topics) {
        setTopics(res.topics);
      }
    });
  };

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <BrainCircuit className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">No topics generated yet</h3>
        <p className="text-slate-500 text-sm max-w-sm mb-6">Let AI analyze the job description and your profile to predict what they'll ask you.</p>
        <Button onClick={handleGenerate} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700">
          <BrainCircuit className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} /> 
          {isGenerating ? "Generating..." : "Generate Expected Topics"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Expected Interview Topics</h3>
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
          <BrainCircuit className={`w-3.5 h-3.5 mr-2 ${isGenerating ? 'animate-pulse text-blue-600' : ''}`} /> 
          {isGenerating ? "Regenerating..." : "Regenerate"}
        </Button>
      </div>
      <div className="grid gap-4">
        {topics.map((t, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">{i + 1}</div>
            <p className="text-slate-700 font-medium leading-relaxed pt-1">{t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function QATab({ prep }: { prep: any }) {
  const [question, setQuestion] = useState("Tell me about a time you faced a difficult technical challenge.");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ score: number; feedback: string } | null>(null);
  const [isEvaluating, startTransition] = useTransition();

  const handleEvaluate = () => {
    if (!answer) return;
    startTransition(async () => {
      const res = await evaluateAIPracticeAnswer(question, answer);
      if (res.success && res.result) {
        setFeedback(res.result);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Practice Question</h3>
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
          <select 
            className="w-full bg-transparent font-semibold text-slate-900 outline-none"
            value={question}
            onChange={e => { setQuestion(e.target.value); setFeedback(null); setAnswer(""); }}
          >
            <option>Tell me about a time you faced a difficult technical challenge.</option>
            <option>Why do you want to work here?</option>
            <option>Tell me about a time you disagreed with a coworker.</option>
            <option>Describe your most impactful project.</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Answer</label>
          <Textarea 
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Type your answer here using the STAR method (Situation, Task, Action, Result)..."
            className="min-h-[250px] resize-none"
          />
        </div>
        <Button onClick={handleEvaluate} disabled={isEvaluating || !answer.trim()} className="w-full bg-slate-900 hover:bg-slate-800">
          <Play className={`w-4 h-4 mr-2 ${isEvaluating ? 'animate-pulse' : ''}`} /> 
          {isEvaluating ? "Evaluating..." : "Evaluate Answer"}
        </Button>
      </div>

      <div className="space-y-4 border-l border-slate-100 pl-8">
        <h3 className="text-lg font-bold text-slate-900">AI Feedback</h3>
        {!feedback ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3 pt-12">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p className="text-sm max-w-[200px]">Submit an answer to get instant feedback and a score.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-2xl ${
                feedback.score >= 8 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                feedback.score >= 5 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {feedback.score}<span className="text-[10px] font-bold uppercase -mt-1 opacity-70">/10</span>
              </div>
              <div>
                <p className="font-bold text-slate-900">Score</p>
                <p className="text-sm font-medium text-slate-500">
                  {feedback.score >= 8 ? 'Great job!' : feedback.score >= 5 ? 'Needs improvement.' : 'Poor answer.'}
                </p>
              </div>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 leading-relaxed font-medium">
              {feedback.feedback}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChecklistTab({ prep, interviewId }: { prep: any; interviewId: string }) {
  const [items, setItems] = useState<any[]>(prep?.checklist || []);

  const toggle = async (id: string) => {
    const newItems = items.map(i => i.id === id ? { ...i, completed: !i.completed } : i);
    setItems(newItems);
    await updateChecklist(interviewId, newItems);
  };

  return (
    <div className="max-w-xl">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Pre-Interview Checklist</h3>
      <div className="space-y-3">
        {items.map(item => (
          <label key={item.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
            item.completed ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
          }`}>
            <input 
              type="checkbox" 
              checked={item.completed} 
              onChange={() => toggle(item.id)}
              className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
            />
            <span className={`font-medium text-slate-800 ${item.completed ? 'line-through text-slate-500' : ''}`}>
              {item.text}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Flashcards ────────────────────────────────────────────────────
const DEFAULT_FLASHCARDS = [
  { q: "What are React hooks?", a: "Functions that let you use React state and lifecycle features in function components. Common hooks: useState, useEffect, useContext, useReducer, useMemo, useCallback." },
  { q: "Explain the virtual DOM.", a: "A lightweight in-memory representation of the real DOM. React diffs the virtual DOM against a previous snapshot and only updates the real DOM where things changed — making updates fast." },
  { q: "What is closure in JavaScript?", a: "A function that retains access to its outer scope's variables even after the outer function has returned. Used for data encapsulation, factory functions, and callbacks." },
  { q: "What is the difference between == and ===?", a: "== performs type coercion before comparison. === checks value AND type without coercion. Always prefer === in modern JS." },
  { q: "What is event delegation?", a: "Instead of attaching an event listener to each child element, attach one listener to a parent. Use event.target to determine which child triggered the event." },
  { q: "Explain async/await.", a: "Syntactic sugar over Promises. async functions always return a Promise. await pauses execution until the Promise resolves, making async code look synchronous." },
  { q: "What is memoization?", a: "An optimization that caches function results for given inputs. In React: useMemo caches computed values, useCallback caches function references, React.memo prevents re-renders when props are unchanged." },
  { q: "What is the difference between null and undefined?", a: "undefined means a variable was declared but not assigned. null is an explicit assignment meaning 'no value'. typeof null === 'object' is a known bug." },
  { q: "What is a Promise?", a: "An object representing the eventual completion or failure of an async operation. States: pending → fulfilled or rejected. Methods: .then(), .catch(), .finally(), Promise.all(), Promise.race()." },
  { q: "Tell me about yourself.", a: "Structured answer: 1) Current role/background (30s), 2) Key achievement (20s), 3) Why this company/role (10s). Keep it under 90 seconds and end with a question hook." },
];

function FlashcardsTab({ prep }: { prep: any }) {
  const cards = prep?.flashcards?.length ? prep.flashcards : DEFAULT_FLASHCARDS;
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [skipped, setSkipped] = useState<Set<number>>(new Set());

  const current = cards[index];
  const knownCount = known.size;
  const progress = Math.round((knownCount / cards.length) * 100);

  const next = () => { setRevealed(false); setIndex(i => Math.min(i + 1, cards.length - 1)); };
  const prev = () => { setRevealed(false); setIndex(i => Math.max(i - 1, 0)); };
  const markKnown = () => { setKnown(k => new Set(k).add(index)); next(); };
  const markSkip = () => { setSkipped(s => new Set(s).add(index)); next(); };
  const reset = () => { setIndex(0); setRevealed(false); setKnown(new Set()); setSkipped(new Set()); };

  const allDone = index === cards.length - 1 && (known.has(index) || skipped.has(index));

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: "var(--color-graphite-heading)" }}>
          Card {index + 1} / {cards.length}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "var(--color-slate-body)" }}>{knownCount} known</span>
          <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-frost-tint)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: "#16a34a" }} />
          </div>
          <button onClick={reset} className="text-xs flex items-center gap-1" style={{ color: "var(--color-fog-text)" }}>
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-8 mb-5 min-h-[240px] flex flex-col justify-between cursor-pointer select-none"
        style={{
          backgroundColor: known.has(index) ? "#f0fdf4" : skipped.has(index) ? "var(--color-frost-tint)" : "var(--color-canvas-white)",
          boxShadow: "var(--shadow-card)",
          border: known.has(index) ? "1.5px solid #86efac" : skipped.has(index) ? "1.5px solid var(--color-ash-border)" : "1.5px solid var(--color-ash-border)",
        }}
        onClick={() => setRevealed(r => !r)}
      >
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-fog-text)" }}>Question</span>
          <p className="mt-2 text-lg font-semibold" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
            {current.q}
          </p>
        </div>

        {revealed ? (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--color-ash-border)" }}>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#16a34a" }}>Answer</span>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-slate-body)" }}>{current.a}</p>
          </div>
        ) : (
          <p className="text-xs text-center mt-6" style={{ color: "var(--color-fog-text)" }}>Tap to reveal answer</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={prev} disabled={index === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
          style={{ backgroundColor: "var(--color-canvas-white)", color: "var(--color-slate-body)", boxShadow: "var(--shadow-card)" }}
        >
          <ChevLeft className="w-4 h-4" /> Prev
        </button>

        <div className="flex gap-2">
          <button
            onClick={markSkip}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "var(--color-frost-tint)", color: "var(--color-steel-text)" }}
          >
            <SkipForward className="w-4 h-4" /> Skip
          </button>
          <button
            onClick={markKnown}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: "#16a34a" }}
          >
            <Check className="w-4 h-4" /> I Know This
          </button>
        </div>

        <button
          onClick={next} disabled={index === cards.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
          style={{ backgroundColor: "var(--color-canvas-white)", color: "var(--color-slate-body)", boxShadow: "var(--shadow-card)" }}
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {allDone && (
        <div className="mt-6 rounded-xl p-4 text-center" style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}>
          <p className="font-semibold text-sm" style={{ color: "#166534" }}>🎉 You finished the deck! {knownCount}/{cards.length} marked as known.</p>
          <button onClick={reset} className="mt-2 text-xs font-semibold underline" style={{ color: "#166534" }}>Restart deck</button>
        </div>
      )}
    </div>
  );
}
