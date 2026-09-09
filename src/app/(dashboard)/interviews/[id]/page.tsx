import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInterviewDetails } from "@/lib/actions/interviews";
import PrepWorkspaceClient from "./PrepWorkspaceClient";

export const metadata = {
  title: "Interview Workspace — Zentail",
};

export default async function InterviewWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const res = await getInterviewDetails(id);

  if (!res.success || !res.interview) {
    redirect("/interviews");
  }

  return (
    <PrepWorkspaceClient
      interview={res.interview}
      prep={res.prep}
    />
  );
}
