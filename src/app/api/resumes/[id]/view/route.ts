import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the resume record from resume_versions
    const { data: resume, error: dbError } = await (supabase as any)
      .from("resume_versions")
      .select("pdf_url, version_label")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (dbError || !resume) {
      return new NextResponse("Resume not found", { status: 404 });
    }

    if (resume.pdf_url) {
      const res = await fetch(resume.pdf_url);
      if (res.ok) {
        const fileBuffer = await res.arrayBuffer();
        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${resume.version_label || "resume"}.pdf"`,
          },
        });
      }
    }

    return new NextResponse("PDF not available for this version", { status: 404 });
  } catch (error) {
    console.error("View resume error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
