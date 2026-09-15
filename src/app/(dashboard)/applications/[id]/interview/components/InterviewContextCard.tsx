import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InterviewContextCard() {
  return (
    <Card className="border-slate-200 shadow-sm mb-6">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500" />
          Interview Context
        </CardTitle>
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none px-2 py-0.5 text-[10px] tracking-wider uppercase">
          Confirmed
        </Badge>
      </CardHeader>
      <CardContent className="pt-4 space-y-5">
        
        {/* Format & Type */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Format & Type
          </h4>
          <p className="text-sm text-slate-800">
            Technical Screening (60 min) — Live Coding & Architecture Design
          </p>
        </div>

        {/* Application Status */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Application Status
          </h4>
          <div className="flex items-center gap-2 text-sm text-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Interview Round 1 of 3
          </div>
        </div>

        {/* Host Platform */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Host Platform
          </h4>
          <p className="text-sm text-slate-800">
            Google Meet (Code shared via CollabPad)
          </p>
        </div>

        {/* Attached Resume */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Attached Resume
          </h4>
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors cursor-pointer group">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-xs font-medium text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                Aman_Resume_FullStack.pdf
              </span>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
