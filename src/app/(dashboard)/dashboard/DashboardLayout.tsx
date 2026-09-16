"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Briefcase, Calendar, CheckCircle2, XCircle, Clock, AlertCircle,
  ArrowRight, BookOpen, GraduationCap, Target, Zap, ChevronRight,
  TrendingUp, Trophy,
} from "lucide-react";
import { AddApplicationModal } from "@/app/(dashboard)/applications/AddApplicationModal";
import { formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";

type Props = {
  userName: string;
  targetRole?: string;
  countsByStatus: Record<string, number>;
  upcomingInterviews: any[];
  followUps: any[];
  recentApplications: any[];
  applicationsThisWeek: number;
  coveragePercent: number;
  totalUnique: number;
  matchedCount: number;
  topMissing: any[];
  activeLearningPath: any | null;
  children?: React.ReactNode;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    saved: { bg: "#f1f5f9", text: "#475569" },
    applied: { bg: "#dbeafe", text: "#1e40af" },
    interview: { bg: "#fef08a", text: "#854d0e" },
    offer: { bg: "#dcfce7", text: "#166534" },
    rejected: { bg: "#fee2e2", text: "#991b1b" }
  };
  const s = styles[status] || styles.saved;
  return (
    <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: s.bg, color: s.text }}>
      {status}
    </span>
  );
}

function Countdown({ scheduledAt }: { scheduledAt: string }) {
  const date = new Date(scheduledAt);
  let text = formatDistanceToNow(date, { addSuffix: true });
  return <div className="text-xl font-bold mt-1" style={{ color: "var(--color-sunset-orange)" }}>{text}</div>;
}

// ... skipped function definitions ...

export default function DashboardLayoutClient({
  userName, targetRole, countsByStatus, upcomingInterviews, followUps,
  recentApplications, applicationsThisWeek, coveragePercent,
  totalUnique, matchedCount, topMissing, activeLearningPath,
  children,
}: Props) {
  const totalApplications = Object.values(countsByStatus).reduce((a, b) => a + b, 0);
  const offers = countsByStatus.offer || 0;
  const interviews = countsByStatus.interview || 0;
  const nextInterview = upcomingInterviews[0] ?? null;
  const coverageColor = coveragePercent >= 75 ? "#16a34a" : coveragePercent >= 50 ? "#d97706" : "var(--color-sunset-orange)";

  return (
    <div className="space-y-6">

      {/* ── Top Level Summary Stats ─────────────────────────────────── */}
      <div 
        className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8 pb-8 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          {targetRole && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3" style={{ backgroundColor: "#eef2ff" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Targeting {targetRole} roles
              </span>
            </div>
          )}
          <h2 className="text-3xl font-bold flex items-center gap-2 mb-1.5" style={{ fontFamily: "var(--font-display)", color: "var(--color-graphite-heading)", letterSpacing: "-0.03em" }}>
            Welcome back, {userName} 👋
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-slate-body)" }}>
            Here is a summary of your job search progress.
          </p>
          <div className="flex items-center gap-3">
            <span 
              className="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
              style={{ backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              {countsByStatus.saved + countsByStatus.applied + countsByStatus.assessment + countsByStatus.interview} in progress
            </span>
            <span 
              className="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
              style={{ backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
              {upcomingInterviews.length} upcoming interviews
            </span>
            <span 
              className="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
              style={{ backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              {coveragePercent}% skill coverage
            </span>
          </div>
        </div>

        <div className="w-full md:w-auto relative">
          <AddApplicationModal 
             triggerClassName="w-full md:w-auto inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-semibold transition-all"
          />
        </div>
      </div>

      {children && (
        <div className="mt-6 mb-2">
          {children}
        </div>
      )}

      {/* ── Stat Cards Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Apps", value: totalApplications, sub: `+${applicationsThisWeek} this week`, icon: Briefcase, iconBg: "#dbeafe", iconColor: "#1e40af", href: "/applications" },
          { label: "Interviews", value: interviews, sub: `${upcomingInterviews.length} upcoming`, icon: Calendar, iconBg: "#ede9fe", iconColor: "var(--color-sunset-orange)", href: "/interviews" },
          { label: "Offers", value: offers, sub: "Landed so far", icon: Trophy, iconBg: "#dcfce7", iconColor: "#166534", href: "/applications" },
          { label: "Skill Coverage", value: `${coveragePercent}%`, sub: `${matchedCount}/${totalUnique} skills`, icon: Target, iconBg: "var(--color-frost-tint)", iconColor: "var(--color-steel-text)", href: "/skills" },
        ].map(({ label, value, sub, icon: Icon, iconBg, iconColor, href }) => (
          <Link key={label} href={href}
            className="rounded-xl px-5 py-4 flex items-center gap-4 transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--color-canvas-white)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-graphite-heading)", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--color-fog-text)" }}>{label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--color-steel-text)" }}>{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Applications — 2 col */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-canvas-white)", boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-ash-border)" }}>
            <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-graphite-heading)", letterSpacing: "-0.01em" }}>
              Recent Applications
            </h3>
            <Link href="/applications" className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--color-sunset-orange)" }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentApplications.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-fog-text)" }} />
              <p className="text-sm" style={{ color: "var(--color-slate-body)" }}>No applications yet.</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-fog-text)" }}>Track your first job above.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--color-ash-border)" }}>
              {recentApplications.map((app: any) => (
                <div key={app.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--color-cloud-mist)] transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold" style={{ backgroundColor: "var(--color-sunset-whisper)", color: "var(--color-sunset-orange)" }}>
                    {(app.job?.company ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--color-graphite-heading)" }}>{app.job?.title ?? "Unknown Role"}</p>
                    <p className="text-xs truncate" style={{ color: "var(--color-slate-body)" }}>{app.job?.company ?? "Unknown Company"} · {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Next Interview Countdown */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-canvas-white)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--color-sunset-whisper)" }}>
                <Zap className="w-3.5 h-3.5" style={{ color: "var(--color-sunset-orange)" }} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)" }}>Next Interview</h3>
            </div>
            {nextInterview ? (
              <>
                <p className="font-semibold text-sm" style={{ color: "var(--color-graphite-heading)" }}>
                  {(nextInterview.application as any)?.job?.company ?? "Unknown"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-slate-body)" }}>
                  {(nextInterview.application as any)?.job?.title ?? "Unknown Role"}
                </p>
                <Countdown scheduledAt={nextInterview.scheduled_at} />
                <Link
                  href={`/interviews/${nextInterview.id}`}
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ backgroundColor: "var(--color-sunset-orange)" }}
                >
                  Prepare Now <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : (
              <div className="text-center py-4">
                <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-fog-text)" }} />
                <p className="text-xs" style={{ color: "var(--color-slate-body)" }}>No upcoming interviews</p>
              </div>
            )}
          </div>

          {/* Skills Progress */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-canvas-white)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--color-frost-tint)" }}>
                  <Target className="w-3.5 h-3.5" style={{ color: "var(--color-steel-text)" }} />
                </div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)" }}>Skill Coverage</h3>
              </div>
              <span className="text-sm font-bold" style={{ color: coverageColor }}>{coveragePercent}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: "var(--color-frost-tint)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${coveragePercent}%`, backgroundColor: coverageColor }} />
            </div>
            {topMissing.length > 0 && (
              <div className="space-y-1.5 mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-fog-text)" }}>Top Missing</p>
                {topMissing.map((gap: any) => (
                  <div key={gap.skill_name} className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--color-slate-body)" }}>• {gap.skill_name}</span>
                    <span className="font-semibold" style={{ color: "#d97706" }}>{gap.required_in_count} jobs</span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/skills" className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--color-sunset-orange)" }}>
              Full Skills Analysis <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">



        {/* Needs Follow-up */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-canvas-white)", boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--color-ash-border)" }}>
            <AlertCircle className="w-4 h-4" style={{ color: "#d97706" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)" }}>Needs Follow-up</h3>
          </div>
          {followUps.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle2 className="w-7 h-7 mx-auto mb-2" style={{ color: "#16a34a" }} />
              <p className="text-sm font-medium" style={{ color: "var(--color-slate-body)" }}>All caught up!</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--color-ash-border)" }}>
              {followUps.map((app: any) => {
                const daysAgo = Math.floor((Date.now() - new Date(app.updated_at).getTime()) / 86400000);
                return (
                  <div key={app.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-graphite-heading)" }}>{app.job?.title}</p>
                      <p className="text-xs" style={{ color: "var(--color-slate-body)" }}>{app.job?.company}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={app.status} />
                      <p className="text-[10px] mt-1" style={{ color: "var(--color-fog-text)" }}>{daysAgo}d no update</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
