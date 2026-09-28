import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddApplicationModal } from "./AddApplicationModal";
import { KanbanWrapper } from "./KanbanWrapper";
import { ApplicationsListWrapper } from "./ApplicationsListWrapper";
import {
  Bookmark, Send, TerminalSquare, MessageSquare,
  CheckCircle2, XCircle,
} from "lucide-react";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const params = await searchParams;
  const currentView = params.view === "list" ? "list" : "kanban";
  const searchQuery = params.q?.toLowerCase() ?? "";

  const { data: rawApplications, error: appError } = await supabase
    .from("applications")
    .select(`
      id, status, applied_at, company_name, job_title,
      job_link, fit_score, fit_level, fit_summary, created_at
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (appError) console.error("Applications query error:", appError);

  const applications = (rawApplications || []).map((app: any) => ({
    ...app,
    job: {
      company: app.company_name || "Target Company",
      title: app.job_title || "Target Role",
      url: app.job_link || null,
    },
    notes: app.fit_summary || "",
  }));

  // Normalise status for the 6 kanban columns
  const kanbanApplications = applications.map((app: any) => {
    let newStatus: string = app.status;
    if (["review_needed", "saved", "analyzing"].includes(app.status) || !app.status) newStatus = "saved";
    else if (["interviewing", "interview"].includes(app.status)) newStatus = "interview";
    else if (app.status === "assessment") newStatus = "assessment";
    else if (app.status === "applied") newStatus = "applied";
    else if (app.status === "offer") newStatus = "offer";
    else if (app.status === "rejected" || app.status === "outcome") newStatus = "rejected";
    return { ...app, status: newStatus as any };
  });

  type StatusConfig = {
    id: string; label: string; sub: string; icon: any;
    color: string; bg: string; accent: string; border?: string; labelColor?: string; numColor?: string;
  };
  const statuses: StatusConfig[] = [
    { id: "saved",      label: "SAVED",      sub: "Review Needed", icon: Bookmark,       color: "text-slate-500",   bg: "bg-slate-100",    accent: "bg-slate-400",   numColor: "text-slate-900" },
    { id: "applied",    label: "APPLIED",    sub: "Submitted",     icon: Send,           color: "text-blue-600",    bg: "bg-blue-50",      accent: "bg-blue-500",    numColor: "text-slate-900" },
    { id: "assessment", label: "ASSESSMENT", sub: "Pending",       icon: TerminalSquare, color: "text-violet-600",  bg: "bg-violet-50",    accent: "bg-violet-500",  numColor: "text-slate-900" },
    { id: "interview",  label: "INTERVIEW",  sub: "In Progress",   icon: MessageSquare,  color: "text-[#FC5C3C]",   bg: "bg-[#FC5C3C]/10", accent: "bg-[#FC5C3C]",  border: "border-[#FC5C3C]", labelColor: "text-[#FC5C3C]", numColor: "text-[#FC5C3C]" },
    { id: "offer",      label: "OFFER",      sub: "Secured",       icon: CheckCircle2,   color: "text-emerald-600", bg: "bg-emerald-50",   accent: "bg-emerald-500", numColor: "text-emerald-700" },
    { id: "rejected",   label: "REJECTED",   sub: "Closed",        icon: XCircle,        color: "text-red-500",     bg: "bg-red-50",       accent: "bg-red-400",     numColor: "text-red-600" },
  ];

  const counts = statuses.reduce((acc, s) => {
    acc[s.id] = kanbanApplications.filter((a: any) => a.status === s.id).length;
    return acc;
  }, {} as Record<string, number>);

  const activeLeads =
    (counts.interview || 0) + (counts.offer || 0) +
    (counts.assessment || 0) + (counts.applied || 0);

  return (
    <div className="flex flex-col flex-1 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden min-h-0">

      {/* ── Header ── */}
      <div className="mb-6 flex-none flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1
              className="text-3xl font-semibold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-graphite-heading)",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              Applications Pipeline
            </h1>
            <span className="bg-[#FC5C3C]/10 text-[#FC5C3C] px-3 py-1 rounded-full text-xs font-semibold">
              {activeLeads} Active Leads
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--color-slate-body)", letterSpacing: "-0.01em" }}>
            Track, manage, and win your active job opportunities across interview stages.
          </p>
        </div>
        <AddApplicationModal />
      </div>

      {/* ── Stats Row ── */}
      <div className="flex gap-4 mb-6 shrink-0 flex-wrap lg:flex-nowrap">
        {statuses.map((status) => {
          const Icon = status.icon;
          return (
            <div
              key={status.id}
              className={`bg-white rounded-[16px] flex-1 min-w-[120px] flex flex-col transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
                status.border
                  ? "border border-[#FC5C3C] ring-2 ring-[#FC5C3C]/15"
                  : "border border-slate-100"
              }`}
            >
              {/* Colored top accent stripe */}
              <div className={`h-[3px] w-full shrink-0 ${status.accent}`} />
              <div className="p-4 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <h3 className={`text-[10px] font-bold tracking-widest uppercase ${status.labelColor || "text-slate-500"}`}>
                    {status.label}
                  </h3>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${status.bg} ${status.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <p className={`text-[30px] leading-none font-bold tracking-tight ${status.numColor || "text-slate-900"}`}>
                    {counts[status.id]}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 mt-1.5">{status.sub}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Toolbar (all wired via URL params) ── */}
      <div className="flex items-center justify-between mb-5 shrink-0 bg-white/70 p-2 rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <form method="GET" action="/applications" className="flex items-center gap-2 flex-1 max-w-3xl pl-2">
          {/* Preserve current view when searching */}
          <input type="hidden" name="view" value={currentView} />
          <div className="relative flex-1">
            <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              name="q"
              defaultValue={searchQuery}
              placeholder="Filter company, role, stage…"
              className="pl-7 bg-transparent border-none shadow-none h-9 text-sm focus:outline-none w-full text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <button type="submit" className="sr-only">Search</button>
        </form>

        {/* View toggle — links update the URL param */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm ml-3">
          <a
            href={`/applications?view=kanban${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
            className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors ${
              currentView === "kanban"
                ? "text-[#FC5C3C] bg-[#FC5C3C]/10"
                : "text-slate-400 hover:text-slate-600"
            }`}
            title="Kanban view"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="9" rx="1"/><rect x="14" y="16" width="7" height="5" rx="1"/>
            </svg>
          </a>
          <a
            href={`/applications?view=list${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
            className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors ${
              currentView === "list"
                ? "text-[#FC5C3C] bg-[#FC5C3C]/10"
                : "text-slate-400 hover:text-slate-600"
            }`}
            title="List view"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
            </svg>
          </a>
        </div>
      </div>

      {/* ── Board / List ── */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-4">
        {currentView === "kanban" ? (
          <KanbanWrapper
            initialApplications={
              searchQuery
                ? kanbanApplications.filter(
                    (a: any) =>
                      a.job.company.toLowerCase().includes(searchQuery) ||
                      a.job.title.toLowerCase().includes(searchQuery) ||
                      a.status.toLowerCase().includes(searchQuery)
                  )
                : kanbanApplications
            }
          />
        ) : (
          <ApplicationsListWrapper
            applications={
              searchQuery
                ? kanbanApplications.filter(
                    (a: any) =>
                      a.job.company.toLowerCase().includes(searchQuery) ||
                      a.job.title.toLowerCase().includes(searchQuery) ||
                      a.status.toLowerCase().includes(searchQuery)
                  )
                : kanbanApplications
            }
          />
        )}
      </div>
    </div>
  );
}
