// src/lib/resume/skills-categorizer.ts

export interface CategorizedSkillGroup {
  id: string;
  category: string;
  items: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const LANGUAGE_KEYWORDS = new Set([
  "javascript", "typescript", "python", "java", "c", "c++", "c#", "go", "golang",
  "rust", "ruby", "php", "swift", "kotlin", "sql", "html", "html5", "css", "css3",
  "r", "bash", "shell", "dart", "scala", "perl", "matlab", "elixir", "haskell"
]);

const FRAMEWORK_KEYWORDS = new Set([
  "react", "react.js", "reactjs", "next.js", "nextjs", "vue", "vue.js", "angular",
  "svelte", "sveltekit", "tailwind", "tailwind css", "tailwindcss", "bootstrap",
  "material-ui", "mui", "sass", "scss", "redux", "zustand", "mobx", "jquery",
  "vite", "webpack"
]);

const BACKEND_API_KEYWORDS = new Set([
  "node.js", "nodejs", "node", "express", "express.js", "nest.js", "nestjs",
  "django", "flask", "fastapi", "spring", "spring boot", "ruby on rails", "rails",
  "rest", "rest api", "rest apis", "restful", "restful apis", "graphql", "grpc",
  "microservices", "websockets", "supabase", "firebase", "prisma", "sequelize",
  "typeorm", "celery"
]);

const DATABASE_KEYWORDS = new Set([
  "postgresql", "postgres", "mongodb", "mysql", "redis", "sqlite", "mariadb",
  "dynamodb", "cassandra", "neo4j", "elasticsearch", "supabase db", "oracle"
]);

const TOOLS_CLOUD_KEYWORDS = new Set([
  "git", "github", "gitlab", "bitbucket", "docker", "kubernetes", "aws", "amazon web services",
  "gcp", "google cloud", "azure", "linux", "ci/cd", "github actions", "jenkins",
  "terraform", "postman", "jest", "cypress", "playwright", "figma", "jira",
  "npm", "pnpm", "yarn", "vercel", "netlify"
]);

/**
 * Cleanly organizes an arbitrary list of skill names (or raw {name, category} objects)
 * into industry-standard, ATS-friendly resume categories:
 * - Languages
 * - Frameworks & Libraries
 * - Backend & APIs
 * - Databases
 * - Developer Tools & Cloud
 */
export function categorizeSkills(rawSkills: any[]): CategorizedSkillGroup[] {
  if (!Array.isArray(rawSkills) || rawSkills.length === 0) return [];

  const languages: string[] = [];
  const frameworks: string[] = [];
  const backend: string[] = [];
  const databases: string[] = [];
  const tools: string[] = [];
  const customCategories = new Map<string, string[]>();

  const seen = new Set<string>();

  for (const item of rawSkills) {
    if (!item) continue;
    let name = "";
    let userCategory = "";

    if (typeof item === "string") {
      name = item.trim();
    } else if (typeof item === "object") {
      name = (item.name || item.skill || item.title || item.skill_name || "").trim();
      if (item.category && item.category.toLowerCase() !== "core" && item.category.toLowerCase() !== "general") {
        userCategory = item.category.trim();
      }
    }

    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    const lower = name.toLowerCase();

    // If user provided a specific non-generic category (e.g. "Cloud & DevOps"), honor it
    if (userCategory && !["core", "general", "other", "all"].includes(userCategory.toLowerCase())) {
      const formattedCat = userCategory.charAt(0).toUpperCase() + userCategory.slice(1);
      if (!customCategories.has(formattedCat)) customCategories.set(formattedCat, []);
      customCategories.get(formattedCat)!.push(name);
      continue;
    }

    // Auto-classify by keyword
    if (LANGUAGE_KEYWORDS.has(lower)) {
      languages.push(name);
    } else if (FRAMEWORK_KEYWORDS.has(lower)) {
      frameworks.push(name);
    } else if (BACKEND_API_KEYWORDS.has(lower)) {
      backend.push(name);
    } else if (DATABASE_KEYWORDS.has(lower)) {
      databases.push(name);
    } else if (TOOLS_CLOUD_KEYWORDS.has(lower)) {
      tools.push(name);
    } else {
      // Default fallback grouping
      tools.push(name);
    }
  }

  const result: CategorizedSkillGroup[] = [];

  if (languages.length > 0) {
    result.push({ id: uid(), category: "Languages", items: languages.join(", ") });
  }
  if (frameworks.length > 0) {
    result.push({ id: uid(), category: "Frameworks & Libraries", items: frameworks.join(", ") });
  }
  if (backend.length > 0) {
    result.push({ id: uid(), category: "Backend & APIs", items: backend.join(", ") });
  }
  if (databases.length > 0) {
    result.push({ id: uid(), category: "Databases", items: databases.join(", ") });
  }
  if (tools.length > 0) {
    result.push({ id: uid(), category: "Developer Tools & Cloud", items: tools.join(", ") });
  }

  // Append any explicitly custom categorized skills
  for (const [cat, itms] of customCategories.entries()) {
    result.push({ id: uid(), category: cat, items: itms.join(", ") });
  }

  // If everything failed to match and result is empty, give a clean "Technical Skills" group (NEVER "core:")
  if (result.length === 0 && seen.size > 0) {
    result.push({ id: uid(), category: "Technical Skills", items: Array.from(seen).join(", ") });
  }

  return result;
}

export function classifySkillName(skillName: string): string {
  if (!skillName) return "Technical Skills";
  const lower = skillName.trim().toLowerCase();
  if (LANGUAGE_KEYWORDS.has(lower)) return "Languages";
  if (FRAMEWORK_KEYWORDS.has(lower)) return "Frameworks & Libraries";
  if (BACKEND_API_KEYWORDS.has(lower)) return "Backend & APIs";
  if (DATABASE_KEYWORDS.has(lower)) return "Databases";
  if (TOOLS_CLOUD_KEYWORDS.has(lower)) return "Developer Tools & Cloud";
  return "Technical Skills";
}
