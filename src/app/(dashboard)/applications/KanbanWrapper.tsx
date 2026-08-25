"use client";

import dynamic from "next/dynamic";

const ApplicationsKanban = dynamic(
  () => import("./ApplicationsKanban").then((mod) => mod.ApplicationsKanban),
  { ssr: false, loading: () => <div className="flex-1 min-h-[500px] bg-slate-100/50 animate-pulse rounded-2xl w-full" /> }
);

export function KanbanWrapper({ initialApplications }: { initialApplications: any[] }) {
  return <ApplicationsKanban initialApplications={initialApplications} />;
}
