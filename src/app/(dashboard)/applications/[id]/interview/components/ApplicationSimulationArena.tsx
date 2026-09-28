"use client";

import React from "react";
import { useInterviewStore } from "@/store/useInterviewStore";
import InterviewConfigurator from "@/components/interview/InterviewConfigurator";
import InterviewArena from "@/components/interview/InterviewArena";
import SessionReview from "@/components/interview/SessionReview";

interface ApplicationSimulationArenaProps {
  applicationId: string;
  jobTitle: string;
  company: string;
  initialQuestions?: any[];
}

export function ApplicationSimulationArena({
  applicationId,
  jobTitle,
  company,
}: ApplicationSimulationArenaProps) {
  const { currentState } = useInterviewStore();

  return (
    <div className="w-full">
      {currentState === "config" && (
        <InterviewConfigurator
          initialRole={jobTitle}
          initialCompany={company}
          applicationId={applicationId}
        />
      )}
      {currentState === "practicing" && <InterviewArena />}
      {currentState === "review" && <SessionReview />}
    </div>
  );
}
