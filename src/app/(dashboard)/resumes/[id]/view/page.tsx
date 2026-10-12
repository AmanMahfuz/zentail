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

  let versionRecord = null;
  let versionLabel = "Resume";
  let content = null;
  let themeConfig = null;

  // 1. Check resume_versions scoped to user_id
  const { data: resumeVersion } = await (supabase as any)
    .from("resume_versions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (resumeVersion) {
    versionRecord = resumeVersion;
    versionLabel = resumeVersion.version_label || "Resume";
    content = resumeVersion.content;
    themeConfig = resumeVersion.theme || resumeVersion.content?.theme;
  }

  // 1.5 Check tailored_resumes (verified via application ownership)
  if (!versionRecord) {
    const { data: tailored } = await (supabase as any)
      .from("tailored_resumes")
      .select("*")
      .or(`id.eq.${id},application_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (tailored) {
      // Verify ownership
      let isOwner = false;
      if (tailored.application_id) {
        const { data: appAuth } = await (supabase as any)
          .from("applications")
          .select("id")
          .eq("id", tailored.application_id)
          .eq("user_id", user.id)
          .maybeSingle();
        isOwner = !!appAuth;
      }

      if (isOwner) {
        let md = tailored.resume_markdown;
        if (!md && tailored.tailored_content) {
          const { tailoredResumeToMarkdown } = await import("@/lib/agents/resume-tailor");
          md = tailoredResumeToMarkdown(tailored.tailored_content as any);
        }
        if (md) {
          versionLabel = "Tailored Resume";
          content = {
            markdown: md,
            personal: { fullName: user.user_metadata?.full_name || "Candidate" },
          };
          versionRecord = tailored;
        }
      }
    }
  }

  // 2. Check resumes_generated scoped to user_id
  if (!versionRecord) {
    const { data: genResume } = await (supabase as any)
      .from("resumes_generated")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (genResume) {
      versionLabel = genResume.company ? `Tailored for ${genResume.company}` : "Tailored Resume";
      content = {
        markdown: genResume.resume_markdown,
        personal: { fullName: user.user_metadata?.full_name || "Candidate" },
      };
      versionRecord = genResume;
    }
  }

  // 3. Check applications scoped to user_id
  if (!versionRecord) {
    const { data: appRecord } = await (supabase as any)
      .from("applications")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (appRecord) {
      redirect(`/applications/${appRecord.id}`);
    }
  }

  // If not found or not owned by user, redirect to /resumes
  if (!versionRecord) {
    redirect("/resumes");
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
      readOnly={true}
    />
  );
}
