"use client";

import { useState } from "react";
import { User, Mail, Phone, MapPin, Globe, Code2, Link2, Plus, X, Check, Sparkles } from "lucide-react";

export interface ExtractedProfile {
  personal: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    portfolioUrl?: string | null;
  };
  summary?: string | null;
  skills: Array<{
    name: string;
    category?: string;
    proficiency?: string;
    proofStatus?: string;
  }>;
  experience?: any[];
  projects?: any[];
  education?: any[];
  certifications?: any[];
}

interface ExtractedProfileCardProps {
  profile: ExtractedProfile;
  onUpdate: (updated: ExtractedProfile) => void;
  onProceed: () => void;
}

export function ExtractedProfileCard({ profile, onUpdate, onProceed }: ExtractedProfileCardProps) {
  const [data, setData] = useState<ExtractedProfile>(profile);
  const [newSkillText, setNewSkillText] = useState("");
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  const handlePersonalChange = (field: keyof ExtractedProfile["personal"], value: string) => {
    const updated = {
      ...data,
      personal: {
        ...data.personal,
        [field]: value
      }
    };
    setData(updated);
    onUpdate(updated);
  };

  const handleRemoveSkill = (skillName: string) => {
    const updated = {
      ...data,
      skills: data.skills.filter(s => s.name.toLowerCase() !== skillName.toLowerCase())
    };
    setData(updated);
    onUpdate(updated);
  };

  const handleAddSkill = () => {
    if (!newSkillText.trim()) return;
    const exists = data.skills.some(s => s.name.toLowerCase() === newSkillText.trim().toLowerCase());
    if (!exists) {
      const updated = {
        ...data,
        skills: [
          ...data.skills,
          { name: newSkillText.trim(), proficiency: "intermediate", proofStatus: "self_reported" }
        ]
      };
      setData(updated);
      onUpdate(updated);
    }
    setNewSkillText("");
    setIsAddingSkill(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Profile Successfully Extracted
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Review your candidate telemetry
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            We extracted your key details from the resume. Verify or edit them before running the job match.
          </p>
        </div>
      </div>

      {/* Grid: Personal Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Full Name
          </label>
          <input
            type="text"
            value={data.personal?.fullName || ""}
            onChange={(e) => handlePersonalChange("fullName", e.target.value)}
            placeholder="Jane Doe"
            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            Email Address
          </label>
          <input
            type="email"
            value={data.personal?.email || ""}
            onChange={(e) => handlePersonalChange("email", e.target.value)}
            placeholder="jane@example.com"
            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            Phone Number
          </label>
          <input
            type="tel"
            value={data.personal?.phone || ""}
            onChange={(e) => handlePersonalChange("phone", e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Location / Remote Preference
          </label>
          <input
            type="text"
            value={data.personal?.location || ""}
            onChange={(e) => handlePersonalChange("location", e.target.value)}
            placeholder="San Francisco, CA or Remote"
            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Online Profiles / Proof Links */}
      <div className="pt-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Online Footprint & Portfolios
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* GitHub */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Code2 className="w-4 h-4" />
            </div>
            <input
              type="url"
              value={data.personal?.githubUrl || ""}
              onChange={(e) => handlePersonalChange("githubUrl", e.target.value)}
              placeholder="github.com/username"
              className="w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Portfolio */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Globe className="w-4 h-4" />
            </div>
            <input
              type="url"
              value={data.personal?.portfolioUrl || ""}
              onChange={(e) => handlePersonalChange("portfolioUrl", e.target.value)}
              placeholder="portfolio.dev"
              className="w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* LinkedIn */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Link2 className="w-4 h-4" />
            </div>
            <input
              type="url"
              value={data.personal?.linkedinUrl || ""}
              onChange={(e) => handlePersonalChange("linkedinUrl", e.target.value)}
              placeholder="linkedin.com/in/username"
              className="w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Extracted Skills Chips */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Extracted Skills & Competencies ({data.skills?.length || 0})
          </label>
          <span className="text-xs text-slate-400">Click × to remove or add missing skills</span>
        </div>

        <div className="flex flex-wrap gap-2 p-3 bg-slate-50/60 rounded-xl border border-slate-100 min-h-[56px] items-center">
          {data.skills?.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <span>{skill.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill.name)}
                className="text-slate-400 hover:text-rose-500 p-0.5 rounded-full transition-colors"
                title="Remove skill"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Add skill input/button */}
          {isAddingSkill ? (
            <div className="inline-flex items-center gap-1 bg-white border border-indigo-300 rounded-full pl-3 pr-1 py-0.5 shadow-xs">
              <input
                type="text"
                autoFocus
                value={newSkillText}
                onChange={(e) => setNewSkillText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  } else if (e.key === "Escape") {
                    setIsAddingSkill(false);
                    setNewSkillText("");
                  }
                }}
                placeholder="Type skill name..."
                className="text-xs font-medium text-slate-800 outline-none w-28"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingSkill(true)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100/80 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-medium border border-dashed border-slate-300 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Skill</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          Details look accurate? Proceed to paste your target Job Description.
        </div>
        <button
          type="button"
          onClick={onProceed}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Confirm Profile & Paste Job Description</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
