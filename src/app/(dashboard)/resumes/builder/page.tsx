import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResumeBuilderClient from "./ResumeBuilderClient";
import { mapToBuilderResumeData, parseMarkdownToBuilderResumeData } from "@/lib/resume/map-resume-data";
import { getUserResume, formatResumeToMarkdown } from "@/lib/resume/user-resume-helper";
import { TemplateId } from "@/types/resume-builder";
import { getAtsBlueprint } from "@/config/ats-templates";

export default async function ResumeBuilderPage(props: {
  searchParams?: Promise<{
    resumeId?: string;
    template?: string;
    loadSample?: string;
    scratch?: string;
    importProfile?: string;
    applicationId?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const targetResumeId = searchParams?.resumeId;
  const initialTemplate = searchParams?.template as TemplateId | undefined;
  const shouldLoadSample = searchParams?.loadSample === "true";
  const isScratch = searchParams?.scratch === "true";
  const applicationId = searchParams?.applicationId;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  let applicationInfo: { company?: string; jobTitle?: string } | undefined = undefined;
  let activeVersion: any = null;
  let userEvidence: any = null;
  let versionLabel = "Primary Resume";

  // Case A: Loaded for an Application (Tailored visual canvas)
  if (applicationId && !isScratch) {
    const { data: appData } = await (supabase as any)
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (appData) {
      applicationInfo = {
        company: appData.company || appData.company_name || "Target Company",
        jobTitle: appData.job_title || "Target Role",
      };
      versionLabel = `Tailored for ${applicationInfo.jobTitle} @ ${applicationInfo.company}`;
    }

    // Check tailored_resumes
    const { data: tailoredRecord } = await (supabase as any)
      .from("tailored_resumes")
      .select("*")
      .eq("application_id", applicationId)
      .maybeSingle();

    let initialData = mapToBuilderResumeData({
      userMetadata: user.user_metadata,
      userEmail: user.email,
    });

    if (tailoredRecord) {
      let md = tailoredRecord.resume_markdown;
      if (!md && tailoredRecord.tailored_content) {
        const { tailoredResumeToMarkdown } = await import("@/lib/agents/resume-tailor");
        md = tailoredResumeToMarkdown(tailoredRecord.tailored_content as any);
      }
      if (md) {
        const parsed = parseMarkdownToBuilderResumeData(md);
        initialData = {
          ...initialData,
          ...parsed,
          contact: {
            ...initialData.contact,
            ...(parsed.contact || {}),
            name: parsed.contact?.name || user.user_metadata?.full_name || initialData.contact.name,
            email: parsed.contact?.email || user.email || initialData.contact.email,
          },
        };
      }
    } else {
      // Fallback: load candidate master profile
      const masterProfile = await getUserResume(user.id);
      if (masterProfile) {
        const masterMd = formatResumeToMarkdown(masterProfile);
        const parsed = parseMarkdownToBuilderResumeData(masterMd);
        initialData = {
          ...initialData,
          ...parsed,
          contact: {
            ...initialData.contact,
            ...(parsed.contact || {}),
            name: masterProfile.full_name || initialData.contact.name,
            email: masterProfile.email || initialData.contact.email,
            phone: masterProfile.phone || initialData.contact.phone,
            location: masterProfile.location || initialData.contact.location,
            linkedin: masterProfile.linkedin || initialData.contact.linkedin,
            github: masterProfile.github || initialData.contact.github,
          },
        };
      }
    }

    return (
      <ResumeBuilderClient
        initialData={initialData}
        hasExistingData={true}
        versionLabel={versionLabel}
        resumeId={tailoredRecord?.id || applicationId}
        initialTemplate={initialTemplate}
        applicationId={applicationId}
        applicationInfo={applicationInfo}
      />
    );
  }

  // Case B: General Resume Builder (Master profile / version history / scratch / sample)
  if (targetResumeId && !isScratch) {
    const { data: specificVersion } = await (supabase as any)
      .from("resume_versions")
      .select("*")
      .eq("id", targetResumeId)
      .eq("user_id", user.id)
      .maybeSingle();
    activeVersion = specificVersion;
  }

  if (!activeVersion && !isScratch) {
    const { data: latestVersion } = await (supabase as any)
      .from("resume_versions")
      .select("*")
      .eq("user_id", user.id)
      .order("is_latest", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    activeVersion = latestVersion;
  }

  if (!isScratch) {
    const { data: evidence } = await (supabase as any)
      .from("user_evidence")
      .select(`
        *,
        evidence_experience (*),
        evidence_education (*),
        evidence_skills (*),
        evidence_projects (*)
      `)
      .eq("user_id", user.id)
      .maybeSingle();
    userEvidence = evidence;
  }

  // 3. Map into the unified BuilderResumeData format
  let initialData = mapToBuilderResumeData({
    versionContent: activeVersion?.content,
    userEvidence,
    userMetadata: user.user_metadata,
    userEmail: user.email,
  });

  // If no resume_versions found and not scratch, hydrate from user's active Career Profile (user_resume)
  if (!activeVersion && !isScratch) {
    const masterProfile = await getUserResume(user.id);
    if (masterProfile && (masterProfile.experiences?.length > 0 || masterProfile.skills?.length > 0)) {
      const masterMd = formatResumeToMarkdown(masterProfile);
      const parsed = parseMarkdownToBuilderResumeData(masterMd);
      initialData = {
        ...initialData,
        ...parsed,
        contact: {
          ...initialData.contact,
          ...(parsed.contact || {}),
          name: masterProfile.full_name || initialData.contact.name,
          email: masterProfile.email || initialData.contact.email,
          phone: masterProfile.phone || initialData.contact.phone,
          location: masterProfile.location || initialData.contact.location,
          linkedin: masterProfile.linkedin || initialData.contact.linkedin,
          github: masterProfile.github || initialData.contact.github,
        },
      };
      versionLabel = `Master Profile — ${masterProfile.full_name}`;
    }
  } else if (activeVersion) {
    versionLabel = activeVersion.version_label || "Master Resume";
  }

  // If scratching, let's make sure it's completely empty!
  if (isScratch) {
    initialData = {
      ...initialData,
      contact: {
        name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        email: user.email || "",
        phone: "",
        location: "",
        website: "",
        linkedin: "",
        github: "",
        portfolio: "",
      },
      summary: "",
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
    };
    versionLabel = "New Blank Resume";
  }

  if (shouldLoadSample && initialTemplate) {
    const blueprint = getAtsBlueprint(initialTemplate);
    if (blueprint) {
      initialData = {
        ...blueprint.sampleData,
        contact: {
          ...blueprint.sampleData.contact,
          name: user.user_metadata?.full_name || user.user_metadata?.name || blueprint.sampleData.contact.name,
          email: user.email || blueprint.sampleData.contact.email,
        },
      };
    }
  }

  const hasExistingData = !!(
    activeVersion ||
    userEvidence ||
    initialData.experience.length > 0 ||
    initialData.skills.some(s => s.items.trim())
  );

  return (
    <ResumeBuilderClient
      initialData={initialData}
      hasExistingData={hasExistingData}
      versionLabel={versionLabel}
      resumeId={activeVersion?.id}
      initialTemplate={initialTemplate}
    />
  );
}
