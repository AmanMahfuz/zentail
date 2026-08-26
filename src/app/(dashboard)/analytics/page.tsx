import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getResumeAnalytics, generateResumeInsight } from "@/lib/actions/analytics";
import AnalyticsClient from "./AnalyticsClient";

export const metadata = {
  title: "Resume Analytics — Zentail",
  description: "See which resume is winning you interviews.",
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const statsResult = await getResumeAnalytics("all");
  const insight =
    statsResult.success && statsResult.data
      ? await generateResumeInsight(statsResult.data)
      : { insight: "", recommendation: "" };

  return (
    <AnalyticsClient
      initialStats={statsResult.data ?? []}
      initialInsight={insight}
    />
  );
}
