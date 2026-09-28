import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateTailoredResume } from "@/lib/actions/phase3";
import { ResumeCenterClient } from "./ResumeCenterClient";

function formatProfileToMarkdown(profile: any, role?: string) {
  if (!profile) return "";
  if (typeof profile === "string") return profile;
  if (profile.markdown) return profile.markdown;

  const lines: string[] = [];
  const p = profile.personal || profile.contact || {};
  const name = p.fullName || p.name || profile.fullName || "Candidate";
  lines.push(`# ${name}`);

  const contacts = [p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean);
  if (contacts.length > 0) lines.push(contacts.join(" | "));
  lines.push("");

  const summary = profile.summary || p.summary;
  if (summary) {
    lines.push(`## Professional Summary`);
    lines.push(summary);
    lines.push("");
  }

  const skills = profile.skills || [];
  if (skills.length > 0) {
    lines.push(`## Technical Skills`);
    const skillList = skills.map((s: any) => (typeof s === "string" ? s : s.name)).join(", ");
    lines.push(skillList);
    lines.push("");
  }

  const experience = profile.experience || [];
  if (experience.length > 0) {
    lines.push(`## Work Experience`);
    experience.forEach((exp: any) => {
      const title = exp.jobTitle || exp.title || "Role";
      const comp = exp.company || "Company";
      const dates = [exp.startDate, exp.isCurrent ? "Present" : exp.endDate].filter(Boolean).join(" - ");
      lines.push(`### ${title} — ${comp} ${dates ? `(${dates})` : ""}`);
      if (exp.description) lines.push(exp.description);
      if (Array.isArray(exp.bullets)) {
        exp.bullets.forEach((b: string) => lines.push(`- ${b}`));
      }
      lines.push("");
    });
  }

  const projects = profile.projects || [];
  if (projects.length > 0) {
    lines.push(`## Key Projects`);
    projects.forEach((proj: any) => {
      lines.push(`### ${proj.title || "Project"}`);
      if (proj.description) lines.push(proj.description);
      if (Array.isArray(proj.bullets)) {
        proj.bullets.forEach((b: string) => lines.push(`- ${b}`));
      }
      lines.push("");
    });
  }

  const education = profile.education || [];
  if (education.length > 0) {
    lines.push(`## Education`);
    education.forEach((edu: any) => {
      const deg = edu.degree || "Degree";
      const inst = edu.institution || "Institution";
      const yr = edu.endYear || edu.year || "";
      lines.push(`- **${deg}**, ${inst} ${yr ? `(${yr})` : ""}`);
    });
    lines.push("");
  }

  return lines.join("\n");
}

export default async function ResumeCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: applicationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Fetch application + job info
  const { data: application } = await supabase
    .from("applications")
    .select("id, job_title, company_name, job_description, resume_version_id, fit_score, matched_skills, missing_skills")
    .eq("id", applicationId)
    .single();

  if (!application) redirect("/applications");

  // Fetch existing generated resume for this application
  let { data: resumeRaw } = await supabase
    .from("resumes_generated")
    .select("*")
    .eq("application_id", applicationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let resume: any = resumeRaw ?? null;

  // Filter out any invalid / placeholder generated records
  if (
    resume?.resume_markdown &&
    (resume.resume_markdown.includes("Placeholder") ||
      resume.resume_markdown.startsWith("# Name") ||
      resume.resume_markdown.includes("email@example.com"))
  ) {
    resume = null;
  }

  // If none in resumes_generated or placeholder was discarded, look up the application's linked resume_version or latest user resume
  if (!resume) {
    let verQuery = supabase.from("resume_versions").select("*");

    if (application.resume_version_id) {
      verQuery = verQuery.eq("id", application.resume_version_id);
    } else {
      verQuery = verQuery
        .eq("user_id", user.id)
        .order("is_latest", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);
    }

    const { data: ver } = await verQuery.maybeSingle();

    if (ver) {
      const content = (ver.content as any) || {};
      const md = content.markdown || formatProfileToMarkdown(content, application.job_title);
      resume = {
        id: ver.id,
        resume_markdown: md,
        ats_score: application.fit_score || 95,
        match_percentage: application.fit_score || 95,
        skills_matched: application.matched_skills ?? [],
        skills_missing: application.missing_skills ?? [],
        pdf_url: ver.pdf_url ?? null,
      };
    }
  }

  // Only auto-generate tailored resume if none exists AND candidate fit score is below 80%
  if (!resume && (application.fit_score ?? 0) < 80) {
    const result = await generateTailoredResume(applicationId);
    if (result.success) resume = result.data ?? null;
  }

  return (
    <ResumeCenterClient
      applicationId={applicationId}
      jobTitle={application.job_title ?? ""}
      company={application.company_name ?? ""}
      resume={resume}
    />
  );
}
