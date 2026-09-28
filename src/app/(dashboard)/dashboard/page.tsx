import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, primary_target_role")
    .eq("id", user.id)
    .maybeSingle();

  const firstName = profile?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";
  const userName = profile?.full_name ?? user.email?.split("@")[0] ?? "";
  const targetRole = profile?.primary_target_role ?? "";

  return (
    <DashboardClient
      userName={userName}
      firstName={firstName}
      targetRole={targetRole}
    />
  );
}
