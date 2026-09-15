"use client";

import { useInterviewStore } from "@/store/useInterviewStore";
import { StandaloneConfigurator } from "./StandaloneConfigurator";
import { InterviewArena } from "../applications/[id]/interview/InterviewArena";
import { FinalReport } from "../applications/[id]/interview/FinalReport";
import { useEffect } from "react";

export function StandaloneSimulator() {
  const { phase, reset } = useInterviewStore();

  useEffect(() => {
    // Reset when mounting standalone to clear out any application-specific state
    reset();
  }, [reset]);

  return (
    <div className="w-full">
      {phase === "configurator" && (
        <StandaloneConfigurator />
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
