"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { ChevronLeft, Calendar, Building2, BrainCircuit, CheckSquare, MessageSquare, Briefcase, Play, ExternalLink, Layers, ChevronRight, ChevronLeft as ChevLeft, RotateCcw, Check, SkipForward, ArrowLeft, Edit3, Video, Info, FileText, Monitor, Clock as ClockIcon, Download } from "lucide-react";
import { generateAITopics, evaluateAIPracticeAnswer, updateChecklist } from "@/lib/actions/interviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardwarePreflight } from "../../applications/[id]/interview/components/HardwarePreflight";
import { InterviewHero } from "../../applications/[id]/interview/components/InterviewHero";
import { PipelineCountdown } from "../../applications/[id]/interview/components/PipelineCountdown";

export default function PrepWorkspaceClient({ interview, prep }: { interview?: any; prep?: any }) {
  const [activeTab, setActiveTab] = useState("topics");
  
  const tabs = [
    { id: "topics", label: "AI Topics", icon: BrainCircuit },
    { id: "qa", label: "Q&A Practice", icon: MessageSquare },
    { id: "flashcards", label: "Flashcards", icon: Layers },
    { id: "checklist", label: "Checklist", icon: CheckSquare },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <Button variant="ghost" className="text-slate-600 hover:text-slate-900" onClick={() => window.location.href = '/interviews'}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Interviews
        </Button>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <Button variant="outline" className="bg-white text-slate-700 border-slate-200">
            <Edit3 className="w-4 h-4 mr-2" />
            Add Notes
          </Button>
          <Button variant="outline" className="bg-white text-slate-700 border-slate-200">
            <Calendar className="w-4 h-4 mr-2" />
            Reschedule
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
            <Video className="w-4 h-4 mr-2" />
            Join Meeting
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Main Content) - 70% */}
        <div className="lg:col-span-8 space-y-6">
          <InterviewHero 
            jobTitle={"Full Stack Developer Intern"} 
            company={"F6 IT Services Private Limited"} 
          />

          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === t.id 
                      ? "bg-indigo-600 text-white shadow-sm" 
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                  {activeTab === t.id && <div className="w-1.5 h-1.5 rounded-full bg-white ml-1"></div>}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200">
              {activeTab === "topics" && <TopicsTab prep={prep} interview={interview} />}
              {activeTab === "qa" && <QATab prep={prep} />}
              {activeTab === "flashcards" && <FlashcardsTab prep={prep} />}
              {activeTab === "checklist" && <ChecklistTab prep={prep} interviewId={interview?.id} />}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) - 30% */}
        <div className="lg:col-span-4 space-y-6">
          <PipelineCountdown />
          
          <Card className="border-slate-200 shadow-sm mb-6">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-500" />
                Interview Context
              </CardTitle>
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none px-2 py-0.5 text-[10px] tracking-wider uppercase">
                Confirmed
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Format & Type
                </h4>
                <p className="text-sm text-slate-800">
                  {interview.interview_type} (60 min) — Live Coding & Architecture
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Application Status
                </h4>
                <div className="flex items-center gap-1.5 text-sm text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Interview Round {interview.round} of 3
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Host Platform
                </h4>
                <p className="text-sm text-slate-800">
                  Google Meet (Code shared via CollabPad)
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Attached Resume
                </h4>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">
                      Aman_Resume_FullStack.pdf
                    </span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <HardwarePreflight />
        </div>
      </div>
    </div>
  );
}

function TopicsTab({ prep, interview }: { prep: any; interview?: any }) {
  const [topics, setTopics] = useState<string[]>(prep?.topics || []);
  const [isGenerating, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const res = await generateAITopics(
        interview?.id || "mock-id", 
        interview?.applications?.jobs?.title || "", 
        interview?.applications?.jobs?.company || "",
        interview?.applications?.jobs?.description || ""
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
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<{ score: number; feedback: string; structure?: string; clarity?: string; relevance?: string; missing_evidence?: string } | null>(null);
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
        <div className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Answer</label>
            <Button 
              size="sm" 
              variant={isRecording ? "destructive" : "outline"} 
              className={`h-7 px-3 text-[10px] ${isRecording ? 'animate-pulse' : ''}`}
              onClick={() => setIsRecording(!isRecording)}
            >
              {isRecording ? "Stop Recording" : "Record Answer (Mock)"}
            </Button>
          </div>
          <Textarea 
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder={isRecording ? "Listening..." : "Type your answer here using the STAR method (Situation, Task, Action, Result)..."}
            className="min-h-[250px] resize-none"
            disabled={isRecording}
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
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 leading-relaxed font-medium mb-4">
              {feedback.feedback}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
              {feedback.structure && (
                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <span className="font-bold text-indigo-600 block mb-1">Structure (STAR)</span>
                  <span className="text-slate-600">{feedback.structure}</span>
                </div>
              )}
              {feedback.clarity && (
                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <span className="font-bold text-blue-600 block mb-1">Clarity</span>
                  <span className="text-slate-600">{feedback.clarity}</span>
                </div>
              )}
              {feedback.relevance && (
                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <span className="font-bold text-emerald-600 block mb-1">Relevance</span>
                  <span className="text-slate-600">{feedback.relevance}</span>
                </div>
              )}
              {feedback.missing_evidence && (
                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <span className="font-bold text-amber-600 block mb-1">Missing Evidence</span>
                  <span className="text-slate-600">{feedback.missing_evidence}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChecklistTab({ prep, interviewId }: { prep: any; interviewId?: string }) {
  const [items, setItems] = useState<any[]>(prep?.checklist || []);

  const toggle = async (id: string) => {
    const newItems = items.map(i => i.id === id ? { ...i, completed: !i.completed } : i);
    setItems(newItems);
    if (interviewId) {
      await updateChecklist(interviewId, newItems);
    }
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
