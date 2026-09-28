"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit3, Calendar, Video, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { InterviewDashboardTabs } from "../applications/[id]/interview/components/InterviewDashboardTabs";
import { PipelineCountdown } from "../applications/[id]/interview/components/PipelineCountdown";
import { QuickPrepChecklist } from "../applications/[id]/interview/components/QuickPrepChecklist";
import { HardwarePreflight } from "../applications/[id]/interview/components/HardwarePreflight";
import { StandaloneConfigurator } from "./StandaloneConfigurator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, FileText, CalendarDays, Clock, Monitor, Building2 } from "lucide-react";
import { format } from "date-fns";

interface StandaloneDashboardClientProps {
  applications?: Array<{
    id: string;
    job_title: string | null;
    company_name: string | null;
    status: string | null;
    created_at: string | null;
    applied_at?: string | null;
    job_description?: string | null;
  }>;
  upcomingInterviews?: Array<{
    id: string;
    scheduled_at: string | null;
    interview_type: string | null;
    round: number | null;
    notes: string | null;
    application_id: string;
  }>;
}

export function StandaloneDashboardClient({
  applications = [],
  upcomingInterviews = [],
}: StandaloneDashboardClientProps) {
  const [selectedAppId, setSelectedAppId] = useState<string | "custom">(
    applications.length > 0 ? applications[0].id : "custom"
  );

  const selectedApp = applications.find((a) => a.id === selectedAppId);
  const matchingInterview = upcomingInterviews.find(
    (i) => i.application_id === selectedAppId
  );

  const jobTitle = selectedApp?.job_title || "Custom Practice Role";
  const company = selectedApp?.company_name || "Tailored Practice";
  const targetDate = matchingInterview?.scheduled_at || null;
  const isCustom = selectedAppId === "custom" || !selectedApp;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Target Application Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0">
            Target:
          </span>
          {applications.map((app) => (
            <button
              key={app.id}
              onClick={() => setSelectedAppId(app.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                selectedAppId === app.id
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 opacity-80" />
              <span>{app.company_name || "Company"}</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="truncate max-w-[140px]">{app.job_title || "Role"}</span>
            </button>
          ))}
          <button
            onClick={() => setSelectedAppId("custom")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              selectedAppId === "custom"
                ? "bg-indigo-600 text-white shadow-sm font-semibold"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Mock Setup</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isCustom ? (
            <Link href={`/interviews/simulator?applicationId=${selectedApp?.id}`}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-xs font-medium h-9">
                <Video className="w-3.5 h-3.5 mr-1.5" />
                Launch Live Simulation
              </Button>
            </Link>
          ) : (
            <Link href="/interviews/simulator">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-xs font-medium h-9">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Open Standalone Arena
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isCustom ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <StandaloneConfigurator />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <PipelineCountdown targetDate={null} />
            <QuickPrepChecklist />
            <HardwarePreflight />
          </div>
        </div>
      ) : (
        /* Main Grid Layout for Real Application */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (Main Content) - 70% */}
          <div className="lg:col-span-8 space-y-6">
            {/* Hero */}
            <Card className="border-slate-200 shadow-sm mb-6">
              <CardContent className="p-6 md:p-8 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-indigo-50 text-indigo-700 uppercase text-[10px] tracking-wider py-1 border-indigo-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
                    Interview Prep
                  </Badge>
                  <div className="flex items-center gap-1.5 text-slate-600 text-sm font-semibold px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    {company}
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 uppercase text-[10px] tracking-wider py-1 border-emerald-100">
                    {selectedApp?.status?.toUpperCase() || "ACTIVE"}
                  </Badge>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                  {jobTitle}
                </h1>

                <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-2 text-slate-600 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-indigo-500" />
                    {targetDate ? format(new Date(targetDate), "MMM d, yyyy 'at' h:mm a") : "On-demand Practice"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    Adaptive Pacing
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-indigo-500" />
                    Zentail AI Simulator
                  </div>
                </div>
              </CardContent>
            </Card>

            <InterviewDashboardTabs
              applicationId={selectedApp?.id}
              jobTitle={jobTitle}
              company={company}
            />
          </div>

          {/* Right Column (Sidebar) - 30% */}
          <div className="lg:col-span-4 space-y-6">
            <PipelineCountdown targetDate={targetDate} />

            <Card className="border-slate-200 shadow-sm mb-6">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-500" />
                  Target Application Context
                </CardTitle>
                <Badge className="bg-emerald-100 text-emerald-800 border-none px-2 py-0.5 text-[10px] tracking-wider uppercase">
                  Connected
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Role & Company
                  </h4>
                  <p className="text-sm font-medium text-slate-800">
                    {jobTitle} at {company}
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Simulation Platform
                  </h4>
                  <p className="text-sm text-slate-800">
                    Zentail Voice & Adaptive AI
                  </p>
                </div>
                <div className="pt-2">
                  <Link href={`/interviews/simulator?applicationId=${selectedApp?.id}`}>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2 shadow-sm">
                      <Video className="w-3.5 h-3.5 mr-1.5" />
                      Begin Interview for {company}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <QuickPrepChecklist />
            <HardwarePreflight />
          </div>
        </div>
      )}
    </div>
  );
}
