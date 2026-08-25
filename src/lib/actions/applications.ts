"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// --- Types ---
// For simplicity, we define the application status enum matching Supabase
export type ApplicationStatus = "saved" | "applied" | "assessment" | "interview" | "offer" | "rejected";

// --- Update Status ---
export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Please sign in again." };
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, message: "Could not update status." };
  }

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { success: true };
}

// --- Create Application ---
const createApplicationSchema = z.object({
  company: z.string().trim().min(2).max(120),
  jobTitle: z.string().trim().min(2).max(120),
  jobUrl: z.string().trim().max(1000).optional().or(z.literal("")),
  jobDescription: z.string().max(10000).optional(),
  salaryMin: z.coerce.number().min(0).optional().or(z.literal(0)),
  salaryMax: z.coerce.number().min(0).optional().or(z.literal(0)),
  currency: z.string().trim().default("USD"),
  location: z.string().trim().max(120).optional(),
  applicationDate: z.string().optional(), // ISO date
  deadline: z.string().optional(),        // ISO date
  notes: z.string().max(2000).optional(),
  resumeId: z.string().uuid().optional().or(z.literal("")),
  initialStatus: z.enum(["saved", "applied", "assessment", "interview", "offer", "rejected"]).default("saved"),
});

export type CreateApplicationState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createApplication(
  _previousState: CreateApplicationState,
  formData: FormData
): Promise<CreateApplicationState> {
  const rawData = {
    company: formData.get("company"),
    jobTitle: formData.get("jobTitle"),
    jobUrl: formData.get("jobUrl"),
    jobDescription: formData.get("jobDescription"),
    salaryMin: formData.get("salaryMin") || undefined,
    salaryMax: formData.get("salaryMax") || undefined,
    currency: formData.get("currency") || "USD",
    location: formData.get("location"),
    applicationDate: formData.get("applicationDate") || undefined,
    deadline: formData.get("deadline") || undefined,
    notes: formData.get("notes") || undefined,
    resumeId: formData.get("resumeId") || undefined,
    initialStatus: formData.get("initialStatus") || "saved",
  };

  const parsed = createApplicationSchema.safeParse(rawData);
  if (!parsed.success) {
    const failedFields = Object.keys(parsed.error.flatten().fieldErrors).join(", ");
    return {
      success: false,
      message: "Please fix the highlighted fields: " + failedFields,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Please sign in again." };
  }

  // Create or reuse job row
  const { data: existingJob } = await supabase
    .from("jobs")
    .select("id")
    .eq("user_id", user.id)
    .eq("company", parsed.data.company)
    .eq("title", parsed.data.jobTitle)
    .eq("url", parsed.data.jobUrl || "")
    .single();

  let jobId: string;

  if (existingJob) {
    jobId = existingJob.id;
  } else {
    const { data: newJob, error: jobError } = await supabase
      .from("jobs")
      .insert({
        user_id: user.id,
        company: parsed.data.company,
        title: parsed.data.jobTitle,
        url: parsed.data.jobUrl || null,
        description: parsed.data.jobDescription || null,
        location: parsed.data.location || null,
        salary_min: parsed.data.salaryMin ?? null,
        salary_max: parsed.data.salaryMax ?? null,
        currency: parsed.data.currency,
        posted_date: parsed.data.applicationDate
          ? new Date(parsed.data.applicationDate).toISOString().slice(0, 10)
          : null,
        deadline: parsed.data.deadline
          ? new Date(parsed.data.deadline).toISOString().slice(0, 10)
          : null,
      })
      .select("id")
      .single();

    if (jobError || !newJob) {
      console.error(jobError);
      return { success: false, message: "Could not create job record." };
    }

    jobId = newJob.id;
  }

  const { error: appError } = await supabase.from("applications").insert({
    user_id: user.id,
    job_id: jobId,
    resume_id: parsed.data.resumeId || null,
    status: parsed.data.initialStatus as ApplicationStatus,
    applied_at: parsed.data.applicationDate
      ? new Date(parsed.data.applicationDate).toISOString()
      : new Date().toISOString(),
    notes: parsed.data.notes || null,
  });

  if (appError) {
    console.error(appError);
    return { success: false, message: "Could not create application." };
  }

  revalidatePath("/applications");
  revalidatePath("/resumes");
  revalidatePath("/dashboard");
  return { success: true };
}

// --- Delete Application ---
export async function deleteApplication(
  applicationId: string
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Please sign in again." };
  }

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, message: "Could not delete application." };
  }

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { success: true };
}

// --- Update Application Details ---
export async function updateApplication(
  applicationId: string,
  data: { notes?: string; status?: ApplicationStatus }
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Please sign in again." };
  }

  const { error } = await supabase
    .from("applications")
    .update({ 
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      updated_at: new Date().toISOString() 
    })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, message: "Could not update application." };
  }

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { success: true };
}
