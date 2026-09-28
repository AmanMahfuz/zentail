"use client";

import React from "react";
import { Brain } from "lucide-react";

interface NeuralRadarLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function NeuralRadarLoader({ size = "md", className = "" }: NeuralRadarLoaderProps) {
  const scale = size === "sm" ? "scale-75" : size === "lg" ? "scale-125" : "scale-100";

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Subtle Ambient Glow Aura */}
      <div className="absolute w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "4s" }} />

      {/* AI Concentric Radar Core Container */}
      <div className={`relative w-44 h-44 flex items-center justify-center ${scale}`}>
        {/* Outer Rotating Radar Sweep Aura (Dashed ring) */}
        <div
          className="absolute inset-0 rounded-full border border-dashed border-[#4F46E5]/30 animate-spin"
          style={{ animationDuration: "20s" }}
        />

        {/* Second Inner Counter-Rotating Ring */}
        <div
          className="absolute inset-2 rounded-full border border-[#4F46E5]/20 animate-spin"
          style={{ animationDuration: "12s", animationDirection: "reverse" }}
        />

        {/* Middle Pulsing Wave */}
        <div
          className="absolute inset-6 rounded-full bg-gradient-to-tr from-[#4F46E5]/20 via-blue-200/30 to-[#4F46E5]/10 animate-ping opacity-40"
          style={{ animationDuration: "3s" }}
        />

        {/* Core Glowing Hex / Rounded Diamond Orb */}
        <div
          className="relative w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#4F46E5] via-[#6366F1] to-[#0058BE] flex items-center justify-center shadow-xl shadow-indigo-500/25 transform rotate-45 transition-transform duration-700"
        >
          {/* Inner cutout box (Counter-rotated back -45deg) */}
          <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center transform -rotate-45 shadow-inner">
            <div className="relative flex items-center justify-center">
              <Brain className="w-9 h-9 text-[#4F46E5] animate-pulse" style={{ animationDuration: "2.5s" }} />
              
              {/* Online Green Radar Beacon */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
          </div>
        </div>

        {/* Orbiting Particle Node */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "6s" }}>
          <div className="w-3 h-3 rounded-full bg-[#4F46E5] shadow-md shadow-indigo-500/50 -translate-x-1/2" />
        </div>
      </div>
    </div>
  );
}
