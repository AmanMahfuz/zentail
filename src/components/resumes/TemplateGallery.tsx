"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Layers,
  Columns,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  GraduationCap,
  Briefcase,
  Wand2,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { TemplateId } from "@/types/resume-builder";
import { Button } from "@/components/ui/button";
import { ATS_BLUEPRINT_RULES } from "@/config/ats-templates";

interface TemplateDefinition {
  id: TemplateId;
  name: string;
  category: "all" | "ats-blueprints" | "standard" | "executive";
  badge: string;
  badgeColor: string;
  description: string;
  bestFor: string;
  atsScore: string;
  margins: string;
  lineSpacing: string;
  features: string[];
  icon: any;
}

const TEMPLATES: TemplateDefinition[] = [
  {
    id: "fresher",
    name: "The Fresher / Entry-Level",
    category: "ats-blueprints",
    badge: "1.0\" Margins • Entry-Level",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    description:
      "Targeted at recent graduates. Prioritizes education, academic projects, and core technical skills over limited work history. Uses 1-inch margins to provide balanced white space.",
    bestFor: "Students, Recent College/Bootcamp Graduates, and Entry-Level Software Engineers",
    atsScore: "100%",
    margins: "1.0 inch (72px)",
    lineSpacing: "1.15 leading",
    features: [
      "Education-first linear hierarchy",
      "Academic project highlight blocks",
      "Categorized Technical Skills (•)",
      "Balanced 1-inch ATS white space",
    ],
    icon: GraduationCap,
  },
  {
    id: "experienced",
    name: "The Experienced / Full-Stack",
    category: "ats-blueprints",
    badge: "0.5\" Margins • 3+ Years Exp",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description:
      "Targeted at professionals with established careers. Prioritizes professional experience, specific technologies (React, Next.js, Python), and quantifiable business impact. Uses 0.5-inch margins for high density.",
    bestFor: "Full-Stack Developers, Senior Engineers, and Tech Leads (3+ years commercial exp)",
    atsScore: "100%",
    margins: "0.5 inch (36px)",
    lineSpacing: "1.0 leading",
    features: [
      "High-density commercial impact layout",
      "Technical skills stack at top",
      "Quantifiable metrics in action bullets",
      "0.5-inch margin maximization",
    ],
    icon: Briefcase,
  },
  {
    id: "hybrid",
    name: "The Career Pivot / Hybrid (Tech + Design)",
    category: "ats-blueprints",
    badge: "0.75\" Margins • Tech + Design",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description:
      "Targeted at individuals combining two distinct skill sets (e.g., UI/UX Design and Frontend Development). Uses a functional/chronological hybrid layout to highlight overlapping skills.",
    bestFor: "Creative Technologists, Design Engineers, Product Strategists & Career Changers",
    atsScore: "100%",
    margins: "0.75 inch (54px)",
    lineSpacing: "1.05 leading",
    features: [
      "Core Competencies synergy section",
      "Blended relevant experience & builds",
      "Design + Tech dual credentialing",
      "0.75-inch balanced ATS proportion",
    ],
    icon: Wand2,
  },
  {
    id: "basic",
    name: "Modern Basic",
    category: "standard",
    badge: "100% ATS Standard",
    badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
    description:
      "Industry-standard single-column layout. Engineered for flawless parsing across Workday, Greenhouse, Lever, and iCIMS.",
    bestFor: "Software Engineers, Data Analysts, Product Managers & General Tech",
    atsScore: "100%",
    margins: "0.75 inch",
    lineSpacing: "1.15 leading",
    features: [
      "Linear single-column hierarchy",
      "Standard system-compatible fonts",
      "Action-verb bullet point structure",
      "Zero unparsed graphic elements",
    ],
    icon: FileText,
  },
  {
    id: "balanced",
    name: "Balanced Executive",
    category: "executive",
    badge: "Senior & Leadership",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    description:
      "Refined typography with centered header accents and elegant section dividers. Highlights career progression and strategic leadership.",
    bestFor: "Engineering Managers, Directors, VP & Experienced Hires (5+ yrs)",
    atsScore: "98%",
    margins: "0.75 inch",
    lineSpacing: "1.2 leading",
    features: [
      "Balanced margin and line proportions",
      "Executive summary accent block",
      "High-density achievement sections",
      "Subtle architectural divider rules",
    ],
    icon: Layers,
  },
  {
    id: "original",
    name: "Original Preserved",
    category: "standard",
    badge: "Uploaded Layout",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    description:
      "Faithfully replicates the visual spacing, header arrangement, divider lines, and section sequence from your original uploaded resume.",
    bestFor: "Candidates wanting to maintain their custom-built existing document flow",
    atsScore: "97%",
    margins: "Original",
    lineSpacing: "Original",
    features: [
      "Preserves original document flow",
      "Custom line rule preservation",
      "Seamless ATS normalization",
      "Instant content sync",
    ],
    icon: Sparkles,
  },
];

export function TemplateGallery() {
  const [filter, setFilter] = useState<"all" | "ats-blueprints" | "standard" | "executive">("all");

  const filteredTemplates =
    filter === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.category === filter);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-[24px] p-8 text-white relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-blue-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            100% ATS Verified Technical Blueprints
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Single-Column Technical ATS Blueprints
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Every blueprint balances the mechanical parser needs of ATS engines (Workday, Greenhouse, Lever, iCIMS) with the scannability expectations of human hiring managers. Clean text hierarchy, consistent margins, and actionable impact bullets.
          </p>
        </div>

        {/* Categories / Filter Pills */}
        <div className="mt-6 flex flex-wrap gap-2 relative z-10">
          {[
            { id: "all", label: "All Templates" },
            { id: "ats-blueprints", label: "★ Research ATS Blueprints (3)" },
            { id: "standard", label: "Standard 1-Column" },
            { id: "executive", label: "Executive" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === cat.id
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* TECHNICAL ATS RULES CHEATSHEET ACCORDION / BOX */}
      <div className="bg-slate-50 border border-slate-200 rounded-[20px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                The Technical ATS-Friendly Blueprint Specifications
              </h3>
              <p className="text-xs text-slate-500">
                Research-backed formatting rules applied directly across all Zentail blueprints
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Parser Passing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700 pt-2 border-t border-slate-200">
          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-900 flex items-center gap-1">
              Typography & Font Sizes
            </h4>
            <ul className="space-y-1 text-[11px] text-slate-600">
              <li>• <strong>Body Text:</strong> 10–12pt (11pt optimal)</li>
              <li>• <strong>Headings:</strong> 12–14pt bold (ALL CAPS)</li>
              <li>• <strong>Name/Header:</strong> 18–22pt bold at top</li>
              <li>• <strong>Fonts:</strong> Arial, Calibri, Times, Georgia, Inter</li>
            </ul>
          </div>

          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-900 flex items-center gap-1">
              Margins & Spacing
            </h4>
            <ul className="space-y-1 text-[11px] text-slate-600">
              <li>• <strong>Margins:</strong> 0.5" (Senior) to 1.0" (Junior)</li>
              <li>• <strong>Leading:</strong> 1.0 to 1.15 line spacing</li>
              <li>• <strong>Gaps:</strong> 8–10pt entries, 12–16pt sections</li>
              <li>• <strong>Bullets:</strong> Standard round bullets (•)</li>
            </ul>
          </div>

          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100">
            <h4 className="font-bold text-rose-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Structural Taboos Avoided
            </h4>
            <ul className="space-y-1 text-[11px] text-slate-600">
              <li>• No tables or multi-column grids</li>
              <li>• No text boxes or floating frames</li>
              <li>• No icons, graphics, or skill rating bars</li>
              <li>• Clean, linear single-column parsing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <div
              key={template.id}
              className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-blue-600 group-hover:bg-blue-50 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{template.name}</h3>
                      <span className="text-xs text-slate-500 font-medium">ATS Score: {template.atsScore}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${template.badgeColor}`}>
                    {template.badge}
                  </span>
                </div>

                {/* Wireframe Mockup Visualizer */}
                <div className="h-36 w-full bg-slate-50/80 rounded-xl border border-slate-200/70 p-4 flex flex-col justify-between overflow-hidden shadow-inner group-hover:border-blue-200 transition-colors">
                  {template.id === "fresher" && (
                    <div className="space-y-1.5">
                      <div className="w-1/2 h-2.5 bg-blue-600/70 rounded mx-auto" />
                      <div className="w-3/5 h-1 bg-slate-300 rounded mx-auto" />
                      <div className="w-full h-px bg-slate-300 my-1" />
                      <div className="w-1/4 h-1.5 bg-slate-800 rounded font-bold" />
                      <div className="w-full h-1 bg-slate-200 rounded" />
                      <div className="w-4/5 h-1 bg-slate-200 rounded" />
                    </div>
                  )}

                  {template.id === "experienced" && (
                    <div className="space-y-1.5">
                      <div className="w-3/5 h-2.5 bg-slate-900 rounded mx-auto" />
                      <div className="w-4/5 h-1 bg-slate-400 rounded mx-auto" />
                      <div className="w-full h-px bg-slate-400 my-1" />
                      <div className="w-1/3 h-1.5 bg-slate-900 rounded" />
                      <div className="w-full h-1 bg-slate-200 rounded" />
                      <div className="w-11/12 h-1 bg-slate-200 rounded" />
                      <div className="w-5/6 h-1 bg-slate-200 rounded" />
                    </div>
                  )}

                  {template.id === "hybrid" && (
                    <div className="space-y-1.5">
                      <div className="w-1/2 h-2.5 bg-indigo-700/80 rounded mx-auto" />
                      <div className="w-2/3 h-1 bg-slate-300 rounded mx-auto" />
                      <div className="w-full h-px bg-indigo-200 my-1" />
                      <div className="w-1/3 h-1.5 bg-indigo-900 rounded" />
                      <div className="w-full h-1 bg-slate-200 rounded" />
                      <div className="w-3/4 h-1 bg-slate-200 rounded" />
                    </div>
                  )}

                  {template.id === "basic" && (
                    <div className="space-y-1.5">
                      <div className="w-1/2 h-2.5 bg-slate-400/80 rounded mx-auto" />
                      <div className="w-1/3 h-1 bg-slate-300 rounded mx-auto" />
                      <div className="w-full h-px bg-slate-200 my-1" />
                      <div className="w-1/4 h-1.5 bg-blue-600/60 rounded" />
                      <div className="w-full h-1 bg-slate-200 rounded" />
                      <div className="w-5/6 h-1 bg-slate-200 rounded" />
                    </div>
                  )}

                  {template.id === "balanced" && (
                    <div className="space-y-1.5">
                      <div className="w-3/5 h-2.5 bg-slate-800/80 rounded mx-auto" />
                      <div className="w-2/5 h-1 bg-slate-400 rounded mx-auto" />
                      <div className="w-3/4 h-px bg-slate-300 mx-auto my-1" />
                      <div className="w-1/3 h-1.5 bg-indigo-700/60 rounded mx-auto" />
                      <div className="w-full h-1 bg-slate-200 rounded" />
                    </div>
                  )}

                  {template.id === "original" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <div className="w-1/3 h-2.5 bg-purple-700/70 rounded" />
                        <div className="w-1/4 h-1 bg-slate-300 rounded" />
                      </div>
                      <div className="w-full h-0.5 bg-purple-200 my-1" />
                      <div className="w-1/4 h-1.5 bg-slate-600 rounded" />
                      <div className="w-full h-1 bg-slate-200 rounded" />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/60">
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <Zap className="w-3 h-3 text-amber-500" /> {template.margins}
                    </span>
                    <span className="font-mono text-slate-500">{template.lineSpacing}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed min-h-[48px]">
                  {template.description}
                </p>

                {/* Best For Tag */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Best Suited For
                  </span>
                  <p className="text-xs font-semibold text-slate-800 leading-snug">
                    {template.bestFor}
                  </p>
                </div>

                {/* Feature Checklist */}
                <ul className="space-y-1 pt-1">
                  {template.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-4 border-t border-slate-100 space-y-2">
                <Link
                  href={`/resumes/builder?template=${template.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl py-2 px-3 text-xs font-semibold transition-all shadow-xs"
                >
                  Use This Blueprint <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {["fresher", "experienced", "hybrid"].includes(template.id) && (
                  <Link
                    href={`/resumes/builder?template=${template.id}&loadSample=true`}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl py-1.5 px-3 text-[11px] font-semibold transition-all border border-slate-200"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-600" /> Load Blueprint Sample
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
