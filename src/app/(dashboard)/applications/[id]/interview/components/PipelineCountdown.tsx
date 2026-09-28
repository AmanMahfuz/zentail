import { Card, CardContent } from "@/components/ui/card";
import { Clock, RefreshCw } from "lucide-react";

export function PipelineCountdown({ targetDate }: { targetDate?: string | Date | null }) {
  let days = "00";
  let hours = "00";
  let minutes = "00";
  let hasTarget = false;

  if (targetDate) {
    const target = new Date(targetDate);
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff > 0) {
      hasTarget = true;
      days = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, "0");
      hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, "0");
      minutes = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, "0");
    }
  }

  return (
    <Card className="border-indigo-100 bg-indigo-50/30 shadow-sm mb-6">
      <CardContent className="p-6 flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 text-indigo-800 font-medium tracking-wide text-xs uppercase mb-4">
          <Clock className="w-3.5 h-3.5" />
          {hasTarget ? "Pipeline Countdown" : "Practice Readiness"}
        </div>
        
        {hasTarget ? (
          <div className="flex items-center gap-4 text-slate-900 font-semibold">
            <div className="flex flex-col items-center">
              <span className="text-4xl">{days}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Days</span>
            </div>
            <span className="text-3xl text-slate-300 pb-4">:</span>
            <div className="flex flex-col items-center">
              <span className="text-4xl">{hours}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Hrs</span>
            </div>
            <span className="text-3xl text-slate-300 pb-4">:</span>
            <div className="flex flex-col items-center">
              <span className="text-4xl">{minutes}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Min</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Standby &bull; Practice Anytime
            </span>
            <p className="text-xs text-slate-500 mt-2">
              Ready for on-demand AI mock simulation
            </p>
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-4 text-[11px] text-slate-500 font-medium">
          <RefreshCw className="w-3 h-3 text-emerald-500" />
          {hasTarget ? "Automated calendar sync active" : "Real-time AI readiness active"}
        </div>
      </CardContent>
    </Card>
  );
}
