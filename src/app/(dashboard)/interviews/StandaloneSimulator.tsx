"use client";

import { useInterviewStore } from "@/store/useInterviewStore";
import InterviewConfigurator from "@/components/interview/InterviewConfigurator";
import InterviewArena from "@/components/interview/InterviewArena";
import SessionReview from "@/components/interview/SessionReview";
import { useEffect } from "react";

export function StandaloneSimulator() {
  const { currentState, reset } = useInterviewStore();

  useEffect(() => {
    // Reset to start clean when entering standalone simulator
    reset();
  }, [reset]);

  return (
    <div className="w-full">
      {currentState === "config" && <InterviewConfigurator />}
      {currentState === "practicing" && <InterviewArena />}
      {currentState === "review" && <SessionReview />}
    </div>
  );
}
