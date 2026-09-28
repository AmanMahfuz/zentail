import {
  BuilderResumeData,
  ResumeTheme,
  ExperienceItem,
  EducationItem,
  SkillCategory,
  ProjectItem,
} from "@/types/resume-builder";

const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_THEME: ResumeTheme = {
  template: "basic",
  primaryColor: "#0f172a",
  fontFamily: "Inter",
  fontSize: "normal",
  layoutDensity: "normal",
  atsModeActive: false,
};

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

  const name =
    personal.fullName ||
    personal.name ||
    content.fullName ||
    content.name ||
    evidencePersonal.full_name ||
    userMetadata?.full_name ||
    userMetadata?.name ||
    (userEmail ? userEmail.split("@")[0] : "");

  const email =
    personal.email ||
    content.email ||
    evidencePersonal.email ||
    userEmail ||
    "";

  const phone =
    personal.phone ||
    content.phone ||
    evidencePersonal.phone ||
    "";

  const location =
    personal.location ||
    content.location ||
    evidencePersonal.location ||
    "";

  const linkedin =
    personal.linkedinUrl ||
    personal.linkedin ||
    content.linkedin ||
    content.linkedinUrl ||
    evidencePersonal.linkedin_url ||
    "";

  const portfolio =
    personal.portfolioUrl ||
    personal.portfolio ||
    personal.website ||
    content.portfolio ||
    content.portfolioUrl ||
    evidencePersonal.portfolio_url ||
    "";

  const github =
    personal.githubUrl ||
    personal.github ||
    content.github ||
    content.githubUrl ||
    evidencePersonal.github_url ||
    "";

  // 2. Summary
  const summary =
    content.summary ||
    evidencePersonal.summary ||
    personal.summary ||
    "";

  // 3. Experience
  let experience: ExperienceItem[] = [];
  if (Array.isArray(content.experience) && content.experience.length > 0) {
    experience = content.experience.map((e: any) => ({
      id: e.id || uid(),
      company: e.company || "",
      title: e.title || e.jobTitle || e.position || "",
      location: e.location || "",
      startDate: e.startDate || e.start_date || "",
      endDate: e.endDate || e.end_date || "",
      current: !!(e.current || e.isCurrent || e.is_current),
      bullets: Array.isArray(e.bullets)
        ? e.bullets
        : e.description
        ? [e.description]
        : [""],
      description: e.description || "",
    }));
  } else if (Array.isArray(userEvidence?.evidence_experience) && userEvidence.evidence_experience.length > 0) {
    experience = userEvidence.evidence_experience.map((e: any) => ({
      id: e.id || uid(),
      company: e.company || "",
      title: e.job_title || "",
      location: "",
      startDate: e.start_date || "",
      endDate: e.end_date || "",
      current: !!e.is_current,
      bullets: Array.isArray(e.bullets) && e.bullets.length > 0
        ? e.bullets
        : e.description
        ? [e.description]
        : [""],
      description: e.description || "",
    }));
  }

  const title =
    personal.title ||
    personal.jobTitle ||
    content.target_job_title ||
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

  // 5. Skills
  let skills: SkillCategory[] = [];
  if (Array.isArray(content.skills) && content.skills.length > 0) {
    // Check if it's already in the Builder shape: [{ category: string, items: string | string[] }]
    const hasCategoryAndItems = content.skills.some(
      (s: any) => typeof s === "object" && s && "category" in s && ("items" in s) && (typeof s.items === "string" || Array.isArray(s.items))
    );

    if (hasCategoryAndItems) {
      skills = content.skills.map((s: any) => ({
        id: s.id || uid(),
        category: s.category || "General",
        items: typeof s.items === "string" ? s.items : Array.isArray(s.items) ? s.items.join(", ") : "",
      }));
    } else {
      // Group by category from array of { name, category } or strings
      const categoryMap = new Map<string, string[]>();
      for (const s of content.skills) {
        if (!s) continue;
        const skillName = typeof s === "string" ? s.trim() : (s.name || s.skill || s.title || "").trim();
        if (!skillName) continue;
        const cat = (typeof s === "object" && s.category ? String(s.category).trim() : "Core Skills") || "Core Skills";
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, []);
        }
        categoryMap.get(cat)!.push(skillName);
      }

      if (categoryMap.size > 0) {
        skills = Array.from(categoryMap.entries()).map(([category, itemsList]) => ({
          id: uid(),
          category,
          items: itemsList.join(", "),
        }));
      }
    }
  } else if (Array.isArray(userEvidence?.evidence_skills) && userEvidence.evidence_skills.length > 0) {
    const map: Record<string, string[]> = {};
    for (const s of userEvidence.evidence_skills) {
      const cat = s.category || "Core Skills";
      if (!map[cat]) map[cat] = [];
      if (s.skill_name) map[cat].push(s.skill_name);
    }
    skills = Object.entries(map).map(([category, itemsList]) => ({
      id: uid(),
      category: category.charAt(0).toUpperCase() + category.slice(1),
      items: itemsList.join(", "),
    }));
  }

  // 6. Projects
  let projects: ProjectItem[] = [];
  if (Array.isArray(content.projects) && content.projects.length > 0) {
    projects = content.projects.map((p: any) => ({
      id: p.id || uid(),
      name: p.name || p.title || "",
      tech: p.tech || (Array.isArray(p.techStack) ? p.techStack.join(", ") : p.techStack) || (Array.isArray(p.tech_stack) ? p.tech_stack.join(", ") : p.tech_stack) || "",
      url: p.url || p.githubUrl || p.github_url || "",
      bullets: Array.isArray(p.bullets) ? p.bullets : p.description ? [p.description] : [""],
    }));
  } else if (Array.isArray(userEvidence?.evidence_projects) && userEvidence.evidence_projects.length > 0) {
    projects = userEvidence.evidence_projects.map((p: any) => ({
      id: p.id || uid(),
      name: p.title || "",
      tech: Array.isArray(p.tech_stack) ? p.tech_stack.join(", ") : p.tech_stack || "",
      url: p.url || p.github_url || "",
      bullets: Array.isArray(p.bullets) && p.bullets.length > 0 ? p.bullets : p.description ? [p.description] : [""],
    }));
  }

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
      name: name || "Aman Mahfuz KZ",
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
