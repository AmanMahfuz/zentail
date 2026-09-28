"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  FileText, 
  HelpCircle, 
  Flame, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResumeRecommendation, QABank } from "@/types/resume-matching";

interface RecommendationCardProps {
  recommendation: ResumeRecommendation;
  qaBank?: QABank;
  onOpenQABank?: () => void;
}

export function RecommendationCard({ recommendation, qaBank, onOpenQABank }: RecommendationCardProps) {
  const [showTailoring, setShowTailoring] = useState(false);
  const [showAllCandidates, setShowAllCandidates] = useState(false);

  const score = recommendation.matchScore;
  const isHighMatch = score >= 75;
  const isModerateMatch = score >= 55 && score < 75;

  const scoreColor = isHighMatch 
    ? "text-emerald-600 bg-emerald-50 border-emerald-200" 
    : isModerateMatch 
      ? "text-amber-600 bg-amber-50 border-amber-200" 
      : "text-rose-600 bg-rose-50 border-rose-200";

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-md bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <BrainCircuit className="w-56 h-56 text-white" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-indigo-200 text-xs font-medium mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Automated AI Decision Engine
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {recommendation.jobTitle}
            </h2>
            <p className="text-slate-300 text-sm mt-0.5">
              at <span className="font-semibold text-white">{recommendation.companyName}</span>
            </p>
          </div>

          {/* Match Score Badge */}
          <div className="flex items-center gap-3">
            <div className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-xl border ${scoreColor} shadow-inner bg-white/95`}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Match Fit</span>
              <span className="text-3xl font-black tracking-tight">{score}%</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Recommendation Verdict Callout */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          recommendation.recommendationType === "use_existing"
            ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
            : "bg-indigo-50/60 border-indigo-200 text-indigo-950"
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {recommendation.recommendationType === "use_existing" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-600 text-white tracking-wide">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Apply
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-600 text-white tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" /> Tailoring Recommended
                </span>
              )}
              <span className="text-sm font-semibold">
                Best Resume: <span className="underline decoration-indigo-300">{recommendation.bestResumeLabel || "Default Resume"}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-1">
              {recommendation.explanation}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {recommendation.bestResumeId && (
              <Link 
                href={`/resumes/${recommendation.bestResumeId}/view`}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                Preview
              </Link>
            )}
            {recommendation.bestResumeId && (
              <Link 
                href={`/resumes/${recommendation.bestResumeId}/edit`}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                Edit in Builder
              </Link>
            )}
          </div>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Matched Skills */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Demonstrated Strengths ({recommendation.matchedSkills.length})
              </span>
            </div>
            {recommendation.matchedSkills.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No exact skills matched.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {recommendation.matchedSkills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100/70 text-emerald-900 border border-emerald-200">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Missing Skills */}
          <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                Missing / Unverified Skills ({recommendation.missingSkills.length})
              </span>
            </div>
            {recommendation.missingSkills.length === 0 ? (
              <p className="text-xs text-emerald-600 font-medium">All required skills are covered in your resume!</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {recommendation.missingSkills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-rose-100/70 text-rose-900 border border-rose-200">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tailoring Suggestions Accordion */}
        {recommendation.tailoringSuggestions?.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              onClick={() => setShowTailoring(!showTailoring)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Targeted Resume Tweaks ({recommendation.tailoringSuggestions.length} recommendations)
                </span>
              </div>
              {showTailoring ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showTailoring && (
              <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-200/60 bg-white">
                <ul className="space-y-2">
                  {recommendation.tailoringSuggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <span className="font-bold text-indigo-600 mt-0.5">•</span>
                      <span className="leading-relaxed">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Other Resumes Evaluated */}
        {recommendation.allCandidates && recommendation.allCandidates.length > 1 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              onClick={() => setShowAllCandidates(!showAllCandidates)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  All Resumes Evaluated ({recommendation.allCandidates.length})
                </span>
              </div>
              {showAllCandidates ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showAllCandidates && (
              <div className="p-4 pt-2 border-t border-slate-200/60 bg-white space-y-2.5">
                {recommendation.allCandidates.map((c) => {
                  const isWinner = c.resumeId === recommendation.bestResumeId;
                  return (
                    <div 
                      key={c.resumeId} 
                      className={`p-3 rounded-lg border text-xs sm:text-sm flex items-center justify-between gap-3 ${
                        isWinner ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200 bg-slate-50/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 ${isWinner ? "text-indigo-600 font-bold" : "text-slate-400"}`} />
                        <div>
                          <span className="font-semibold text-slate-900">{c.versionLabel}</span>
                          {isWinner && <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-600 text-white">Top Match</span>}
                          <p className="text-xs text-slate-500 mt-0.5">{c.summary}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-base font-bold ${
                          c.matchScore >= 75 ? "text-emerald-600" : c.matchScore >= 55 ? "text-amber-600" : "text-rose-600"
                        }`}>
                          {c.matchScore}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions with Q&A Bank Launcher */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>15 Interview Q&As prepared specifically for this role</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenQABank && (
              <Button 
                onClick={onOpenQABank}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm text-xs font-semibold px-4 h-9"
              >
                <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                Practice 15 Interview Q&As
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
