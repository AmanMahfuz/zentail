import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, Monitor, Building2, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export interface InterviewScheduleData {
  round?: number | string | null;
  status?: string | null;
  scheduledAt?: string | Date | null;
  durationMinutes?: number | string | null;
  platform?: string | null;
  notes?: string | null;
}

export function InterviewHero({
  jobTitle,
  company,
  schedule,
  applicationId,
}: {
  jobTitle: string;
  company: string;
  schedule?: InterviewScheduleData | null;
  applicationId?: string;
}) {
  const isScheduled = Boolean(schedule?.scheduledAt);
  const scheduledDate = schedule?.scheduledAt ? new Date(schedule.scheduledAt) : null;
  const isDateValid = scheduledDate && !isNaN(scheduledDate.getTime());

  const roundText = schedule?.round ? `Round ${schedule.round}` : null;
  const statusText = schedule?.status || (isScheduled ? "Scheduled" : "Unscheduled");

  return (
    <Card className="border-slate-200 shadow-sm mb-6">
      <CardContent className="p-6 md:p-8 space-y-4">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {isScheduled ? (
            <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 uppercase text-[10px] tracking-wider py-1 border-indigo-100">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
              {roundText || "Scheduled Round"}
            </Badge>
          ) : (
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 uppercase text-[10px] tracking-wider py-1 border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
              On-Demand Prep
            </Badge>
          )}

          <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
            <Building2 className="w-3.5 h-3.5" />
            {company}
          </div>

          <Badge
            className={`uppercase text-[10px] tracking-wider py-1 border ${
              isScheduled
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
            }`}
          >
            {statusText}
          </Badge>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
          {jobTitle}
        </h1>

        {/* Details Row */}
        {isScheduled && isDateValid ? (
          <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-2 text-slate-600 text-sm font-medium">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-500" />
              {format(scheduledDate, "MMM d, yyyy 'at' h:mm a")}
            </div>
            {schedule?.durationMinutes && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                {schedule.durationMinutes} Minutes Duration
              </div>
            )}
            {schedule?.platform && (
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-indigo-500" />
                {schedule.platform}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-slate-500 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <span>No interview date scheduled yet</span>
            </div>

            {applicationId && (
              <Link
                href="/interviews"
                className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors shadow-2xs"
              >
                <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
                Add or Schedule Interview
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
