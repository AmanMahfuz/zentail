import {
  BuilderResumeData,
  TemplateId,
  ResumeTheme,
  SkillCategory,
  ExperienceItem,
  EducationItem,
  ProjectItem,
} from "@/types/resume-builder";
import { getAtsBlueprint, ATS_BLUEPRINT_RULES } from "@/config/ats-templates";

export interface ProfileAnalysisResult {
  careerStage: "entry-level" | "experienced" | "hybrid";
  bestBlueprintId: "fresher" | "experienced" | "hybrid";
  blueprintName: string;
  rationale: string;
  confidence: number;
  yearsOfExperience: number;
  identifiedTraits: string[];
}

const uid = () => Math.random().toString(36).slice(2, 9);

/**
 * Analyzes resume content to determine candidate profile and optimal ATS blueprint
 */
export function analyzeCandidateProfile(content: any): ProfileAnalysisResult {
  const experiences: any[] = Array.isArray(content?.experience) ? content.experience : [];
  const skills: any[] = Array.isArray(content?.skills) ? content.skills : [];
  const education: any[] = Array.isArray(content?.education) ? content.education : [];
  const summary: string = content?.summary || "";

  // 1. Calculate estimated years of experience
  let totalMonths = 0;
  const currentYear = new Date().getFullYear();

  for (const exp of experiences) {
    const startStr = exp.startDate || exp.start_date || "";
    const endStr = exp.endDate || exp.end_date || "";
    const isCurrent = exp.current || exp.isCurrent || exp.currentlyWorking || false;

    const startYearMatch = startStr.match(/\b(19|20)\d{2}\b/);
    const endYearMatch = endStr.match(/\b(19|20)\d{2}\b/);

    const sYear = startYearMatch ? parseInt(startYearMatch[0], 10) : null;
    const eYear = isCurrent ? currentYear : endYearMatch ? parseInt(endYearMatch[0], 10) : sYear;

    if (sYear && eYear && eYear >= sYear) {
      const diffYears = eYear - sYear;
      totalMonths += Math.max(diffYears * 12, 6);
    } else {
      totalMonths += 6; // Default fallback per experience entry
    }
  }

  const estimatedYears = Number((totalMonths / 12).toFixed(1));

  // 2. Detect Cross-Functional (Hybrid) traits: Design + Development, Product + Code, etc.
  const allText = [
    summary,
    ...skills.map((s) => (typeof s === "string" ? s : `${s.name || s.category || ""} ${s.items || ""}`)),
    ...experiences.map((e) => `${e.title || e.jobTitle || ""} ${e.description || ""} ${(e.bullets || []).join(" ")}`),
  ]
    .join(" ")
    .toLowerCase();

  const hasDesign =
    allText.includes("figma") ||
    allText.includes("ui/ux") ||
    allText.includes("wireframe") ||
    allText.includes("graphic design") ||
    allText.includes("product design") ||
    allText.includes("brand");

  const hasDev =
    allText.includes("react") ||
    allText.includes("python") ||
    allText.includes("javascript") ||
    allText.includes("full-stack") ||
    allText.includes("frontend") ||
    allText.includes("backend") ||
    allText.includes("api");

  const hasHybridSuperpower = hasDesign && hasDev;

  const identifiedTraits: string[] = [];
  if (estimatedYears >= 3) identifiedTraits.push(`${estimatedYears}+ years commercial tech experience`);
  if (hasDesign) identifiedTraits.push("Visual & UI/UX product capabilities");
  if (hasDev) identifiedTraits.push("Full-stack engineering & code architectures");
  if (education.length > 0) identifiedTraits.push("Formal academic degree qualifications");

  // 3. Match to best blueprint
  if (hasHybridSuperpower) {
    return {
      careerStage: "hybrid",
      bestBlueprintId: "hybrid",
      blueprintName: "The Career Pivot / Hybrid (Tech + Design)",
      rationale:
        "Detected dual competencies in UI/UX design and frontend engineering. The Hybrid Blueprint (0.75\" margins, Core Competencies synergy) harmonizes visual and technical skills into a single-column flow that ATS parsers parse with 100% precision.",
      confidence: 96,
      yearsOfExperience: estimatedYears,
      identifiedTraits,
    };
  }

  if (estimatedYears >= 3 || (experiences.length >= 2 && estimatedYears >= 2)) {
    return {
      careerStage: "experienced",
      bestBlueprintId: "experienced",
      blueprintName: "The Experienced / Full-Stack Developer",
      rationale:
        `Detected ${estimatedYears >= 3 ? `${estimatedYears}+ years` : "established"} commercial tech experience. The Experienced Blueprint (0.5" margins, compact 1.0 leading, high-density technical stack) maximizes space for quantifiable business impact.`,
      confidence: 98,
      yearsOfExperience: estimatedYears,
      identifiedTraits,
    };
  }

  // Default to Fresher / Entry-Level
  return {
    careerStage: "entry-level",
    bestBlueprintId: "fresher",
    blueprintName: "The Fresher / Entry-Level",
    rationale:
      "Detected early-career profile or graduate background. The Fresher Blueprint (1.0\" margins, Education & Skills First) emphasizes degrees, academic coursework, and verified projects with balanced ATS white space.",
    confidence: 94,
    yearsOfExperience: estimatedYears,
    identifiedTraits,
  };
}

/**
 * Converts any raw or extracted resume into the optimal ATS blueprint
 */
export function convertResumeToAtsBlueprint(
  rawContent: any,
  targetBlueprintId?: TemplateId
): BuilderResumeData {
  const analysis = analyzeCandidateProfile(rawContent);
  const blueprintId: TemplateId = targetBlueprintId || analysis.bestBlueprintId;
  const blueprintConfig = getAtsBlueprint(blueprintId);

  // 1. Resolve Contact Info
  const personal =
    rawContent?.personal ||
    rawContent?.contact ||
    rawContent?.personalInfo ||
    {};

  const contact = {
    name:
      personal.fullName ||
      personal.name ||
      rawContent?.fullName ||
      rawContent?.name ||
      "Candidate Name",
    title:
      personal.title ||
      personal.jobTitle ||
      rawContent?.title ||
      (blueprintId === "fresher"
        ? "Entry-Level Software Developer"
        : blueprintId === "hybrid"
        ? "Creative Technologist (UI/UX + Frontend)"
        : "Senior Full-Stack Developer"),
    email: personal.email || rawContent?.email || "",
    phone: personal.phone || rawContent?.phone || "",
    location: personal.location || rawContent?.location || "",
    linkedin: personal.linkedinUrl || personal.linkedin || rawContent?.linkedin || "",
    portfolio: personal.portfolioUrl || personal.portfolio || personal.website || rawContent?.portfolio || "",
    github: personal.githubUrl || personal.github || rawContent?.github || "",
  };

  // 2. Summary
  let summary = rawContent?.summary || "";
  if (!summary && blueprintConfig) {
    summary = blueprintConfig.sampleData.summary;
  }

  // 3. Education
  const rawEdu = Array.isArray(rawContent?.education) ? rawContent.education : [];
  const education: EducationItem[] = rawEdu.map((edu: any, i: number) => ({
    id: edu.id || `edu-${i}-${uid()}`,
    school: edu.institution || edu.school || edu.university || "University",
    degree: edu.degree || "Bachelor of Science",
    field: edu.fieldOfStudy || edu.field || edu.specialization || "Computer Science",
    startDate: String(edu.startYear || edu.startDate || ""),
    endDate: String(edu.endYear || edu.endDate || edu.graduationYear || ""),
    gpa: edu.grade || edu.gpa || undefined,
  }));

  // 4. Skills Categorization
  const rawSkills = Array.isArray(rawContent?.skills) ? rawContent.skills : [];
  let skills: SkillCategory[] = [];

  if (rawSkills.length > 0) {
    // If skills are already categorized objects
    if (typeof rawSkills[0] === "object" && rawSkills[0].category && rawSkills[0].items) {
      skills = rawSkills.map((s: any) => ({
        id: s.id || uid(),
        category: s.category,
        items: s.items,
      }));
    } else {
      // Group flat skills by type
      const techSkills: string[] = [];
      const toolSkills: string[] = [];
      const designSkills: string[] = [];

      rawSkills.forEach((s: any) => {
        const skillName = typeof s === "string" ? s : s.name || s.skill || "";
        if (!skillName) return;
        const low = skillName.toLowerCase();
        if (low.includes("figma") || low.includes("adobe") || low.includes("ui") || low.includes("design")) {
          designSkills.push(skillName);
        } else if (low.includes("git") || low.includes("docker") || low.includes("supabase") || low.includes("aws") || low.includes("vercel")) {
          toolSkills.push(skillName);
        } else {
          techSkills.push(skillName);
        }
      });

      if (blueprintId === "hybrid") {
        if (designSkills.length > 0) skills.push({ id: uid(), category: "UI/UX & Design Systems", items: designSkills.join(", ") });
        if (techSkills.length > 0) skills.push({ id: uid(), category: "Frontend Engineering", items: techSkills.join(", ") });
        if (toolSkills.length > 0) skills.push({ id: uid(), category: "Tools & Infrastructure", items: toolSkills.join(", ") });
      } else if (blueprintId === "fresher") {
        if (techSkills.length > 0) skills.push({ id: uid(), category: "Languages & Frameworks", items: techSkills.join(", ") });
        if (toolSkills.length > 0) skills.push({ id: uid(), category: "Developer Tools", items: toolSkills.join(", ") });
      } else {
        if (techSkills.length > 0) skills.push({ id: uid(), category: "Frontend & Backend", items: techSkills.join(", ") });
        if (toolSkills.length > 0) skills.push({ id: uid(), category: "Cloud & DevOps", items: toolSkills.join(", ") });
      }
    }
  }

  if (skills.length === 0 && blueprintConfig) {
    skills = blueprintConfig.sampleData.skills;
  }

  // 5. Experience
  const rawExp = Array.isArray(rawContent?.experience) ? rawContent.experience : [];
  const experience: ExperienceItem[] = rawExp.map((exp: any, i: number) => {
    let bullets: string[] = Array.isArray(exp.bullets) ? exp.bullets : [];
    if (bullets.length === 0 && exp.description) {
      bullets = exp.description
        .split(/\n|\. /)
        .map((b: string) => b.trim())
        .filter((b: string) => b.length > 10);
    }
    // Clean bullet formatting (no checkmarks, no emojis)
    bullets = bullets.map((b) => b.replace(/^[-*•✔]\s*/, "").trim());

    return {
      id: exp.id || `exp-${i}-${uid()}`,
      company: exp.company || exp.company_name || "Company",
      title: exp.jobTitle || exp.title || "Software Developer",
      location: exp.location || "",
      startDate: String(exp.startDate || exp.start_date || ""),
      endDate: String(exp.endDate || exp.end_date || (exp.isCurrent ? "Present" : "")),
      current: Boolean(exp.isCurrent || exp.currentlyWorking || exp.current),
      bullets: bullets.length > 0 ? bullets : ["Delivered core feature capabilities and system enhancements."],
    };
  });

  // 6. Projects
  const rawProj = Array.isArray(rawContent?.projects) ? rawContent.projects : [];
  const projects: ProjectItem[] = rawProj.map((proj: any, i: number) => {
    let bullets: string[] = Array.isArray(proj.bullets) ? proj.bullets : [];
    if (bullets.length === 0 && proj.description) {
      bullets = proj.description
        .split(/\n|\. /)
        .map((b: string) => b.trim())
        .filter((b: string) => b.length > 10);
    }
    bullets = bullets.map((b) => b.replace(/^[-*•✔]\s*/, "").trim());

    return {
      id: proj.id || `proj-${i}-${uid()}`,
      name: proj.title || proj.name || "Project",
      tech: Array.isArray(proj.techStack) ? proj.techStack.join(", ") : proj.tech || "",
      url: proj.url || proj.githubUrl || "",
      bullets: bullets.length > 0 ? bullets : ["Engineered responsive application architecture."],
    };
  });

  // 7. Certifications
  const rawCerts = Array.isArray(rawContent?.certifications) ? rawContent.certifications : [];
  const certifications = rawCerts.map((c: any, i: number) => ({
    id: c.id || `cert-${i}-${uid()}`,
    name: c.name || "Certification",
    issuer: c.issuer || "",
    date: String(c.date || c.dateObtained || ""),
    url: c.credentialUrl || "",
  }));

  // 8. Theme configured to strict ATS Blueprint
  const marginStr =
    blueprintId === "experienced"
      ? "0.5in"
      : blueprintId === "hybrid"
      ? "0.75in"
      : "1.0in";

  const spacingDensity =
    blueprintId === "experienced"
      ? "compact"
      : blueprintId === "fresher"
      ? "spacious"
      : "normal";

  const theme: ResumeTheme = {
    template: blueprintId,
    primaryColor: "#0f172a",
    fontFamily: blueprintId === "experienced" ? "Calibri" : blueprintId === "fresher" ? "Arial" : "Inter",
    fontSize: blueprintId === "experienced" ? "compact" : "normal",
    layoutDensity: spacingDensity,
    atsModeActive: true,
    spacingDensity,
    margin: marginStr,
    sectionOrder: blueprintConfig?.sectionOrder || ["summary", "skills", "experience", "projects", "education"],
  };

  return {
    contact,
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
    languages: rawContent?.languages || [],
    achievements: rawContent?.achievements || [],
    theme,
  };
}
