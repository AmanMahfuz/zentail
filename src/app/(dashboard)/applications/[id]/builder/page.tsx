import { createClient } from "@/lib/supabase/server";
import { ResumeBuilderClient } from "./ResumeBuilderClient";
import { redirect } from "next/navigation";

export default async function ResumeBuilderPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Fetch application and associated job
  const { data: application } = await supabase
    .from("applications")
    .select(`
      id,
      status,
      job:jobs ( title, company, location, salary_min, salary_max )
    `)
    .eq("id", params.id)
    .single();

  if (!application) {
    redirect("/applications");
  }

  // Look for any generated resumes
  const { data: generatedResumes } = await supabase
    .from("resumes_generated")
    .select("*")
    .eq("application_id", params.id)
    .order("created_at", { ascending: false });

  const activeResume = generatedResumes && generatedResumes.length > 0 ? generatedResumes[0] : null;

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50">
      <ResumeBuilderClient application={application} activeResume={activeResume} history={generatedResumes || []} />
    </div>
  );
}
