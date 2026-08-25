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

    // Get the resume record
    const { data: resume, error: dbError } = await supabase
      .from("resumes")
      .select("file_path, file_url, name")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (dbError || !resume) {
      return new NextResponse("Resume not found", { status: 404 });
    }

    // Fallback: if file_path is missing (old records), extract it from file_url
    const filePath = resume.file_path || resume.file_url?.split("/public/resumes/")[1];
    if (!filePath) {
      return new NextResponse("Invalid file path", { status: 400 });
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Storage download error:", downloadError);
      return new NextResponse("Failed to retrieve PDF", { status: 500 });
    }

    // Return the file with headers to view inline in the browser
    return new NextResponse(fileData, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${resume.name}"`,
      },
    });
  } catch (error) {
    console.error("View resume error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
