"use client";
import "@/dom-polyfill";

import { useState, useEffect } from "react";
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
import { CSS } from "@dnd-kit/utilities";
import { ApplicationStatus, updateApplicationStatus } from "@/lib/actions/applications";
import { ApplicationDetailsSheet } from "./ApplicationDetailsSheet";

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
};

import { MapPin, Banknote, Calendar, Building2, Plus, Bookmark, Send, Target, MessageSquare, CheckCircle2, XCircle } from "lucide-react";

const STATUS_COLUMNS: { 
  id: ApplicationStatus; 
  title: string; 
  emptyIcon: any;
  emptyTitle: string;
  emptyDesc: string;
}[] = [
  { id: "saved", title: "Saved", emptyIcon: Bookmark, emptyTitle: "No saved jobs yet", emptyDesc: "Drag prospective postings here or add new manually." },
  { id: "applied", title: "Applied", emptyIcon: Send, emptyTitle: "No active applications", emptyDesc: "Sent your resume? Shift opportunities to this lane." },
  { id: "assessment", title: "Assessment", emptyIcon: Target, emptyTitle: "No pending tests", emptyDesc: "Online coding tasks and assignments go here." },
  { id: "interview", title: "Interview", emptyIcon: MessageSquare, emptyTitle: "No interviews", emptyDesc: "Track your ongoing interview rounds here." },
  { id: "offer", title: "Offer", emptyIcon: CheckCircle2, emptyTitle: "No offers yet", emptyDesc: "Accepted or pending offers will appear here." },
  { id: "rejected", title: "Rejected", emptyIcon: XCircle, emptyTitle: "No rejections", emptyDesc: "Closed opportunities." },
];

// --- Sortable Item Component ---
function SortableAppCard({ app, onClick }: { app: KanbanApplication, onClick: (app: KanbanApplication) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id, data: { type: "Application", app } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const colors = ["bg-indigo-50 text-indigo-700", "bg-emerald-50 text-emerald-700", "bg-rose-50 text-rose-700", "bg-amber-50 text-amber-700"];
  const colorClass = colors[app.job.company.length % colors.length];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(app)}
      className="bg-white p-3.5 rounded-[14px] border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] cursor-grab active:cursor-grabbing mb-3 hover:shadow-md hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 group relative"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm tracking-wider ${colorClass}`}>
          {app.job.company.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 text-sm leading-snug truncate group-hover:text-blue-600 transition-colors">{app.job.title}</h4>
          <p className="text-[13px] text-slate-500 truncate mt-0.5">{app.job.company}</p>
        </div>
      </div>

      {(app.job.location || app.job.salary_max) && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {app.job.location && (
            <span className="inline-flex items-center text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {app.job.location}
            </span>
          )}
          {app.job.salary_max && (
            <span className="inline-flex items-center text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {app.job.currency || '$'}{app.job.salary_max.toLocaleString()}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        {app.applied_at ? (
          <p className="text-[11px] text-slate-400 font-medium">
            {new Date(app.applied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        ) : (
          <p className="text-[11px] text-slate-400 font-medium">Tracked</p>
        )}
        
        {app.notes && (
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" title="Has notes" />
        )}
      </div>
    </div>
  );
}

import { useDroppable } from "@dnd-kit/core";

// --- Droppable Column Component ---
function DroppableColumn({ 
  col, 
  columnApps, 
  setDetailsApp 
}: { 
  col: typeof STATUS_COLUMNS[0], 
  columnApps: KanbanApplication[],
  setDetailsApp: (app: KanbanApplication) => void 
}) {
  const { setNodeRef } = useDroppable({
    id: col.id,
    data: { type: "Column", col },
  });

  return (
    <div className="flex flex-col w-[320px] shrink-0 bg-slate-50/80 rounded-[20px] border border-transparent max-h-full">
      <div className="p-4 flex items-center justify-between border-b-0 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-[15px]">{col.title}</h3>
          <span className="text-xs font-semibold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full">
            {columnApps.length}
          </span>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto min-h-0 custom-scrollbar">
        <SortableContext items={columnApps.map(a => a.id)} strategy={verticalListSortingStrategy}>
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
                <SortableAppCard key={app.id} app={app} onClick={setDetailsApp} />
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
  const [applications, setApplications] = useState<KanbanApplication[]>(initialApplications);
  const [activeApp, setActiveApp] = useState<KanbanApplication | null>(null);
  const [detailsApp, setDetailsApp] = useState<KanbanApplication | null>(null);

  // Sync state when Server Component re-fetches data (e.g. after revalidatePath)
  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const app = applications.find((a) => a.id === active.id);
    if (app) setActiveApp(app);
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

    // Moving over another app
    if (isActiveApp && isOverApp) {
      setApplications((apps) => {
        const activeIndex = apps.findIndex((t) => t.id === activeId);
        const overIndex = apps.findIndex((t) => t.id === overId);
        
        if (apps[activeIndex].status !== apps[overIndex].status) {
          // Strictly immutable update
          const newApps = apps.map((app, idx) => 
            idx === activeIndex ? { ...app, status: apps[overIndex].status } : app
          );
          return arrayMove(newApps, activeIndex, overIndex);
        }
        return arrayMove(apps, activeIndex, overIndex);
      });
    }

    // Moving over empty column area
    if (isActiveApp && isOverColumn) {
      setApplications((apps) => {
        const activeIndex = apps.findIndex((t) => t.id === activeId);
        // Strictly immutable update
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
    const app = applications.find((a) => a.id === activeId);
    
    if (app) {
      // Optimistic update has already happened in dragOver, we just need to persist
      // We check if it changed status from original
      const originalApp = initialApplications.find(a => a.id === activeId);
      if (originalApp && originalApp.status !== app.status) {
        const result = await updateApplicationStatus(activeId, app.status);
        if (!result.success) {
          // Revert on failure
          setApplications(initialApplications);
          alert(result.message || "Failed to update status");
        }
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
            <DroppableColumn key={col.id} col={col} columnApps={columnApps} setDetailsApp={setDetailsApp} />
          );
        })}
      </div>

      <DragOverlay>
        {activeApp ? (
          <div className="bg-white p-4 rounded-xl border border-blue-400 shadow-xl opacity-90 scale-105">
            <h4 className="font-semibold text-slate-900 text-sm">{activeApp.job.title}</h4>
            <p className="text-xs text-slate-500 mt-1">{activeApp.job.company}</p>
          </div>
        ) : null}
      </DragOverlay>

      <ApplicationDetailsSheet 
        app={detailsApp}
        isOpen={!!detailsApp}
        onOpenChange={(open) => !open && setDetailsApp(null)}
      />
    </DndContext>
  );
}
