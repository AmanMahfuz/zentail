"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit3, Calendar, Play, CalendarPlus, Video } from "lucide-react";
import Link from "next/link";
import { InterviewHero, type InterviewScheduleData } from "./components/InterviewHero";
import { InterviewDashboardTabs } from "./components/InterviewDashboardTabs";
import { PipelineCountdown } from "./components/PipelineCountdown";
import { InterviewContextCard } from "./components/InterviewContextCard";
import { HardwarePreflight } from "./components/HardwarePreflight";

export function InterviewDashboardClient({
  jobTitle,
  company,
  applicationId,
  initialPrep,
  schedule,
}: {
  jobTitle: string;
  company: string;
  applicationId: string;
  initialPrep?: any;
  schedule?: InterviewScheduleData | null;
}) {
  const isScheduled = Boolean(schedule?.scheduledAt);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <Button
          variant="ghost"
          className="text-slate-600 hover:text-slate-900"
          onClick={() => (window.location.href = "/interviews")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Interviews
        </Button>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <Link
            href={`/interviews/prepare/${applicationId}?mode=text`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Play className="w-4 h-4 mr-2 text-indigo-600" />
            Practice Simulation
          </Link>

          {isScheduled ? (
            <Link
              href="/interviews"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Calendar className="w-4 h-4 mr-2 text-slate-500" />
              Reschedule
            </Link>
          ) : (
            <Link
              href="/interviews"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-2xs"
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Schedule Interview
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Main Content) - 70% */}
        <div className="lg:col-span-8 space-y-6">
          <InterviewHero
            jobTitle={jobTitle}
            company={company}
            schedule={schedule}
            applicationId={applicationId}
          />
          <InterviewDashboardTabs
            applicationId={applicationId}
            initialPrep={initialPrep}
            jobTitle={jobTitle}
            company={company}
          />
        </div>

        {/* Right Column (Sidebar) - 30% */}
        <div className="lg:col-span-4 space-y-6">
          <PipelineCountdown targetDate={schedule?.scheduledAt} />
          <InterviewContextCard schedule={schedule} />
          <HardwarePreflight />
        </div>
      </div>
    </div>
  );
}
