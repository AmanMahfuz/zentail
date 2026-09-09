import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getResumeAnalytics, generateResumeInsight } from "@/lib/actions/analytics";
import AnalyticsClient from "./AnalyticsClient";

export const metadata = {
  title: "Analytics — Zentail",
  description: "Full job search analytics — funnel, resume performance, top companies, skills growth.",
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Resume analytics (existing)
  const statsResult = await getResumeAnalytics("all");
  const insight =
    statsResult.success && statsResult.data
      ? await generateResumeInsight(statsResult.data)
      : { insight: "", recommendation: "" };

  // Application funnel data
  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, created_at, job:jobs(company, title)")
    .eq("user_id", user.id);

  const allApps = applications ?? [];

  // Funnel counts
  const funnel = {
    applied:   allApps.filter(a => ["applied","assessment","interview","offer","rejected"].includes(a.status)).length,
    interview: allApps.filter(a => ["interview","offer"].includes(a.status)).length,
    offer:     allApps.filter(a => a.status === "offer").length,
  };

  // Top companies — group by company name
  const companyMap: Record<string, { count: number; bestStatus: string }> = {};
  const statusRank: Record<string, number> = { saved: 0, applied: 1, assessment: 2, interview: 3, offer: 4, rejected: 0 };
  for (const app of allApps) {
    const co = (app.job as any)?.company ?? "Unknown";
    if (!companyMap[co]) companyMap[co] = { count: 0, bestStatus: app.status };
    companyMap[co].count++;
    if ((statusRank[app.status] ?? 0) > (statusRank[companyMap[co].bestStatus] ?? 0))
      companyMap[co].bestStatus = app.status;
  }
  const topCompanies = Object.entries(companyMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => ({ name, ...data }));

  // Skills growth — compare last 30 days gaps
  const { data: skillGaps } = await supabase
    .from("skill_gaps")
    .select("skill_name, user_has_it, created_at")
    .eq("user_id", user.id);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const skillsLearned = (skillGaps ?? []).filter(
    g => g.user_has_it && new Date(g.created_at) >= thirtyDaysAgo
  ).map(g => g.skill_name);

  const { data: jobMatches } = await supabase
    .from("job_matches")
    .select("matched_skills, missing_skills")
    .eq("user_id", user.id);

  const matchedSet = new Set<string>();
  const missingSet = new Set<string>();
  for (const m of jobMatches ?? []) {
    if (Array.isArray(m.matched_skills)) (m.matched_skills as string[]).forEach(s => matchedSet.add(s));
    if (Array.isArray(m.missing_skills)) (m.missing_skills as string[]).forEach(s => missingSet.add(s));
  }
  const totalUnique = matchedSet.size + missingSet.size;
  const coveragePercent = totalUnique > 0 ? Math.round((matchedSet.size / totalUnique) * 100) : 0;

  return (
    <div className="p-8">
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
          Analytics
        </h1>
        <p className="text-sm" style={{ color: "var(--color-slate-body)", letterSpacing: "-0.01em" }}>
          See what's working in your job search.
        </p>
      </div>

      <AnalyticsClient
        initialStats={statsResult.data ?? []}
        initialInsight={insight}
        funnel={funnel}
        topCompanies={topCompanies}
        coveragePercent={coveragePercent}
        matchedCount={matchedSet.size}
        totalUnique={totalUnique}
        skillsLearned={skillsLearned}
      />
    </div>
  );
}
