"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validation/onboarding.schema";

export type OnboardingState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function completeOnboarding(
  _previousState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const rawData = {
    targetRoles: JSON.parse(String(formData.get("targetRoles") ?? "[]")),
    primaryTargetRole: String(formData.get("primaryTargetRole") ?? ""),
    experienceLevel: String(formData.get("experienceLevel") ?? ""),
    experienceYears: formData.get("experienceYears"),
    locationPreference: String(formData.get("locationPreference") ?? ""),
    workPreference: JSON.parse(String(formData.get("workPreference") ?? "[]")),
    linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
  };

  const parsed = onboardingSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "Please sign in again.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      target_roles: parsed.data.targetRoles,
      primary_target_role: parsed.data.primaryTargetRole,
      target_role: parsed.data.primaryTargetRole, // keeping backwards compatibility for now
      experience_level: parsed.data.experienceLevel,
      experience_years: parsed.data.experienceYears,
      location_preference: parsed.data.locationPreference,
      linkedin_url: parsed.data.linkedinUrl || null,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      success: false,
      message: "Your profile could not be saved. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
