"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit3, Calendar, Video } from "lucide-react";
import Link from "next/link";
import { InterviewDashboardTabs } from "../applications/[id]/interview/components/InterviewDashboardTabs";
import { PipelineCountdown } from "../applications/[id]/interview/components/PipelineCountdown";
import { QuickPrepChecklist } from "../applications/[id]/interview/components/QuickPrepChecklist";
import { HardwarePreflight } from "../applications/[id]/interview/components/HardwarePreflight";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Download, FileText, CalendarDays, Clock, Monitor, Building2 } from "lucide-react";
import { format } from "date-fns";

export function StandaloneDashboardClient() {
  const jobTitle = "Software Engineer (Mock)";
  const company = "Target Company";
  const date = new Date();
  
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <Button variant="ghost" className="text-slate-600 hover:text-slate-900" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
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
          {/* Hero */}
          <Card className="border-slate-200 shadow-sm mb-6">
            <CardContent className="p-6 md:p-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 uppercase text-[10px] tracking-wider py-1 border-indigo-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
                  Daily Practice
                </Badge>
                <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
                  <Building2 className="w-3.5 h-3.5" />
                  {company}
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 uppercase text-[10px] tracking-wider py-1 border-emerald-100">
                  Ready
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                {jobTitle}
              </h1>

              <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-2 text-slate-600 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-500" />
                  {format(date, "MMM d, yyyy 'at' h:mm a")}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Flexible Duration
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-indigo-500" />
                  Zentail AI Simulator
                </div>
              </div>
            </CardContent>
          </Card>
          
          <InterviewDashboardTabs />
        </div>

        {/* Right Column (Sidebar) - 30% */}
        <div className="lg:col-span-4 space-y-6">
          <PipelineCountdown />
          
          <Card className="border-slate-200 shadow-sm mb-6">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-500" />
                Practice Context
              </CardTitle>
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none px-2 py-0.5 text-[10px] tracking-wider uppercase">
                Active
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Format & Type
                </h4>
                <p className="text-sm text-slate-800">
                  Generic Technical Screening — Live Coding & Architecture
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Host Platform
                </h4>
                <p className="text-sm text-slate-800">
                  Zentail AI
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Target Profile
                </h4>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-700">
                      General Resume Profile
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <QuickPrepChecklist />
          <HardwarePreflight />
        </div>

      </div>
    </div>
  );
}
