"use client";

import { useState, useTransition } from "react";
import { ResumeStats, getResumeAnalytics, generateResumeInsight } from "@/lib/actions/analytics";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";
import { Trophy, FileText, TrendingUp, Clock, Briefcase, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

type DateRange = "7" | "30" | "all";

export default function AnalyticsClient({
  initialStats,
  initialInsight,
}: {
  initialStats: ResumeStats[];
  initialInsight: { insight: string; recommendation: string };
}) {
  const [stats, setStats] = useState(initialStats);
  const [insight, setInsight] = useState(initialInsight);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [expandedId, setExpandedId] = useState<string | null>(
    initialStats.find((s) => s.is_best)?.resume_id ?? initialStats[0]?.resume_id ?? null
  );
  const [isPending, startTransition] = useTransition();

  const handleDateChange = (range: DateRange) => {
    setDateRange(range);
    startTransition(async () => {
      const res = await getResumeAnalytics(range);
      if (res.success && res.data) {
        setStats(res.data);
        const ins = await generateResumeInsight(res.data);
        setInsight(ins);
      }
    });
  };

  const totalApps = stats.reduce((s, r) => s + r.total_applications, 0);
  const totalInterviews = stats.reduce((s, r) => s + r.interviews, 0);
  const totalOffers = stats.reduce((s, r) => s + r.offers, 0);
  const overallRate = totalApps > 0 ? Math.round((totalInterviews / totalApps) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Resume Analytics</h1>
          <p className="text-slate-500 mt-1">See which resume is winning you interviews.</p>
        </div>
        {/* Date filter */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {(["7", "30", "all"] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => handleDateChange(r)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                dateRange === r
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {r === "7" ? "7 Days" : r === "30" ? "30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", value: totalApps, icon: Briefcase, color: "blue" },
          { label: "Interviews", value: totalInterviews, icon: TrendingUp, color: "purple" },
          { label: "Offers", value: totalOffers, icon: Trophy, color: "emerald" },
          { label: "Overall Interview Rate", value: `${overallRate}%`, icon: FileText, color: "amber" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-xl bg-${color}-50 flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* AI Insight + Recommendation */}
      {(insight.insight || insight.recommendation) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insight.insight && (
            <div className="flex gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">AI Insight</p>
                <p className="text-sm text-blue-800 leading-relaxed">{insight.insight}</p>
              </div>
            </div>
          )}
          {insight.recommendation && (
            <div className="flex gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900 mb-1">Recommendation</p>
                <p className="text-sm text-emerald-800 leading-relaxed">{insight.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No data state */}
      {stats.length === 0 || totalApps === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <BarChart className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No data yet</h3>
          <p className="text-slate-500 text-sm max-w-xs">
            Upload a resume, link it to applications, and come back here to see your performance stats.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Resume Breakdown</h2>
          {stats.map((resume) => {
            const isExpanded = expandedId === resume.resume_id;
            return (
              <div
                key={resume.resume_id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  resume.is_best ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200"
                }`}
              >
                {/* Card header */}
                <button
                  className="w-full text-left p-5"
                  onClick={() => setExpandedId(isExpanded ? null : resume.resume_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${resume.is_best ? "bg-amber-50" : "bg-slate-50"}`}>
                        <FileText className={`w-5 h-5 ${resume.is_best ? "text-amber-500" : "text-slate-400"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{resume.resume_name}</span>
                          {resume.is_best && (
                            <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              <Trophy className="w-3 h-3" /> Best Performer
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{resume.total_applications} applications tracked</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {/* Stats pills */}
                      <div className="hidden sm:flex gap-4">
                        <Stat label="Interview Rate" value={`${resume.interview_rate}%`} highlight={resume.is_best} />
                        <Stat label="Interviews" value={String(resume.interviews)} />
                        <Stat label="Offers" value={String(resume.offers)} />
                        {resume.avg_days_to_interview !== null && (
                          <Stat label="Avg Days to Interview" value={`${resume.avg_days_to_interview}d`} />
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Mobile stats */}
                  <div className="sm:hidden flex gap-4 mt-3">
                    <Stat label="Interview Rate" value={`${resume.interview_rate}%`} highlight={resume.is_best} />
                    <Stat label="Interviews" value={String(resume.interviews)} />
                    <Stat label="Offers" value={String(resume.offers)} />
                  </div>
                </button>

                {/* Expanded chart */}
                {isExpanded && resume.timeline.length > 0 && (
                  <div className="px-5 pb-6 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-600 mt-4 mb-3">Application Activity (by week)</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={resume.timeline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v.slice(5)} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                          labelStyle={{ fontWeight: 600 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} dot={false} name="Applications" />
                        <Line type="monotone" dataKey="interviews" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Interviews" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {isExpanded && resume.timeline.length === 0 && (
                  <div className="px-5 pb-6 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-400 text-center py-4">No applications linked to this resume yet.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isPending && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          Refreshing data...
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-base font-bold ${highlight ? "text-amber-600" : "text-slate-900"}`}>{value}</p>
      <p className="text-[10px] text-slate-400 whitespace-nowrap">{label}</p>
    </div>
  );
}
