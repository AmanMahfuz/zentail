"use client";
import "@/dom-polyfill";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ApplicationStatus, updateApplicationStatus } from "@/lib/actions/applications";

import { AddInterviewModal } from "./AddInterviewModal";
import { getNextAction } from "@/lib/utils/next-action";
import { RecordOutcomeModal } from "./RecordOutcomeModal";
import { MapPin, Banknote, Calendar, Building2, Plus, Bookmark, Send, Target, MessageSquare, CheckCircle2, XCircle, Loader2, Minimize2, Maximize2 } from "lucide-react";

// --- Types ---
type KanbanApplication = {
  id: string;
  status: ApplicationStatus;
  job: {
    company: string;
    title: string;
    location?: string | null;
    salary_min?: number | null;
    salary_max?: number | null;
    currency?: string | null;
    deadline?: string | null;
    url?: string | null;
  };
  applied_at?: string | null;
  notes?: string | null;
  fit_score?: number | null;
};

const STATUS_COLUMNS: {
  id: ApplicationStatus;
  title: string;
  emptyIcon: any;
  emptyTitle: string;
  emptyDesc: string;
}[] = [
  { id: "saved", title: "Saved", emptyIcon: Bookmark, emptyTitle: "No saved jobs", emptyDesc: "Jobs awaiting review or saved for later." },
  { id: "applied", title: "Applied", emptyIcon: Send, emptyTitle: "No active applications", emptyDesc: "Sent your resume? Shift opportunities to this lane." },
  { id: "assessment", title: "Assessment", emptyIcon: Target, emptyTitle: "No pending tests", emptyDesc: "Online coding tasks and assignments go here." },
  { id: "interview", title: "Interview", emptyIcon: MessageSquare, emptyTitle: "No interviews", emptyDesc: "Track your ongoing interview rounds here." },
  { id: "offer", title: "Offer", emptyIcon: CheckCircle2, emptyTitle: "No offers yet", emptyDesc: "Accepted or pending offers will appear here." },
  { id: "rejected", title: "Rejected", emptyIcon: XCircle, emptyTitle: "No rejections", emptyDesc: "Closed opportunities." },
];

const AVATAR_COLORS = [
  "bg-indigo-50 text-indigo-700",
  "bg-emerald-50 text-emerald-700",
  "bg-rose-50 text-rose-700",
  "bg-amber-50 text-amber-700",
  "bg-violet-50 text-violet-700",
  "bg-cyan-50 text-cyan-700",
];

// Visual-only: per-status design tokens
const STATUS_STYLES: Record<string, { colBg: string; dot: string; accentBar: string }> = {
  saved:      { colBg: "bg-slate-50/80",    dot: "bg-slate-400",   accentBar: "bg-slate-300" },
  applied:    { colBg: "bg-blue-50/50",     dot: "bg-blue-500",    accentBar: "bg-blue-400" },
  assessment: { colBg: "bg-violet-50/50",   dot: "bg-violet-500",  accentBar: "bg-violet-400" },
  interview:  { colBg: "bg-orange-50/50",   dot: "bg-[#FC5C3C]",   accentBar: "bg-[#FC5C3C]" },
  offer:      { colBg: "bg-emerald-50/50",  dot: "bg-emerald-500", accentBar: "bg-emerald-400" },
  rejected:   { colBg: "bg-red-50/40",      dot: "bg-red-400",     accentBar: "bg-red-300" },
};

// --- Sortable App Card ---
function SortableAppCard({
  app,
  onClick,
  onRecordOutcome,
  isUpdating,
}: {
  app: KanbanApplication;
  onClick: (app: KanbanApplication) => void;
  onRecordOutcome: (app: KanbanApplication) => void;
  isUpdating: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
    data: { type: "Application", app },
    disabled: isUpdating,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const safeCompany = app.job?.company || "Target Company";
  const colorClass = AVATAR_COLORS[safeCompany.length % AVATAR_COLORS.length];

  const daysSinceApplied = app.applied_at
    ? Math.floor((Date.now() - new Date(app.applied_at).getTime()) / (1000 * 3600 * 24))
    : 0;
  const action = getNextAction(app, daysSinceApplied, null);

  const getStageDateText = () => {
    const days = daysSinceApplied;
    if (app.status === "saved") return `Saved ${days}d ago`;
    if (app.status === "applied") return `Applied ${days}d ago`;
    if (app.status === "interview") return `Scheduling...`;
    if (app.status === "offer") return `Offer received`;
    return app.applied_at ? new Date(app.applied_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Tracked";
  };

  const getActionLink = () => {
    if (app.status === "saved") return { label: "Prepare & Tailor", onClick: () => window.location.href = `/resumes?jobId=${app.job.title}` };
    if (app.status === "applied") return { label: "Send Follow-up", onClick: () => {} };
    if (app.status === "assessment") return { label: "Open Workspace", onClick: () => {} };
    if (app.status === "interview") return { label: "Start Mock Interview", onClick: () => window.location.href = "/interviews" };
    return null;
  };

  const actionLink = getActionLink();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isUpdating && onClick(app)}
      className={`bg-white rounded-[16px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-3 transition-all duration-300 group relative overflow-hidden flex flex-col
        ${isUpdating
          ? "cursor-wait opacity-60"
          : "cursor-grab active:cursor-grabbing hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1"
        }`}
    >
      {/* Saving overlay */}
      {isUpdating && (
        <div className="absolute inset-0 rounded-[16px] bg-white/70 flex items-center justify-center z-10">
          <Loader2 className="w-4 h-4 text-[#FC5C3C] animate-spin" />
        </div>
      )}

      <div className="px-4 pt-4 pb-1 flex-1">
        <div className="flex items-start gap-3.5 mb-2">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold text-lg tracking-wide bg-[#E8F8F0] text-[#008B5C]">
            {safeCompany.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h4 className="font-bold text-slate-900 text-[13px] tracking-wide uppercase truncate transition-colors">
              {app.job?.title || "Target Role"}
            </h4>
            <p className="text-[14px] text-slate-500 truncate mt-0.5 font-medium">{safeCompany}</p>
          </div>
        </div>

        {app.status === "assessment" ? (
          <div className="flex flex-col gap-2 mt-4 mb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[11px] border border-indigo-100">
                <span className="material-symbols-outlined text-[14px]">assignment</span>
                Take-Home Project (Due in 3d)
              </span>
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px]">
                Node & TypeScript
              </span>
            </div>
          </div>
        ) : app.status === "interview" ? (
          <div className="flex flex-col gap-1.5 mt-3 mb-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-medium text-slate-600">Interview Progress:</span>
              <span className="text-blue-600 font-semibold">Stage 2 of 3</span>
            </div>
            <div className="flex items-center gap-1 w-full mt-0.5">
              <span className="flex-1 inline-flex items-center justify-center gap-0.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-semibold">
                <span className="material-symbols-outlined text-[11px]">check</span> HR Screen
              </span>
              <span className="flex-1 inline-flex items-center justify-center py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shadow-sm">
                Round 2
              </span>
              <span className="flex-1 inline-flex items-center justify-center py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-medium">
                Final
              </span>
            </div>
            <div className="mt-1 flex items-center">
              <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold transition-colors border border-blue-200" title="Click to update interview round" type="button">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                <span>Technical Round 2</span>
                <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
              </button>
            </div>
          </div>
        ) : app.status === "offer" ? (
          <div className="flex items-center mt-5 mb-2 gap-2">
            <div className="flex-1 px-3 py-2 rounded-lg bg-green-50 border border-green-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-green-700">
                <span className="material-symbols-outlined text-[16px]">celebration</span>
                <span className="font-bold text-[12px]">Offer Received!</span>
              </div>
              <span className="font-semibold text-green-800 text-[12px]">{app.job.salary_max ? `$${(app.job.salary_max / 1000).toFixed(0)}k` : "Pending"}</span>
            </div>
          </div>
        ) : app.status === "rejected" ? (
          <div className="flex items-center mt-5 mb-2 gap-2">
             <div className="flex-1 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-red-600">
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                <span className="font-semibold text-[12px]">Not Moving Forward</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center mt-5 mb-2 gap-2">
            {action.urgency !== "none" && (
              <div className={`text-[12px] px-3 py-1 rounded-full font-semibold border truncate max-w-[180px]
                ${action.urgency === "high" ? "bg-red-50 text-red-600 border-red-100" :
                  action.urgency === "medium" ? "bg-orange-50 text-[#C45E2A] border-orange-100" :
                  "bg-blue-50 text-blue-600 border-blue-100"}`}>
                {action.urgency === "high" && "⚠️ "}{action.action}
              </div>
            )}
            
            {app.fit_score != null ? (
              <div className="text-[12px] px-3 py-1 rounded-full font-semibold bg-[#F2F3FF] text-[#4F39F6] whitespace-nowrap ml-auto">
                ✨ {app.fit_score}% Match
              </div>
            ) : (
              <div className="text-[12px] px-3 py-1 rounded-full font-semibold bg-slate-50 text-slate-500 whitespace-nowrap ml-auto">
                ✨ Pending Match
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#9CA3AF]">
          <Calendar className="w-4 h-4" />
          <span className="text-[13px] font-medium">{getStageDateText()}</span>
        </div>
        {actionLink && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              actionLink.onClick();
            }}
            className="text-[13px] font-semibold text-[#0055FF] hover:text-blue-700 transition-colors inline-flex items-center gap-1"
          >
            {actionLink.label} &rarr;
          </button>
        )}
      </div>
    </div>
  );
}

// --- Droppable Column ---
function DroppableColumn({
  col,
  columnApps,
  setDetailsApp,
  onRecordOutcome,
  updatingIds,
  isCollapsed,
  onToggle,
}: {
  col: typeof STATUS_COLUMNS[0];
  columnApps: KanbanApplication[];
  setDetailsApp: (app: KanbanApplication) => void;
  onRecordOutcome: (app: KanbanApplication) => void;
  updatingIds: Set<string>;
  isCollapsed: boolean;
  onToggle: (id: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: col.id, data: { type: "Column", col } });

  if (isCollapsed) {
    return (
      <div 
        onClick={() => onToggle(col.id)}
        className={`flex flex-col w-12 shrink-0 rounded-[20px] border border-white/60 max-h-full cursor-pointer transition-colors ${STATUS_STYLES[col.id]?.colBg ?? "bg-slate-50/80"} hover:bg-slate-100/50`}
      >
        <div className="pt-4 pb-4 flex flex-col items-center gap-4 h-full">
          <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            {columnApps.length}
          </span>
          <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_STYLES[col.id]?.dot ?? "bg-slate-400"}`} />
          <h3 className="font-semibold text-slate-700 text-[11px] tracking-widest uppercase" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            {col.title}
          </h3>
          <div className="mt-auto">
            <Maximize2 className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col w-[296px] shrink-0 rounded-[20px] border border-white/60 max-h-full ${STATUS_STYLES[col.id]?.colBg ?? "bg-slate-50/80"}`}>
      <div className="px-4 pt-4 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_STYLES[col.id]?.dot ?? "bg-slate-400"}`} />
          <h3 className="font-semibold text-slate-700 text-[11px] tracking-widest uppercase">{col.title}</h3>
          <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            {columnApps.length}
          </span>
        </div>
        <button onClick={() => onToggle(col.id)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-black/5">
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto min-h-0 custom-scrollbar">
        <SortableContext items={columnApps.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          <div className="h-full flex flex-col">
            {columnApps.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 mt-6">
                <div className="w-12 h-12 bg-white rounded-[14px] flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                  <col.emptyIcon className="w-5 h-5 text-slate-400" />
                </div>
                <h4 className="text-[13px] font-semibold text-slate-900 mb-1.5">{col.emptyTitle}</h4>
                <p className="text-[12px] text-slate-500 max-w-[200px] leading-relaxed">{col.emptyDesc}</p>
              </div>
            ) : (
              columnApps.map((app) => (
                <SortableAppCard
                  key={app.id}
                  app={app}
                  onClick={setDetailsApp}
                  onRecordOutcome={onRecordOutcome}
                  isUpdating={updatingIds.has(app.id)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// --- Main Kanban Component ---
export function ApplicationsKanban({ initialApplications }: { initialApplications: KanbanApplication[] }) {
  const router = useRouter();
  const [applications, setApplications] = useState<KanbanApplication[]>(initialApplications);
  const [activeApp, setActiveApp] = useState<KanbanApplication | null>(null);
  const [outcomeApp, setOutcomeApp] = useState<KanbanApplication | null>(null);
  const [pendingInterviewAppId, setPendingInterviewAppId] = useState<string | null>(null);
  // Track IDs currently being saved
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set(["rejected"])); // default collapse rejected
  // Snapshot before drag for rollback
  const snapshotRef = useRef<KanbanApplication[]>([]);

  const toggleColumn = (id: string) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Sync when server re-fetches (revalidatePath)
  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  // --- Real-time Supabase subscription ---
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("applications-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "applications" },
        (payload) => {
          const updated = payload.new as any;
          setApplications((prev) =>
            prev.map((app) =>
              app.id === updated.id
                ? {
                    ...app,
                    status: updated.status ?? app.status,
                    notes: updated.fit_summary ?? app.notes,
                  }
                : app
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "applications" },
        (payload) => {
          const inserted = payload.new as any;
          setApplications((prev) => {
            if (prev.find((a) => a.id === inserted.id)) return prev;
            return [
              {
                id: inserted.id,
                status: inserted.status ?? "saved",
                job: {
                  company: inserted.company_name ?? "Unknown Company",
                  title: inserted.job_title ?? "Unknown Role",
                  url: inserted.job_link ?? null,
                },
                applied_at: inserted.applied_at ?? null,
                notes: inserted.fit_summary ?? null,
              },
              ...prev,
            ];
          });
          toast.success(`New application added: ${inserted.job_title ?? "Unknown Role"}`);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "applications" },
        (payload) => {
          const deleted = payload.old as any;
          setApplications((prev) => prev.filter((a) => a.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const app = applications.find((a) => a.id === event.active.id);
    if (app) {
      setActiveApp(app);
      // Snapshot for potential rollback
      snapshotRef.current = applications;
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveApp = active.data.current?.type === "Application";
    const isOverApp = over.data.current?.type === "Application";
    const isOverColumn = over.data.current?.type === "Column" || STATUS_COLUMNS.some((c) => c.id === overId);

    if (!isActiveApp) return;

    if (isActiveApp && isOverApp) {
      setApplications((apps) => {
        const activeIndex = apps.findIndex((t) => t.id === activeId);
        const overIndex = apps.findIndex((t) => t.id === overId);
        if (apps[activeIndex].status !== apps[overIndex].status) {
          const newApps = apps.map((app, idx) =>
            idx === activeIndex ? { ...app, status: apps[overIndex].status } : app
          );
          return arrayMove(newApps, activeIndex, overIndex);
        }
        return arrayMove(apps, activeIndex, overIndex);
      });
    }

    if (isActiveApp && isOverColumn) {
      setApplications((apps) => {
        const activeIndex = apps.findIndex((t) => t.id === activeId);
        const newApps = apps.map((app, idx) =>
          idx === activeIndex ? { ...app, status: overId as ApplicationStatus } : app
        );
        return arrayMove(newApps, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveApp(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    let finalStatus: ApplicationStatus | null = null;
    const isOverColumn = over.data.current?.type === "Column" || STATUS_COLUMNS.some((c) => c.id === overId);

    if (isOverColumn) {
      finalStatus = overId as ApplicationStatus;
    } else if (over.data.current?.type === "Application") {
      const overApp = applications.find((a) => a.id === overId);
      if (overApp) finalStatus = overApp.status;
    }

    if (!finalStatus) return;

    const originalApp = snapshotRef.current.find((a) => a.id === activeId);
    if (!originalApp || originalApp.status === finalStatus) return;

    const fromLabel = originalApp.status.charAt(0).toUpperCase() + originalApp.status.slice(1);
    const toLabel = finalStatus.charAt(0).toUpperCase() + finalStatus.slice(1);

    // Mark as updating
    setUpdatingIds((prev) => new Set(prev).add(activeId));

    const toastId = toast.loading(`Moving to ${toLabel}…`);

    const result = await updateApplicationStatus(activeId, finalStatus);

    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.delete(activeId);
      return next;
    });

    if (!result.success) {
      // Rollback
      setApplications(snapshotRef.current);
      toast.error(`Failed to move to ${toLabel}. Reverted.`, { id: toastId });
    } else {
      toast.success(`Moved to ${toLabel}`, { id: toastId });

      if (finalStatus === "interview") {
        setTimeout(() => setPendingInterviewAppId(activeId), 50);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-6 pb-6 px-1">
        {STATUS_COLUMNS.map((col) => {
          const columnApps = applications.filter((app) => app.status === col.id);
          return (
            <DroppableColumn
              key={col.id}
              col={col}
              columnApps={columnApps}
              setDetailsApp={(app) => router.push(`/applications/${app.id}`)}
              onRecordOutcome={setOutcomeApp}
              updatingIds={updatingIds}
              isCollapsed={collapsedColumns.has(col.id)}
              onToggle={toggleColumn}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeApp ? (
          <div className="bg-white p-4 rounded-[14px] border border-indigo-300/60 shadow-2xl rotate-1 scale-[1.04] opacity-95">
            <h4 className="font-semibold text-slate-900 text-sm">{activeApp.job.title}</h4>
            <p className="text-xs text-slate-500 mt-1 font-medium">{activeApp.job.company}</p>
          </div>
        ) : null}
      </DragOverlay>

      <AddInterviewModal
        applicationId={pendingInterviewAppId || ""}
        controlledOpen={!!pendingInterviewAppId}
        setControlledOpen={(open) => {
          if (!open) setPendingInterviewAppId(null);
        }}
      />

      <RecordOutcomeModal
        app={outcomeApp}
        isOpen={!!outcomeApp}
        onOpenChange={(open) => {
          if (!open) setOutcomeApp(null);
        }}
      />
    </DndContext>
  );
}
