export type InterviewTrack = "Behavioral" | "Technical" | "DSA" | "System Design" | "Project" | "HR";

export type CompanyProfile = {
  id: string;
  name: string;
  confidence: "Low" | "Medium" | "High";
  reason: string;
  focusAreas: InterviewTrack[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
};

export const SUPPORTED_TRACKS = [
  "Behavioral",
  "Technical", 
  "DSA",
  "System Design",
  "Project",
  "HR"
];

export const COMPANY_PROFILES: Record<string, Omit<CompanyProfile, "confidence" | "reason" | "id">> = {
  "growth_startup": {
    name: "Growth-stage startup",
    focusAreas: ["Technical", "Project", "Behavioral"],
    difficulty: "Intermediate",
  },
  "faang": {
    name: "Big Tech / FAANG",
    focusAreas: ["DSA", "System Design", "Behavioral"],
    difficulty: "Advanced",
  },
  "mnc": {
    name: "MNC / Enterprise",
    focusAreas: ["Technical", "Project", "HR"],
    difficulty: "Intermediate",
  },
  "general": {
    name: "General Practice",
    focusAreas: ["Behavioral", "Technical"],
    difficulty: "Intermediate",
  }
};
