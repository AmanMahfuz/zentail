import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canonicalizeResumeData } from "@/lib/resume/map-resume-data";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { markdown, name, data, resumeId } = await req.json();

    if (!markdown && !data) {
      return NextResponse.json({ error: "Markdown or structured resume data is required" }, { status: 400 });
    }

    const canonicalContent = data ? canonicalizeResumeData(data) : { markdown };

    let publicUrl: string | null = null;
    try {
      const fileExt = "md";
      const fileName = `${user.id}/${Date.now()}_builder.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, markdown || JSON.stringify(canonicalContent, null, 2), {
          contentType: "text/markdown",
          upsert: true,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(fileName);
        publicUrl = urlData?.publicUrl || null;
      }
    } catch (err) {
      console.warn("Storage upload notice in builder route:", err);
    }

    // In-place update of existing resume (prevents duplicate versions!)
    if (resumeId) {
      const updatePayload: any = {
        content: canonicalContent,
      };
      if (name) updatePayload.version_label = name;
      if (publicUrl) updatePayload.pdf_url = publicUrl;
      if (data?.theme) updatePayload.theme = data.theme;
      if (data?.theme?.template) updatePayload.template_id = data.theme.template;

      const { data: updated, error: updateError } = await (supabase as any)
        .from("resume_versions")
        .update(updatePayload)
        .eq("id", resumeId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        console.error("DB Update Error:", updateError);
        return NextResponse.json({ error: updateError.message || "Failed to update resume" }, { status: 500 });
      }

      return NextResponse.json({ success: true, id: updated?.id || resumeId });
    }

    // Dynamic version calculation for newly created resume
    const { data: existing } = await (supabase as any)
      .from("resume_versions")
      .select("version_number")
      .eq("user_id", user.id)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVer = (existing?.[0]?.version_number || 0) + 1;

    await (supabase as any)
      .from("resume_versions")
      .update({ is_latest: false })
      .eq("user_id", user.id);

    const { data: inserted, error: dbError } = await (supabase as any).from("resume_versions").insert({
      user_id: user.id,
      version_number: nextVer,
      version_label: name || `Built Resume V${nextVer}`,
      pdf_url: publicUrl,
      origin_type: "built",
      template_id: data?.theme?.template || "original",
      theme: data?.theme || null,
      is_latest: true,
      content: canonicalContent,
    }).select().single();

    if (dbError) {
      console.error("DB Error:", dbError);
      return NextResponse.json({ error: dbError.message || "DB Error" }, { status: 500 });
    }

    // Ensure profile onboarding completed
    await (supabase as any)
      .from("profiles")
      .upsert({
        id: user.id,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      }, { onConflict: "id" });

    return NextResponse.json({ success: true, id: inserted?.id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
