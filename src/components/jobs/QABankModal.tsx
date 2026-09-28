"use client";

import { useState } from "react";
import { 
  X, 
  HelpCircle, 
  BookOpen, 
  Check, 
  Copy, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Award,
  Layers,
  Terminal,
  Users,
  Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QABank, QABankQuestion, QuestionCategory } from "@/types/resume-matching";

interface QABankModalProps {
  qaBank: QABank;
  isOpen: boolean;
  onClose: () => void;
}

export function QABankModal({ qaBank, isOpen, onClose }: QABankModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | "all">("all");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(
    qaBank.questions?.[0]?.id || null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: "all", label: "All Questions", icon: Layers, count: qaBank.questions.length },
    { id: "technical", label: "Technical", icon: Terminal, count: qaBank.questions.filter(q => q.category === "technical").length },
    { id: "behavioral", label: "Behavioral (STAR)", icon: Users, count: qaBank.questions.filter(q => q.category === "behavioral").length },
    { id: "system_design", label: "System Design", icon: Compass, count: qaBank.questions.filter(q => q.category === "system_design").length },
    { id: "situational", label: "Situational", icon: Award, count: qaBank.questions.filter(q => q.category === "situational").length },
  ];

  const filteredQuestions = selectedCategory === "all"
    ? qaBank.questions
    : qaBank.questions.filter(q => q.category === selectedCategory);

  const handleCopy = (question: QABankQuestion) => {
    const text = `QUESTION:\n${question.question}\n\nMODEL ANSWER:\n${question.modelAnswer}\n\nKEY TALKING POINTS:\n${question.keyPoints.map(p => `- ${p}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedId(question.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Tailored Interview Q&A Bank</h2>
              <p className="text-xs text-slate-300">
                15 role-specific questions for <span className="font-semibold text-white">{qaBank.jobTitle}</span> at <span className="font-semibold text-white">{qaBank.companyName}</span>
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label} ({cat.count})
              </button>
            );
          })}
        </div>

        {/* Questions List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No questions available under this category.</p>
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const isExpanded = expandedQuestion === q.id;
              const isCopied = copiedId === q.id;

              return (
                <div 
                  key={q.id} 
                  className={`border rounded-xl transition-all ${
                    isExpanded ? "border-indigo-300 bg-indigo-50/20 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {/* Question Header */}
                  <div 
                    onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                    className="p-4 cursor-pointer flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            q.category === "technical" ? "bg-blue-100 text-blue-700" :
                            q.category === "behavioral" ? "bg-purple-100 text-purple-700" :
                            q.category === "system_design" ? "bg-emerald-100 text-emerald-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {q.category.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">• {q.difficulty}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                          {q.question}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-slate-400">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(q);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                        title="Copy Q&A"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded Model Answer & Key Points */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-indigo-100/70 space-y-4">
                      {/* Model Answer */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          Recommended Tailored Answer (Grounded in your background)
                        </span>
                        <div className="p-3.5 rounded-lg bg-white border border-indigo-100 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line shadow-xs">
                          {q.modelAnswer}
                        </div>
                      </div>

                      {/* Key Talking Points */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Interviewer Evaluation Criteria:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {q.keyPoints.map((point, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-100 text-slate-800 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <span>{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Use these answers to rehearse out loud or during your interview practice sessions.
          </p>
          <Button onClick={onClose} size="sm" variant="outline" className="rounded-lg">
            Done Practicing
          </Button>
        </div>
      </div>
    </div>
  );
}
