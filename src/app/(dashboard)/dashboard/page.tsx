import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayoutClient from "./DashboardLayout";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, primary_target_role")
    .eq("id", user.id)
    .single();

  // Applications by status
  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, created_at, updated_at, job:jobs(title, company)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const countsByStatus: Record<string, number> = {
    saved: 0, applied: 0, assessment: 0, interview: 0, offer: 0, rejected: 0,
  };
  for (const app of applications ?? []) {
    countsByStatus[app.status] = (countsByStatus[app.status] ?? 0) + 1;
  }

  // Recent 5 applications
  const recentApplications = (applications ?? []).slice(0, 5);

  // This week count
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const applicationsThisWeek = (applications ?? []).filter(
    a => new Date(a.created_at) >= sevenDaysAgo
  ).length;

  // Upcoming interviews
  const { data: interviews } = await supabase
    .from("interviews")
    .select(`
      id, scheduled_at, interview_type, round,
      application:applications!inner(id, user_id,
        job:jobs(company, title)
      )
    `)
    .eq("application.user_id", user.id)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(3);

  // Needs follow-up
  const { data: followUps } = await supabase
    .from("applications")
    .select("id, updated_at, status, job:jobs(company, title)")
    .eq("user_id", user.id)
    .in("status", ["interview", "offer"])
    .lt("updated_at", sevenDaysAgo.toISOString())
    .limit(3);

  // Skills coverage
  const { data: skillGaps } = await supabase
    .from("skill_gaps")
    .select("skill_name, required_in_count, user_has_it, priority")
    .eq("user_id", user.id)
    .order("priority", { ascending: false });

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
  const topMissing = (skillGaps ?? []).filter(g => !g.user_has_it).slice(0, 2);

  // Active learning path
  const { data: activePath } = await supabase
    .from("learning_paths")
    .select(`
      id, progress_percentage, status,
      skill:skill_gaps(skill_name)
    `)
    .eq("user_id", user.id)
    .not("status", "eq", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="p-8 overflow-y-auto h-full">
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
          {profile?.primary_target_role
            ? <>Targeting <span style={{ color: "var(--color-sunset-orange)" }}>{profile.primary_target_role}</span> roles</>
            : "Your job search, organized"}
        </h1>
        <p className="text-sm" style={{ color: "var(--color-slate-body)", letterSpacing: "-0.01em" }}>
          Here is a summary of your job search progress.
        </p>
      </div>

      <DashboardLayoutClient
        userName={profile?.full_name ?? user.email?.split("@")[0] ?? ""}
        countsByStatus={countsByStatus}
        upcomingInterviews={interviews ?? []}
        followUps={followUps ?? []}
        recentApplications={recentApplications}
        applicationsThisWeek={applicationsThisWeek}
        coveragePercent={coveragePercent}
        totalUnique={totalUnique}
        matchedCount={matchedSet.size}
        topMissing={topMissing}
        activeLearningPath={activePath ?? null}
      />
    </div>
  );
}
