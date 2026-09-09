import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResumeBuilderClient from "../../builder/ResumeBuilderClient";

export default async function ResumeEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Passing ResumeBuilderClient without props for now, to ensure the button doesn't 404
  return <ResumeBuilderClient />;
}
