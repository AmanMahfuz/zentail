"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  MessageSquare,
  Layers,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Check,
  SkipForward,
  Plus,
} from "lucide-react";
import { AITopicsTab } from "./AITopicsTab";
import { ApplicationSimulationArena } from "./ApplicationSimulationArena";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface Flashcard {
  q: string;
  a: string;
  category?: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "cl-1",
    text: "Analyze job description and align personal achievements to core requirements",
    completed: false,
  },
  {
    id: "cl-2",
    text: "Prepare 2-3 structured STAR stories highlighting measurable impact and metrics",
    completed: false,
  },
  {
    id: "cl-3",
    text: "Draft 3 thoughtful questions for the interview panel regarding architecture and team culture",
    completed: false,
  },
  {
    id: "cl-4",
    text: "Research company product vision, recent announcements, and engineering challenges",
    completed: false,
  },
  {
    id: "cl-5",
    text: "Complete hardware preflight: test camera, microphone, and network reliability",
    completed: false,
  },
];

export function InterviewDashboardTabs({
  applicationId = "",
  initialPrep,
  jobTitle = "Software Engineer",
  company = "Company",
}: {
  applicationId?: string;
  initialPrep?: any;
  jobTitle?: string;
  company?: string;
}) {
  const [activeTab, setActiveTab] = useState("topics");

  // Derive flashcards from mock_questions if available
  const flashcards: Flashcard[] = Array.isArray(initialPrep?.mock_questions)
    ? initialPrep.mock_questions.map((mq: any, idx: number) => ({
        q: mq.question || `Interview Question #${idx + 1}`,
        a: Array.isArray(mq.answer_hints)
          ? mq.answer_hints.join(". ")
          : mq.answer_hints || "Structure your answer using the STAR method: Situation, Task, Action, and Result.",
        category: mq.type || "Interview Question",
      }))
    : [];

  // Checklist state with localStorage persistence
  const storageKey = `zentail_interview_checklist_${applicationId || "default"}`;
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST_ITEMS);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    setIsClientLoaded(true);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChecklist(parsed);
        }
      }
    } catch {
      // fallback to defaults
    }
  }, [storageKey]);

  const toggleChecklistItem = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore localstorage errors
    }
  };

  const addChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      text: newItemText.trim(),
      completed: false,
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewItemText("");
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const completedCount = checklist.filter((item) => item.completed).length;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab("topics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === "topics"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Topics & Questions
          {activeTab === "topics" && (
            <div className="w-1.5 h-1.5 rounded-full bg-white ml-1"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("qa")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === "qa"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Interactive Simulation
          <Badge className="ml-1 bg-amber-100 text-amber-800 hover:bg-amber-100 border-none px-1.5 py-0 text-[10px] font-bold">
            Live AI
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab("flashcards")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === "flashcards"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Layers className="w-4 h-4" />
          Flashcards
          {flashcards.length > 0 && (
            <Badge className="ml-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none px-1.5 py-0 text-[10px]">
              {flashcards.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("checklist")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === "checklist"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Checklist
          <Badge className="ml-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-1.5 py-0 text-[10px]">
            {isClientLoaded ? `${completedCount}/${checklist.length}` : `${checklist.length}`}
          </Badge>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200">
        {activeTab === "topics" && (
          <AITopicsTab applicationId={applicationId} initialPrep={initialPrep} />
        )}

        {activeTab === "qa" && (
          <ApplicationSimulationArena
            applicationId={applicationId}
            jobTitle={jobTitle}
            company={company}
            initialQuestions={initialPrep?.mock_questions}
          />
        )}

        {activeTab === "flashcards" && (
          <FlashcardDeck
            cards={flashcards}
            onNavigateToTopics={() => setActiveTab("topics")}
          />
        )}

        {activeTab === "checklist" && (
          <div className="max-w-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Pre-Interview Readiness Checklist
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Essential preparation items tailored for {jobTitle} at {company}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {completedCount} of {checklist.length} Done
              </span>
            </div>

            <div className="space-y-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    item.completed
                      ? "bg-slate-50/70 border-slate-200 opacity-70"
                      : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xs"
                  }`}
                >
                  <Checkbox
                    id={item.id}
                    checked={item.completed}
                    onCheckedChange={() => toggleChecklistItem(item.id)}
                    className="mt-0.5 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <label
                    htmlFor={item.id}
                    className={`text-sm leading-relaxed cursor-pointer select-none ${
                      item.completed
                        ? "line-through text-slate-400"
                        : "text-slate-800 font-medium"
                    }`}
                  >
                    {item.text}
                  </label>
                </div>
              ))}
            </div>

            {/* Add Custom Item */}
            <form onSubmit={addChecklistItem} className="flex items-center gap-2 pt-2">
              <Input
                type="text"
                placeholder="Add a personal preparation task..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                className="text-xs h-9 border-slate-200"
              />
              <Button
                type="submit"
                size="sm"
                className="h-9 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Item
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function FlashcardDeck({
  cards,
  onNavigateToTopics,
}: {
  cards: Flashcard[];
  onNavigateToTopics: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());

  if (cards.length === 0) {
    return (
      <div className="py-12 text-center space-y-3 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-800">
          No Flashcards Generated Yet
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          Questions generated from the AI Topics & Questions tab are automatically converted into interactive flashcards for quick revision.
        </p>
        <Button
          onClick={onNavigateToTopics}
          variant="outline"
          size="sm"
          className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 mt-2"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Generate Interview Questions
        </Button>
      </div>
    );
  }

  const current = cards[index];
  const knownCount = known.size;
  const progress = Math.round((knownCount / cards.length) * 100);

  const next = () => {
    setRevealed(false);
    setIndex((i) => Math.min(i + 1, cards.length - 1));
  };

  const prev = () => {
    setRevealed(false);
    setIndex((i) => Math.max(i - 1, 0));
  };

  const markKnown = () => {
    setKnown((k) => new Set(k).add(index));
    next();
  };

  const reset = () => {
    setIndex(0);
    setRevealed(false);
    setKnown(new Set());
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">
          Card {index + 1} of {cards.length}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{knownCount} mastered</span>
          <div className="w-28 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            onClick={reset}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Interactive Card */}
      <div
        onClick={() => setRevealed((r) => !r)}
        className={`min-h-[220px] rounded-2xl p-6 sm:p-8 flex flex-col justify-between cursor-pointer select-none border transition-all ${
          known.has(index)
            ? "bg-emerald-50/40 border-emerald-200"
            : "bg-white border-slate-200 hover:border-indigo-300 shadow-sm"
        }`}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              {current.category || "Interview Question"}
            </span>
            {known.has(index) && (
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none text-[10px]">
                Mastered
              </Badge>
            )}
          </div>
          <p className="mt-3 text-base sm:text-lg font-semibold text-slate-900 leading-snug">
            {current.q}
          </p>
        </div>

        {revealed ? (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Key Talking Points & Strategy
            </span>
            <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {current.a}
            </p>
          </div>
        ) : (
          <p className="text-xs text-center text-slate-400 pt-6">
            Click card to reveal talking points & hints
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <Button
          onClick={prev}
          disabled={index === 0}
          variant="outline"
          size="sm"
          className="text-xs border-slate-200"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button
            onClick={next}
            disabled={index === cards.length - 1}
            variant="ghost"
            size="sm"
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            <SkipForward className="w-3.5 h-3.5 mr-1" />
            Skip
          </Button>
          <Button
            onClick={markKnown}
            size="sm"
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            I Know This
          </Button>
        </div>

        <Button
          onClick={next}
          disabled={index === cards.length - 1}
          variant="outline"
          size="sm"
          className="text-xs border-slate-200"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
