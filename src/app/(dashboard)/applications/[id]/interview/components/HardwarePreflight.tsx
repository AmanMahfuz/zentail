import { Card, CardContent } from "@/components/ui/card";
import { Mic } from "lucide-react";

export function HardwarePreflight() {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-emerald-600">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900">Hardware Pre-flight</h4>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
              Mic, webcam & screen verified 15m ago
            </p>
          </div>
        </div>
        <Mic className="w-4 h-4 text-slate-400 shrink-0" />
      </CardContent>
    </Card>
  );
}
