"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit3, Calendar, Video } from "lucide-react";
import Link from "next/link";
import { InterviewHero } from "./components/InterviewHero";
import { InterviewDashboardTabs } from "./components/InterviewDashboardTabs";
import { PipelineCountdown } from "./components/PipelineCountdown";
import { InterviewContextCard } from "./components/InterviewContextCard";
import { QuickPrepChecklist } from "./components/QuickPrepChecklist";
import { HardwarePreflight } from "./components/HardwarePreflight";

export function InterviewDashboardClient({
  jobTitle,
  company,
  applicationId,
}: {
  jobTitle: string;
  company: string;
  applicationId: string;
}) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <Button variant="ghost" className="text-slate-600 hover:text-slate-900" onClick={() => window.location.href = '/applications'}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Interviews
        </Button>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <Button variant="outline" className="bg-white text-slate-700 border-slate-200">
            <Edit3 className="w-4 h-4 mr-2" />
            Add Notes
          </Button>
          <Button variant="outline" className="bg-white text-slate-700 border-slate-200">
            <Calendar className="w-4 h-4 mr-2" />
            Reschedule
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
            <Video className="w-4 h-4 mr-2" />
            Join Meeting
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Main Content) - 70% */}
        <div className="lg:col-span-8 space-y-6">
          <InterviewHero jobTitle={jobTitle} company={company} />
          <InterviewDashboardTabs />
        </div>

        {/* Right Column (Sidebar) - 30% */}
        <div className="lg:col-span-4 space-y-6">
          <PipelineCountdown />
          <InterviewContextCard />
          <QuickPrepChecklist />
          <HardwarePreflight />
        </div>

      </div>
    </div>
  );
}
