import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadResumeModal } from "./UploadResumeModal";
import { AIGenerateModal } from "./AIGenerateModal";
import { AddNewResumeModal } from "./AddNewResumeModal";
import { ResumeSessionSync } from "./ResumeSessionSync";
import { ResumesListClient } from "./ResumesListClient";
import { getUserResume } from "@/lib/resume/user-resume-helper";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Palette, Plus, UserCircle, FileText } from "lucide-react";

export default async function ResumesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // 1. Fetch saved resume versions
  const { data: resumesRaw } = await (supabase as any)
    .from("resume_versions")
    .select(`
      id,
      user_id,
      origin_type,
      version_label,
      is_latest,
      content,
      created_at,
      version_number,
      pdf_url,
      application_id
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 2. Fetch master career profile from user_resume
  const masterProfile = await getUserResume(user.id);

  // 3. Fetch applications
  const { data: applicationsRaw } = await (supabase as any)
    .from("applications")
    .select("id, company, company_name, job_title, fit_score, match_score, present_skills, matched_skills, missing_skills, resume_version_id")
    .eq("user_id", user.id);

  // 4. Fetch tailored_resumes
  const { data: tailoredRecords } = await (supabase as any)
    .from("tailored_resumes")
    .select("*")
    .order("created_at", { ascending: false });

  const appById = new Map<string, any>();
  const appByResumeId = new Map<string, any>();
  (applicationsRaw || []).forEach((a: any) => {
    appById.set(a.id, a);
    if (a.resume_version_id) appByResumeId.set(a.resume_version_id, a);
  });

  // Map versions
  const mappedVersions = (resumesRaw || []).map((r: any) => {
    const content = (r.content as any) || {};
    const personal = content.personal || content.contact || {};
    const candidateName =
      personal.fullName ||
      personal.name ||
      content.fullName ||
      content.name ||
      r.version_label ||
      "Resume";

    const linkedApp = (r.application_id ? appById.get(r.application_id) : null) || appByResumeId.get(r.id);
    const fitScore = linkedApp?.fit_score || linkedApp?.match_score || content.ats_score || content.match_percentage || 90;
    const matchedCount = linkedApp?.matched_skills?.length || linkedApp?.present_skills?.length || (Array.isArray(content.skills) ? Math.min(content.skills.length, 12) : 8);
    const missingCount = linkedApp?.missing_skills?.length ?? 2;

    return {
      ...r,
      type: r.origin_type || "master",
      name: r.version_label || candidateName || "Resume",
      is_default: r.is_latest || false,
      content: {
        ...content,
        fullName: candidateName,
        experience: Array.isArray(content.experience) ? content.experience : [],
        skills: Array.isArray(content.skills) ? content.skills : [],
        education: Array.isArray(content.education) ? content.education : [],
      },
      version: r.version_number || 1,
      file_url: r.pdf_url,
      fitScore,
      matchedCount,
      missingCount,
      company: linkedApp?.company || linkedApp?.company_name || null,
      jobTitle: linkedApp?.job_title || null,
    };
  });

  // Map tailored resumes from applications that might not be in resume_versions yet
  const tailoredFromApps: any[] = [];
  (tailoredRecords || []).forEach((tr: any) => {
    const app = appById.get(tr.application_id);
    // Don't duplicate if already mapped via resume_versions
    if (mappedVersions.some((v: any) => v.application_id === tr.application_id)) return;

    tailoredFromApps.push({
      id: tr.id,
      application_id: tr.application_id,
      type: "tailored",
      name: app ? `Tailored for ${app.job_title}` : "Tailored Resume",
      company: app?.company || app?.company_name || "Company",
      jobTitle: app?.job_title || "Role",
      fitScore: tr.ats_score || tr.match_percentage || app?.match_score || 88,
      matchedCount: app?.matched_skills?.length || app?.present_skills?.length || 8,
      missingCount: app?.missing_skills?.length || 2,
      file_url: tr.pdf_url,
      created_at: tr.created_at || tr.updated_at || new Date().toISOString(),
      content: tr.tailored_content || {},
    });
  });

  // If no master resumes in resume_versions, create synthetic master entry from user_resume
  const hasMasterInVersions = mappedVersions.some((v: any) => v.type === "master");
  const syntheticMaster: any[] = [];
  if (!hasMasterInVersions && masterProfile) {
    syntheticMaster.push({
      id: "master-profile",
      user_id: user.id,
      origin_type: "master",
      type: "master",
      name: `Master Profile — ${masterProfile.full_name}`,
      is_default: true,
      content: {
        personal: {
          fullName: masterProfile.full_name,
          email: masterProfile.email,
          phone: masterProfile.phone,
          location: masterProfile.location,
          linkedinUrl: masterProfile.linkedin,
          githubUrl: masterProfile.github,
        },
        experience: masterProfile.experiences || [],
        skills: masterProfile.skills || [],
        education: masterProfile.education || [],
      },
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const allResumes = [...syntheticMaster, ...mappedVersions, ...tailoredFromApps];
  const masterResumes = allResumes.filter((r) => r.type !== "tailored");

  // Deduplicate tailored resumes
  const seenTailored = new Set<string>();
  const tailoredResumes = allResumes.filter((r) => {
    if (r.type !== "tailored") return false;
    const key = r.application_id || r.name;
    if (seenTailored.has(key)) return false;
    seenTailored.add(key);
    return true;
  });

  return (
    <div className="w-full px-6 lg:px-10 pt-8 pb-16 space-y-8 bg-white min-h-screen">
      <ResumeSessionSync resumesCount={allResumes.length} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
            My Resumes
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Manage your resume versions and create new ones.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <AddNewResumeModal>
            <Button className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg shadow-sm h-9 px-4 font-medium text-sm flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4 text-white" />
              <span>Create Resume</span>
            </Button>
          </AddNewResumeModal>
        </div>
      </div>

      {/* Main List & Gallery Tabs */}
      <ResumesListClient
        resumes={allResumes}
        masterResumes={masterResumes}
        tailoredResumes={tailoredResumes}
        applications={applicationsRaw || []}
      />
    </div>
  );
}
