import { z } from "zod";

const experienceLevels = [
  "student",
  "fresher",
  "0_1_years",
  "1_3_years",
  "3_5_years",
  "5_plus_years",
] as const;

export const onboardingSchema = z
  .object({
    targetRoles: z
      .array(
        z.string().trim().min(2).max(80).regex(/^[a-zA-Z0-9\s\-_,&]+$/, "Roles can only contain letters, numbers, spaces, and basic punctuation")
      )
      .min(1, "Choose at least one target role.")
      .max(3, "Choose up to three target roles."),
    primaryTargetRole: z.string().trim().min(2).max(80),
    experienceLevel: z.enum(experienceLevels),
    experienceYears: z.coerce.number().int().min(0).max(50),
    locationPreference: z.string().trim().min(2).max(120),
    workPreference: z
      .array(z.enum(["remote", "hybrid", "onsite"]))
      .max(3)
      .default([]),
    linkedinUrl: z
      .string()
      .trim()
      .url("Enter a valid URL.")
      .refine(
        (url) => url.includes("linkedin.com"),
        "Use a LinkedIn profile URL."
      )
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    // 1. Primary role must exist in targetRoles
    if (!data.targetRoles.includes(data.primaryTargetRole)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["primaryTargetRole"],
        message: "Primary role must be one of your selected roles.",
      });
    }

    // 2. Misleading experience correlation check
    if (
      (data.experienceLevel === "student" || data.experienceLevel === "fresher") &&
      data.experienceYears > 1
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["experienceYears"],
        message: "Experience years must be 0 or 1 for students/freshers.",
      });
    }

    if (data.experienceLevel === "5_plus_years" && data.experienceYears < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["experienceYears"],
        message: "Experience years must be at least 5 for '5+ years' level.",
      });
    }
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;
