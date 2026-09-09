import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { markdown, name } = await req.json();

    if (!markdown) {
      return NextResponse.json({ error: "Markdown is required" }, { status: 400 });
    }

    // Convert markdown to a simple PDF string or just store markdown
    // In a real app we'd generate a PDF buffer here with Puppeteer or react-pdf,
    // upload to storage, and save the URL. For MVP we'll just save it to DB.

    // Let's create a text file as a mock PDF for now, or just save to DB.
    const fileExt = "md";
    const fileName = `${user.id}/${Date.now()}_builder.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, markdown, {
        contentType: "text/markdown",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage error:", uploadError);
      return NextResponse.json({ error: "Storage error" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(fileName);

    const { error: dbError } = await supabase.from("resumes").insert({
      user_id: user.id,
      name: name || "Built Resume",
      file_url: urlData.publicUrl,
      file_path: fileName,
      version_tag: "Builder",
    });

    if (dbError) {
      console.error("DB Error:", dbError);
      return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
