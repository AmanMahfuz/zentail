import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SkillsClient } from "./SkillsClient";

export default async function SkillsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: skillGaps } = await supabase
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

  // Compute coverage: matched skills from job_matches
  const { data: jobMatches } = await supabase
    .from("job_matches")
    .select("matched_skills, missing_skills")
    .eq("user_id", user.id);

  // Aggregate matched skills across all job matches
  const matchedSet = new Set<string>();
  const missingSet = new Set<string>();
  for (const m of jobMatches ?? []) {
    const matched = m.matched_skills as string[] | null;
    const missing = m.missing_skills as string[] | null;
    if (Array.isArray(matched)) matched.forEach(s => matchedSet.add(s));
    if (Array.isArray(missing)) missing.forEach(s => missingSet.add(s));
  }
  const totalUnique = matchedSet.size + missingSet.size;
  const coveragePercent = totalUnique > 0 ? Math.round((matchedSet.size / totalUnique) * 100) : 0;
  const matchedSkills = Array.from(matchedSet);

  return (
    <div className="max-w-6xl mx-auto py-8 px-8">
      <div className="mb-8">
        <h1
          className="text-3xl font-semibold mb-1.5"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-graphite-heading)",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}
        >
          Skills Analysis
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-slate-body)", letterSpacing: "-0.01em" }}>
          Identify your skill gaps based on your recent job matches.
        </p>
      </div>

      <SkillsClient
        initialGaps={skillGaps || []}
        initialPaths={learningPaths || []}
        coveragePercent={coveragePercent}
        matchedSkills={matchedSkills}
        totalUnique={totalUnique}
      />
    </div>
  );
}
