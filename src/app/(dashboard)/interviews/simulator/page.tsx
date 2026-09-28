import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StandaloneSimulator } from "../StandaloneSimulator";
import { ApplicationSimulationArena } from "../../applications/[id]/interview/components/ApplicationSimulationArena";

export default async function InterviewSimulatorPage({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const resolvedParams = await searchParams;
  const applicationId = resolvedParams?.applicationId;

  if (applicationId) {
    const { data: app } = await supabase
      .from("applications")
      .select("id, job_title, company_name, job_description, resume_version_id")
      .eq("id", applicationId)
      .maybeSingle();

    if (app) {
      return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <ApplicationSimulationArena
            applicationId={applicationId}
            jobTitle={app.job_title || "Target Role"}
            company={app.company_name || "Target Company"}
          />
        </div>
      );
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <StandaloneSimulator />
    </div>
  );
}
