import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResumeBuilderClient from "../../builder/ResumeBuilderClient";
import { mapToBuilderResumeData } from "@/lib/resume/map-resume-data";

export default async function ResumeViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: resumeVersion } = await (supabase as any)
    .from("resume_versions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!resumeVersion) {
    redirect("/resumes");
  }

  const initialData = mapToBuilderResumeData({
    versionContent: resumeVersion.content,
    themeConfig: resumeVersion.theme || resumeVersion.content?.theme,
    userMetadata: user.user_metadata,
    userEmail: user.email,
  });

  return (
    <ResumeBuilderClient
      initialData={initialData}
      hasExistingData={true}
      versionLabel={resumeVersion.version_label}
      resumeId={id}
      readOnly={true}
    />
  );
}
