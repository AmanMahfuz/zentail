import { NextResponse } from "next/server";
import { createClient, createAuthClient } from "@/lib/supabase/server";
import { canonicalizeResumeData, formatProfileToMarkdown } from "@/lib/resume/map-resume-data";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    const supabase = token ? createAuthClient(token) : await createClient();
    const { data: { user } } = await (token ? supabase.auth.getUser(token) : supabase.auth.getUser());

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { markdown, name, versionLabel, data, resumeId, applicationId } = body;
    const resolvedName = versionLabel || name;

    if (!markdown && !data) {
      return NextResponse.json({ error: "Markdown or structured resume data is required" }, { status: 400 });
    }

    const canonicalContent = data ? canonicalizeResumeData(data) : { markdown };
    const mdContent = markdown || (data ? formatProfileToMarkdown(canonicalContent) : "");

    let publicUrl: string | null = null;
    try {
      const fileExt = "md";
      const fileName = `${user.id}/${Date.now()}_builder.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, mdContent || JSON.stringify(canonicalContent, null, 2), {
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

    // 1. If an applicationId was passed, persist/sync to tailored_resumes
    if (applicationId) {
      try {
        await (supabase as any)
          .from("tailored_resumes")
          .upsert({
            application_id: applicationId,
            resume_markdown: mdContent,
            tailored_content: canonicalContent,
          }, { onConflict: "application_id" });
      } catch (tailorErr) {
        console.warn("tailored_resumes sync notice in builder route:", tailorErr);
      }
    }

    // 2. Removed implicit sync to user_resume to protect the Career Profile.
    // user_resume is now only updated through explicit profile actions.

    // 3. In-place update of existing resume (prevents duplicate versions!)
    if (resumeId) {
      const updatePayload: any = {
        content: canonicalContent,
      };
      if (resolvedName) updatePayload.version_label = resolvedName;
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

      if (!updateError) {
        return NextResponse.json({ success: true, id: updated?.id || resumeId });
      }
      // If resumeId wasn't found in resume_versions (e.g. was applicationId or tailored ID), continue to insert
    }

    // 4. Dynamic version calculation for newly created resume
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
      version_label: resolvedName || (applicationId ? `Tailored Resume V${nextVer}` : `Built Resume V${nextVer}`),
      pdf_url: publicUrl,
      origin_type: applicationId ? "tailored" : "built",
      application_id: applicationId || null,
      template_id: data?.theme?.template || "original",
      theme: data?.theme || null,
      is_latest: true,
      content: canonicalContent,
    }).select().single();

    if (dbError) {
      console.error("DB Error in builder route:", dbError);
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
    console.error("Server error in builder route:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
