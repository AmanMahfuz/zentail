"use client";

import React from "react";
import {
  CertificationItem,
  LanguageItem,
  AchievementItem,
} from "@/types/resume-builder";
import { Award, Languages, Trophy, Plus, Trash2 } from "lucide-react";

interface AdditionalSectionsProps {
  certifications: CertificationItem[];
  languages: LanguageItem[];
  achievements: AchievementItem[];
  onUpdateCertifications: (items: CertificationItem[]) => void;
  onUpdateLanguages: (items: LanguageItem[]) => void;
  onUpdateAchievements: (items: AchievementItem[]) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);

export default function AdditionalSections({
  certifications = [],
  languages = [],
  achievements = [],
  onUpdateCertifications,
  onUpdateLanguages,
  onUpdateAchievements,
}: AdditionalSectionsProps) {
  // Certification handlers
  const addCert = () => {
    onUpdateCertifications([
      ...certifications,
      { id: uid(), name: "", issuer: "", date: "" },
    ]);
  };
  const updateCert = (id: string, patch: Partial<CertificationItem>) => {
    onUpdateCertifications(
      certifications.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  };
  const removeCert = (id: string) => {
    onUpdateCertifications(certifications.filter((c) => c.id !== id));
  };

  // Language handlers
  const addLang = () => {
    onUpdateLanguages([
      ...languages,
      { id: uid(), name: "", proficiency: "Fluent" },
    ]);
  };
  const updateLang = (id: string, patch: Partial<LanguageItem>) => {
    onUpdateLanguages(
      languages.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  };
  const removeLang = (id: string) => {
    onUpdateLanguages(languages.filter((l) => l.id !== id));
  };

  // Achievement handlers
  const addAch = () => {
    onUpdateAchievements([
      ...achievements,
      { id: uid(), title: "", description: "" },
    ]);
  };
  const updateAch = (id: string, patch: Partial<AchievementItem>) => {
    onUpdateAchievements(
      achievements.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
  };
  const removeAch = (id: string) => {
    onUpdateAchievements(achievements.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* ── Certifications ───────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Certifications & Licenses
            </h4>
          </div>
          <button
            type="button"
            onClick={addCert}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {certifications.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No certifications added yet.</p>
        ) : (
          <div className="space-y-2">
            {certifications.map((c) => (
              <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    placeholder="Certification Name (e.g. AWS Certified Solutions Architect)"
                    value={c.name}
                    onChange={(e) => updateCert(c.id, { name: e.target.value })}
                    className="flex-1 text-xs font-semibold bg-transparent outline-none text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => removeCert(c.id)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Issuer (e.g. Amazon Web Services)"
                    value={c.issuer}
                    onChange={(e) => updateCert(c.id, { issuer: e.target.value })}
                    className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="Year or Date (e.g. 2024)"
                    value={c.date}
                    onChange={(e) => updateCert(c.id, { date: e.target.value })}
                    className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Languages ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Languages
            </h4>
          </div>
          <button
            type="button"
            onClick={addLang}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {languages.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No languages added yet.</p>
        ) : (
          <div className="space-y-2">
            {languages.map((l) => (
              <div key={l.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Language (e.g. English)"
                  value={l.name}
                  onChange={(e) => updateLang(l.id, { name: e.target.value })}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800"
                />
                <select
                  value={l.proficiency}
                  onChange={(e) => updateLang(l.id, { proficiency: e.target.value })}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800"
                >
                  <option value="Native">Native</option>
                  <option value="Fluent">Fluent</option>
                  <option value="Professional">Professional</option>
                  <option value="Conversational">Conversational</option>
                  <option value="Basic">Basic</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeLang(l.id)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Honors & Achievements ────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Honors & Achievements
            </h4>
          </div>
          <button
            type="button"
            onClick={addAch}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {achievements.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No achievements added yet.</p>
        ) : (
          <div className="space-y-2">
            {achievements.map((a) => (
              <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    placeholder="Honor or Award Title (e.g. 1st Place National Hackathon)"
                    value={a.title}
                    onChange={(e) => updateAch(a.id, { title: e.target.value })}
                    className="flex-1 text-xs font-semibold bg-transparent outline-none text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => removeAch(a.id)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Details or impact (e.g. Built automated triage bot among 200+ teams)"
                  value={a.description}
                  onChange={(e) => updateAch(a.id, { description: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
