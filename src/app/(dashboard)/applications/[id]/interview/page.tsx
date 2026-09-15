import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InterviewDashboardClient } from "./InterviewDashboardClient";

export default async function ApplicationInterviewPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const { data: app, error } = await supabase
    .from("applications")
    .select("*, jobs(title, company, description)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !app || !app.jobs) {
    return <div>Application not found</div>;
  }

  const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
  
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-slate-50/50 min-h-screen">
      <InterviewDashboardClient 
        applicationId={params.id}
        jobTitle={job.title}
        company={job.company}
      />
    </div>
  );
}
