import { NextRequest, NextResponse } from "next/server";
import { parseResume } from "@/lib/agents/resume-parser";
import { createClient, createAuthClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    const supabase = token ? createAuthClient(token) : await createClient();
    const {
      data: { user },
    } = await (token ? supabase.auth.getUser(token) : supabase.auth.getUser());

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide resume text with at least 20 characters." },
        { status: 400 }
      );
    }

    const parsed = await parseResume(text);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("[api/resume/parse] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse resume" },
      { status: 500 }
    );
  }
}
