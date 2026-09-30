import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResumeBuilderClient from "../../builder/ResumeBuilderClient";
import { mapToBuilderResumeData } from "@/lib/resume/map-resume-data";

export default async function ResumeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  let versionRecord = null;
  let versionLabel = "Resume";
  let content = null;
  let themeConfig = null;

  // 1. Check resume_versions
  const { data: resumeVersion } = await (supabase as any)
    .from("resume_versions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (resumeVersion) {
    versionRecord = resumeVersion;
    versionLabel = resumeVersion.version_label || "Resume";
    content = resumeVersion.content;
    themeConfig = resumeVersion.theme || resumeVersion.content?.theme;
  }

  // 2. Check resumes_generated
  if (!versionRecord) {
    const { data: genResume } = await (supabase as any)
      .from("resumes_generated")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (genResume) {
      if (genResume.application_id) {
        redirect(`/applications/${genResume.application_id}/builder`);
      }
      versionLabel = genResume.company ? `Tailored for ${genResume.company}` : "Tailored Resume";
      content = {
        markdown: genResume.resume_markdown,
        personal: { fullName: user.user_metadata?.full_name || "Candidate" },
      };
      versionRecord = genResume;
    }
  }

  // 3. Check applications
  if (!versionRecord) {
    const { data: appRecord } = await (supabase as any)
      .from("applications")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (appRecord) {
      redirect(`/applications/${appRecord.id}/builder`);
    }
  }

  // 4. Fallback to user latest master resume
  if (!versionRecord) {
    const { data: latestMaster } = await (supabase as any)
      .from("resume_versions")
      .select("*")
      .eq("user_id", user.id)
      .order("is_latest", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestMaster) {
      redirect(`/resumes/${latestMaster.id}/edit`);
    } else {
      redirect("/resumes");
    }
  }

  const initialData = mapToBuilderResumeData({
    versionContent: content,
    themeConfig: themeConfig,
    userMetadata: user.user_metadata,
    userEmail: user.email,
  });

  return (
    <ResumeBuilderClient
      initialData={initialData}
      hasExistingData={true}
      versionLabel={versionLabel}
      resumeId={id}
      readOnly={false}
    />
  );
}
