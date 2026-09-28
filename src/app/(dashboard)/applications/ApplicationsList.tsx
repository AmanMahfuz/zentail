"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink, Building2, Briefcase } from "lucide-react";

type SortField = "company" | "title" | "status" | "applied_at";
type SortDir = "asc" | "desc";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  saved:      { label: "Saved",      cls: "bg-slate-100 text-slate-700 border-slate-200" },
  applied:    { label: "Applied",    cls: "bg-blue-100 text-blue-700 border-blue-200" },
  assessment: { label: "Assessment", cls: "bg-purple-100 text-purple-700 border-purple-200" },
  interview:  { label: "Interview",  cls: "bg-amber-100 text-amber-700 border-amber-200" },
  offer:      { label: "Offer",      cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected:   { label: "Rejected",   cls: "bg-red-100 text-red-700 border-red-200" },
};

const AVATAR_COLORS = [
  "bg-indigo-50 text-indigo-700",
  "bg-emerald-50 text-emerald-700",
  "bg-rose-50 text-rose-700",
  "bg-amber-50 text-amber-700",
  "bg-violet-50 text-violet-700",
  "bg-cyan-50 text-cyan-700",
];

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 ml-1" />;
  return dir === "asc"
    ? <ChevronUp className="w-3.5 h-3.5 text-[#FC5C3C] ml-1" />
    : <ChevronDown className="w-3.5 h-3.5 text-[#FC5C3C] ml-1" />;
}

export function ApplicationsList({ applications }: { applications: any[] }) {
  const [sortField, setSortField] = useState<SortField>("applied_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const router = useRouter();
  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    return [...applications].sort((a, b) => {
      let av: string, bv: string;
      if (sortField === "company")    { av = a.job.company; bv = b.job.company; }
      else if (sortField === "title") { av = a.job.title;   bv = b.job.title; }
      else if (sortField === "status"){ av = a.status;       bv = b.status; }
      else { av = a.applied_at ?? ""; bv = b.applied_at ?? ""; }
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [applications, sortField, sortDir]);

  const totalDays = (app: any) => {
    if (!app.applied_at) return null;
    return Math.floor((Date.now() - new Date(app.applied_at).getTime()) / 86_400_000);
  };

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Briefcase className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">No applications found</h3>
        <p className="text-sm text-slate-500">Try a different search or add a new application.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
        {/* Table head */}
        <div className="grid grid-cols-[2fr_2fr_1.2fr_1fr_1fr] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
          {(
            [
              { field: "company" as SortField, label: "Company" },
              { field: "title"   as SortField, label: "Role" },
              { field: "status"  as SortField, label: "Stage" },
              { field: "applied_at" as SortField, label: "Applied" },
            ] as { field: SortField; label: string }[]
          ).map(({ field, label }) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className="flex items-center text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors text-left"
            >
              {label}
              <SortIcon field={field} current={sortField} dir={sortDir} />
            </button>
          ))}
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Actions</span>
        </div>

        {/* Rows */}
        <div className="overflow-y-auto flex-1">
          {sorted.map((app) => {
            const colorClass = AVATAR_COLORS[app.job.company.length % AVATAR_COLORS.length];
            const statusMeta = STATUS_LABELS[app.status] ?? { label: app.status, cls: "bg-slate-100 text-slate-700 border-slate-100" };
            const days = totalDays(app);
            const stale = (app.status === "applied" || app.status === "assessment") && days !== null && days > 14;

            return (
              <div
                key={app.id}
                onClick={() => router.push(`/applications/${app.id}`)}
                className="grid grid-cols-[2fr_2fr_1.2fr_1fr_1fr] gap-4 px-5 py-4 border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer group transition-colors items-center"
              >
                {/* Company */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${colorClass}`}>
                    {app.job.company.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {app.job.company}
                  </span>
                </div>

                {/* Role */}
                <span className="text-sm text-slate-700 truncate">{app.job.title}</span>

                {/* Stage */}
                <span className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.cls}`}>
                  {statusMeta.label}
                </span>

                {/* Applied date */}
                <div className="flex flex-col">
                  <span className="text-xs text-slate-600">
                    {app.applied_at
                      ? new Date(app.applied_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      : "—"}
                  </span>
                  {stale && (
                    <span className="text-[10px] font-semibold text-orange-500 mt-0.5">
                      {days}d — follow up?
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/applications/${app.id}/resume`}
                    className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                    title="Open Resume Center"
                  >
                    Resume
                  </Link>
                  {app.job.url && (
                    <a
                      href={app.job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                      title="View job posting"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer count */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 shrink-0">
          <p className="text-xs text-slate-400 font-medium">{sorted.length} application{sorted.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

    </>
  );
}
