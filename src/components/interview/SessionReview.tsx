'use client';

import React from 'react';
import { useInterviewStore } from '@/store/useInterviewStore';
import { motion } from 'framer-motion';
import { BarChart2, CheckCircle2, RotateCcw, TrendingUp, AlertTriangle, TrendingDown, Printer } from 'lucide-react';
import Link from 'next/link';
import { PostInterviewReport } from './PostInterviewReport';

export default function SessionReview() {
  const { questions, config, reset } = useInterviewStore();

  // Calculate mock overall scores based on the answers
  const avgConfidence = Math.round(questions.reduce((acc, q) => acc + (q.feedback?.detailed_scores?.confidence || 0), 0) / questions.length) || 0;
  const avgFluency = Math.round(questions.reduce((acc, q) => acc + (q.feedback?.detailed_scores?.english_fluency || 0), 0) / questions.length) || 0;
  const avgStructure = Math.round(questions.reduce((acc, q) => acc + (q.feedback?.detailed_scores?.structure || 0), 0) / questions.length) || 0;
  
  const overallScore = Math.round(questions.reduce((acc, q) => acc + (q.feedback?.overall_score || 0), 0) / questions.length) || 0;

  // Identify Strongest and Weakest Answers
  const sortedQuestions = [...questions].sort((a, b) => (b.feedback?.overall_score || 0) - (a.feedback?.overall_score || 0));
  const strongestAnswer = sortedQuestions[0];
  const weakestAnswer = sortedQuestions[sortedQuestions.length - 1];

  // Aggregate weaknesses
  const allWeaknesses = questions.map(q => q.feedback?.priority_fix).filter(Boolean);
  const topWeaknesses = Array.from(new Set(allWeaknesses)).slice(0, 3);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-10">
        
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4 tracking-tight">Session Review</h1>
          <p className="text-lg text-slate-500">Here's how you performed in your {config?.mode?.replace('_', ' ')} practice session.</p>
        </div>

        {/* Top Score Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#111216] p-6 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center shadow-sm">
             <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Overall</span>
             <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400">{overallScore}</span>
          </div>
          <div className="bg-white dark:bg-[#111216] p-6 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center shadow-sm">
             <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Confidence</span>
             <span className="text-4xl font-bold">{avgConfidence}</span>
          </div>
          <div className="bg-white dark:bg-[#111216] p-6 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center shadow-sm">
             <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Fluency</span>
             <span className="text-4xl font-bold">{avgFluency}</span>
          </div>
          <div className="bg-white dark:bg-[#111216] p-6 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center shadow-sm">
             <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Structure</span>
             <span className="text-4xl font-bold">{avgStructure}</span>
          </div>
        </div>

        {/* High Level Report */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-500/20">
             <h3 className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-2 mb-3"><TrendingUp size={18}/> Strongest Area</h3>
             <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-2 font-medium">Question: {strongestAnswer?.text}</p>
             <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl">
                <span className="text-xs font-black text-emerald-600 uppercase block mb-1">What worked</span>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 italic">{strongestAnswer?.feedback?.what_worked?.[0]}</p>
             </div>
          </div>
          
          <div className="bg-rose-50 dark:bg-rose-500/10 p-6 rounded-3xl border border-rose-100 dark:border-rose-500/20">
             <h3 className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-2 mb-3"><TrendingDown size={18}/> Needs Practice</h3>
             <p className="text-sm text-rose-800 dark:text-rose-200 mb-2 font-medium">Question: {weakestAnswer?.text}</p>
             <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl">
                <span className="text-xs font-black text-rose-600 uppercase block mb-1">Priority fix</span>
                <p className="text-xs text-rose-700 dark:text-rose-300 italic">{weakestAnswer?.feedback?.priority_fix}</p>
             </div>
          </div>
        </div>

        {/* Top Weaknesses */}
        {topWeaknesses.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-3xl border border-orange-100 dark:border-orange-500/20">
            <h3 className="text-orange-700 dark:text-orange-400 font-bold flex items-center gap-2 mb-4"><AlertTriangle size={18}/> Top Weaknesses Identified</h3>
            <ul className="space-y-2">
              {topWeaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-orange-800 dark:text-orange-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0"/> {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Review */}
        <div className="bg-white dark:bg-[#111216] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <CheckCircle2 className="text-indigo-500" /> Answer Breakdown
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex-1">Q{idx + 1}: {q.text}</h4>
                  <div className="shrink-0 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg">
                    <span className="text-sm font-black text-indigo-600">{q.feedback?.overall_score}<span className="text-indigo-400/50">/100</span></span>
                  </div>
                </div>
                
                <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-500/30 py-1">
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{q.userAnswer}"</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                   <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase flex items-center gap-1.5 mb-2"><TrendingUp size={14}/> What worked</span>
                      <ul className="text-sm text-emerald-700 dark:text-emerald-400 list-disc pl-4 space-y-1">
                        {q.feedback?.what_worked?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                   </div>
                   <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-xl">
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase flex items-center gap-1.5 mb-2"><TrendingDown size={14}/> Priority fix</span>
                      <p className="text-sm text-rose-700 dark:text-rose-400">
                        {q.feedback?.priority_fix}
                      </p>
                   </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl mt-4">
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Better structure</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 italic">{q.feedback?.better_structure}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-6 print:hidden">
          <Link href="/dashboard" className="px-6 py-3.5 rounded-xl font-bold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors text-sm">
            Return to Dashboard
          </Link>
          <button 
            onClick={() => window.print()}
            className="px-6 py-3.5 rounded-xl font-bold border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-sm flex items-center gap-2"
          >
            <Printer size={16} /> Print / Export PDF
          </button>
          <button 
            onClick={reset}
            className="px-8 py-3.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg flex items-center gap-2 transition-all text-sm"
          >
            <RotateCcw size={16} /> Practice Again
          </button>
        </div>

        {/* Printable Section for window.print() */}
        <div className="hidden print:block">
          <PostInterviewReport
            scores={questions}
            interviewConfig={config}
            averageScore={overallScore}
          />
        </div>

      </div>
    </div>
  );
}
