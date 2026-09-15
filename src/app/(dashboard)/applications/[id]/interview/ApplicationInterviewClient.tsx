"use client";

import { useState, useEffect } from "react";
import { InterviewSimulator } from "./InterviewSimulator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Plus, BarChart } from "lucide-react";
import { useInterviewStore } from "@/store/useInterviewStore";

export function ApplicationInterviewClient({
  applicationId,
  jobTitle,
  company,
  suggestedProfile,
  sessions
}: {
  applicationId: string;
  jobTitle: string;
  company: string;
  suggestedProfile?: string;
  sessions: any[];
}) {
  const [showSimulator, setShowSimulator] = useState(false);
  const reset = useInterviewStore(state => state.reset);

  useEffect(() => {
    // If there are no past sessions, immediately show the simulator
    if (sessions.length === 0) {
      setShowSimulator(true);
    }
  }, [sessions]);

  const handleStartNew = () => {
    reset();
    setShowSimulator(true);
  };

  if (showSimulator) {
    return (
      <div className="w-full">
        {sessions.length > 0 && (
          <div className="mb-4">
            <Button variant="ghost" onClick={() => setShowSimulator(false)}>
              &larr; Back to History
            </Button>
          </div>
        )}
        <InterviewSimulator 
          applicationId={applicationId}
          jobTitle={jobTitle}
          company={company}
          suggestedProfile={suggestedProfile}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Interview Practice History</h1>
          <p className="text-slate-500">Your past mock interviews for {jobTitle} at {company}</p>
        </div>
        <Button onClick={handleStartNew} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> Start New Session
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sessions.map((session) => {
          const finalReport = session.final_report;
          const score = finalReport?.overallScore;
          
          return (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-500">
                      {format(new Date(session.created_at), "MMM d, yyyy h:mm a")}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {session.stage}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {session.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                      {session.mode} Mode
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-2">
                    Score: {score ? <span className={score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600"}>{score}/100</span> : "Incomplete"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {session.tracks && session.tracks.map((track: string) => (
                      <span key={track} className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {track}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 min-w-[140px]">
                  <Button variant="outline" className="w-full" disabled={!finalReport}>
                    <BarChart className="w-4 h-4 mr-2" /> View Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
