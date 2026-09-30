import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // Run all queries in parallel
    const [
      appsResult,
      interviewsResult,
      followUpsResult,
      recommendationsResult,
      skillGapsResult,
      jobMatchesResult,
    ] = await Promise.all([
      // All applications
      supabase
        .from("applications")
        .select("id, status, created_at, company_name, job_title, fit_score, fit_level")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      // Upcoming interviews (next 3)
      supabase
        .from("interviews")
        .select(`id, scheduled_at, interview_type, round, application:applications!inner(id, user_id, company_name, job_title)`)
        .eq("application.user_id", user.id)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(3),

      // Needs follow-up: interview/offer status, no update in 7+ days
      supabase
        .from("applications")
        .select("id, created_at, status, company_name, job_title")
        .eq("user_id", user.id)
        .in("status", ["interview", "offer"])
        .lt("created_at", sevenDaysAgoISO)
        .limit(5),

      // Recent high-score recommendations not yet acted on
      (supabase as any)
        .from("resume_recommendations")
        .select("id, job_title, company_name, match_score, matched_skills, missing_skills, best_resume_label, application_id, created_at")
        .eq("user_id", user.id)
        .gte("match_score", 70)
        .order("match_score", { ascending: false })
        .limit(5),

      // Skill gaps
      supabase
        .from("skill_gaps")
        .select("skill_name, required_in_count, user_has_it, priority")
        .eq("user_id", user.id)
        .order("priority", { ascending: false }),

      // Job matches for skill coverage
      supabase
        .from("job_matches")
        .select("matched_skills, missing_skills")
        .eq("user_id", user.id),
    ]);

    const applications = appsResult.data ?? [];
    const interviews = interviewsResult.data ?? [];
    const followUps = followUpsResult.data ?? [];
    const recommendations = recommendationsResult.data ?? [];
    const skillGaps = skillGapsResult.data ?? [];
    const jobMatches = jobMatchesResult.data ?? [];

    // Compute status counts
    const countsByStatus: Record<string, number> = {};
    for (const app of applications) {
      if (app.status) countsByStatus[app.status] = (countsByStatus[app.status] ?? 0) + 1;
    }

    // Skill coverage
    const matchedSet = new Set<string>();
    const missingSet = new Set<string>();
    for (const m of jobMatches) {
      if (Array.isArray(m.matched_skills)) (m.matched_skills as string[]).forEach(s => matchedSet.add(s));
      if (Array.isArray(m.missing_skills)) (m.missing_skills as string[]).forEach(s => missingSet.add(s));
    }
    const totalUnique = matchedSet.size + missingSet.size;
    const coveragePercent = totalUnique > 0 ? Math.round((matchedSet.size / totalUnique) * 100) : 0;
    const topMissing = (skillGaps).filter((g: any) => !g.user_has_it).slice(0, 3);

    // This week count
    const applicationsThisWeek = applications.filter(
      a => a.created_at && new Date(a.created_at) >= sevenDaysAgo
    ).length;

    return NextResponse.json({
      applications: applications.slice(0, 10),
      countsByStatus,
      upcomingInterviews: interviews,
      followUps,
      recommendations,
      stats: {
        total: applications.length,
        applicationsThisWeek,
        offers: countsByStatus.offer ?? 0,
        interviews: (countsByStatus.interview ?? 0) + (countsByStatus.interviewing ?? 0),
        coveragePercent,
        totalUnique,
        matchedCount: matchedSet.size,
      },
      topMissing,
    });
  } catch (err: any) {
    console.error("Dashboard summary error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
