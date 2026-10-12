"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// --- Types ---
// For simplicity, we define the application status enum matching Supabase
export type ApplicationStatus = "saved" | "applied" | "assessment" | "interview" | "offer" | "rejected" | "analyzing" | "review_needed" | "interviewing" | "outcome";

// --- Status Validation ---
export const VALID_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "saved",
  "applied",
  "assessment",
  "interview",
  "offer",
  "rejected",
  "analyzing",
  "review_needed",
  "interviewing",
  "outcome",
] as const;

// --- Update Status ---
export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus
): Promise<{ success: boolean; message?: string }> {
  if (!VALID_APPLICATION_STATUSES.includes(newStatus)) {
    return { success: false, message: `Invalid status value: ${newStatus}` };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Please sign in again." };
  }

  // 1. Fetch current status to verify ownership and record transition
  const { data: currentApp, error: fetchErr } = await supabase
    .from("applications")
    .select("id, status")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr || !currentApp) {
    return { success: false, message: "Application not found or unauthorized." };
  }

  const oldStatus = currentApp.status;

  // 2. Update status
  const { error } = await (supabase
    .from("applications")
    .update({ 
      status: newStatus,
    } as any) as any)
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("updateApplicationStatus error:", error);
    return { success: false, message: "Could not update status." };
  }

  // 3. Record timeline event
  if (oldStatus !== newStatus) {
    try {
      await supabase.from("application_events").insert({
        application_id: applicationId,
        event_type: "status_changed",
        status: newStatus,
        data: {
          from: oldStatus,
          to: newStatus,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (evtErr) {
      console.warn("Failed to record application_event:", evtErr);
    }
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}`);
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
  followUpDate: z.string().optional(),
  source: z.string().trim().max(120).optional(),
  notes: z.string().max(2000).optional(),
  resumeId: z.string().uuid().optional().or(z.literal("")),
  initialStatus: z.enum(["saved", "applied", "assessment", "interview", "offer", "rejected", "analyzing"]).default("analyzing"),
});

export type CreateApplicationState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  applicationId?: string;
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
    followUpDate: formData.get("followUpDate") || undefined,
    source: formData.get("source") || undefined,
    notes: formData.get("notes") || undefined,
    resumeId: formData.get("resumeId") || undefined,
    initialStatus: formData.get("initialStatus") || "analyzing",
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

  // Idempotency: prevent accidental duplicate application creation on rapid double-submit
  const recentThreshold = new Date(Date.now() - 15 * 1000).toISOString();
  const { data: recentApp } = await (supabase
    .from("applications")
    .select("id")
    .eq("user_id", user.id)
    .ilike("company_name", parsed.data.company)
    .ilike("job_title", parsed.data.jobTitle)
    .gte("created_at", recentThreshold)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle() as any);

  if (recentApp) {
    return { success: true, applicationId: recentApp.id };
  }

  // Create or reuse job row
  const { data: existingJob } = await supabase
    .from("jobs")
    .select("id")
    .eq("user_id", user.id)
    .eq("company", parsed.data.company)
    .eq("title", parsed.data.jobTitle)
    .eq("url", parsed.data.jobUrl || "")
    .maybeSingle();

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
        source: parsed.data.source || null,
      })
      .select("id")
      .single();

    if (jobError || !newJob) {
      console.error(jobError);
      return { success: false, message: "Could not create job record." };
    }

    jobId = newJob.id;
  }

  const { data: appData, error: appError } = await supabase.from("applications").insert({
    user_id: user.id,
    job_id: jobId,
    job_title: parsed.data.jobTitle,
    company: parsed.data.company,
    company_name: parsed.data.company,
    job_description: parsed.data.jobDescription || null,
    job_link: parsed.data.jobUrl || null,
    resume_id: parsed.data.resumeId || null,
    status: parsed.data.initialStatus as ApplicationStatus,
    applied_at: parsed.data.applicationDate
      ? new Date(parsed.data.applicationDate).toISOString()
      : new Date().toISOString(),
    follow_up_date: parsed.data.followUpDate 
      ? new Date(parsed.data.followUpDate).toISOString().slice(0, 10)
      : null,
    notes: parsed.data.notes || null,
  } as any).select("id").single();

  if (appError || !appData) {
    console.error(appError);
    return { success: false, message: "Could not create application." };
  }

  // Record initial creation timeline event
  try {
    await supabase.from("application_events").insert({
      application_id: appData.id,
      event_type: "created",
      status: parsed.data.initialStatus,
      data: {
        company: parsed.data.company,
        job_title: parsed.data.jobTitle,
        created_at: new Date().toISOString(),
      },
    });
  } catch {}

  // Enqueue background processing with Inngest
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { inngest } = await import("@/inngest/client");
    await inngest.send({
      name: "application/added",
      data: { 
        application_id: appData.id,
        user_id: user.id,
        access_token: session?.access_token,
      },
    });
  } catch (err) {
    console.error("Failed to trigger Inngest application/added event:", err);
  }

  revalidatePath("/applications");
  revalidatePath("/resumes");
  revalidatePath("/dashboard");
  return { success: true, applicationId: appData.id };
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

  // Verify existence & ownership
  const { data: currentApp, error: fetchErr } = await supabase
    .from("applications")
    .select("id, job_id")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr || !currentApp) {
    return { success: false, message: "Application not found or unauthorized." };
  }

  // Clean up any application-specific child records cleanly
  try {
    await (supabase as any).from("cover_letters_generated").delete().eq("application_id", applicationId);
    await (supabase as any).from("resumes_generated").delete().eq("application_id", applicationId);
    await (supabase as any).from("requirement_map").delete().eq("application_id", applicationId);
    await (supabase as any).from("tailored_resumes").delete().eq("application_id", applicationId);
    await (supabase as any).from("interview_sessions").delete().eq("application_id", applicationId);
    await (supabase as any).from("qa_banks").delete().eq("application_id", applicationId);
    await (supabase as any).from("application_events").delete().eq("application_id", applicationId);
  } catch (cleanErr) {
    console.warn("Cascade cleanup warning:", cleanErr);
  }

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("deleteApplication error:", error);
    return { success: false, message: "Could not delete application." };
  }

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { success: true };
}

// --- Update Application Details ---
export interface UpdateApplicationData {
  company?: string;
  jobTitle?: string;
  jobDescription?: string;
  jobUrl?: string;
  location?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  deadline?: string | null;
  notes?: string;
  status?: ApplicationStatus;
}

export async function updateApplication(
  applicationId: string,
  data: UpdateApplicationData
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Please sign in again." };
  }

  // 1. Fetch current application to verify ownership and get linked job_id
  const { data: currentApp, error: fetchErr } = await supabase
    .from("applications")
    .select("id, job_id, status")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr || !currentApp) {
    return { success: false, message: "Application not found or unauthorized." };
  }

  // 2. Validate status if provided
  if (data.status !== undefined && !VALID_APPLICATION_STATUSES.includes(data.status)) {
    return { success: false, message: `Invalid status value: ${data.status}` };
  }

  // 3. Prepare application update payload
  const appUpdates: Record<string, any> = {};

  if (data.company !== undefined) {
    const cleanCompany = data.company.trim();
    appUpdates.company = cleanCompany;
    appUpdates.company_name = cleanCompany;
  }
  if (data.jobTitle !== undefined) {
    appUpdates.job_title = data.jobTitle.trim();
  }
  if (data.jobDescription !== undefined) {
    appUpdates.job_description = data.jobDescription;
  }
  if (data.jobUrl !== undefined) {
    appUpdates.job_link = data.jobUrl || null;
  }
  if (data.notes !== undefined) {
    appUpdates.notes = data.notes;
  }
  if (data.status !== undefined) {
    appUpdates.status = data.status;
  }

  const { error: appUpdateErr } = await (supabase
    .from("applications")
    .update(appUpdates as any) as any)
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (appUpdateErr) {
    console.error("updateApplication error:", appUpdateErr);
    return { success: false, message: "Could not update application." };
  }

  // 4. Update linked job record if it exists
  if (currentApp.job_id) {
    const jobUpdates: Record<string, any> = {};
    if (data.company !== undefined) jobUpdates.company = data.company.trim();
    if (data.jobTitle !== undefined) jobUpdates.title = data.jobTitle.trim();
    if (data.jobDescription !== undefined) jobUpdates.description = data.jobDescription || null;
    if (data.jobUrl !== undefined) jobUpdates.url = data.jobUrl || null;
    if (data.location !== undefined) jobUpdates.location = data.location || null;
    if (data.salaryMin !== undefined) jobUpdates.salary_min = data.salaryMin;
    if (data.salaryMax !== undefined) jobUpdates.salary_max = data.salaryMax;
    if (data.currency !== undefined) jobUpdates.currency = data.currency;
    if (data.deadline !== undefined) {
      jobUpdates.deadline = data.deadline ? new Date(data.deadline).toISOString().slice(0, 10) : null;
    }

    if (Object.keys(jobUpdates).length > 0) {
      await (supabase
        .from("jobs")
        .update(jobUpdates as any) as any)
        .eq("id", currentApp.job_id)
        .eq("user_id", user.id);
    }
  }

  // 5. Record timeline event if status changed
  if (data.status !== undefined && data.status !== currentApp.status) {
    try {
      await supabase.from("application_events").insert({
        application_id: applicationId,
        event_type: "status_changed",
        status: data.status,
        data: {
          from: currentApp.status,
          to: data.status,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (evtErr) {
      console.warn("Failed to record application_event:", evtErr);
    }
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

// --- Update Application Outcome ---
export async function updateApplicationOutcome(
  applicationId: string,
  data: { outcome_status: string; stage_reached?: string; feedback?: string }
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await (supabase as any)
    .from("applications")
    .update({ 
      outcome: data.outcome_status,
      updated_at: new Date().toISOString() 
    })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, message: "Could not update application outcome." };
  }

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateApplicationNotes(id: string, notes: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { error } = await (supabase as any)
    .from("applications")
    .update({ notes })
    .eq("id", id)
    .eq("user_id", user.id);
    
  if (error) {
    console.error("Error updating application notes:", error);
    return { success: false, error: error.message };
  }
  
  revalidatePath("/applications");
  revalidatePath("/applications/[id]", "page");
  return { success: true };
}

export async function updateApplicationChecklist(id: string, field: string, value: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const updateData: any = {};
  if (field === 'portfolio_verified') updateData.portfolio_verified = value;
  if (field === 'intro_note_sent') updateData.intro_note_sent = value;
  
  if (Object.keys(updateData).length === 0) return { success: false, error: "Invalid field" };

  const { error } = await (supabase as any)
    .from("applications")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id);
    
  if (error) {
    console.error("Error updating application checklist:", error);
    return { success: false, error: error.message };
  }
  
  revalidatePath("/applications/[id]", "page");
  return { success: true };
}

export async function retryApplicationProcessing(applicationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  // Set status back to analyzing
  const { error } = await (supabase as any)
    .from("applications")
    .update({ status: "analyzing" })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, message: "Could not update status." };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { inngest } = await import("@/inngest/client");
    await inngest.send({
      name: "application/added",
      data: { 
        application_id: applicationId,
        user_id: user.id,
        access_token: session?.access_token,
      },
    });
  } catch (err) {
    console.error("Failed to trigger Inngest application/added event:", err);
    return { success: false, message: "Could not trigger background task." };
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}`);
  return { success: true };
}
