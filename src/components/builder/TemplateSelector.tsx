"use client";

import React from "react";
import { TemplateId } from "@/types/resume-builder";
import { CheckCircle2, FileText, Layers, Columns, Sparkles, GraduationCap, Briefcase, Wand2 } from "lucide-react";

interface TemplateSelectorProps {
  currentTemplate: TemplateId;
  onSelect: (template: TemplateId) => void;
}

const TEMPLATES: Array<{
  id: TemplateId;
  name: string;
  badge: string;
  description: string;
  icon: any;
}> = [
  {
    id: "fresher",
    name: "The Fresher / Entry-Level",
    badge: "1.0\" Margins • Education First",
    description: "Strict single-column ATS layout. Prioritizes education, core technical skills, and academic builds over work history.",
    icon: GraduationCap,
  },
  {
    id: "experienced",
    name: "The Experienced / Full-Stack",
    badge: "0.5\" Margins • High Density",
    description: "Maximized density for 3+ yrs professionals. Prioritizes summary, tech stack, quantifiable commercial impact, and systems.",
    icon: Briefcase,
  },
  {
    id: "hybrid",
    name: "The Career Pivot / Hybrid",
    badge: "0.75\" Margins • Tech + Design",
    description: "Functional/chronological hybrid layout. Highlights cross-functional competencies (e.g. UI/UX + Frontend) seamlessly.",
    icon: Wand2,
  },
  {
    id: "basic",
    name: "Modern Basic (ATS Standard)",
    badge: "Industry Standard",
    description: "Traditional single-column layout engineered for standard ATS parsing across Workday, Greenhouse & Lever.",
    icon: FileText,
  },
  {
    id: "balanced",
    name: "Balanced Minimalist (Executive)",
    badge: "Senior & Leadership",
    description: "Refined typography with centered header accents. Ideal for managers, directors, and executive leadership.",
    icon: Layers,
  },
  {
    id: "original",
    name: "Original Uploaded Style",
    badge: "Original Theme",
    description: "Faithfully replicates the visual layout, header style, divider lines, and section order from your uploaded resume.",
    icon: Sparkles,
  },
];

export default function TemplateSelector({ currentTemplate, onSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Resume Architecture</h3>
        <p className="text-xs text-slate-500">
          Switch layouts anytime. Content adheres to technical ATS-friendly single-column rules.
        </p>
      </div>

      <div className="space-y-3">
        {TEMPLATES.map((t) => {
          const isActive = currentTemplate === t.id;
          const Icon = t.icon;
          return (
            <div
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                isActive
                  ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                    <span className="text-[10px] font-semibold text-blue-600">{t.badge}</span>
                  </div>
                </div>
                {isActive && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                {t.description}
              </p>

              {/* Wireframe Mini Visualizer */}
              <div className="h-16 bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col justify-between overflow-hidden">
                {t.id === "fresher" && (
                  <div className="space-y-1">
                    <div className="w-1/2 h-1.5 bg-blue-600/70 rounded mx-auto" />
                    <div className="w-2/3 h-1 bg-slate-300 rounded mx-auto" />
                    <div className="w-full h-px bg-slate-300 my-0.5" />
                    <div className="w-1/4 h-1 bg-slate-700 font-bold rounded" />
                    <div className="w-full h-1 bg-slate-200 rounded" />
                    <div className="w-3/4 h-1 bg-slate-200 rounded" />
                  </div>
                )}
                {t.id === "experienced" && (
                  <div className="space-y-1">
                    <div className="w-3/5 h-1.5 bg-slate-900 rounded mx-auto" />
                    <div className="w-4/5 h-1 bg-slate-300 rounded mx-auto" />
                    <div className="w-full h-px bg-slate-400 my-0.5" />
                    <div className="w-1/3 h-1 bg-slate-800 rounded" />
                    <div className="w-full h-1 bg-slate-300 rounded" />
                    <div className="w-full h-1 bg-slate-300 rounded" />
                    <div className="w-5/6 h-1 bg-slate-300 rounded" />
                  </div>
                )}
                {t.id === "hybrid" && (
                  <div className="space-y-1">
                    <div className="w-1/2 h-1.5 bg-indigo-700/80 rounded mx-auto" />
                    <div className="w-3/5 h-1 bg-slate-300 rounded mx-auto" />
                    <div className="w-full h-px bg-indigo-200 my-0.5" />
                    <div className="w-2/5 h-1 bg-indigo-900 rounded" />
                    <div className="w-full h-1 bg-slate-200 rounded" />
                    <div className="w-4/5 h-1 bg-slate-200 rounded" />
                  </div>
                )}
                {t.id === "basic" && (
                  <div className="space-y-1">
                    <div className="w-2/3 h-1.5 bg-slate-300 rounded mx-auto" />
                    <div className="w-1/2 h-1 bg-slate-200 rounded mx-auto" />
                    <div className="w-full h-px bg-slate-300 my-1" />
                    <div className="w-1/3 h-1 bg-slate-300 rounded" />
                    <div className="w-full h-1 bg-slate-200 rounded" />
                    <div className="w-5/6 h-1 bg-slate-200 rounded" />
                  </div>
                )}
                {t.id === "balanced" && (
                  <div className="space-y-1">
                    <div className="w-1/2 h-1.5 bg-slate-400 rounded mx-auto" />
                    <div className="w-2/3 h-1 bg-slate-200 rounded mx-auto" />
                    <div className="flex items-center gap-1 my-1">
                      <div className="flex-1 h-px bg-slate-300" />
                      <div className="w-12 h-1 bg-slate-400 rounded" />
                      <div className="flex-1 h-px bg-slate-300" />
                    </div>
                    <div className="w-full h-1 bg-slate-200 rounded" />
                  </div>
                )}
                {t.id === "original" && (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <div className="w-1/3 h-1.5 bg-purple-700/70 rounded" />
                      <div className="w-1/4 h-1 bg-slate-300 rounded" />
                    </div>
                    <div className="w-full h-px bg-purple-300 my-0.5" />
                    <div className="w-1/4 h-1 bg-slate-600 rounded" />
                    <div className="w-full h-1 bg-slate-200 rounded" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
