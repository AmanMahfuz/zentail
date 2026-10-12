"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function uploadResume(formData: FormData): Promise<{
  success: boolean;
  message?: string;
  resumeId?: string;
  blueprintId?: string;
  blueprintName?: string;
  rationale?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const file = formData.get("file") as File;
  const resumeName = formData.get("resumeName") as string;

  if (!file || file.size === 0) {
    return { success: false, message: "Please select a valid PDF file." };
  }

  if (file.type !== "application/pdf") {
    return { success: false, message: "Only PDF files are supported." };
  }

  // 1. Upload to Storage (graceful fallback)
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;
  let pdfUrl: string | null = null;

  try {
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, file, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(fileName);
      pdfUrl = urlData?.publicUrl || null;
    } else {
      console.warn("Storage upload notice (continuing with DB save):", uploadError);
    }
  } catch (err) {
    console.warn("Storage upload exception:", err);
  }

  // 2. Extract structured content from PDF (using unpdf for local robust extraction + Gemini when available)
  const bytes = await file.arrayBuffer();
  let rawPdfText = "";
  try {
    const { extractText } = await import("unpdf");
    const pdfRes = await extractText(new Uint8Array(bytes));
    rawPdfText = Array.isArray(pdfRes.text) ? pdfRes.text.join("\n") : (pdfRes.text || "");
  } catch (pdfErr) {
    console.warn("unpdf text extraction notice:", pdfErr);
  }

  const { parseResume } = await import("@/lib/agents/resume-parser");
  const parsedStructured = rawPdfText.trim().length > 15
    ? await parseResume(rawPdfText)
    : null;

  let extractedContent: any = {
    name: resumeName || file.name,
    file_url: pdfUrl,
    uploaded_at: new Date().toISOString(),
    personal: {
      fullName: parsedStructured?.full_name || user.user_metadata?.full_name || "Candidate",
      email: parsedStructured?.email || user.email || "",
      phone: parsedStructured?.phone || "",
      location: parsedStructured?.location || "",
      linkedinUrl: parsedStructured?.linkedin || "",
      githubUrl: parsedStructured?.github || "",
      portfolioUrl: "",
    },
    skills: (parsedStructured?.skills || []).map((s: string) => ({
      name: s,
      category: "core",
      proficiency: "intermediate",
    })),
    experience: (parsedStructured?.experiences || []).map((exp: any) => ({
      jobTitle: exp.title || "Software Engineer",
      company: exp.company || "Company",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      description: "",
      bullets: exp.bullets || [],
    })),
    education: (parsedStructured?.education || []).map((edu: any) => ({
      degree: edu.degree || "Degree",
      institution: edu.school || "University",
      field: edu.field || "",
      startYear: 2020,
      endYear: parseInt(edu.graduationDate) || 2024,
    })),
    summary: parsedStructured?.experiences?.length
      ? `Experienced professional with demonstrated background in ${(parsedStructured.skills || []).slice(0, 4).join(", ")}.`
      : "",
  };

  // Sync to master user_resume table so candidate profile is immediately populated
  if (parsedStructured) {
    try {
      await (supabase as any).from("user_resume").upsert({
        user_id: user.id,
        full_name: parsedStructured.full_name || user.user_metadata?.full_name || "Candidate",
        email: parsedStructured.email || user.email || "",
        phone: parsedStructured.phone || null,
        location: parsedStructured.location || null,
        linkedin: parsedStructured.linkedin || null,
        github: parsedStructured.github || null,
        experiences: parsedStructured.experiences || [],
        education: parsedStructured.education || [],
        skills: parsedStructured.skills || [],
        last_updated: new Date().toISOString(),
      }, { onConflict: "user_id" });
    } catch (syncErr) {
      console.warn("user_resume master profile sync notice:", syncErr);
    }
  }

  // 3. Compute next version number to avoid UNIQUE(user_id, version_number) conflict
  const { data: existing } = await (supabase as any)
    .from("resume_versions")
    .select("version_number")
    .eq("user_id", user.id)
    .order("version_number", { ascending: false })
    .limit(1);

  const nextVersion = (existing?.[0]?.version_number || 0) + 1;

  // Mark previous versions as not latest
  await (supabase as any)
    .from("resume_versions")
    .update({ is_latest: false })
    .eq("user_id", user.id);

  // 4. Analyze candidate profile and auto-convert to optimal ATS blueprint
  const { analyzeCandidateProfile, convertResumeToAtsBlueprint } = await import("@/lib/services/ats-converter");
  const analysis = analyzeCandidateProfile(extractedContent);
  const autoConvertAts = formData.get("autoConvertAts") !== "false";

  const convertedData = autoConvertAts
    ? convertResumeToAtsBlueprint(extractedContent, analysis.bestBlueprintId)
    : extractedContent;

  const finalLabel = resumeName || file.name.replace(/\.[^/.]+$/, "") || `Master Resume V${nextVersion}`;
  const { data: insertedData, error: dbError } = await (supabase as any)
    .from("resume_versions")
    .insert({
      user_id: user.id,
      version_number: nextVersion,
      version_label: finalLabel,
      pdf_url: pdfUrl,
      origin_type: "upload",
      template_id: autoConvertAts ? analysis.bestBlueprintId : "original",
      is_latest: true,
      content: {
        ...(autoConvertAts ? convertedData : extractedContent),
        ats_analysis: analysis,
        original_raw: extractedContent,
      },
    })
    .select("id")
    .single();

  if (dbError) {
    console.error("DB insert error:", dbError);
    return { success: false, message: "Failed to save resume record." };
  }

  // Also ensure profile onboarding is completed
  await (supabase as any)
    .from("profiles")
    .upsert({
      id: user.id,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString()
    }, { onConflict: "id" });

  revalidatePath("/resumes");
  return {
    success: true,
    resumeId: insertedData?.id,
    blueprintId: analysis.bestBlueprintId,
    blueprintName: analysis.blueprintName,
    rationale: analysis.rationale,
  };
}

export async function duplicateResume(resumeId: string): Promise<{ success: boolean; message?: string; resumeId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  // 1. Fetch the target resume version
  const { data: target, error: fetchError } = await (supabase as any)
    .from("resume_versions")
    .select("*")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !target) {
    return { success: false, message: "Resume version not found" };
  }

  // 2. Compute next version number
  const { data: existing } = await (supabase as any)
    .from("resume_versions")
    .select("version_number")
    .eq("user_id", user.id)
    .order("version_number", { ascending: false })
    .limit(1);

  const nextVersion = (existing?.[0]?.version_number || 0) + 1;
  const clonedLabel = `${target.version_label || "Resume"} (Copy)`;

  // 3. Insert clone
  const { data: inserted, error: insertError } = await (supabase as any)
    .from("resume_versions")
    .insert({
      user_id: user.id,
      version_number: nextVersion,
      version_label: clonedLabel,
      origin_type: target.origin_type === "tailored" ? "tailored" : "master",
      is_latest: false,
      template_id: target.template_id || "basic",
      theme: target.theme,
      content: target.content,
      pdf_url: target.pdf_url,
      parent_version_id: target.id,
      application_id: target.application_id,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Duplicate resume error:", insertError);
    return { success: false, message: insertError.message || "Failed to duplicate resume" };
  }

  revalidatePath("/resumes");
  return { success: true, resumeId: inserted.id };
}

export async function deleteResume(resumeId: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const { error } = await (supabase as any)
    .from("resume_versions")
    .delete()
    .eq("id", resumeId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Delete resume error:", error);
    return { success: false, message: error.message || "Failed to delete resume" };
  }

  revalidatePath("/resumes");
  return { success: true };
}

export async function tailorMasterResumeForJob({
  masterResumeId,
  applicationId,
  jobTitle,
  companyName,
  jobDescription,
}: {
  masterResumeId: string;
  applicationId?: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
}): Promise<{ success: boolean; message?: string; applicationId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  let targetAppId = applicationId;

  // If no existing applicationId is provided, create a new job application record
  if (!targetAppId) {
    if (!jobTitle || !companyName) {
      return { success: false, message: "Job title and company name are required." };
    }

    const { data: newApp, error: appError } = await (supabase as any)
      .from("applications")
      .insert({
        user_id: user.id,
        company_name: companyName,
        job_title: jobTitle,
        job_description: jobDescription || "",
        status: "drafting",
        resume_version_id: masterResumeId,
      })
      .select("id")
      .single();

    if (appError || !newApp) {
      console.error("Failed to create application for tailoring:", appError);
      return { success: false, message: appError?.message || "Failed to create application" };
    }
    targetAppId = newApp.id;
  } else {
    // Ensure the application references this master resume
    await (supabase as any)
      .from("applications")
      .update({ resume_version_id: masterResumeId })
      .eq("id", targetAppId)
      .eq("user_id", user.id);
  }

  if (!targetAppId) {
    return { success: false, message: "Failed to determine application ID" };
  }

  // Trigger ResumeAgent to tailor for this application
  const { ResumeAgent } = await import("@/lib/agents/resume-agent");
  const result = await ResumeAgent.tailorForJob(targetAppId);

  revalidatePath("/resumes");
  revalidatePath("/applications");

  if (!result.success) {
    return { success: false, message: result.message || "Failed to tailor resume" };
  }

  return { success: true, applicationId: targetAppId };
}

export async function convertResumeToBestAtsAction(
  resumeId: string,
  forcedBlueprint?: any
): Promise<{
  success: boolean;
  message?: string;
  blueprintId?: string;
  blueprintName?: string;
  rationale?: string;
  newResumeId?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const { data: version, error } = await (supabase as any)
    .from("resume_versions")
    .select("*")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();

  if (error || !version) {
    return { success: false, message: "Resume not found." };
  }

  const { analyzeCandidateProfile, convertResumeToAtsBlueprint } = await import("@/lib/services/ats-converter");
  const analysis = analyzeCandidateProfile(version.content);
  const targetBlueprint = forcedBlueprint || analysis.bestBlueprintId;
  const converted = convertResumeToAtsBlueprint(version.content, targetBlueprint);

  // Compute next version
  const { data: existing } = await (supabase as any)
    .from("resume_versions")
    .select("version_number")
    .eq("user_id", user.id)
    .order("version_number", { ascending: false })
    .limit(1);

  const nextVersion = (existing?.[0]?.version_number || 0) + 1;

  // Mark all previous as not latest
  await (supabase as any)
    .from("resume_versions")
    .update({ is_latest: false })
    .eq("user_id", user.id);

  const blueprintShort = analysis.blueprintName.split("/")[0].replace("The", "").trim();
  const finalLabel = `${version.version_label || "Resume"} (ATS ${blueprintShort})`;

  const { data: newVersion, error: insertError } = await (supabase as any)
    .from("resume_versions")
    .insert({
      user_id: user.id,
      version_number: nextVersion,
      version_label: finalLabel,
      pdf_url: version.pdf_url,
      origin_type: "ats_optimized",
      template_id: targetBlueprint,
      is_latest: true,
      content: {
        ...converted,
        ats_analysis: analysis,
        original_source_id: version.id,
      },
    })
    .select("id")
    .single();

  if (insertError) {
    return { success: false, message: insertError.message };
  }

  revalidatePath("/resumes");

  return {
    success: true,
    blueprintId: targetBlueprint,
    blueprintName: analysis.blueprintName,
    rationale: analysis.rationale,
    newResumeId: newVersion.id,
  };
}

