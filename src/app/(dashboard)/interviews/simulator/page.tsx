import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InterviewSimulatorClient from "./InterviewSimulatorClient";

export default async function InterviewSimulatorPage({ searchParams }: { searchParams: { applicationId?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const applicationId = searchParams.applicationId;
  
  if (!applicationId) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No application selected. Please start an interview from an application board.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <InterviewSimulatorClient applicationId={applicationId} userId={user.id} />
    </div>
  );
}
