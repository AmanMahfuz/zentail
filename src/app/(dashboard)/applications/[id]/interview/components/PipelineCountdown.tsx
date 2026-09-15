import { Card, CardContent } from "@/components/ui/card";
import { Clock, RefreshCw } from "lucide-react";

export function PipelineCountdown() {
  return (
    <Card className="border-indigo-100 bg-indigo-50/30 shadow-sm mb-6">
      <CardContent className="p-6 flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 text-indigo-800 font-medium tracking-wide text-xs uppercase mb-4">
          <Clock className="w-3.5 h-3.5" />
          Pipeline Countdown
        </div>
        
        <div className="flex items-center gap-4 text-slate-900 font-semibold">
          <div className="flex flex-col items-center">
            <span className="text-4xl">02</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Days</span>
          </div>
          <span className="text-3xl text-slate-300 pb-4">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl">14</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Hrs</span>
          </div>
          <span className="text-3xl text-slate-300 pb-4">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl">48</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Min</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-4 text-[11px] text-slate-500 font-medium">
          <RefreshCw className="w-3 h-3 text-emerald-500" />
          Automated calendar sync active
        </div>
      </CardContent>
    </Card>
  );
}
