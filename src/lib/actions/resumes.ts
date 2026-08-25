"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function uploadResume(formData: FormData): Promise<{ success: boolean; message?: string }> {
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

  // 1. Upload to Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(fileName, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return { success: false, message: "Failed to upload file to storage." };
  }

  // 2. Get public URL (or signed URL). Since bucket might be private, we will use createSignedUrl in a real app,
  // but for MVP if it's public we use getPublicUrl. Assuming public or we get public URL anyway.
  const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(fileName);

  // 3. Insert into resumes table
  const { error: dbError } = await supabase.from("resumes").insert({
    user_id: user.id,
    name: resumeName || file.name, // Custom name or fallback to original filename
    file_url: urlData.publicUrl, // keeping for backwards compatibility if needed
    file_path: fileName,
    version_tag: resumeName || "Default", // Also store in version_tag for backwards compatibility
  });

  if (dbError) {
    console.error("DB insert error:", dbError);
    return { success: false, message: "Failed to save resume record." };
  }

  revalidatePath("/resumes");
  return { success: true };
}
