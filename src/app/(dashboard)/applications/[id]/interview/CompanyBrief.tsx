import { COMPANY_PROFILES } from "@/lib/interview/profiles";
import { Info } from "lucide-react";

export function CompanyBrief({ 
  suggestedProfile, 
  currentSelection, 
  onChange 
}: { 
  suggestedProfile?: string, 
  currentSelection?: string, 
  onChange: (t: string) => void 
}) {
  const activeProfile = currentSelection || suggestedProfile || "general";
  const profileDetails = COMPANY_PROFILES[activeProfile] || COMPANY_PROFILES["general"];

  return (
    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
      <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
        <Info className="w-4 h-4" /> Company Style Configuration
      </h3>
      
      {suggestedProfile && !currentSelection && (
        <p className="text-sm text-indigo-700">
          We detected that this job description matches a <strong>{COMPANY_PROFILES[suggestedProfile]?.name || suggestedProfile}</strong> profile. 
          You can keep this style or change it.
        </p>
      )}

      <div className="flex gap-2">
        <select 
          className="p-2 text-sm border border-indigo-200 rounded-md bg-white text-indigo-900 focus:outline-none"
          value={activeProfile}
          onChange={(e) => onChange(e.target.value)}
        >
          {Object.entries(COMPANY_PROFILES).map(([key, data]) => (
            <option key={key} value={key}>{data.name}</option>
          ))}
        </select>
      </div>

      <div className="text-sm text-indigo-800">
        <p><strong>Emphasis:</strong> {profileDetails.focusAreas.join(", ")}</p>
        <p><strong>Difficulty Base:</strong> {profileDetails.difficulty}</p>
      </div>
    </div>
  );
}
