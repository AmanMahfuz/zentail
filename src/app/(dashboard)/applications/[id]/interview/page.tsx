import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InterviewDashboardClient } from "./InterviewDashboardClient";

export default async function ApplicationInterviewPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const { data: app, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !app) {
    return <div>Application not found</div>;
  }

  // Fetch generated interview prep if it exists
  const { data: prepData } = await (supabase as any)
    .from("interview_preps")
    .select("*")
    .eq("application_id", id)
    .maybeSingle();

  // Fetch scheduled interview if one exists
  const { data: scheduledInterview } = await (supabase as any)
    .from("interviews")
    .select("*")
    .eq("application_id", id)
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-slate-50/50 min-h-screen">
      <InterviewDashboardClient 
        applicationId={id}
        jobTitle={app.job_title}
        company={app.company_name}
        initialPrep={prepData}
        schedule={
          scheduledInterview
            ? {
                round: scheduledInterview.round,
                status: scheduledInterview.prep_status || "Scheduled",
                scheduledAt: scheduledInterview.scheduled_at,
                notes: scheduledInterview.notes,
              }
            : null
        }
      />
    </div>
  );
}
