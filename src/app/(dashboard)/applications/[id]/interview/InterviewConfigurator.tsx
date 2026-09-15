import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyBrief } from "./CompanyBrief";
import { useInterviewStore } from "@/store/useInterviewStore";
import { SUPPORTED_TRACKS } from "@/lib/interview/profiles";

export function InterviewConfigurator({
  applicationId,
  jobTitle,
  company,
  suggestedProfile
}: {
  applicationId: string,
  jobTitle: string,
  company: string,
  suggestedProfile?: string
}) {
  const { 
    stage, difficulty, tracks, mode, companyType,
    setConfig, startSession 
  } = useInterviewStore();

  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          stage,
          difficulty,
          tracks,
          mode,
          companyType: companyType || suggestedProfile || "general"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      startSession(data);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrack = (t: string) => {
    if (tracks.includes(t)) {
      setConfig({ tracks: tracks.filter((x: string) => x !== t) });
    } else {
      setConfig({ tracks: [...tracks, t] });
    }
  };

  return (
    <Card className="max-w-3xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Configure Interview: {jobTitle} at {company}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        
        <CompanyBrief 
          suggestedProfile={suggestedProfile} 
          currentSelection={companyType}
          onChange={(type) => setConfig({ companyType: type })}
        />

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800">1. Interview Stage</h3>
          <div className="flex gap-2 flex-wrap">
            {["Quick Practice", "Weakness Drill", "Full Mock", "Final Round"].map(s => (
              <Badge 
                key={s} 
                variant={stage === s ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setConfig({ stage: s })}
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800">2. Difficulty</h3>
          <div className="flex gap-2 flex-wrap">
            {["Beginner", "Intermediate", "Advanced"].map(d => (
              <Badge 
                key={d} 
                variant={difficulty === d ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setConfig({ difficulty: d })}
              >
                {d}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800">3. Focus Tracks</h3>
          <div className="flex gap-2 flex-wrap">
            {SUPPORTED_TRACKS.map(t => (
              <Badge 
                key={t} 
                variant={tracks.includes(t) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTrack(t)}
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800">4. Answer Mode</h3>
          <div className="flex gap-2">
            <Button 
              variant={mode === "text" ? "default" : "outline"}
              onClick={() => setConfig({ mode: "text" })}
            >
              Text
            </Button>
            <Button 
              variant={mode === "voice" ? "default" : "outline"}
              onClick={() => setConfig({ mode: "voice" })}
            >
              Voice
            </Button>
          </div>
        </div>

        <Button onClick={handleStart} disabled={isLoading} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700">
          {isLoading ? "Preparing Session..." : "Start Interview Simulator"}
        </Button>

      </CardContent>
    </Card>
  );
}
