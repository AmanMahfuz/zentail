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
    .single();
  
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-slate-50/50 min-h-screen">
      <InterviewDashboardClient 
        applicationId={id}
        jobTitle={app.job_title}
        company={app.company_name}
        initialPrep={prepData}
      />
    </div>
  );
}
