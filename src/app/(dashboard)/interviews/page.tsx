import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInterviews } from "@/lib/actions/interviews";
import InterviewsClient from "./InterviewsClient";

export const metadata = {
  title: "Interviews — Zentail",
  description: "Manage your upcoming interviews and prep workspaces.",
};

export default async function InterviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const res = await getInterviews();

  return <InterviewsClient initialInterviews={res.data || []} />;
}
