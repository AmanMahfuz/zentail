"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AddApplicationModal } from "@/app/(dashboard)/applications/AddApplicationModal";
import { AiMatchAlert } from "@/components/dashboard/AiMatchAlert";
import {
  Briefcase, Calendar, CheckCircle2, AlertCircle,
  ArrowRight, Target, Zap, ChevronRight, Trophy,
  TrendingUp, Clock, ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ── Types ────────────────────────────────────────────────────────────────────
type DashboardData = {
  applications: any[];
  countsByStatus: Record<string, number>;
  upcomingInterviews: any[];
  followUps: any[];
  recommendations: any[];
  stats: {
    total: number;
    applicationsThisWeek: number;
    offers: number;
    interviews: number;
    coveragePercent: number;
    totalUnique: number;
    matchedCount: number;
  };
  topMissing: any[];
};

// ── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  saved:        { bg: "#f1f5f9", text: "#475569", label: "Saved" },
  review_needed:{ bg: "#fef3c7", text: "#92400e", label: "Review Needed" },
  applied:      { bg: "#dbeafe", text: "#1e40af", label: "Applied" },
  assessment:   { bg: "#f3e8ff", text: "#6b21a8", label: "Assessment" },
  interview:    { bg: "#fef08a", text: "#854d0e", label: "Interview" },
  offer:        { bg: "#dcfce7", text: "#166534", label: "Offer" },
  rejected:     { bg: "#fee2e2", text: "#991b1b", label: "Rejected" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "#f1f5f9", text: "#475569", label: (status || "Unknown").replace(/_/g, " ") };
  return (
    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 whitespace-nowrap" style={{ backgroundColor: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 90 ? "text-emerald-700 bg-emerald-50" : score >= 80 ? "text-blue-700 bg-blue-50" : score >= 70 ? "text-amber-700 bg-amber-50" : "text-slate-600 bg-slate-100";
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{score}%</span>;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-lg animate-pulse ${className ?? ""}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-80 rounded-xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Avatar colors ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: "#eef2ff", text: "#4338ca" },
  { bg: "#ecfdf5", text: "#065f46" },
  { bg: "#fff1f2", text: "#9f1239" },
  { bg: "#fffbeb", text: "#92400e" },
  { bg: "#f5f3ff", text: "#5b21b6" },
];
function avatarColor(name: string) { return AVATAR_COLORS[name.length % AVATAR_COLORS.length]; }

// ── Main Client Component ─────────────────────────────────────────────────────
export function DashboardClient({ userName, firstName, targetRole }: { userName: string; firstName: string; targetRole: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/summary", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load dashboard");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 60s in background
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const stats = data?.stats;
  const coverageColor = !stats ? "#94a3b8" :
    stats.coveragePercent >= 75 ? "#16a34a" :
    stats.coveragePercent >= 50 ? "#d97706" :
    "#FC5C3C";

  return (
    <div className="p-8 overflow-y-auto h-full">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8 pb-8 border-b border-slate-100">
        <div>
          {targetRole && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3 bg-blue-50">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Targeting {targetRole} roles
              </span>
            </div>
          )}
          <h1 className="text-3xl font-bold mb-1.5" style={{ fontFamily: "var(--font-display)", color: "var(--color-graphite-heading)", letterSpacing: "-0.03em" }}>
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 mb-4">Here is a summary of your job search progress.</p>
          {/* Status pills */}
          {data && (
            <div className="flex flex-wrap items-center gap-2">
              {[
                { dot: "bg-blue-500", label: `${(data.countsByStatus.saved ?? 0) + (data.countsByStatus.applied ?? 0) + (data.countsByStatus.interview ?? 0) + (data.countsByStatus.assessment ?? 0)} in progress` },
                { dot: "bg-slate-400", label: `${data.upcomingInterviews.length} upcoming interviews` },
                { dot: "bg-emerald-500", label: `${data.stats.coveragePercent}% skill coverage` },
              ].map(p => (
                <span key={p.label} className="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200">
                  <div className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                  {p.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <AddApplicationModal triggerClassName="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-semibold transition-all" />
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-red-600 font-medium mb-3">{error}</p>
          <button onClick={fetchData} className="text-sm text-blue-600 underline">Retry</button>
        </div>
      ) : data ? (
        <div className="space-y-6">

          {/* ── AI Match Alert ────────────────────────── */}
          <AiMatchAlert recommendations={data.recommendations} />

          {/* ── Stat Cards ───────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Apps", value: stats!.total, sub: `+${stats!.applicationsThisWeek} this week`, icon: Briefcase, iconBg: "#dbeafe", iconColor: "#1e40af", href: "/applications" },
              { label: "Interviews", value: stats!.interviews, sub: `${data.upcomingInterviews.length} upcoming`, icon: Calendar, iconBg: "#ede9fe", iconColor: "#FC5C3C", href: "/interviews" },
              { label: "Offers", value: stats!.offers, sub: "Landed so far", icon: Trophy, iconBg: "#dcfce7", iconColor: "#166534", href: "/applications" },
              { label: "Skill Coverage", value: `${stats!.coveragePercent}%`, sub: `${stats!.matchedCount}/${stats!.totalUnique} skills`, icon: Target, iconBg: "#f1f5f9", iconColor: "#64748b", href: "/skills" },
            ].map(({ label, value, sub, icon: Icon, iconBg, iconColor, href }) => (
              <Link
                key={label}
                href={href}
                className="rounded-xl px-5 py-4 flex items-center gap-4 bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
                  <Icon className="w-5 h-5" style={{ color: iconColor }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-graphite-heading)", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
                  <p className="text-[11px] font-semibold mt-0.5 text-slate-500">{label}</p>
                  <p className="text-[10px] mt-0.5 text-slate-400">{sub}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Main Grid ────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Recent Applications — 2/3 width */}
            <div className="lg:col-span-2 rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm">
              <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-graphite-heading)" }}>
                  Recent Applications
                </h3>
                <Link href="/applications" className="text-xs font-semibold flex items-center gap-1 text-[#FC5C3C]">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {data.applications.length === 0 ? (
                <div className="p-10 text-center">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">No applications yet.</p>
                  <p className="text-xs mt-1 text-slate-400">Track your first job using the button above.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {data.applications.map((app: any) => {
                    const company = app.company_name || "Target Company";
                    const title = app.job_title || "Target Role";
                    const av = avatarColor(company);
                    const daysSince = app.created_at
                      ? Math.floor((Date.now() - new Date(app.created_at).getTime()) / 86_400_000)
                      : 0;
                    const stale = (app.status === "applied" && daysSince > 7) || (app.status === "saved" && daysSince > 3);

                    return (
                      <Link
                        key={app.id}
                        href={`/applications/${app.id}`}
                        className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold" style={{ backgroundColor: av.bg, color: av.text }}>
                          {company[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate group-hover:text-blue-600 transition-colors" style={{ color: "var(--color-graphite-heading)" }}>
                            {title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs truncate text-slate-500">{company}</p>
                            {stale && (
                              <span className="text-[10px] font-semibold text-orange-500 flex items-center gap-0.5 shrink-0">
                                <Clock className="w-2.5 h-2.5" />
                                {daysSince}d — follow up?
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {app.fit_score && <ScoreBadge score={app.fit_score} />}
                          <StatusBadge status={app.status} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">

              {/* Next Interview */}
              <div className="rounded-xl p-5 bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center bg-orange-50">
                    <Zap className="w-3.5 h-3.5 text-[#FC5C3C]" />
                  </div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)" }}>Next Interview</h3>
                </div>
                {data.upcomingInterviews[0] ? (
                  <>
                    <p className="font-semibold text-sm text-slate-900">
                      {(data.upcomingInterviews[0].application as any)?.company_name ?? "Unknown Company"}
                    </p>
                    <p className="text-xs mt-0.5 text-slate-500">
                      {(data.upcomingInterviews[0].application as any)?.job_title ?? "Unknown Role"}
                    </p>
                    <div className="text-xl font-bold mt-1 text-[#FC5C3C]">
                      {formatDistanceToNow(new Date(data.upcomingInterviews[0].scheduled_at), { addSuffix: true })}
                    </div>
                    <Link
                      href={`/interviews/${data.upcomingInterviews[0].id}`}
                      className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-semibold text-white bg-[#FC5C3C] hover:bg-[#e04a2a] transition-colors"
                    >
                      Prepare Now <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs text-slate-400">No upcoming interviews</p>
                  </div>
                )}
              </div>

              {/* Skill Coverage */}
              <div className="rounded-xl p-5 bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-100">
                      <Target className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)" }}>Skill Coverage</h3>
                  </div>
                  <span className="text-sm font-bold" style={{ color: coverageColor }}>{stats!.coveragePercent}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-3 bg-slate-100">
                  <div className="h-full rounded-full transition-all" style={{ width: `${stats!.coveragePercent}%`, backgroundColor: coverageColor }} />
                </div>
                {data.topMissing.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Top Missing</p>
                    {data.topMissing.map((gap: any) => (
                      <div key={gap.skill_name} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">• {gap.skill_name}</span>
                        <span className="font-semibold text-amber-600">{gap.required_in_count} jobs</span>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/skills" className="text-xs font-semibold flex items-center gap-1 text-[#FC5C3C]">
                  Full Skills Analysis <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* ── Follow-up Row ─────────────────────────── */}
          {data.followUps.length > 0 && (
            <div className="rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm">
              <div className="px-5 py-4 flex items-center gap-2 border-b border-slate-100">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)" }}>Needs Follow-up</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {data.followUps.map((app: any) => {
                  const daysAgo = app.created_at
                    ? Math.floor((Date.now() - new Date(app.created_at).getTime()) / 86_400_000)
                    : 0;
                  return (
                    <Link key={app.id} href={`/applications/${app.id}`} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{app.job_title || "Target Role"}</p>
                        <p className="text-xs text-slate-500">{app.company_name || "Target Company"}</p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={app.status} />
                        <p className="text-[10px] mt-1 text-slate-400">{daysAgo}d no update</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      ) : null}
    </div>
  );
}
