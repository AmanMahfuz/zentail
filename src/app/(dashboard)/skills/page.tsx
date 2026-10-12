import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SkillsClient } from "./SkillsClient";

export default async function SkillsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // 1. Fetch user's master resume skills
  const { data: resume } = await supabase
    .from("user_resume")
    .select("skills")
    .eq("user_id", user.id)
    .maybeSingle();

  // 2. Fetch all applications for user
  const { data: applications } = await supabase
    .from("applications")
    .select("job_title, company, company_name, present_skills, missing_skills, matched_skills")
    .eq("user_id", user.id);

  // 3. Check legacy tables as fallback
  const { data: rawGaps } = await supabase
    .from("skill_gaps")
    .select("*")
    .eq("user_id", user.id)
    .order("priority", { ascending: false });

  const { data: learningPaths } = await supabase
    .from("learning_paths")
    .select(`
      id, status, progress_percentage,
      skill:skill_gaps(id, skill_name),
      resource:learning_resources(id, platform, resource_name, url, price, duration_minutes, difficulty)
    `)
    .eq("user_id", user.id);

  // 4. Aggregate skills across user's resume & pasted jobs
  const matchedSet = new Set<string>();
  const missingFreq = new Map<string, number>();

  if (Array.isArray(resume?.skills)) {
    resume.skills.forEach((s: string) => {
      if (s?.trim()) matchedSet.add(s.trim());
    });
  }

  for (const app of applications ?? []) {
    const present = (app.present_skills || app.matched_skills || []) as string[];
    const missing = (app.missing_skills || []) as string[];
    if (Array.isArray(present)) present.forEach((s) => s && matchedSet.add(s));
    if (Array.isArray(missing)) {
      missing.forEach((s) => {
        if (s) missingFreq.set(s, (missingFreq.get(s) || 0) + 1);
      });
    }
  }

  const totalUnique = matchedSet.size + missingFreq.size;
  const coveragePercent =
    totalUnique > 0
      ? Math.round((matchedSet.size / totalUnique) * 100)
      : matchedSet.size > 0
      ? 80
      : 65;

  const matchedSkills = Array.from(matchedSet);

  // Synthesize skill gaps from application data if table is not yet populated
  const synthesizedGaps = Array.from(missingFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([skill_name, count]) => ({
      id: skill_name,
      skill_name,
      priority: count >= 2 ? "high" : "medium",
      demand_level: count >= 2 ? "High (Multiple Jobs)" : "Moderate",
      occurrences: count,
      required_in_count: count,
      created_at: new Date().toISOString(),
    }));

  const activeGaps = rawGaps && rawGaps.length > 0 ? rawGaps : synthesizedGaps;

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 sm:px-8 font-sans">
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold text-slate-900 tracking-tight"
          style={{ letterSpacing: "-0.03em" }}
        >
          Skill Gap Analysis & Roadmap
        </h1>
        <p className="text-sm mt-1 text-slate-500">
          Aggregated across your master resume and target job applications.
        </p>
      </div>

      <SkillsClient
        initialGaps={activeGaps}
        initialPaths={learningPaths || []}
        coveragePercent={coveragePercent}
        matchedSkills={matchedSkills}
        totalUnique={totalUnique || matchedSkills.length}
      />
    </div>
  );
}
