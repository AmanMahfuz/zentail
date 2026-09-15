"use client";

interface Props {
  application: any;
  stageColor: string;
  stageBg: string;
}

export function ApplicationCard({ application: app, stageColor, stageBg }: Props) {
  const missing = app.requirement_maps?.missing_count || 0;
  const fitScore = app.fit_score;

  return (
    <a
      href={`/applications/${app.id}`}
      className="block bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 no-underline text-inherit hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
    >
      {/* Company + role */}
      <div className="mb-3">
        <div className="text-sm font-medium leading-tight">
          {app.job_title}
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          {app.company_name}
        </div>
      </div>

      {/* Fit score */}
      {fitScore != null && (
        <div className="mb-3">
          <div className="flex justify-between text-[11px] text-zinc-500 mb-1.5">
            <span>Fit</span>
            <span>{fitScore}%</span>
          </div>
          <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                fitScore >= 80 ? "bg-emerald-500" :
                fitScore >= 60 ? "bg-amber-500" :
                "bg-red-500"
              }`}
              style={{ width: `${fitScore}%` }} 
            />
          </div>
        </div>
      )}

      {/* Status badges */}
      <div className="flex flex-wrap gap-1 mb-3">
        {app.resumes_generated?.status === "ready" && (
          <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
            Resume ✓
          </span>
        )}
        {app.resumes_generated?.status === "generating" && (
          <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full">
            Resume ⏳
          </span>
        )}
        {app.interview_prep?.status === "ready" && (
          <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
            Prep ✓
          </span>
        )}
        {missing > 0 && (
          <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
            {missing} gaps
          </span>
        )}
      </div>

      {/* NEXT ACTION - the most important part */}
      {app.next_action && (
        <div 
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium"
          style={{ background: stageBg, color: stageColor }}
        >
          → {app.next_action}
        </div>
      )}

      {/* Date */}
      <div className="text-[10px] text-zinc-400 mt-2">
        {getDaysAgo(app.created_at)}
      </div>
    </a>
  );
}

function getDaysAgo(dateStr: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "Added today";
  if (days === 1) return "Added yesterday";
  return `Added ${days} days ago`;
}
