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

    // Run only necessary queries in parallel
    const [
      appsResult,
      interviewsResult,
      followUpsResult,
    ] = await Promise.all([
      // All applications
      supabase
        .from("applications")
        .select("id, status, created_at, company, company_name, job_title, match_score, fit_score, fit_level")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      // Upcoming interviews (next 3)
      supabase
        .from("interviews")
        .select(`id, scheduled_at, interview_type, round, application:applications!inner(id, user_id, company, company_name, job_title)`)
        .eq("application.user_id", user.id)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(3),

      // Needs follow-up: interview/offer status, no update in 7+ days
      supabase
        .from("applications")
        .select("id, created_at, status, company, company_name, job_title")
        .eq("user_id", user.id)
        .in("status", ["interview", "offer"])
        .lt("created_at", sevenDaysAgoISO)
        .limit(5),
    ]);

    const applications = (appsResult.data ?? []).map((app: any) => ({
      ...app,
      company_name: app.company_name || app.company || "Target Company",
      fit_score: app.fit_score ?? app.match_score ?? 0,
    }));
    const interviews = interviewsResult.data ?? [];
    const followUps = (followUpsResult.data ?? []).map((app: any) => ({
      ...app,
      company_name: app.company_name || app.company || "Target Company",
    }));

    // Compute status counts
    const countsByStatus: Record<string, number> = {};
    for (const app of applications) {
      if (app.status) countsByStatus[app.status] = (countsByStatus[app.status] ?? 0) + 1;
    }

    return NextResponse.json({
      applications: applications.slice(0, 10),
      countsByStatus,
      upcomingInterviews: interviews,
      followUps,
      stats: {
        total: applications.length,
        offers: countsByStatus.offer ?? 0,
        interviews: (countsByStatus.interview ?? 0) + (countsByStatus.interviewing ?? 0),
      },
    });
  } catch (err: any) {
    console.error("Dashboard summary error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
