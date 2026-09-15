import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, Monitor, Building2, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export function InterviewHero({ jobTitle, company }: { jobTitle: string; company: string }) {
  // Hardcoded for now based on design
  const round = "Round 1 (Technical)";
  const status = "Confirmed";
  const date = new Date("2026-08-29T00:22:00Z");
  const duration = "60 Minutes Duration";
  const platform = "Google Meet / Live IDE";

  return (
    <Card className="border-slate-200 shadow-sm mb-6">
      <CardContent className="p-6 md:p-8 space-y-4">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 uppercase text-[10px] tracking-wider py-1 border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
            {round}
          </Badge>
          <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
            <Building2 className="w-3.5 h-3.5" />
            {company}
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 uppercase text-[10px] tracking-wider py-1 border-emerald-100">
            {status}
          </Badge>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
          {jobTitle}
        </h1>

        {/* Details Row */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-2 text-slate-600 text-sm font-medium">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            {format(date, "MMM d, yyyy 'at' h:mm a")}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            {duration}
          </div>
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-indigo-500" />
            {platform}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
