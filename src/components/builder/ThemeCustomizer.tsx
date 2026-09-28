"use client";

import React from "react";
import { ResumeTheme } from "@/types/resume-builder";
import { Palette, Type, Layout, ShieldCheck, Check } from "lucide-react";

interface ThemeCustomizerProps {
  theme: ResumeTheme;
  onChange: (patch: Partial<ResumeTheme>) => void;
}

const PALETTES = [
  { name: "Midnight", value: "#0f172a" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Sunset Orange", value: "#ea580c" },
  { name: "Emerald", value: "#059669" },
  { name: "Sky", value: "#0284c7" },
  { name: "Rose", value: "#e11d48" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Charcoal", value: "#334155" },
];

const FONTS: Array<{ name: string; value: ResumeTheme["fontFamily"]; desc: string }> = [
  { name: "Inter", value: "Inter", desc: "Clean, modern, maximum readability" },
  { name: "Playfair Display", value: "Playfair Display", desc: "Classic serif, executive presence" },
  { name: "Roboto", value: "Roboto", desc: "Tech-standard neutral sans-serif" },
  { name: "Outfit", value: "Outfit", desc: "Contemporary geometric sans" },
];

export default function ThemeCustomizer({ theme, onChange }: ThemeCustomizerProps) {
  return (
    <div className="space-y-6">
      {/* ── ATS Mode Switcher ────────────────────────────────────── */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-emerald-50/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-950">ATS Strict Mode</p>
            <p className="text-[10px] text-emerald-700">Enforces 100% black text & standard parsing</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange({ atsModeActive: !theme.atsModeActive })}
          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
            theme.atsModeActive ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
        </button>
      </div>

      {/* ── Color Palette ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Palette className="w-4 h-4 text-slate-500" />
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Accent Palette
          </label>
        </div>
        {theme.atsModeActive ? (
          <p className="text-xs text-slate-400 italic">Color palette is overridden in ATS Strict Mode.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {PALETTES.map((color) => {
              const active = theme.primaryColor.toLowerCase() === color.value.toLowerCase();
              return (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => onChange({ primaryColor: color.value })}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-left transition-all ${
                    active
                      ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: color.value }}
                  >
                    {active && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-[10px] font-medium text-slate-700 text-center truncate w-full">
                    {color.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Typography ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Type className="w-4 h-4 text-slate-500" />
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Typography
          </label>
        </div>
        <div className="space-y-1.5">
          {FONTS.map((font) => {
            const active = theme.fontFamily === font.value;
            return (
              <button
                key={font.value}
                type="button"
                onClick={() => onChange({ fontFamily: font.value })}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                  active
                    ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{font.name}</p>
                  <p className="text-[10px] text-slate-500">{font.desc}</p>
                </div>
                {active && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Layout Density & Sizing ──────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Layout className="w-4 h-4 text-slate-500" />
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Layout & Spacing
          </label>
        </div>

        {/* Density */}
        <div className="space-y-3">
          <div>
            <span className="block text-[11px] font-medium text-slate-600 mb-1.5">Section Spacing</span>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
              {(["compact", "normal", "spacious"] as const).map((density) => (
                <button
                  key={density}
                  type="button"
                  onClick={() => onChange({ layoutDensity: density })}
                  className={`py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                    theme.layoutDensity === density
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {density}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <span className="block text-[11px] font-medium text-slate-600 mb-1.5">Base Font Size</span>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
              {(["compact", "normal", "large"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onChange({ fontSize: size })}
                  className={`py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                    theme.fontSize === size
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
