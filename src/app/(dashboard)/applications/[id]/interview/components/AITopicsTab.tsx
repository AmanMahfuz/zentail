import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ClipboardPaste, Code2, Cpu, Lightbulb } from "lucide-react";

export function AITopicsTab() {
  return (
    <div className="space-y-6">
      {/* Empty State / Generate Action */}
      <div className="flex flex-col items-center justify-center py-10 border border-slate-100 rounded-xl bg-white shadow-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">No topics generated yet</h3>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          Let AI analyze the job description and your profile to predict what they'll ask you during this 60-minute technical evaluation.
        </p>
        <div className="flex items-center gap-3">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Analyze Job & Predict Questions
          </Button>
          <Button variant="outline" className="text-slate-600 border-slate-200">
            <ClipboardPaste className="w-4 h-4 mr-2" />
            Paste Custom JD
          </Button>
        </div>
      </div>

      {/* Target Skill Signals */}
      <div className="space-y-3">
        <h4 className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          DETECTED TARGET SKILL SIGNALS
        </h4>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {["Node.js", "React 18", "PostgreSQL", "System Design", "REST & WebSocket"].map(skill => (
            <Badge key={skill} variant="outline" className="bg-white border-slate-200 text-slate-700 font-medium py-1 px-3 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      {/* Topic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1 */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <Code2 className="w-4 h-4" />
              </div>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                25 Min Live
              </Badge>
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Live Coding Expectations</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">
              Typical test: Build a debounce utility or implement an LRU cache with O(1) reads within 25 minutes.
            </p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-medium uppercase tracking-wider">
                <Code2 className="w-3 h-3" />
                Algorithm & Data Structures
              </div>
              <Button variant="link" className="text-indigo-600 p-0 h-auto font-semibold text-xs">
                Practice sandbox &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Cpu className="w-4 h-4" />
              </div>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                20 Min Arch
              </Badge>
            </div>
            <h3 className="font-bold text-slate-900 mb-2">System Architecture Question</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">
              Design a high-throughput notification ingestion service using Redis queues and PostgreSQL backpressure.
            </p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-medium uppercase tracking-wider">
                <Cpu className="w-3 h-3" />
                Microservices / Queueing
              </div>
              <Button variant="link" className="text-indigo-600 p-0 h-auto font-semibold text-xs">
                View blueprints &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pro Tip */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-900">Pro tip for F6 IT technical screenings</h4>
          <p className="text-xs text-slate-600 mt-1">
            Interviewers prioritize verbalizing trade-offs over writing flawless syntax on the first pass.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-indigo-600 font-semibold px-2 py-0">
          Dismiss
        </Button>
      </div>
    </div>
  );
}
