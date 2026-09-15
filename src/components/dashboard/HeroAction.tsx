"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  firstName: string;
  isFirstTime: boolean;
  needsReview: any[];
  analyzing: any[];
  upcomingInterviews: any[];
}

export function HeroAction({
  firstName,
  isFirstTime,
  needsReview,
  analyzing,
  upcomingInterviews
}: Props) {
  const [jd, setJd] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"jd" | "link" | "quick">("jd");
  const router = useRouter();

  const handleAddJob = async () => {
    if (!jd.trim() && !jobTitle.trim()) return;
    setLoading(true);

    try {
      const response = await fetch("/api/applications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: jd,
          jobTitle,
          company,
          inputType: tab
        })
      });

      const { applicationId } = await response.json();
      router.push(`/applications/${applicationId}`);
    } finally {
      setLoading(false);
    }
  };

  // STATE 1: First time - show job input prominently
  if (isFirstTime) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 mb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">
            Welcome, {firstName} 👋
          </h1>
          <p className="text-sm text-zinc-500">
            Add your first job and we'll tell you exactly where you stand.
          </p>
        </div>

        {/* Input tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-4">
          {[
            { id: "jd", label: "Paste JD" },
            { id: "link", label: "Job link" },
            { id: "quick", label: "Quick add" }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2 text-sm border-b-2 -mb-[1px] transition-colors ${
                tab === t.id
                  ? "border-blue-600 text-blue-600 font-medium"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* JD paste */}
        {tab === "jd" && (
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="Paste the full job description here — we'll extract everything automatically..."
            className="w-full min-h-[120px] p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm bg-white dark:bg-zinc-950 resize-y mb-4 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        )}

        {/* Job link */}
        {tab === "link" && (
          <input
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="https://linkedin.com/jobs/view/... or any job link"
            className="w-full p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm bg-white dark:bg-zinc-950 mb-4 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        )}

        {/* Quick add */}
        {tab === "quick" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="Job title (e.g. Frontend Developer)"
              className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm bg-white dark:bg-zinc-950 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Company name"
              className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm bg-white dark:bg-zinc-950 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
            <div className="col-span-1 sm:col-span-2 text-xs text-zinc-500 px-1 mt-1">
              ⚠️ Without a job description, some AI features won't be available
            </div>
          </div>
        )}

        <button
          onClick={handleAddJob}
          disabled={loading || (!jd.trim() && !jobTitle.trim())}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
        >
          {loading ? "Analyzing job..." : "Analyze This Job →"}
        </button>
      </div>
    );
  }

  // STATE 2: Has apps - show what needs attention
  // Combine all items and limit to top 3 total
  const allAlerts = [
    ...analyzing.map(a => ({ type: 'analyzing' as const, data: a })),
    ...needsReview.map(a => ({ type: 'review' as const, data: a })),
    ...upcomingInterviews.map(a => ({ type: 'interview' as const, data: a }))
  ].slice(0, 3);

  return (
    <div className="mb-6">
      {/* Greeting (Mobile + Desktop) */}
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          HEY {firstName?.toUpperCase()}
        </h3>
        <span className="text-xs font-semibold text-zinc-600">
          {needsReview.length + upcomingInterviews.length + analyzing.length} active alerts
        </span>
      </div>
      
      <h2 className="text-2xl font-bold mb-5 text-[#111827]">
        Here's what needs your attention today
      </h2>

      {/* Action items - grid layout to fill space on desktop (max 3 items) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {allAlerts.map((alert, idx) => {
          if (alert.type === 'analyzing') {
            return (
              <div key={alert.data.id || idx} className="flex flex-col justify-between p-5 bg-white border border-zinc-200 rounded-[14px] shadow-sm w-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Processing</div>
                    <div className="font-bold text-[#111827]">1 Job</div>
                  </div>
                </div>
                <p className="text-[13px] text-zinc-500 leading-relaxed mb-4">
                  Analyzing requirements. Usually takes 30-60 seconds...
                </p>
              </div>
            );
          }

          if (alert.type === 'review') {
            const app = alert.data;
            return (
              <a
                key={app.id}
                href={`/applications/${app.id}`}
                className="flex flex-col justify-between p-5 bg-white border border-zinc-100 rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] w-full transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                      {(app.company_name ?? "C")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-zinc-500 truncate">Review</div>
                      <div className="font-bold text-[#111827] text-[15px] truncate">{app.company_name}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#fee2e2] text-[#991b1b] shrink-0 whitespace-nowrap">
                    Action needed
                  </span>
                </div>
                
                <p className="text-[13px] text-zinc-500 leading-relaxed mb-5 line-clamp-2">
                  Analysis ready · {app.requirement_maps?.missing_count || 0} gaps found. Review required to proceed.
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="text-sm text-[#5e4cff] font-semibold flex items-center gap-1 shrink-0">
                    Review now →
                  </span>
                  <span className="text-xs font-medium text-zinc-400 truncate ml-2">
                    {app.job_title}
                  </span>
                </div>
              </a>
            );
          }

          if (alert.type === 'interview') {
            const app = alert.data;
            return (
              <a
                key={app.id}
                href={`/applications/${app.id}/interview`}
                className="flex flex-col justify-between p-5 bg-white border border-zinc-100 rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] w-full transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                      {app.company_name ? app.company_name.substring(0, 2).toUpperCase() : "C"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-zinc-500 truncate">Interview</div>
                      <div className="font-bold text-[#111827] text-[15px] truncate">{app.company_name}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#fee2e2] text-[#991b1b] shrink-0 whitespace-nowrap">
                    Action needed
                  </span>
                </div>
                
                <p className="text-[13px] text-zinc-500 leading-relaxed mb-5 line-clamp-2">
                  Prep not complete · Practice recommended before proceeding with recruiter screen.
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="text-sm text-[#5e4cff] font-semibold flex items-center gap-1 shrink-0">
                    Start prep →
                  </span>
                  <span className="text-xs font-medium text-zinc-400 truncate ml-2">
                    {app.job_title}
                  </span>
                </div>
              </a>
            );
          }
        })}

      </div>
    </div>
  );
}
