import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResumeBuilderClient from "../../builder/ResumeBuilderClient";

export default async function ResumeViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: resumeVersion } = await (supabase as any)
    .from("resume_versions")
    .select("parsed_content")
    .eq("id", id)
    .single();

  const initialData = resumeVersion?.parsed_content || undefined;

  return <ResumeBuilderClient initialData={initialData} />;
}
