import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateCoverLetter } from "@/lib/actions/phase3";
import { CoverLetterCenterClient } from "./CoverLetterCenterClient";

export default async function CoverLetterCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: applicationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: application } = await supabase
    .from("applications")
    .select("id, job:jobs(title, company, description)")
    .eq("id", applicationId)
    .single();

  if (!application) redirect("/applications");
  const job = application.job as any;

  let { data: letterRaw } = await supabase
    .from("cover_letters_generated")
    .select("*")
    .eq("application_id", applicationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let letter: any = letterRaw ?? null;

  if (!letter) {
    const result = await generateCoverLetter(applicationId);
    if (result.success) letter = result.data ?? null;
  }

  return (
    <CoverLetterCenterClient
      applicationId={applicationId}
      jobTitle={job?.title ?? ""}
      company={job?.company ?? ""}
      letter={letter}
    />
  );
}
