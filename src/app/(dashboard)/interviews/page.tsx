import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StandaloneDashboardClient } from "./StandaloneDashboardClient";

export default async function InterviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-slate-50/50 min-h-screen">
      <StandaloneDashboardClient />
    </div>
  );
}
