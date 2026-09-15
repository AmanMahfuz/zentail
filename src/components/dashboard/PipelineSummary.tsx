"use client";

export function PipelineSummary({ applications, weeklyStats }: { applications: any[], weeklyStats: any }) {
  const stages = [
    { key: "analyzing", label: "Analyzing" },
    { key: "review_needed", label: "Review needed" },
    { key: "applied", label: "Applied" },
    { key: "interviewing", label: "Interviewing" },
    { key: "outcome", label: "Outcome" }
  ];

  const counts = stages.reduce((acc, stage) => {
    acc[stage.key] = applications.filter((a: any) => a.status === stage.key).length;
    return acc;
  }, {} as Record<string, number>);

  const total = applications.length;
  // Calculate interviews: anything currently interviewing + anything in outcome that had an interview (simplification for now: outcome = offer/rejected/ghosted could have had an interview)
  // Let's count apps that progressed past applied
  const interviews = counts.interviewing + (applications.filter((a: any) =>
    ["offer", "rejected"].includes(a.outcome)
  ).length);
  const offers = applications.filter((a: any) => a.outcome === "offer").length;

  const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0;
  const offerRate = interviews > 0 ? Math.round((offers / interviews) * 100) : 0;

  return (
    <div className="mb-6 md:hidden">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)" }}>
            Pipeline
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
            {weeklyStats?.new_this_week || 0} This week new jobs
          </span>
        </div>
        <a href="/analytics" className="text-xs font-semibold flex items-center gap-1 text-blue-600">
          Full analytics <span className="text-[10px]">→</span>
        </a>
      </div>

      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4">
        {stages.map((stage) => (
          <div key={stage.key} className="flex flex-col items-center justify-center p-4 bg-white rounded-xl min-w-[100px] snap-center shrink-0 shadow-sm border border-zinc-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 truncate w-full text-center">
              {stage.label}
            </span>
            <span className="text-2xl font-semibold text-zinc-900">
              {counts[stage.key] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
