"use server";

import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type ResumeStats = {
  resume_id: string;
  resume_name: string;
  total_applications: number;
  interviews: number;
  offers: number;
  rejections: number;
  interview_rate: number;
  offer_rate: number;
  avg_days_to_interview: number | null;
  is_best: boolean;
  timeline: { date: string; applications: number; interviews: number }[];
};

export async function getResumeAnalytics(
  dateRange: "7" | "30" | "all" = "all"
): Promise<{ success: boolean; data?: ResumeStats[]; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  // Date filter
  let dateFilter = new Date(0).toISOString();
  if (dateRange === "7") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    dateFilter = d.toISOString();
  } else if (dateRange === "30") {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    dateFilter = d.toISOString();
  }

  // Fetch all resumes
  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, name, version_tag, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!resumes || resumes.length === 0) {
    return { success: true, data: [] };
  }

  // Fetch all applications linked to resumes in date range
  const { data: applications } = await supabase
    .from("applications")
    .select("id, resume_id, status, applied_at, updated_at")
    .eq("user_id", user.id)
    .gte("applied_at", dateFilter)
    .not("resume_id", "is", null);

  if (!applications) return { success: true, data: [] };

  const stats: ResumeStats[] = resumes.map((resume) => {
    const apps = applications.filter((a) => a.resume_id === resume.id);
    const total = apps.length;
    const interviews = apps.filter(
      (a) => a.status === "interview" || a.status === "offer"
    ).length;
    const offers = apps.filter((a) => a.status === "offer").length;
    const rejections = apps.filter((a) => a.status === "rejected").length;

    const interview_rate = total > 0 ? Math.round((interviews / total) * 100) : 0;
    const offer_rate = interviews > 0 ? Math.round((offers / interviews) * 100) : 0;

    // Avg days to interview
    const interviewApps = apps.filter(
      (a) => a.status === "interview" || a.status === "offer"
    );
    let avg_days_to_interview: number | null = null;
    if (interviewApps.length > 0) {
      const totalDays = interviewApps.reduce((sum, a) => {
        if (!a.applied_at) return sum;
        const applied = new Date(a.applied_at).getTime();
        const updated = new Date(a.updated_at).getTime();
        return sum + Math.round((updated - applied) / (1000 * 60 * 60 * 24));
      }, 0);
      avg_days_to_interview = Math.round(totalDays / interviewApps.length);
    }

    // Build timeline (group by week)
    const timeline = buildTimeline(
      apps
        .filter((a) => a.applied_at !== null)
        .map((a) => ({ applied_at: a.applied_at as string, status: a.status }))
    );

    return {
      resume_id: resume.id,
      resume_name: resume.name || resume.version_tag || "Untitled Resume",
      total_applications: total,
      interviews,
      offers,
      rejections,
      interview_rate,
      offer_rate,
      avg_days_to_interview,
      is_best: false,
      timeline,
    };
  });

  // Mark best performer (highest interview rate, min 1 application)
  const withApps = stats.filter((s) => s.total_applications > 0);
  if (withApps.length > 0) {
    const best = withApps.reduce((a, b) =>
      a.interview_rate >= b.interview_rate ? a : b
    );
    const idx = stats.findIndex((s) => s.resume_id === best.resume_id);
    if (idx !== -1) stats[idx].is_best = true;
  }

  // Sort: best performer first, then by interview rate
  stats.sort((a, b) => {
    if (a.is_best) return -1;
    if (b.is_best) return 1;
    return b.interview_rate - a.interview_rate;
  });

  return { success: true, data: stats };
}

function buildTimeline(
  apps: { applied_at: string; status: string }[]
): { date: string; applications: number; interviews: number }[] {
  const map: Record<string, { applications: number; interviews: number }> = {};

  apps.forEach((a) => {
    const week = getWeekLabel(a.applied_at);
    if (!map[week]) map[week] = { applications: 0, interviews: 0 };
    map[week].applications++;
    if (a.status === "interview" || a.status === "offer") {
      map[week].interviews++;
    }
  });

  return Object.entries(map)
    .map(([date, vals]) => ({ date, ...vals }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-8); // Last 8 weeks
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  // Round down to Monday
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

export async function generateResumeInsight(
  stats: ResumeStats[]
): Promise<{ insight: string; recommendation: string }> {
  const withApps = stats.filter((s) => s.total_applications > 0);
  if (withApps.length === 0) return { insight: "", recommendation: "" };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { insight: "", recommendation: "" };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a career coach analyzing resume performance data for a job seeker.

Resume performance data:
${JSON.stringify(
  withApps.map((s) => ({
    name: s.resume_name,
    applications: s.total_applications,
    interviews: s.interviews,
    offers: s.offers,
    interview_rate: s.interview_rate + "%",
    avg_days_to_interview: s.avg_days_to_interview,
  })),
  null,
  2
)}

Return a JSON object with exactly two fields:
1. "insight": 1-2 sentences explaining which resume performs best and WHY (use the data, be specific with numbers).
2. "recommendation": 1 clear, specific action the user should take RIGHT NOW (e.g. "Use Resume X for all frontend applications — it gets interviews 2x faster than your other resumes.").

Be honest. If only one resume exists, comment on what the data shows. No markdown, no bullet points. Plain text only.

Respond ONLY with valid JSON: {"insight": "...", "recommendation": "..."}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(result.response.text());
    return {
      insight: parsed.insight || "",
      recommendation: parsed.recommendation || "",
    };
  } catch {
    return { insight: "", recommendation: "" };
  }
}
