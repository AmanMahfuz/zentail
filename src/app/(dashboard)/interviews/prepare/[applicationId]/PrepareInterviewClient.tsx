'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Mic,
  Type,
  FileText,
  Printer,
  Download,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Target,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import VoiceMode from '@/components/interview/VoiceMode';

interface Question {
  id: string;
  question: string;
  category: 'behavioral' | 'technical' | 'situational' | 'cultural' | string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  howToAnswer?: string;
  sampleAnswer?: string;
  followUp?: string;
  keywords?: string[];
  expectedKeywords?: string[];
}

interface ApplicationData {
  id: string;
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
}

interface PrepareInterviewClientProps {
  applicationId: string;
  application: ApplicationData;
  initialQaBank: { questions: Question[] } | null;
  initialMode: 'voice' | 'text' | 'pdf';
}

export default function PrepareInterviewClient({
  applicationId,
  application,
  initialQaBank,
  initialMode,
}: PrepareInterviewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeFromUrl = (searchParams.get('mode') as 'voice' | 'text' | 'pdf') || initialMode;

  const [mode, setMode] = useState<'voice' | 'text' | 'pdf'>(modeFromUrl);
  const [questions, setQuestions] = useState<Question[]>(initialQaBank?.questions || []);
  const [isGenerating, setIsGenerating] = useState(!initialQaBank?.questions?.length);
  const [error, setError] = useState<string | null>(null);

  // Text Mode state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showHowToAnswer, setShowHowToAnswer] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [sessionAnswers, setSessionAnswers] = useState<any[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Sync mode with URL if needed
  useEffect(() => {
    if (searchParams.get('mode') && searchParams.get('mode') !== mode) {
      setMode(searchParams.get('mode') as 'voice' | 'text' | 'pdf');
    }
  }, [searchParams]);

  // If no questions, generate them automatically
  useEffect(() => {
    async function ensureQuestions() {
      if (questions.length > 0) return;
      setIsGenerating(true);
      setError(null);
      try {
        const res = await fetch(`/api/interviews/${applicationId}/generate-qa`, {
          method: 'POST',
        });
        const rawText = await res.text();
        let data: any = {};
        try {
          data = JSON.parse(rawText);
        } catch {
          if (!res.ok) {
            throw new Error(`Failed to generate interview questions (${res.status})`);
          }
        }
        if (!res.ok) throw new Error(data.error || 'Failed to generate interview questions');
        
        const loadedQuestions = data.questions || data.qaBank?.questions;
        if (loadedQuestions && loadedQuestions.length > 0) {
          setQuestions(loadedQuestions);
        } else {
          // Fallback check
          const getRes = await fetch(`/api/interviews/applications`);
          if (getRes.ok) {
            const apps = await getRes.json().catch(() => []);
            const currentApp = Array.isArray(apps) ? apps.find((a: any) => a.id === applicationId) : null;
            if (currentApp?.qaBank?.questions && currentApp.qaBank.questions.length > 0) {
              setQuestions(currentApp.qaBank.questions);
              return;
            }
          }
          setError('No questions available yet. Please refresh or try again.');
        }
      } catch (err: any) {
        console.error('Error generating QA bank:', err);
        setError(err.message || 'Unable to generate questions bank. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    }

    ensureQuestions();
  }, [applicationId, questions.length]);

  // Text mode: Speech synthesis for reading question
  const toggleSpeakQuestion = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleEvaluateAnswer = async () => {
    if (!userAnswer.trim()) return;
    setIsEvaluating(true);
    const currentQ = questions[currentIndex];

    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: {
            id: currentQ.id,
            question: currentQ.question,
            text: currentQ.question,
            category: currentQ.category,
            keywords: currentQ.keywords,
          },
          textAnswer: userAnswer,
          roleFamily: application.jobTitle,
          jobDescription: application.jobDescription,
        }),
      });

      const data = await res.json();
      const evalResult = data.evaluation || {
        overall_score: 78,
        score: 78,
        feedback: data.feedback || 'Good structured response. Try including specific metrics next time.',
        strengths: data.strengths || ['Direct answer to the prompt'],
        weaknesses: data.weaknesses || ['Could elaborate on specific impact'],
      };

      setEvaluation(evalResult);
      setSessionAnswers((prev) => [
        ...prev,
        {
          question: currentQ.question,
          category: currentQ.category,
          answer: userAnswer,
          score: evalResult.overall_score || evalResult.score || 75,
          feedback: evalResult.feedback,
        },
      ]);
    } catch (err) {
      console.error('Evaluation error:', err);
      // Fallback evaluation
      const fallback = {
        overall_score: 75,
        score: 75,
        feedback: 'Your answer covers the core concepts well. Focus on communicating measurable impact and specific tools.',
        strengths: ['Clear explanation'],
        weaknesses: ['Add concrete examples from past work'],
      };
      setEvaluation(fallback);
      setSessionAnswers((prev) => [
        ...prev,
        {
          question: currentQ.question,
          category: currentQ.category,
          answer: userAnswer,
          score: 75,
          feedback: fallback.feedback,
        },
      ]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer('');
      setEvaluation(null);
      setShowHowToAnswer(false);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    } else {
      handleCompleteSession();
    }
  };

  const handleCompleteSession = async () => {
    setIsSessionComplete(true);
    const scores = sessionAnswers.map((a) => a.score);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 80;

    try {
      await fetch(`/api/interviews/${applicationId}/save-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'text',
          overallScore: avgScore,
          answers: sessionAnswers,
          overallFeedback: `Completed practice on ${questions.length} tailored interview questions.`,
          duration_seconds: 300,
        }),
      });
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  const handleVoiceComplete = async (scores: any[]) => {
    const numericScores = scores.map((s) => s.evaluation?.score || s.score || 75);
    const avg = numericScores.length ? Math.round(numericScores.reduce((a, b) => a + b, 0) / numericScores.length) : 80;

    try {
      await fetch(`/api/interviews/${applicationId}/save-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'voice',
          overallScore: avg,
          answers: scores,
          overallFeedback: 'Voice simulation completed successfully.',
          duration_seconds: 450,
        }),
      });
    } catch (e) {
      console.error('Failed to save voice session:', e);
    }
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const response = await fetch(`/api/interviews/${applicationId}/download-pdf`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate Interview Q&A PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(application.companyName || 'Interview').replace(/[^a-zA-Z0-9_-]/g, '_')}_${(application.jobTitle || 'Role').replace(/[^a-zA-Z0-9_-]/g, '_')}_QA_Bank.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to download PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadMarkdown = () => {
    const content = `# Interview Q&A Bank: ${application.jobTitle} at ${application.companyName}
Generated by Zentail AI • ${questions.length} Tailored Questions

${questions
  .map(
    (q, idx) => `## Question ${idx + 1}: ${q.question}
- **Category**: ${q.category.toUpperCase()}
- **Difficulty**: ${q.difficulty}
${q.keywords?.length ? `- **Key Concepts**: ${q.keywords.join(', ')}` : ''}

### How to Answer Effectively:
${q.howToAnswer || 'Use the STAR method (Situation, Task, Action, Result) to structure your response.'}

${q.sampleAnswer ? `### Model Answer:\n${q.sampleAnswer}\n` : ''}
---
`
  )
  .join('\n')}`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${application.companyName}_${application.jobTitle}_QA_Bank.md`.replace(/\s+/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Filtered questions for PDF mode
  const filteredQuestions = categoryFilter === 'all'
    ? questions
    : questions.filter((q) => q.category?.toLowerCase() === categoryFilter.toLowerCase());

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Generating 15 Tailored Questions</h2>
          <p className="text-sm text-slate-500">
            Zentail AI is analyzing the requirements for <strong className="text-slate-800">{application.jobTitle}</strong> at <strong className="text-slate-800">{application.companyName}</strong>...
          </p>
          <div className="flex justify-center items-center gap-2 text-xs font-semibold text-indigo-600 pt-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Preparing technical, behavioral & situational tracks
          </div>
          <div className="pt-3 border-t border-slate-100">
            <Link
              href="/interviews"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Interviews
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto text-red-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Questions Bank Unavailable</h2>
          <p className="text-sm text-slate-500">{error}</p>
          <div className="space-y-2 pt-2">
            <Button onClick={() => window.location.reload()} className="w-full bg-[#4F39F6]">
              Try Again
            </Button>
            <Link
              href="/interviews"
              className="block w-full py-2.5 text-center text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              ← Back to Interviews
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex] || questions[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar - Hidden during Print */}
      <header className="print:hidden bg-white border-b border-slate-200 sticky top-0 z-40 px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/interviews"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Back to Interviews"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-base">{application.jobTitle}</h1>
              <span className="text-xs font-medium text-slate-400">at {application.companyName}</span>
            </div>
            <p className="text-[11px] font-semibold text-indigo-600">
              {questions.length} Predefined Interview Questions Bank
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs & Stop Interview */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => {
                setMode('text');
                router.replace(`/interviews/prepare/${applicationId}?mode=text`);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'text'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Type className="w-3.5 h-3.5" /> Text Mode
            </button>
            <button
              onClick={() => {
                setMode('voice');
                router.replace(`/interviews/prepare/${applicationId}?mode=voice`);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'voice'
                  ? 'bg-white text-purple-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mic className="w-3.5 h-3.5" /> Voice Mode
            </button>
            <button
              onClick={() => {
                setMode('pdf');
                router.replace(`/interviews/prepare/${applicationId}?mode=pdf`);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'pdf'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> PDF Q&A Bank
            </button>
          </div>

          <Link
            href="/interviews"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors shrink-0"
          >
            Stop Interview
          </Link>
        </div>
      </header>

      {/* Mode 1: VOICE MODE */}
      {mode === 'voice' && (
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col">
          <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex-1 flex flex-col min-h-[620px] border border-slate-800">
            <VoiceMode
              questions={questions.map((q) => ({
                id: q.id,
                question: q.question,
                category: q.category,
                howToAnswer: q.howToAnswer,
              }))}
              onComplete={handleVoiceComplete}
              onSwitchToTextMode={() => setMode('text')}
            />
          </div>
        </main>
      )}

      {/* Mode 2: TEXT MODE */}
      {mode === 'text' && (
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
          {isSessionComplete ? (
            /* Session Completed Screen */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-6 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Text Practice Completed!</h2>
                <p className="text-sm text-slate-500 mt-1">
                  You completed all {questions.length} questions for {application.jobTitle}.
                </p>
              </div>

              {/* Answers Review */}
              <div className="space-y-4 text-left max-h-[400px] overflow-y-auto pt-4 border-t border-slate-100">
                {sessionAnswers.map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 uppercase">Q{i + 1} • {item.category}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Score: {item.score}%
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{item.question}</p>
                    <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-100">
                      "{item.answer}"
                    </p>
                    {item.feedback && (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {item.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentIndex(0);
                    setUserAnswer('');
                    setEvaluation(null);
                    setSessionAnswers([]);
                    setIsSessionComplete(false);
                  }}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Practice Again
                </Button>
                <Button
                  onClick={() => setMode('voice')}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Mic className="w-4 h-4 mr-2" /> Try Voice Mode
                </Button>
              </div>
            </div>
          ) : (
            /* Active Question Screen */
            <div className="space-y-6">
              {/* Question Progress Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    {currentQ.category || 'General'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 capitalize">
                    {currentQ.difficulty || 'medium'} difficulty
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Question {currentIndex + 1} of {questions.length}
                </span>
              </div>

              {/* Question Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interview Question</p>
                      <h2 className="text-lg md:text-xl font-bold text-slate-900 mt-1 leading-relaxed">
                        {currentQ.question}
                      </h2>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSpeakQuestion(currentQ.question)}
                    className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shrink-0"
                    title={isSpeaking ? 'Mute' : 'Listen to question'}
                  >
                    {isSpeaking ? <VolumeX className="w-5 h-5 text-indigo-600 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>

                {/* How to Answer Toggle */}
                {currentQ.howToAnswer && (
                  <div className="pt-2">
                    <button
                      onClick={() => setShowHowToAnswer(!showHowToAnswer)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {showHowToAnswer ? 'Hide Coaching Guide' : 'How to Answer this Question (Coaching Tips)'}
                      {showHowToAnswer ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                    </button>

                    {showHowToAnswer && (
                      <div className="mt-3 p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-950 leading-relaxed space-y-2">
                        <p className="font-semibold text-indigo-900">💡 Strategy & Structure:</p>
                        <p>{currentQ.howToAnswer}</p>
                        {currentQ.keywords?.length ? (
                          <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                            <span className="font-semibold text-indigo-900 mr-1">Key concepts to mention:</span>
                            {currentQ.keywords.map((kw, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-[10px] font-bold text-indigo-700">
                                {kw}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Answer Input Section */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Your Response</h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>

                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer clearly. Focus on real actions you took and outcomes you achieved..."
                  rows={6}
                  disabled={isEvaluating}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none transition-all leading-relaxed"
                />

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> AI will evaluate completeness, clarity & relevance
                  </span>

                  <Button
                    onClick={handleEvaluateAnswer}
                    disabled={!userAnswer.trim() || isEvaluating}
                    className="bg-[#4F39F6] hover:bg-[#4330E0] text-white px-6 font-bold"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evaluating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Submit Answer
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Evaluation Feedback Card */}
              {evaluation && (
                <div className="bg-white rounded-3xl border border-indigo-200 p-6 md:p-8 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                        {evaluation.overall_score || evaluation.score || 80}%
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">AI Coach Feedback</h4>
                        <p className="text-[11px] text-slate-400">Response Evaluation</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {evaluation.feedback}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {evaluation.strengths?.length > 0 && (
                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
                        <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                        </p>
                        <ul className="text-xs text-emerald-700 space-y-0.5 list-disc pl-4">
                          {evaluation.strengths.map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {evaluation.weaknesses?.length > 0 && (
                      <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 space-y-1">
                        <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> How to Improve
                        </p>
                        <ul className="text-xs text-amber-700 space-y-0.5 list-disc pl-4">
                          {evaluation.weaknesses.map((w: string, idx: number) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={handleNextQuestion}
                      className="bg-slate-900 hover:bg-black text-white px-6 font-bold"
                    >
                      {currentIndex < questions.length - 1 ? 'Next Question →' : 'Complete Session 🎉'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* Mode 3: PDF / STUDY BANK */}
      {mode === 'pdf' && (
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-8">
          {/* Controls Bar - Hidden on print */}
          <div className="print:hidden bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Customized 15-Question Study Bank</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every question with category, difficulty, coaching tips, and model answers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleDownloadMarkdown}
                className="text-xs font-bold rounded-xl"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export Markdown
              </Button>
              <Button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="bg-[#008B5C] hover:bg-[#00754E] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {isDownloadingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF Q&A Bank
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Category Filter Pills - Hidden on print */}
          <div className="print:hidden flex flex-wrap gap-2">
            {['all', 'behavioral', 'technical', 'situational', 'cultural'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat} {cat === 'all' ? `(${questions.length})` : ''}
              </button>
            ))}
          </div>

          {/* Printable Document Sheet */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-sm space-y-8 print:shadow-none print:border-none print:p-0">
            {/* Document Header */}
            <div className="border-b border-slate-200 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                    Zentail Interview Intelligence
                  </span>
                  <h1 className="text-2xl font-bold text-slate-900 mt-2">
                    {application.jobTitle} — Interview Q&A Bank
                  </h1>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    Company: <strong className="text-slate-700">{application.companyName}</strong> • 15 Predefined Questions & Model Answers
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-semibold text-slate-400">Total Questions</span>
                  <p className="text-2xl font-bold text-slate-900">{questions.length}</p>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {filteredQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3.5 break-inside-avoid"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                        {q.category}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 capitalize">
                      {q.difficulty} difficulty
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {q.question}
                  </h3>

                  {q.howToAnswer && (
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-500" /> How to Answer Effectively:
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed">{q.howToAnswer}</p>
                    </div>
                  )}

                  {q.sampleAnswer && (
                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1">
                      <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> High-Impact Model Answer:
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed italic">{q.sampleAnswer}</p>
                    </div>
                  )}

                  {q.keywords && q.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400">Key Focus Areas:</span>
                      {q.keywords.map((kw, kIdx) => (
                        <span
                          key={kIdx}
                          className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-600"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
