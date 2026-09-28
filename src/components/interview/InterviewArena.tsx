"use client";

import React, { useState } from "react";
import { useInterviewStore } from "@/store/useInterviewStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Send,
  Bot,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Code2,
  ArrowRight,
  RotateCcw,
  Settings,
  Flame,
  Target,
  Volume2,
  VolumeX,
} from "lucide-react";
import VoiceMode from "@/components/interview/VoiceMode";
import AnswerCoachFeedback from "@/components/interview/AnswerCoachFeedback";
import Editor from "@monaco-editor/react";

export default function InterviewArena() {
  const {
    config,
    setConfig,
    questions,
    currentQuestionIndex,
    nextQuestion,
    answerQuestion,
    endInterview,
    sessionId,
  } = useInterviewStore();

  const currentQ = questions[currentQuestionIndex];

  const [answerText, setAnswerText] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [latestEvaluation, setLatestEvaluation] = useState<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = React.useRef<HTMLAudioElement | null>(null);

  const handleRepeatQuestionAudio = () => {
    if (isPlayingAudio) {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const qText = currentQ.question || currentQ.text;
    if (currentQ.audioBase64) {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      const audio = new Audio(`data:${currentQ.mimeType || "audio/wav"};base64,${currentQ.audioBase64}`);
      audioPlayerRef.current = audio;
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play().catch(() => setIsPlayingAudio(false));
    } else if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(qText);
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!currentQ) return null;

  // Render Voice Mode if selected
  if (config?.simulationMode === "voice") {
    return (
      <div className="flex-1 bg-slate-950 flex flex-col relative h-full min-h-[600px] rounded-2xl overflow-hidden">
        <VoiceMode
          questions={questions.map((q) => ({ id: q.id, question: q.question || q.text }))}
          onSwitchToTextMode={() => setConfig({ simulationMode: "text" })}
          onComplete={(scores) => {
            const mappedQuestions = scores.map((s) => ({
              id: s.question?.id || `q-${Math.random()}`,
              text: s.question?.question || s.question?.text || "Question",
              userAnswer: s.answer,
              feedback: s.evaluation,
            }));
            useInterviewStore.getState().setQuestions(mappedQuestions);
            endInterview();
          }}
          config={config}
          sessionId={sessionId}
        />
      </div>
    );
  }

  const isCodingTrack =
    currentQ.track === "coding" || currentQ.track === "system_design";

  const handleSubmit = async () => {
    if (!answerText.trim() && !codeSnippet.trim()) return;
    setIsSubmitting(true);

    try {
      const submittedText = codeSnippet
        ? `[CODE]\n${codeSnippet}\n[/CODE]\n\n${answerText}`
        : answerText;

      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ,
          textAnswer: submittedText,
          sessionId: sessionId || "temp-id",
          roleFamily: config?.roleFamily || "technology",
          jobDescription: config?.jobDescription || "",
        }),
      });

      const data = await res.json();

      if (data.success && data.evaluation) {
        answerQuestion(submittedText, data.evaluation);
        setLatestEvaluation(data.evaluation);

        if (data.evaluation.next_question) {
          useInterviewStore.getState().insertReinforcedQuestion({
            ...data.evaluation.next_question,
            audioBase64: data.nextQuestionAudio,
            mimeType: data.nextMimeType,
          });
        }

        setShowFeedback(true);
      } else {
        console.error("Evaluation failed", data);
        alert(data.error || "Failed to evaluate answer. Please try again.");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Network error evaluating answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setAnswerText("");
    setCodeSnippet("");
    setLatestEvaluation(null);
    if (currentQuestionIndex >= questions.length - 1) {
      endInterview();
    } else {
      nextQuestion();
    }
  };

  const isLastQuestion = currentQuestionIndex >= questions.length - 1;
  const isReinforced =
    currentQ.question_type === "reinforced_pressure_test" ||
    currentQ.isReinforced ||
    (currentQ.question || currentQ.text)?.startsWith("[Reinforced Challenge");
  const isRolePrefixed =
    currentQ.question_type === "role_prefixed" ||
    (currentQ.question || currentQ.text)?.startsWith("[Role Execution") ||
    (currentQ.question || currentQ.text)?.startsWith("[Role Challenge");

  return (
    <div className="flex-1 flex flex-col bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden font-sans shadow-xs">
      {/* Top Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Live Adaptive Interview
          </span>
          <span className="text-xs text-slate-400 font-medium">
            • Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
            {currentQ.track}
          </span>
          <button
            onClick={() => setConfig({ simulationMode: "voice" })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <Mic size={14} /> Voice Call
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto max-w-5xl w-full mx-auto space-y-6">
        {/* Question Card */}
        <div className={`bg-white border rounded-2xl p-6 shadow-xs space-y-4 ${
          isReinforced ? "border-amber-300 ring-2 ring-amber-500/10" : "border-slate-200"
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                <Bot size={18} />
                <span>AI Interviewer Question</span>
              </div>
              <button
                onClick={handleRepeatQuestionAudio}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                title="Repeat Question Audio"
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX size={13} className="text-rose-500" />
                    <span className="text-rose-600 text-[11px] font-bold">Stop Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={13} className="text-indigo-600" />
                    <span className="text-[11px] font-bold">Repeat Question</span>
                  </>
                )}
              </button>
            </div>

            {isReinforced && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-black uppercase tracking-wider animate-in fade-in">
                <Flame size={14} className="text-amber-500" />
                <span>Reinforced Pressure Test • Confidence Check</span>
              </div>
            )}

            {!isReinforced && isRolePrefixed && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 text-xs font-black uppercase tracking-wider">
                <Target size={14} className="text-indigo-600" />
                <span>Role Foundational Question ({currentQuestionIndex + 1} of 2)</span>
              </div>
            )}
          </div>

          {currentQ.cited_claim && (
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900">
              <span className="font-bold uppercase tracking-wider block mb-0.5 text-[10px] text-amber-700">
                Cross-Examining Your Previous Claim:
              </span>
              <p className="italic font-medium">"{currentQ.cited_claim}"</p>
            </div>
          )}

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed">
            {currentQ.question || currentQ.text}
          </h2>
          {currentQ.expected_signals && currentQ.expected_signals.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 self-center mr-1">
                Target Signals:
              </span>
              {currentQ.expected_signals.map((sig: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium"
                >
                  {sig}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Feedback Mode */}
        {showFeedback && latestEvaluation ? (
          <div className="space-y-4">
            <AnswerCoachFeedback
              evaluation={{
                ...latestEvaluation,
                overall_score: latestEvaluation.overall_score || 75,
                what_worked: latestEvaluation.what_worked || [],
                priority_fix: latestEvaluation.priority_fix || "",
                better_version: latestEvaluation.better_structure || "",
              }}
              onNext={handleNext}
              onRetry={() => {
                setShowFeedback(false);
                setLatestEvaluation(null);
              }}
              isLastQuestion={isLastQuestion}
            />
          </div>
        ) : (
          /* Active Input Area */
          <div className="space-y-4">
            {isCodingTrack && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 shadow-xs">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Code2 size={14} className="text-indigo-400" /> Code Workspace (TypeScript / JS)
                  </span>
                  <span>Monaco Editor</span>
                </div>
                <div className="h-64">
                  <Editor
                    height="100%"
                    defaultLanguage="typescript"
                    theme="vs-dark"
                    value={codeSnippet}
                    onChange={(val) => setCodeSnippet(val || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Answer Explanation
              </label>
              <textarea
                rows={5}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Explain your thought process, architectural choices, trade-offs, and outcomes..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">
                  Tip: Use the STAR format (Situation, Task, Action, Result)
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!answerText.trim() && !codeSnippet.trim())}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Evaluating Answer...
                    </>
                  ) : (
                    <>
                      Submit Answer
                      <Send size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
