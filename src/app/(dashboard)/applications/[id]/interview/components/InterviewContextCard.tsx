import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, FileText } from "lucide-react";
import type { InterviewScheduleData } from "./InterviewHero";

export function InterviewContextCard({
  schedule,
  resumeName,
}: {
  schedule?: InterviewScheduleData | null;
  resumeName?: string | null;
}) {
  const isScheduled = Boolean(schedule?.scheduledAt);

  return (
    <Card className="border-slate-200 shadow-sm mb-6">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500" />
          Interview Context
        </CardTitle>
        <Badge
          className={`border-none px-2 py-0.5 text-[10px] tracking-wider uppercase font-semibold ${
            isScheduled
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {schedule?.status || (isScheduled ? "Confirmed" : "Self-Paced")}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4 space-y-5">
        {/* Format & Type */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Format & Type
          </h4>
          <p className="text-sm text-slate-800">
            {schedule?.round
              ? `Round ${schedule.round} Interview Preparation`
              : "Interactive AI Simulation & Practice Arena"}
          </p>
        </div>

        {/* Application Status */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Application Status
          </h4>
          <div className="flex items-center gap-2 text-sm text-slate-800">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isScheduled ? "bg-emerald-500" : "bg-amber-500"
              }`}
            ></span>
            {isScheduled
              ? `Scheduled: ${schedule?.round ? `Round ${schedule.round}` : "Interview Round"}`
              : "Ready for on-demand practice"}
          </div>
        </div>

        {/* Host Platform */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Host Platform
          </h4>
          <p className="text-sm text-slate-800">
            {schedule?.platform
              ? schedule.platform
              : "Zentail In-Browser AI Voice & Text Simulator"}
          </p>
        </div>

        {/* Attached Resume */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Candidate Evidence
          </h4>
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-xs font-medium text-slate-700 truncate">
                {resumeName || "Master Candidate Resume"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium shrink-0">
              Synced
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
