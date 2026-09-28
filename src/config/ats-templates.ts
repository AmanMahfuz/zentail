import { BuilderResumeData, TemplateId } from "@/types/resume-builder";

/**
 * TECHNICAL ATS-FRIENDLY BLUEPRINT RULES
 * Research-backed rules to pass both automated parsing engines and human recruiter scrutiny.
 */
export const ATS_BLUEPRINT_RULES = {
  typography: {
    bodyText: {
      minPt: 10,
      maxPt: 12,
      optimalPt: 11,
      rule: "10–12pt (never below 10pt; 11pt is optimal for readability)",
    },
    sectionHeadings: {
      minPt: 12,
      maxPt: 14,
      style: "bold, simple casing or ALL CAPS",
      rule: "12–14pt bold",
    },
    nameHeader: {
      minPt: 18,
      maxPt: 22,
      style: "bold, placed at the top",
      rule: "18–22pt bold",
    },
    fonts: {
      allowed: [
        "Arial",
        "Calibri",
        "Verdana",
        "Times New Roman",
        "Georgia",
        "Inter",
      ],
      rule: "Standard sans-serif (Arial, Calibri, Verdana) or traditional serif (Times New Roman, Georgia). Avoid custom, decorative, or downloaded web fonts.",
    },
  },
  layout: {
    margins: {
      minInches: 0.5,
      maxInches: 1.0,
      rule: "0.5\" to 1\" (36px to 72px) on all sides. Use 1\" for junior roles to add white space, and 0.5\" for senior roles to fit more content. Never go below 0.5\".",
    },
    lineSpacing: {
      minLeading: 1.0,
      maxLeading: 1.15,
      rule: "1.0 to 1.15 (1.0 for modern fonts like Arial, 1.15 for denser fonts like Times New Roman).",
    },
    gaps: {
      itemGapPt: "8–10pt gap between individual job/project entries",
      sectionGapPt: "12–16pt gap between major sections",
    },
    structuralTaboos: [
      "No tables or multi-column newspaper layouts",
      "No text boxes or floating frames",
      "No headers/footers outside standard margins",
      "No complex graphics, icons, or skill-rating bars",
      "Standard round bullet points (•) only",
      "Linear single-column reading hierarchy only",
    ],
    fileFormats: ["PDF (text-based)", "DOCX"],
  },
};

export interface AtsResumeBlueprint {
  id: TemplateId;
  name: string;
  subtitle: string;
  targetAudience: string;
  bestFor: string;
  marginInches: number;
  marginClass: string;
  leading: number;
  sectionGapPt: number;
  itemGapPt: number;
  atsScore: string;
  badge: string;
  badgeColor: string;
  description: string;
  sectionOrder: string[];
  rawText: string;
  sampleData: BuilderResumeData;
}

/**
 * 1. THE FRESHER / ENTRY-LEVEL RESUME
 * Targeted at recent graduates. Prioritizes education, academic projects, and core technical skills.
 * Uses 1-inch margins.
 */
export const FRESHER_RESUME_BLUEPRINT: AtsResumeBlueprint = {
  id: "fresher",
  name: "The Fresher / Entry-Level",
  subtitle: "Education & Skills First Blueprint",
  targetAudience: "Recent graduates, entry-level candidates, students & junior engineers",
  bestFor: "Graduates with limited commercial experience; prioritizes degrees, academic builds & core stack",
  marginInches: 1.0,
  marginClass: "p-8",
  leading: 1.15,
  sectionGapPt: 16,
  itemGapPt: 10,
  atsScore: "100%",
  badge: "1-Inch Margins • Entry-Level",
  badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  description:
    "Targeted at recent graduates. Prioritizes education, academic projects, and core technical skills over limited work history. Uses 1-inch margins to provide balanced white space.",
  sectionOrder: ["contact", "summary", "education", "skills", "projects"],
  rawText: `[FIRST NAME] [LAST NAME]
City, State, Zip | Phone Number | Email Address | LinkedIn URL | Portfolio/GitHub URL

SUMMARY
Recent Computer Application graduate specializing in artificial intelligence and software development. Strong foundation in full-stack web technologies and prompt engineering. Seeking to leverage academic project experience and UI/UX design skills in an entry-level development role.

EDUCATION
Master of Computer Applications (MCA) – Artificial Intelligence
[University/College Name], [Location] | Expected Graduation: 2027
• Relevant Coursework: Machine Learning, Data Structures, Modern Web Architecture

Bachelor of Vocation (B.Voc) – Software Development
[University/College Name], [Location] | Graduated: 2025
• GPA: [Your GPA] / 4.0

TECHNICAL SKILLS
• Languages: JavaScript, Python, HTML/CSS, SQL
• Frameworks/Libraries: React.js, Tailwind CSS, Framer Motion
• Tools: Git, Figma, Supabase, Google Gemini API

ACADEMIC PROJECTS
Skill Progression App | React, Tailwind, Supabase | [Date – Date]
• Built a gamified web application featuring winding lesson paths and coding challenges.
• Implemented a user authentication flow and database schema handling up to 500 mock users.

Campus E-Magazine Layout | Figma, Adobe Creative Suite | [Date – Date]
• Designed interactive digital spreads and cover graphics for the university technology magazine.
• Optimized digital assets to reduce load times by 20% on the web version.`,
  sampleData: {
    contact: {
      name: "Alex Rivera",
      title: "Entry-Level AI & Software Developer",
      location: "San Jose, CA 95112",
      phone: "+1 (555) 234-5678",
      email: "alex.rivera@example.com",
      linkedin: "https://linkedin.com/in/alex-rivera",
      portfolio: "https://github.com/alexrivera-dev",
      github: "https://github.com/alexrivera-dev",
    },
    summary:
      "Recent Computer Application graduate specializing in artificial intelligence and software development. Strong foundation in full-stack web technologies and prompt engineering. Seeking to leverage academic project experience and UI/UX design skills in an entry-level development role.",
    education: [
      {
        id: "edu-fresher-1",
        school: "State University of Technology",
        degree: "Master of Computer Applications (MCA)",
        field: "Artificial Intelligence",
        startDate: "2025",
        endDate: "Expected 2027",
        gpa: "3.85 / 4.0",
      },
      {
        id: "edu-fresher-2",
        school: "College of Applied Science",
        degree: "Bachelor of Vocation (B.Voc)",
        field: "Software Development",
        startDate: "2022",
        endDate: "2025",
        gpa: "3.90 / 4.0",
      },
    ],
    skills: [
      {
        id: "skill-fresher-1",
        category: "Languages",
        items: "JavaScript, Python, HTML/CSS, SQL",
      },
      {
        id: "skill-fresher-2",
        category: "Frameworks/Libraries",
        items: "React.js, Tailwind CSS, Framer Motion",
      },
      {
        id: "skill-fresher-3",
        category: "Tools",
        items: "Git, Figma, Supabase, Google Gemini API",
      },
    ],
    experience: [],
    projects: [
      {
        id: "proj-fresher-1",
        name: "Skill Progression App",
        tech: "React, Tailwind, Supabase",
        url: "https://github.com/alexrivera-dev/skill-progression",
        bullets: [
          "Built a gamified web application featuring winding lesson paths and coding challenges.",
          "Implemented a user authentication flow and database schema handling up to 500 mock users.",
        ],
      },
      {
        id: "proj-fresher-2",
        name: "Campus E-Magazine Layout",
        tech: "Figma, Adobe Creative Suite, Next.js",
        url: "https://github.com/alexrivera-dev/campus-emag",
        bullets: [
          "Designed interactive digital spreads and cover graphics for the university technology magazine.",
          "Optimized digital assets to reduce load times by 20% on the web version.",
        ],
      },
    ],
    theme: {
      template: "fresher",
      primaryColor: "#0f172a",
      fontFamily: "Arial",
      fontSize: "normal",
      layoutDensity: "spacious",
      atsModeActive: true,
      spacingDensity: "spacious",
      margin: "1.0in",
    },
  },
};

/**
 * 2. THE EXPERIENCED / FULL-STACK DEVELOPER RESUME
 * Targeted at professionals with established careers. Prioritizes experience, specific technologies, and business impact.
 * Uses 0.5-inch margins.
 */
export const EXPERIENCED_RESUME_BLUEPRINT: AtsResumeBlueprint = {
  id: "experienced",
  name: "The Experienced / Full-Stack Developer",
  subtitle: "High-Density Commercial Impact Blueprint",
  targetAudience: "Mid-level to Senior Engineers, Full-Stack Developers & Tech Leads (3+ yrs)",
  bestFor: "Established professionals needing maximum density to fit quantifiable business impact and technical depth",
  marginInches: 0.5,
  marginClass: "p-4",
  leading: 1.0,
  sectionGapPt: 12,
  itemGapPt: 8,
  atsScore: "100%",
  badge: "0.5-Inch Margins • 3+ Years Exp",
  badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  description:
    "Targeted at professionals with established careers. Prioritizes professional experience, specific technologies (React, Next.js, Python), and quantifiable business impact. Uses 0.5-inch margins for high content density.",
  sectionOrder: ["contact", "summary", "skills", "experience", "projects", "education"],
  rawText: `[FIRST NAME] [LAST NAME]
City, State, Zip | Phone Number | Email Address | LinkedIn URL | GitHub URL

PROFESSIONAL SUMMARY
Full-Stack Web Developer with 3+ years of experience architecting scalable applications and integrating AI models. Proven track record in frontend optimization, database schema design, and seamless multimodal API integrations. Adept at transforming complex UI/UX designs into responsive, high-performance web applications.

TECHNICAL SKILLS
• Frontend: React.js, Next.js, JavaScript (ES6+), Tailwind CSS, GSAP, Three.js
• Backend: Python, Django, PostgreSQL, RESTful APIs
• AI & MLOps: Google Gemini API, OpenAI GPT, Anthropic Claude, Prompt Engineering
• Cloud & Infrastructure: Supabase, Vercel, Git/GitHub, CI/CD

PROFESSIONAL EXPERIENCE
Freelance Web Developer | [Agency/Company Name] | [Location] | [Month, Year] – Present
• Architected and deployed 5+ scalable full-stack web applications using Next.js and Supabase, reducing average client server costs by 15%.
• Integrated Large Language Models (LLMs) into client platforms, enhancing automated customer response capabilities and user retention.
• Designed and developed custom UI micro-interactions using Framer Motion and Lottie, increasing user engagement metrics by 25%.

Full Stack Developer Intern | [Company Name] | [Location] | [Month, Year] – [Month, Year]
• Collaborated with a team of 4 developers to migrate a legacy codebase to React.js, improving page load speeds by 40%.
• Built and maintained relational database schemas in PostgreSQL to support a new daily active user tracking system.

PROJECTS
AI-Powered Career Platform | Next.js, Python, Supabase, Gemini API
• Engineered an integrated workspace application handling automated application tracking and resume parsing.
• Developed a custom prompt-optimization pipeline that improved the accuracy of the AI-generated content by 30%.`,
  sampleData: {
    contact: {
      name: "Marcus Vance",
      title: "Senior Full-Stack Web Developer",
      location: "Austin, TX 78701",
      phone: "+1 (512) 555-0194",
      email: "marcus.vance@example.com",
      linkedin: "https://linkedin.com/in/marcus-vance-dev",
      portfolio: "https://marcusvance.dev",
      github: "https://github.com/marcusvance",
    },
    summary:
      "Full-Stack Web Developer with 3+ years of experience architecting scalable applications and integrating AI models. Proven track record in frontend optimization, database schema design, and seamless multimodal API integrations. Adept at transforming complex UI/UX designs into responsive, high-performance web applications.",
    skills: [
      {
        id: "skill-exp-1",
        category: "Frontend",
        items: "React.js, Next.js, JavaScript (ES6+), Tailwind CSS, GSAP, Three.js",
      },
      {
        id: "skill-exp-2",
        category: "Backend",
        items: "Python, Django, PostgreSQL, RESTful APIs",
      },
      {
        id: "skill-exp-3",
        category: "AI & MLOps",
        items: "Google Gemini API, OpenAI GPT, Anthropic Claude, Prompt Engineering",
      },
      {
        id: "skill-exp-4",
        category: "Cloud & Infrastructure",
        items: "Supabase, Vercel, Git/GitHub, CI/CD",
      },
    ],
    experience: [
      {
        id: "exp-1",
        company: "Apex Digital Solutions",
        title: "Freelance Web Developer",
        location: "Remote",
        startDate: "Jan 2024",
        endDate: "Present",
        current: true,
        bullets: [
          "Architected and deployed 5+ scalable full-stack web applications using Next.js and Supabase, reducing average client server costs by 15%.",
          "Integrated Large Language Models (LLMs) into client platforms, enhancing automated customer response capabilities and user retention.",
          "Designed and developed custom UI micro-interactions using Framer Motion and Lottie, increasing user engagement metrics by 25%.",
        ],
      },
      {
        id: "exp-2",
        company: "Vanguard Tech Labs",
        title: "Full Stack Developer Intern",
        location: "Austin, TX",
        startDate: "May 2023",
        endDate: "Dec 2023",
        current: false,
        bullets: [
          "Collaborated with a team of 4 developers to migrate a legacy codebase to React.js, improving page load speeds by 40%.",
          "Built and maintained relational database schemas in PostgreSQL to support a new daily active user tracking system.",
        ],
      },
    ],
    projects: [
      {
        id: "proj-exp-1",
        name: "AI-Powered Career Platform",
        tech: "Next.js, Python, Supabase, Gemini API",
        url: "https://github.com/marcusvance/career-ai",
        bullets: [
          "Engineered an integrated workspace application handling automated application tracking and resume parsing.",
          "Developed a custom prompt-optimization pipeline that improved the accuracy of the AI-generated content by 30%.",
        ],
      },
    ],
    education: [
      {
        id: "edu-exp-1",
        school: "University of Texas at Austin",
        degree: "B.S. in Computer Science",
        field: "Software Engineering",
        startDate: "2019",
        endDate: "2023",
      },
    ],
    theme: {
      template: "experienced",
      primaryColor: "#000000",
      fontFamily: "Calibri",
      fontSize: "compact",
      layoutDensity: "compact",
      atsModeActive: true,
      spacingDensity: "compact",
      margin: "0.5in",
    },
  },
};

/**
 * 3. THE CAREER PIVOT / HYBRID RESUME (TECH + DESIGN)
 * Targeted at individuals combining two distinct skill sets (e.g., UI/UX Design and Frontend Development).
 * Uses a functional/chronological hybrid layout to highlight overlapping skills. Uses 0.75-inch margins.
 */
export const HYBRID_RESUME_BLUEPRINT: AtsResumeBlueprint = {
  id: "hybrid",
  name: "The Career Pivot / Hybrid (Tech + Design)",
  subtitle: "Cross-Functional Synergy Blueprint",
  targetAudience: "Creative Technologists, UI Engineers, Design Technologists & Career Changers",
  bestFor: "Professionals bridging technical execution and visual product strategy without confusing ATS parsers",
  marginInches: 0.75,
  marginClass: "p-6",
  leading: 1.05,
  sectionGapPt: 14,
  itemGapPt: 9,
  atsScore: "100%",
  badge: "0.75-Inch Margins • Hybrid Cross-Skill",
  badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  description:
    "Targeted at individuals combining two distinct skill sets (e.g., UI/UX Design and Frontend Development). Uses a functional/chronological hybrid layout to highlight overlapping skills with 0.75-inch margins.",
  sectionOrder: ["contact", "summary", "skills", "experience", "projects", "education"],
  rawText: `[FIRST NAME] [LAST NAME]
City, State, Zip | Phone Number | Email Address | LinkedIn URL | Portfolio URL

SUMMARY
Creative Technologist combining a strong background in UI/UX and graphic design with full-stack development capabilities. Passionate about building habit-forming user interfaces and gamified digital experiences. Brings a unique visual design perspective to complex coding challenges.

CORE COMPETENCIES
• UI/UX & Motion Design: Figma, Typography, Brand Identity, Cavalry, Lottie Animations
• Frontend Engineering: React.js, Next.js, Tailwind CSS, Responsive Design
• Product Strategy: Gamification mechanics, User flow mapping, Habit-building UX

RELEVANT EXPERIENCE & PROJECTS
Holistic Health & Habit Tracking App | Lead Designer & Developer | [Month, Year] – Present
• Conceptualized and developed a full-scale web application focused on gamified habit tracking.
• Designed the complete UI/UX system in Figma, emphasizing a mood-centric interface and accessibility.
• Built the frontend architecture utilizing React and Tailwind CSS, incorporating custom animation frameworks to reward user streaks.

Freelance Brand Designer | Self-Employed | [Location] | [Month, Year] – [Month, Year]
• Delivered comprehensive branding packages, including logo design, typography selection, and marketing collateral for local businesses.
• Created motion graphics and promotional video assets that increased client social media engagement by over 40%.
• Designed bilingual digital assets ensuring pixel-perfect typography rendering across diverse platforms.

EDUCATION & CERTIFICATIONS
Bachelor of Vocation (B.Voc) – Software Development
[University/College Name], [Location] | Graduated: 2025
• Capstone: Developed interactive front-end interfaces prioritizing accessibility standards.`,
  sampleData: {
    contact: {
      name: "Morgan Chen",
      title: "Creative Technologist (UI/UX + Frontend)",
      location: "Seattle, WA 98101",
      phone: "+1 (206) 555-8392",
      email: "morgan.chen@example.com",
      linkedin: "https://linkedin.com/in/morganchen-design",
      portfolio: "https://morganchen.design",
    },
    summary:
      "Creative Technologist combining a strong background in UI/UX and graphic design with full-stack development capabilities. Passionate about building habit-forming user interfaces and gamified digital experiences. Brings a unique visual design perspective to complex coding challenges.",
    skills: [
      {
        id: "skill-hybrid-1",
        category: "UI/UX & Motion Design",
        items: "Figma, Typography, Brand Identity, Cavalry, Lottie Animations",
      },
      {
        id: "skill-hybrid-2",
        category: "Frontend Engineering",
        items: "React.js, Next.js, Tailwind CSS, Responsive Design",
      },
      {
        id: "skill-hybrid-3",
        category: "Product Strategy",
        items: "Gamification mechanics, User flow mapping, Habit-building UX",
      },
    ],
    experience: [
      {
        id: "exp-hybrid-1",
        company: "Self-Employed",
        title: "Freelance Brand & Product Designer",
        location: "Seattle, WA",
        startDate: "2023",
        endDate: "2024",
        current: false,
        bullets: [
          "Delivered comprehensive branding packages, including logo design, typography selection, and marketing collateral for local businesses.",
          "Created motion graphics and promotional video assets that increased client social media engagement by over 40%.",
          "Designed bilingual digital assets ensuring pixel-perfect typography rendering across diverse platforms.",
        ],
      },
    ],
    projects: [
      {
        id: "proj-hybrid-1",
        name: "Holistic Health & Habit Tracking App",
        tech: "React, Tailwind CSS, Figma, Framer Motion",
        url: "https://morganchen.design/habit-app",
        bullets: [
          "Conceptualized and developed a full-scale web application focused on gamified habit tracking.",
          "Designed the complete UI/UX system in Figma, emphasizing a mood-centric interface and accessibility.",
          "Built the frontend architecture utilizing React and Tailwind CSS, incorporating custom animation frameworks to reward user streaks.",
        ],
      },
    ],
    education: [
      {
        id: "edu-hybrid-1",
        school: "Pacific Northwest Institute of Technology",
        degree: "Bachelor of Vocation (B.Voc)",
        field: "Software Development & Interaction Design",
        startDate: "2021",
        endDate: "2025",
        gpa: "3.88",
      },
    ],
    theme: {
      template: "hybrid",
      primaryColor: "#0f172a",
      fontFamily: "Inter",
      fontSize: "normal",
      layoutDensity: "normal",
      atsModeActive: true,
      spacingDensity: "normal",
      margin: "0.75in",
    },
  },
};

export const ALL_ATS_BLUEPRINTS: AtsResumeBlueprint[] = [
  FRESHER_RESUME_BLUEPRINT,
  EXPERIENCED_RESUME_BLUEPRINT,
  HYBRID_RESUME_BLUEPRINT,
];

export function getAtsBlueprint(id: TemplateId | string): AtsResumeBlueprint | undefined {
  if (id === "fresher") return FRESHER_RESUME_BLUEPRINT;
  if (id === "experienced" || id === "basic") return EXPERIENCED_RESUME_BLUEPRINT;
  if (id === "hybrid" || id === "balanced") return HYBRID_RESUME_BLUEPRINT;
  return ALL_ATS_BLUEPRINTS.find((b) => b.id === id);
}
