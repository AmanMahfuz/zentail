export interface ContactInfo {
  name: string;
  title?: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  github?: string;
  website?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
  description?: string;
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface SkillCategory {
  id?: string;
  category: string;
  items: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  tech: string;
  url: string;
  bullets: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: string; // e.g. Native, Fluent, Professional, Conversational
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
}

export type TemplateId =
  | "fresher"
  | "experienced"
  | "hybrid"
  | "basic"
  | "balanced"
  | "original";

export interface ResumeTheme {
  template: TemplateId;
  primaryColor: string;
  accentColor?: string;
  fontFamily: "Inter" | "Playfair Display" | "Roboto" | "Outfit" | "Merriweather" | string;
  fontSize: "compact" | "normal" | "large";
  layoutDensity: "compact" | "normal" | "spacious";
  atsModeActive: boolean;
  accentStyle?: "bold" | "subtle" | "clean";
  headerStyle?: "centered" | "left-aligned" | "two-column";
  sectionDividers?: "bottom-border" | "pill-tags" | "bold-uppercase" | "minimal-space";
  sectionOrder?: string[];
  spacingDensity?: "compact" | "normal" | "spacious";
  margin?: "0.5in" | "0.75in" | "1.0in" | string;
}

export interface BuilderResumeData {
  contact: ContactInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  projects: ProjectItem[];
  certifications?: CertificationItem[];
  languages?: LanguageItem[];
  achievements?: AchievementItem[];
  theme: ResumeTheme;
}
