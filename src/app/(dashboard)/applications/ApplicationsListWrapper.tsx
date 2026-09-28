"use client";

import dynamic from "next/dynamic";

const ApplicationsList = dynamic(
  () => import("./ApplicationsList").then((mod) => mod.ApplicationsList),
  { ssr: false, loading: () => <div className="flex-1 min-h-[500px] bg-slate-100/50 animate-pulse rounded-2xl w-full" /> }
);

export function ApplicationsListWrapper({ applications }: { applications: any[] }) {
  return <ApplicationsList applications={applications} />;
}
