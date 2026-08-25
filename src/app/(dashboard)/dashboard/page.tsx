import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayoutClient from "./DashboardLayout";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Auth and onboarding checks are already handled by layout.tsx and proxy.ts,
  // but we fetch the profile to personalize the dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_target_role, target_roles")
    .eq("id", user.id)
    .single();

  // a) Application counts by status
  const { data: applications, error: appsError } = await supabase
    .from("applications")
    .select("status, applied_at, created_at")
    .eq("user_id", user.id);

  if (appsError) throw appsError;

  const countsByStatus: Record<string, number> = {
    saved: 0,
    applied: 0,
    assessment: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  };

  for (const app of applications ?? []) {
    countsByStatus[app.status] = (countsByStatus[app.status] ?? 0) + 1;
  }

  // b) Upcoming interviews (Phase 5 will fill this)
  const { data: interviews } = await supabase
    .from("interviews")
    .select(`
      id,
      scheduled_at,
      application:applications!inner (
        id,
        job:jobs (
          company,
          title
        )
      )
    `)
    .eq("application.user_id", user.id)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(3);

  // c) "Needs follow-up" placeholder
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: followUps } = await supabase
    .from("applications")
    .select(`
      id,
      updated_at,
      status,
      job:jobs (
        company,
        title
      )
    `)
    .eq("user_id", user.id)
    .in("status", ["interview", "offer"])
    .lt("updated_at", sevenDaysAgo.toISOString())
    .limit(3);

  // d) This week's progress
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const { data: recentApps } = await supabase
    .from("applications")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", last7Days.toISOString());

  const applicationsThisWeek = recentApps?.length ?? 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Ready to target {profile?.primary_target_role || "your next"} roles?
        </h1>
        <p className="text-slate-500">Here is a summary of your job search progress.</p>
      </div>

      <DashboardLayoutClient
        countsByStatus={countsByStatus}
        upcomingInterviews={interviews ?? []}
        followUps={followUps ?? []}
        applicationsThisWeek={applicationsThisWeek}
      />
    </div>
  );
}
