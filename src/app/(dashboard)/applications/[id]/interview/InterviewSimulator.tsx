"use client";

import { useInterviewStore } from "@/store/useInterviewStore";
import { InterviewConfigurator } from "./InterviewConfigurator";
import { InterviewArena } from "./InterviewArena";
import { FinalReport } from "./FinalReport";

export function InterviewSimulator({ 
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
  const { phase } = useInterviewStore();

  return (
    <div className="w-full">
      {phase === "configurator" && (
        <InterviewConfigurator 
          applicationId={applicationId} 
          jobTitle={jobTitle} 
          company={company}
          suggestedProfile={suggestedProfile}
        />
      )}
      
      {(phase === "active" || phase === "feedback") && (
        <InterviewArena />
      )}
      
      {phase === "completed" && (
        <FinalReport />
      )}
    </div>
  );
}
