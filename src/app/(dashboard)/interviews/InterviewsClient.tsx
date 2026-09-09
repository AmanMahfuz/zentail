"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { Calendar, ChevronRight, Clock, Video, CheckCircle2, Circle } from "lucide-react";

function Countdown({ scheduledAt }: { scheduledAt: string }) {
  const [t, setT] = useState<{ d: number; h: number; m: number } | null>(null);
  useEffect(() => {
    const update = () => {
      const target = new Date(scheduledAt);
      const now = new Date();
      if (target <= now) { setT({ d: 0, h: 0, m: 0 }); return; }
      setT({ d: differenceInDays(target, now), h: differenceInHours(target, now) % 24, m: differenceInMinutes(target, now) % 60 });
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  if (!t) return null;
  if (t.d === 0 && t.h === 0 && t.m === 0)
    return <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>Interview time!</span>;

  return (
    <span className="text-xs font-medium" style={{ color: "var(--color-sunset-orange)" }}>
      {t.d > 0 ? `in ${t.d}d ${t.h}h` : `in ${t.h}h ${t.m}m`}
    </span>
  );
}

export default function InterviewsClient({ initialInterviews }: { initialInterviews: any[] }) {
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  const now = new Date();
  const upcoming = initialInterviews.filter(i => new Date(i.scheduled_at) >= now);
  const past = initialInterviews.filter(i => new Date(i.scheduled_at) < now);

  const displayed =
    filter === "upcoming" ? upcoming :
    filter === "past" ? past :
    initialInterviews;

  const renderCard = (i: any) => {
    const isUpcoming = new Date(i.scheduled_at) >= now;
    const company = i.applications?.jobs?.company || "Unknown Company";
    const title = i.applications?.jobs?.title || "Unknown Role";

    return (
      <Link
        key={i.id}
        href={`/interviews/${i.id}`}
        className="block rounded-2xl p-5 transition-all hover:-translate-y-0.5 group"
        style={{
          backgroundColor: "var(--color-canvas-white)",
          boxShadow: "var(--shadow-card)",
          border: isUpcoming ? "1px solid transparent" : "1px solid var(--color-ash-border)",
        }}
        onMouseEnter={e => { if (isUpcoming) (e.currentTarget as HTMLElement).style.borderColor = "var(--color-sunset-orange)"; }}
        onMouseLeave={e => { if (isUpcoming) (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Date badge */}
            <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
              style={{ backgroundColor: isUpcoming ? "var(--color-sunset-whisper)" : "var(--color-frost-tint)" }}>
              <span className="text-[10px] font-bold uppercase" style={{ color: isUpcoming ? "var(--color-sunset-orange)" : "var(--color-fog-text)" }}>
                {format(new Date(i.scheduled_at), "MMM")}
              </span>
              <span className="text-lg font-black leading-none" style={{ color: isUpcoming ? "var(--color-sunset-orange)" : "var(--color-steel-text)" }}>
                {format(new Date(i.scheduled_at), "d")}
              </span>
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-graphite-heading)", letterSpacing: "-0.01em" }}>
                {company}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-slate-body)" }}>{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isUpcoming ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-sunset-whisper)", color: "var(--color-sunset-orange)" }}>
                UPCOMING
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-frost-tint)", color: "var(--color-steel-text)" }}>
                PAST
              </span>
            )}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--color-sunset-orange)" }}>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-steel-text)" }}>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {format(new Date(i.scheduled_at), "h:mm a")}
          </span>
          <span className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" /> Virtual
          </span>
          {i.interview_type && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize"
              style={{ backgroundColor: "var(--color-frost-tint)", color: "var(--color-slate-body)" }}>
              {i.interview_type}
            </span>
          )}
          {isUpcoming && (
            <span className="ml-auto">
              <Countdown scheduledAt={i.scheduled_at} />
            </span>
          )}
        </div>
      </Link>
    );
  };

  const TABS: { key: typeof filter; label: string; count: number }[] = [
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "past",     label: "Past",     count: past.length },
    { key: "all",      label: "All",      count: initialInterviews.length },
  ];

  return (
    <div className="space-y-6 p-8">
      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-semibold mb-1.5"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-graphite-heading)", letterSpacing: "-0.03em", lineHeight: 1.15 }}
          >
            Interviews
          </h1>
          <p className="text-sm" style={{ color: "var(--color-slate-body)", letterSpacing: "-0.01em" }}>
            Manage your upcoming sessions and prep workspaces.
          </p>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--color-canvas-white)", boxShadow: "var(--shadow-card)" }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: filter === tab.key ? "var(--color-sunset-orange)" : "transparent",
                color: filter === tab.key ? "#ffffff" : "var(--color-slate-body)",
              }}
            >
              {tab.label}
              <span className="text-[10px] font-bold px-1 py-0.5 rounded-full"
                style={{
                  backgroundColor: filter === tab.key ? "rgba(255,255,255,0.25)" : "var(--color-frost-tint)",
                  color: filter === tab.key ? "#fff" : "var(--color-steel-text)",
                }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {displayed.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ backgroundColor: "var(--color-canvas-white)", boxShadow: "var(--shadow-card)", border: "2px dashed var(--color-ash-border)" }}>
          <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-fog-text)" }} />
          <p className="font-semibold" style={{ color: "var(--color-graphite-heading)" }}>
            {filter === "upcoming" ? "No upcoming interviews" : filter === "past" ? "No past interviews" : "No interviews yet"}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--color-slate-body)" }}>
            Move an application to "Interview" status to schedule one.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map(renderCard)}
        </div>
      )}
    </div>
  );
}
