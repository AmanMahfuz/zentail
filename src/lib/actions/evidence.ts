"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getUserSkills() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_skills")
    .select("*")
    .eq("user_id", user.id)
    .order("skill_name");

  if (error) {
    console.error("Error fetching skills:", error);
    return [];
  }

  return data;
}

export async function addUserSkill(skillName: string, proofStatus: string = 'self_reported', proofDescription: string = '') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase
    .from("user_skills")
    .insert({
      user_id: user.id,
      skill_name: skillName,
      proof_status: proofStatus,
      proof_description: proofDescription,
      proof_links: []
    });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/profile/evidence");
  return { success: true };
}

export async function updateUserSkill(id: string, updates: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase
    .from("user_skills")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/profile/evidence");
  return { success: true };
}

export async function deleteUserSkill(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase
    .from("user_skills")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/profile/evidence");
  return { success: true };
}

export async function getUserProjects() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }

  return data;
}

export async function addUserProject(title: string, description: string, githubUrl: string, liveUrl: string, skills: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase
    .from("user_projects")
    .insert({
      user_id: user.id,
      title,
      description,
      github_url: githubUrl || null,
      live_url: liveUrl || null,
      skills_demonstrated: skills
    });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/profile/evidence");
  return { success: true };
}

export async function deleteUserProject(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase
    .from("user_projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/profile/evidence");
  return { success: true };
}
