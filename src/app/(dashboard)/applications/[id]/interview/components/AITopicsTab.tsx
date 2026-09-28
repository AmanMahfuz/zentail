import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ClipboardPaste, Code2, Cpu, Lightbulb, MessageSquare, Layers, Loader2 } from "lucide-react";
import { generateInterviewPrep } from "@/lib/actions/phase3";

const iconMap: Record<string, any> = {
  Code2,
  Cpu,
  MessageSquare,
  Layers,
};

export function AITopicsTab({
  applicationId,
  initialPrep,
}: {
  applicationId: string;
  initialPrep?: any;
}) {
  const [prep, setPrep] = useState<any>(initialPrep);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateInterviewPrep(applicationId);
      if (res.success && res.data) {
        setPrep(res.data);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!prep) {
    return (
      <div className="space-y-6">
        {/* Empty State / Generate Action */}
        <div className="flex flex-col items-center justify-center py-10 border border-slate-100 rounded-xl bg-white shadow-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No topics generated yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            Let AI analyze the job description and your profile to predict what they'll ask you during this interview.
          </p>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Job & Predict Questions
                </>
              )}
            </Button>
            <Button variant="outline" className="text-slate-600 border-slate-200">
              <ClipboardPaste className="w-4 h-4 mr-2" />
              Paste Custom JD
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const signals = prep.signals || [];
  const topics = prep.topics || [];

  return (
    <div className="space-y-6">
      {/* Target Skill Signals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            DETECTED TARGET SKILL SIGNALS
          </h4>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="h-8 text-indigo-600"
          >
            {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
            Regenerate
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {signals.map((skill: string) => (
            <Badge key={skill} variant="outline" className="bg-white border-slate-200 text-slate-700 font-medium py-1 px-3 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      {/* Topic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic: any, idx: number) => {
          const IconComponent = iconMap[topic.icon] || Lightbulb;
          return (
            <Card key={idx} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                    {topic.time}
                  </Badge>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{topic.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">
                  {topic.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-medium uppercase tracking-wider overflow-hidden text-ellipsis whitespace-nowrap">
                    {topic.skills && topic.skills.length > 0 && (
                      <>
                        <IconComponent className="w-3 h-3 shrink-0" />
                        <span className="truncate">{topic.skills.join(" & ")}</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
