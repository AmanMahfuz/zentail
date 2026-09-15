"use client";
import { useState } from "react";

interface Requirement {
  requirement: string;
  type: string;
  importance: "high" | "medium" | "low";
  evidence: string | null;
  status: "found" | "partial" | "missing";
  suggestedAction: string;
}

interface Props {
  applicationId: string;
  requirementMap: any;
  status: string;
}

export function RequirementMap({ applicationId, requirementMap, status }: Props) {
  const [evidenceInputs, setEvidenceInputs] = useState<Record<string, string>>({});
  const [regenerating, setRegenerating] = useState(false);

  if (status === "analyzing") {
    return (
      <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
        <div className="text-3xl mb-4">⏳</div>
        <div className="text-sm font-medium mb-1">
          Analyzing job requirements
        </div>
        <div className="text-xs text-zinc-500">
          Comparing this role against your evidence profile...
          <br />
          Usually takes 30-60 seconds
        </div>
      </div>
    );
  }

  if (!requirementMap?.requirements) {
    return (
      <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
        <div className="text-xs text-zinc-500">
          No requirement map available yet
        </div>
      </div>
    );
  }

  const requirements: Requirement[] = requirementMap.requirements;
  const found = requirements.filter(r => r.status === "found");
  const partial = requirements.filter(r => r.status === "partial");
  const missing = requirements.filter(r => r.status === "missing");

  const handleAddEvidence = async (requirement: string) => {
    const evidence = evidenceInputs[requirement];
    if (!evidence?.trim()) return;

    setRegenerating(true);
    await fetch(`/api/applications/${applicationId}/add-evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirement, evidence })
    });
    setRegenerating(false);
    // Refresh page to show updated map
    window.location.reload();
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="text-sm font-medium">Requirement map</div>
        <div className="text-xs text-zinc-500 mt-1">
          What this role needs vs what you can prove
        </div>
      </div>

      {/* MATCHED */}
      {found.length > 0 && (
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-500 mb-4">
            ✅ You have evidence for these ({found.length})
          </div>
          {found.map(req => (
            <div
              key={req.requirement}
              className="flex justify-between items-start py-3 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
            >
              <div className="flex-1 pr-4">
                <div className="text-sm font-medium flex items-center gap-2">
                  {req.requirement}
                  <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full font-normal">
                    {req.importance}
                  </span>
                </div>
                {req.evidence && (
                  <div className="text-xs text-zinc-500 mt-1">
                    {req.evidence}
                  </div>
                )}
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-500 shrink-0 font-bold">
                ✓
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PARTIAL */}
      {partial.length > 0 && (
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="text-xs font-medium text-amber-600 dark:text-amber-500 mb-4">
            ⚠️ Weak evidence — needs strengthening ({partial.length})
          </div>
          {partial.map(req => (
            <div key={req.requirement} className="mb-5 last:mb-0">
              <div className="text-sm font-medium mb-1">
                {req.requirement}
              </div>
              <div className="text-xs text-zinc-500 mb-3">
                {req.suggestedAction}
              </div>
              <div className="flex gap-2">
                <input
                  value={evidenceInputs[req.requirement] || ""}
                  onChange={e => setEvidenceInputs(prev => ({
                    ...prev,
                    [req.requirement]: e.target.value
                  }))}
                  placeholder={`Describe your ${req.requirement} experience...`}
                  className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleAddEvidence(req.requirement)}
                  disabled={!evidenceInputs[req.requirement]?.trim() || regenerating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-medium whitespace-nowrap transition-colors"
                >
                  {regenerating ? "..." : "Update →"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MISSING */}
      {missing.length > 0 && (
        <div className="p-5">
          <div className="text-xs font-medium text-red-600 dark:text-red-500 mb-4">
            ❌ No evidence found ({missing.length})
          </div>
          {missing.map(req => (
            <div key={req.requirement} className="mb-5 last:mb-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">
                  {req.requirement}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  req.importance === "high"
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}>
                  {req.importance} priority
                </span>
              </div>
              <div className="text-xs text-zinc-500 mb-3">
                {req.suggestedAction}
              </div>

              {/* Let user add evidence inline */}
              <div className="flex gap-2">
                <input
                  value={evidenceInputs[req.requirement] || ""}
                  onChange={e => setEvidenceInputs(prev => ({
                    ...prev,
                    [req.requirement]: e.target.value
                  }))}
                  placeholder={`Do you have ${req.requirement} experience? Describe it briefly...`}
                  className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleAddEvidence(req.requirement)}
                  disabled={!evidenceInputs[req.requirement]?.trim() || regenerating}
                  className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    evidenceInputs[req.requirement]?.trim()
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                  }`}
                >
                  Add →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
