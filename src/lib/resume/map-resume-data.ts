import {
  BuilderResumeData,
  ResumeTheme,
  ExperienceItem,
  EducationItem,
  SkillCategory,
  ProjectItem,
} from "@/types/resume-builder";
import { categorizeSkills } from "./skills-categorizer";

const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_THEME: ResumeTheme = {
  template: "basic",
  primaryColor: "#0f172a",
  fontFamily: "Inter",
  fontSize: "normal",
  layoutDensity: "normal",
  atsModeActive: false,
};

export function parseMarkdownToBuilderResumeData(markdown: string): Partial<BuilderResumeData> {
  if (!markdown || typeof markdown !== "string") return {};

  const lines = markdown.split("\n");
  let currentSection = "";
  let name = "";
  let contactLine = "";
  let summary = "";
  const skills: SkillCategory[] = [];
  const experience: ExperienceItem[] = [];
  const projects: ProjectItem[] = [];
  const education: EducationItem[] = [];

  let currentExp: Partial<ExperienceItem> | null = null;
  let currentProj: Partial<ProjectItem> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    // Heading 1: Name
    if (line.startsWith("# ")) {
      name = line.replace(/^#\s*/, "").trim();
      continue;
    }

    // Heading 2: Section
    if (line.startsWith("## ")) {
      // Flush any pending items
      if (currentExp && (currentExp.company || currentExp.title)) {
        experience.push({
          id: uid(),
          company: currentExp.company || "",
          title: currentExp.title || "Role",
          startDate: currentExp.startDate || "",
          endDate: currentExp.endDate || "",
          current: !!currentExp.current,
          bullets: currentExp.bullets || [],
          description: currentExp.description || "",
        });
        currentExp = null;
      }
      if (currentProj && currentProj.name) {
        projects.push({
          id: uid(),
          name: currentProj.name || "Project",
          tech: currentProj.tech || "",
          url: currentProj.url || "",
          bullets: currentProj.bullets || [],
        });
        currentProj = null;
      }

      currentSection = line.replace(/^##\s*/, "").toLowerCase();
      continue;
    }

    // Check if line is the contact info (under # Name, before any ##)
    if (!currentSection && (line.includes("@") || line.includes("|") || line.includes("github") || line.includes("linkedin"))) {
      contactLine = line;
      continue;
    }

    // Inside Summary
    if (currentSection.includes("summary") || currentSection.includes("profile") || currentSection.includes("about")) {
      summary += (summary ? " " : "") + line;
      continue;
    }

    // Inside Skills
    if (currentSection.includes("skill")) {
      const cleanLine = line.replace(/^[-•*]\s*/, "");
      const colonIdx = cleanLine.indexOf(":");
      if (colonIdx !== -1) {
        const cat = cleanLine.slice(0, colonIdx).trim();
        const itms = cleanLine.slice(colonIdx + 1).trim();
        if (cat && itms) {
          skills.push({
            id: uid(),
            category: cat,
            items: itms,
          });
        }
      } else {
        const existingCore = skills.find(s => s.category === "Core Skills");
        if (existingCore) {
          existingCore.items += ", " + cleanLine;
        } else {
          skills.push({
            id: uid(),
            category: "Core Skills",
            items: cleanLine,
          });
        }
      }
      continue;
    }

    // Inside Experience
    if (currentSection.includes("experience") || currentSection.includes("employment") || currentSection.includes("work")) {
      if (line.startsWith("### ")) {
        if (currentExp && (currentExp.company || currentExp.title)) {
          experience.push({
            id: uid(),
            company: currentExp.company || "",
            title: currentExp.title || "Role",
            startDate: currentExp.startDate || "",
            endDate: currentExp.endDate || "",
            current: !!currentExp.current,
            bullets: currentExp.bullets || [],
            description: currentExp.description || "",
          });
        }

        const expHeader = line.replace(/^###\s*/, "").trim();
        let title = expHeader;
        let company = "";
        let dates = "";
        let isCurrent = false;

        const dateMatch = expHeader.match(/\((.*?)\)|\|(.*?)$/);
        if (dateMatch) {
          dates = (dateMatch[1] || dateMatch[2] || "").trim();
          if (dates.toLowerCase().includes("present")) isCurrent = true;
          title = expHeader.replace(dateMatch[0], "").trim();
        }

        if (title.includes("—") || title.includes("-") || title.includes("|") || title.includes(" at ")) {
          const parts = title.split(/[—\-|]| at /);
          title = (parts[0] || "").trim();
          company = (parts[1] || "").trim();
        }

        currentExp = {
          title,
          company,
          startDate: dates.split(/[-–]/)[0]?.trim() || "",
          endDate: isCurrent ? "Present" : dates.split(/[-–]/)[1]?.trim() || "",
          current: isCurrent,
          bullets: [],
        };
      } else if (line.startsWith("- ") || line.startsWith("• ") || line.startsWith("* ")) {
        const bullet = line.replace(/^[-•*]\s*/, "").trim();
        if (currentExp) {
          currentExp.bullets = currentExp.bullets || [];
          currentExp.bullets.push(bullet);
        }
      } else if (currentExp) {
        currentExp.description = (currentExp.description ? currentExp.description + " " : "") + line;
      }
      continue;
    }

    // Inside Projects
    if (currentSection.includes("project")) {
      if (line.startsWith("### ")) {
        if (currentProj && currentProj.name) {
          projects.push({
            id: uid(),
            name: currentProj.name,
            tech: currentProj.tech || "",
            url: currentProj.url || "",
            bullets: currentProj.bullets || [],
          });
        }

        const projHeader = line.replace(/^###\s*/, "").trim();
        let projName = projHeader;
        let tech = "";
        let url = "";

        const techMatch = projHeader.match(/\((.*?)\)/);
        if (techMatch) {
          tech = techMatch[1].trim();
          projName = projHeader.replace(techMatch[0], "").trim();
        }
        if (projName.includes("—") || projName.includes("|")) {
          const parts = projName.split(/[—|]/);
          projName = parts[0].trim();
          if (parts[1] && (parts[1].includes("http") || parts[1].includes("github"))) {
            url = parts[1].trim();
          } else if (parts[1]) {
            tech = parts[1].trim();
          }
        }

        currentProj = {
          name: projName,
          tech,
          url,
          bullets: [],
        };
      } else if (line.startsWith("- ") || line.startsWith("• ") || line.startsWith("* ")) {
        const bullet = line.replace(/^[-•*]\s*/, "").trim();
        if (currentProj) {
          currentProj.bullets = currentProj.bullets || [];
          currentProj.bullets.push(bullet);
        }
      }
      continue;
    }

    // Inside Education
    if (currentSection.includes("education")) {
      const cleanEdu = line.replace(/^[-•*]\s*/, "").replace(/^###\s*/, "").trim();
      let degree = cleanEdu;
      let school = "";
      let endYear = "";

      const yrMatch = cleanEdu.match(/\((.*?)\)|(\b20\d\d\b)/);
      if (yrMatch) {
        endYear = (yrMatch[1] || yrMatch[2] || "").trim();
        degree = cleanEdu.replace(yrMatch[0], "").trim();
      }

      if (degree.includes(",") || degree.includes("—") || degree.includes(" from ")) {
        const parts = degree.split(/[,—]| from /);
        degree = (parts[0] || "").replace(/\*\*/g, "").trim();
        school = (parts[1] || "").trim();
      }

      education.push({
        id: uid(),
        school,
        degree,
        field: "",
        startDate: "",
        endDate: endYear,
      });
    }
  }

  // Flush remaining
  if (currentExp && (currentExp.company || currentExp.title)) {
    experience.push({
      id: uid(),
      company: currentExp.company || "",
      title: currentExp.title || "Role",
      startDate: currentExp.startDate || "",
      endDate: currentExp.endDate || "",
      current: !!currentExp.current,
      bullets: currentExp.bullets || [],
      description: currentExp.description || "",
    });
  }
  if (currentProj && currentProj.name) {
    projects.push({
      id: uid(),
      name: currentProj.name,
      tech: currentProj.tech || "",
      url: currentProj.url || "",
      bullets: currentProj.bullets || [],
    });
  }

  // Parse contact line if available
  let email = "";
  let phone = "";
  let location = "";
  let linkedin = "";
  let github = "";

  if (contactLine) {
    const parts = contactLine.split("|").map(s => s.trim());
    for (const part of parts) {
      if (part.includes("@")) {
        email = part;
      } else if (part.toLowerCase().includes("linkedin")) {
        linkedin = part;
      } else if (part.toLowerCase().includes("github")) {
        github = part;
      } else if (/(?:\+?\d[\d\s-]{6,}\d)/.test(part)) {
        phone = part;
      } else if (!location && part.length > 2) {
        location = part;
      }
    }
  }

  return {
    contact: {
      name,
      email,
      phone,
      location,
      linkedin,
      portfolio: "",
      github,
    },
    summary,
    skills,
    experience,
    projects,
    education,
  };
}

export function mapToBuilderResumeData({
  versionContent,
  themeConfig,
  userEvidence,
  userMetadata,
  userEmail,
}: {
  versionContent?: any;
  themeConfig?: any;
  userEvidence?: any;
  userMetadata?: any;
  userEmail?: string;
}): BuilderResumeData {
  const content = versionContent || {};

  // 1. Resolve Contact Info
  const personal = content.personal || content.contact || content.personalInfo || {};
  const evidencePersonal = userEvidence || {};

  let name =
    personal.fullName ||
    personal.name ||
    content.fullName ||
    content.name ||
    evidencePersonal.full_name ||
    userMetadata?.full_name ||
    userMetadata?.name ||
    (userEmail ? userEmail.split("@")[0] : "");

  let email =
    personal.email ||
    content.email ||
    evidencePersonal.email ||
    userEmail ||
    "";

  let phone =
    personal.phone ||
    content.phone ||
    evidencePersonal.phone ||
    "";

  let rawLocation =
    personal.location ||
    content.location ||
    evidencePersonal.location ||
    "";

  // Clean location: don't render placeholder "Remote" as a fake geographic address
  let location = rawLocation.trim();
  if (
    location.toLowerCase() === "remote" ||
    location.toLowerCase() === "remote (us / global)" ||
    location.toLowerCase() === "remote (global)" ||
    location.toLowerCase() === "remote (us)"
  ) {
    location = "";
  }

  let linkedin =
    personal.linkedinUrl ||
    personal.linkedin ||
    content.linkedin ||
    content.linkedinUrl ||
    evidencePersonal.linkedin_url ||
    "";

  let portfolio =
    personal.portfolioUrl ||
    personal.portfolio ||
    personal.website ||
    content.portfolio ||
    content.portfolioUrl ||
    evidencePersonal.portfolio_url ||
    "";

  let github =
    personal.githubUrl ||
    personal.github ||
    content.github ||
    content.githubUrl ||
    evidencePersonal.github_url ||
    "";

  // 2. Summary
  let summary =
    content.summary ||
    evidencePersonal.summary ||
    personal.summary ||
    "";

  // Helper to dedup and clean bullets from description / bullet lists
  const extractCleanBullets = (item: any): string[] => {
    const rawBullets = Array.isArray(item.bullets) ? item.bullets.filter(Boolean) : [];
    const desc = (item.description || "").trim();
    let combined = [...rawBullets];
    if (combined.length === 0 && desc) {
      combined = desc.split("\n").map((l: string) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
    }
    // Dedup identical lines
    const deduped: string[] = [];
    for (const b of combined) {
      const cleanB = b.trim();
      if (cleanB && !deduped.some(existing => existing.toLowerCase() === cleanB.toLowerCase())) {
        deduped.push(cleanB);
      }
    }
    return deduped;
  };

  // 3. Experience
  let experience: ExperienceItem[] = [];
  const rawExperienceList = (Array.isArray(content.experience) && content.experience.length > 0)
    ? content.experience
    : (Array.isArray(userEvidence?.evidence_experience) && userEvidence.evidence_experience.length > 0)
    ? userEvidence.evidence_experience
    : [];

  experience = rawExperienceList
    .filter((e: any) => (e.title || e.jobTitle || e.job_title || e.company))
    .map((e: any) => {
      const bullets = extractCleanBullets(e);
      return {
        id: e.id || uid(),
        company: e.company || "",
        title: e.title || e.jobTitle || e.job_title || e.position || "",
        location: (e.location && e.location.toLowerCase() !== "remote") ? e.location : "",
        startDate: e.startDate || e.start_date || "",
        endDate: e.endDate || e.end_date || "",
        current: !!(e.current || e.isCurrent || e.is_current),
        bullets,
        description: bullets.length === 1 ? bullets[0] : (e.description || bullets.join("\n")),
      };
    });

  const title =
    personal.title ||
    personal.jobTitle ||
    content.target_job_title ||
    content.targetRole ||
    content.jobTitle ||
    content.title ||
    (experience[0]?.title || "Full-Stack Developer");

  // 4. Education
  let education: EducationItem[] = [];
  if (Array.isArray(content.education) && content.education.length > 0) {
    education = content.education.map((ed: any) => ({
      id: ed.id || uid(),
      school: ed.school || ed.institution || ed.university || ed.college || "",
      degree: ed.degree || "",
      field: ed.field || ed.fieldOfStudy || ed.specialization || ed.major || "",
      startDate: ed.startDate ? String(ed.startDate) : ed.startYear ? String(ed.startYear) : "",
      endDate: ed.endDate ? String(ed.endDate) : ed.endYear ? String(ed.endYear) : ed.isCurrent ? "Present" : "",
      gpa: ed.gpa || ed.grade || "",
    }));
  } else if (Array.isArray(userEvidence?.evidence_education) && userEvidence.evidence_education.length > 0) {
    education = userEvidence.evidence_education.map((ed: any) => ({
      id: ed.id || uid(),
      school: ed.institution || "",
      degree: ed.degree || "",
      field: ed.field_of_study || "",
      startDate: ed.start_year ? String(ed.start_year) : "",
      endDate: ed.end_year ? String(ed.end_year) : "",
      gpa: ed.grade || "",
    }));
  }

  // 5. Skills - properly categorized into Languages, Frameworks, Backend, Databases, Tools
  const rawSkillsList = Array.isArray(content.skills) && content.skills.length > 0
    ? content.skills
    : Array.isArray(userEvidence?.evidence_skills) && userEvidence.evidence_skills.length > 0
    ? userEvidence.evidence_skills
    : [];

  let skills: SkillCategory[] = categorizeSkills(rawSkillsList);

  // 6. Projects
  let projects: ProjectItem[] = [];
  const rawProjectsList = Array.isArray(content.projects) && content.projects.length > 0
    ? content.projects
    : Array.isArray(userEvidence?.evidence_projects) && userEvidence.evidence_projects.length > 0
    ? userEvidence.evidence_projects
    : [];

  projects = rawProjectsList
    .filter((p: any) => (p.name || p.title))
    .map((p: any) => {
      const bullets = extractCleanBullets(p);
      return {
        id: p.id || uid(),
        name: p.name || p.title || "",
        tech: p.tech || (Array.isArray(p.techStack) ? p.techStack.join(", ") : p.techStack) || (Array.isArray(p.tech_stack) ? p.tech_stack.join(", ") : p.tech_stack) || "",
        url: p.url || p.githubUrl || p.github_url || p.liveUrl || "",
        bullets,
      };
    });

  // 7. Certifications, Languages, Achievements
  const certifications = Array.isArray(content.certifications)
    ? content.certifications.map((c: any) => ({
        id: c.id || uid(),
        name: c.name || "",
        issuer: c.issuer || c.organization || "",
        date: c.date || c.dateObtained || "",
      }))
    : [];

  const languages = Array.isArray(content.languages)
    ? content.languages.map((l: any) => ({
        id: l.id || uid(),
        name: l.name || "",
        proficiency: l.proficiency || "Fluent",
      }))
    : [];

  const achievements = Array.isArray(content.achievements)
    ? content.achievements.map((a: any) => ({
        id: a.id || uid(),
        title: a.title || "",
        description: a.description || "",
      }))
    : [];

  // Fallback: If sections are missing but raw markdown exists (e.g. from AI tailoring or markdown upload)
  const rawMarkdown =
    (typeof versionContent === "string" ? versionContent : "") ||
    content.markdown ||
    content.raw_markdown ||
    (typeof content.content === "string" ? content.content : "") ||
    content.rawText ||
    content.text ||
    "";

  if (rawMarkdown && (experience.length === 0 || skills.length === 0 || education.length === 0 || projects.length === 0)) {
    const parsed = parseMarkdownToBuilderResumeData(rawMarkdown);
    if (experience.length === 0 && parsed.experience && parsed.experience.length > 0) {
      experience = parsed.experience;
    }
    if (skills.length === 0 && parsed.skills && parsed.skills.length > 0) {
      skills = parsed.skills;
    }
    if (education.length === 0 && parsed.education && parsed.education.length > 0) {
      education = parsed.education;
    }
    if (projects.length === 0 && parsed.projects && parsed.projects.length > 0) {
      projects = parsed.projects;
    }
    if (!summary && parsed.summary) {
      summary = parsed.summary;
    }
    if (!name && parsed.contact?.name) {
      name = parsed.contact.name;
    }
    if (!email && parsed.contact?.email) {
      email = parsed.contact.email;
    }
    if (!phone && parsed.contact?.phone) {
      phone = parsed.contact.phone;
    }
    if (!location && parsed.contact?.location) {
      location = parsed.contact.location;
    }
    if (!linkedin && parsed.contact?.linkedin) {
      linkedin = parsed.contact.linkedin;
    }
    if (!github && parsed.contact?.github) {
      github = parsed.contact.github;
    }
  }

  // 8. Theme
  const mergedThemeConfig = themeConfig || content.theme || {};
  const isOriginal =
    mergedThemeConfig.template === "original" ||
    !!mergedThemeConfig.headerStyle ||
    !!mergedThemeConfig.sectionDividers ||
    !!mergedThemeConfig.sectionOrder;

  const theme: ResumeTheme = {
    ...DEFAULT_THEME,
    template: isOriginal ? "original" : (mergedThemeConfig.template || DEFAULT_THEME.template),
    ...mergedThemeConfig,
  };

  return {
    contact: {
      name:
        name ||
        userMetadata?.full_name ||
        userMetadata?.name ||
        (userEmail ? userEmail.split("@")[0] : "") ||
        "Candidate",
      title: title || "Full-Stack Developer",
      email: email || "",
      phone: phone || "",
      location: location || "",
      linkedin: linkedin || "",
      portfolio: portfolio || "",
      github: github || "",
    },
    summary: summary || "",
    experience: experience.length > 0 ? experience : [],
    education: education.length > 0 ? education : [],
    skills: skills.length > 0 ? skills : [{ id: uid(), category: "Core Skills", items: "" }],
    projects: projects.length > 0 ? projects : [],
    certifications,
    languages,
    achievements,
    theme,
  };
}

export function canonicalizeResumeData(data: BuilderResumeData): any {
  return {
    ...data,
    contact: {
      name: data.contact?.name || "",
      title: data.contact?.title || "",
      email: data.contact?.email || "",
      phone: data.contact?.phone || "",
      location: data.contact?.location || "",
      linkedin: data.contact?.linkedin || "",
      portfolio: data.contact?.portfolio || "",
      github: data.contact?.github || "",
      website: data.contact?.website || data.contact?.portfolio || "",
    },
    personal: {
      fullName: data.contact?.name || "",
      jobTitle: data.contact?.title || "",
      email: data.contact?.email || "",
      phone: data.contact?.phone || "",
      location: data.contact?.location || "",
      linkedinUrl: data.contact?.linkedin || "",
      githubUrl: data.contact?.github || "",
      portfolioUrl: data.contact?.portfolio || "",
    },
    summary: data.summary || "",
    experience: (data.experience || []).map((exp) => ({
      ...exp,
      jobTitle: exp.title || "",
      title: exp.title || "",
      isCurrent: exp.current,
      current: exp.current,
      bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
    })),
    education: (data.education || []).map((edu) => ({
      ...edu,
      institution: edu.school || "",
      school: edu.school || "",
      fieldOfStudy: edu.field || "",
      field: edu.field || "",
      startYear: edu.startDate || "",
      startDate: edu.startDate || "",
      endYear: edu.endDate || "",
      endDate: edu.endDate || "",
      grade: edu.gpa || "",
      gpa: edu.gpa || "",
    })),
    projects: (data.projects || []).map((proj) => ({
      ...proj,
      title: proj.name || "",
      name: proj.name || "",
      techStack: typeof proj.tech === "string" ? proj.tech.split(",").map((s) => s.trim()).filter(Boolean) : (proj.tech || []),
      tech: proj.tech || "",
      githubUrl: proj.url || "",
      url: proj.url || "",
      bullets: Array.isArray(proj.bullets) ? proj.bullets : [],
    })),
    skills: data.skills || [],
    certifications: data.certifications || [],
    languages: data.languages || [],
    achievements: data.achievements || [],
    theme: data.theme,
  };
}

export function formatProfileToMarkdown(profile: any, role?: string): string {
  if (!profile) return "";
  if (typeof profile === "string") return profile;
  if (profile.markdown && typeof profile.markdown === "string") return profile.markdown;

  const lines: string[] = [];
  const p = profile.personal || profile.contact || profile.personalInfo || {};
  const name = p.fullName || p.name || profile.fullName || profile.name || "Candidate";
  lines.push(`# ${name}`);

  const contacts = [
    p.email || profile.email,
    p.phone || profile.phone,
    p.location || profile.location,
    p.linkedin || p.linkedinUrl || profile.linkedin,
    p.github || p.githubUrl || profile.github,
    p.portfolio || p.portfolioUrl || profile.portfolio,
  ].filter(Boolean);

  if (contacts.length > 0) lines.push(contacts.join(" | "));
  lines.push("");

  const summary = profile.summary || p.summary;
  if (summary) {
    lines.push(`## Professional Summary`);
    lines.push(summary);
    lines.push("");
  }

  const rawSkills = profile.skills || [];
  if (Array.isArray(rawSkills) && rawSkills.length > 0) {
    lines.push(`## Technical Skills`);
    const skillList = rawSkills
      .map((s: any) => {
        if (typeof s === "string") return s;
        if (s?.name) return s.name;
        if (s?.category && Array.isArray(s.items)) return `${s.category}: ${s.items.join(", ")}`;
        return null;
      })
      .filter(Boolean)
      .join(", ");
    if (skillList) lines.push(skillList);
    lines.push("");
  }

  const experience = profile.experience || [];
  if (Array.isArray(experience) && experience.length > 0) {
    lines.push(`## Work Experience`);
    experience.forEach((exp: any) => {
      const title = exp.jobTitle || exp.title || "Role";
      const comp = exp.company || "Company";
      const dates = [exp.startDate, exp.isCurrent ? "Present" : exp.endDate].filter(Boolean).join(" - ");
      lines.push(`### ${title} — ${comp} ${dates ? `(${dates})` : ""}`);
      if (exp.description) lines.push(exp.description);
      if (Array.isArray(exp.bullets)) {
        exp.bullets.forEach((b: string) => lines.push(`- ${b}`));
      }
      lines.push("");
    });
  }

  const projects = profile.projects || [];
  if (Array.isArray(projects) && projects.length > 0) {
    lines.push(`## Key Projects`);
    projects.forEach((proj: any) => {
      lines.push(`### ${proj.title || proj.name || "Project"}`);
      if (proj.description) lines.push(proj.description);
      if (Array.isArray(proj.bullets)) {
        proj.bullets.forEach((b: string) => lines.push(`- ${b}`));
      }
      lines.push("");
    });
  }

  const education = profile.education || [];
  if (Array.isArray(education) && education.length > 0) {
    lines.push(`## Education`);
    education.forEach((edu: any) => {
      const deg = edu.degree || "Degree";
      const inst = edu.institution || edu.school || "Institution";
      const yr = edu.endYear || edu.year || edu.endDate || "";
      lines.push(`- **${deg}**, ${inst} ${yr ? `(${yr})` : ""}`);
    });
    lines.push("");
  }

  return lines.join("\n");
}

