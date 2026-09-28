import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResumeBuilderClient from "./ResumeBuilderClient";
import { mapToBuilderResumeData } from "@/lib/resume/map-resume-data";
import { TemplateId } from "@/types/resume-builder";

import { getAtsBlueprint } from "@/config/ats-templates";

export default async function ResumeBuilderPage(props: {
  searchParams?: Promise<{ resumeId?: string; template?: string; loadSample?: string; scratch?: string; importProfile?: string }>;
}) {
  const searchParams = await props.searchParams;
  const targetResumeId = searchParams?.resumeId;
  const initialTemplate = searchParams?.template as TemplateId | undefined;
  const shouldLoadSample = searchParams?.loadSample === "true";
  const isScratch = searchParams?.scratch === "true";
  const importProfile = searchParams?.importProfile === "true";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // 1. Fetch targeted or user's newest/latest resume from resume_versions
  let activeVersion = null;
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

  // 2. Fetch user's evidence profile if available
  let userEvidence = null;
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
      versionLabel={activeVersion?.version_label}
      resumeId={activeVersion?.id}
      initialTemplate={initialTemplate}
    />
  );
}
