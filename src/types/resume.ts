import { z } from "zod";

export const skillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Skill name is required").max(50),
  proficiency: z.enum(["Beginner", "Intermediate", "Expert"]).default("Intermediate"),
  yearsOfExperience: z.number().min(0).max(50).default(0),
});

export const experienceSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Job title is required").max(50),
  company: z.string().min(1, "Company name is required").max(50),
  startDate: z.string().min(1, "Start date is required"), // MM/YYYY format expected
  endDate: z.string().optional(), // Can be empty if currently working
  currentlyWorking: z.boolean().default(false),
  description: z.string().max(1000).optional(),
}).refine(data => {
  if (!data.currentlyWorking && !data.endDate) {
    return false;
  }
  return true;
}, {
  message: "End date is required if not currently working",
  path: ["endDate"]
});

export const educationSchema = z.object({
  id: z.string().optional(),
  degree: z.string().min(1, "Degree is required"),
  university: z.string().min(1, "University is required").max(100),
  specialization: z.string().max(50).optional(),
  graduationYear: z.string().min(4, "Graduation year is required"), // YYYY format
  cgpa: z.number().min(0).max(10).optional(),
});

export const certificationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Certification name is required"),
  organization: z.string().min(1, "Issuing organization is required"),
  dateObtained: z.string().min(1, "Date is required"), // MM/YYYY
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const resumeContentSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  location: z.string().max(50).optional(),
  linkedin: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  summary: z.string().max(1000).optional(),
  skills: z.array(skillSchema).default([]),
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
});

export type Skill = z.infer<typeof skillSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type ResumeContent = z.infer<typeof resumeContentSchema>;

export interface Resume {
  id: string;
  user_id: string;
  type: "master" | "tailored";
  name: string;
  is_default: boolean;
  content: ResumeContent;
  created_at: string;
  updated_at: string;
  version: number;
  pdf_url?: string | null;
}
