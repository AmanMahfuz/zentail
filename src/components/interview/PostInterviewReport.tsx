import React from 'react';

interface PostInterviewReportProps {
  scores: any[];
  interviewConfig: any;
  averageScore: number;
}

export const PostInterviewReport = React.forwardRef<HTMLDivElement, PostInterviewReportProps>(
  ({ scores, interviewConfig, averageScore }, ref) => {
    return (
      <div ref={ref} className="bg-white text-slate-900 p-8 sm:p-12 font-sans print:p-6 print:text-black">
        {/* Header Section */}
        <div className="border-b-4 border-indigo-600 pb-6 mb-8 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black tracking-widest uppercase bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                Zentail AI
              </span>
              <span className="text-xs text-slate-400 font-bold">Executive Interview Evaluation</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Performance Dossier</h1>
            <p className="text-lg text-slate-700 font-bold mt-1">{interviewConfig?.role || 'Candidate Assessment'}</p>
            <p className="text-sm text-slate-500 capitalize">
              {interviewConfig?.difficulty || 'Intermediate'} Level • {interviewConfig?.track?.replace('_', ' ') || interviewConfig?.mode || 'Interactive Simulation'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-indigo-600 tracking-tight">{averageScore}<span className="text-2xl text-slate-400 font-bold">/100</span></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Composite Score</p>
          </div>
        </div>

        <div className="mb-8 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-sm text-slate-600 leading-relaxed">
            Generated on <strong className="text-slate-800">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong> by Zentail Adaptive Interview AI. 
            This confidential evaluation assesses alignment against industry competency benchmarks, response structure, delivery confidence, and provides recommended STAR-model upgrades.
          </p>
        </div>

        {/* Question Breakdown */}
        <div className="space-y-8">
          {scores.map((item, i) => {
            const questionText = item.question?.question || item.text || `Question ${i + 1}`;
            const overallScore = item.evaluation?.overall_score || item.feedback?.overall_score || 0;
            const userAnswer = item.answer || item.userAnswer || 'No response recorded.';
            const whatWorked = item.evaluation?.what_worked || item.feedback?.what_worked || [];
            const whatWasMissing = item.evaluation?.what_was_missing || item.feedback?.what_was_missing || [];
            const priorityFix = item.evaluation?.priority_fix || item.feedback?.priority_fix;
            const idealAnswer = item.evaluation?.improved_answer_outline || item.feedback?.better_structure;

            return (
              <div 
                key={i} 
                className="border border-slate-200 rounded-2xl p-6 bg-slate-50/70 shadow-sm break-inside-avoid print:bg-white print:border-slate-300"
                style={{ breakInside: 'avoid' }}
              >
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div>
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1 block">Question {i + 1}</span>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{questionText}</h3>
                  </div>
                  <div className="text-2xl font-black text-indigo-600 bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-xs shrink-0">
                    {overallScore}<span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                </div>
                
                <div className="mb-5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Candidate Response</span>
                  <p className="text-sm text-slate-700 italic bg-white p-3.5 rounded-xl border border-slate-200/80 leading-relaxed font-serif">
                    "{userAnswer}"
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div className="bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-xl">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5 block">What Worked</span>
                    {whatWorked.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
                        {whatWorked.map((w: string, j: number) => <li key={j}>{w}</li>)}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Clear participation</p>
                    )}
                  </div>
                  <div className="bg-rose-50/60 border border-rose-100 p-3.5 rounded-xl">
                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1.5 block">Priority Optimization</span>
                    {priorityFix ? (
                      <p className="text-xs text-rose-800 font-medium leading-relaxed">{priorityFix}</p>
                    ) : whatWasMissing.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
                        {whatWasMissing.map((m: string, j: number) => <li key={j}>{m}</li>)}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 italic">None noted</p>
                    )}
                  </div>
                </div>
                
                {idealAnswer && (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1.5 block">
                      Executive STAR Delivery Model
                    </span>
                    <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                      {idealAnswer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

PostInterviewReport.displayName = 'PostInterviewReport';
