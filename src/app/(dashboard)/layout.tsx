import "@/dom-polyfill";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LayoutDashboard, Briefcase, FileText, CheckCircle2, BarChart3, Video, BookOpen, Users, GraduationCap, Zap } from "lucide-react";
import { SidebarNav } from "./SidebarNav";
import { SignOutButton } from "./SignOutButton";
import { MobileNav } from "./MobileNav";
import { LayoutWrapper } from "./LayoutWrapper";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, full_name")
    .eq("id", user.id)
    .single();

  let isOnboarded = profile?.onboarding_completed === true;

  if (!isOnboarded) {
    const { count: resumeCount } = await supabase
      .from("resume_versions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (resumeCount && resumeCount > 0) {
      isOnboarded = true;
      await (supabase.from("profiles") as any)
        .upsert({ id: user.id, onboarding_completed: true, onboarding_completed_at: new Date().toISOString() }, { onConflict: "id" });
    } else {
      const { count: appCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (appCount && appCount > 0) {
        isOnboarded = true;
        await (supabase.from("profiles") as any)
          .upsert({ id: user.id, onboarding_completed: true, onboarding_completed_at: new Date().toISOString() }, { onConflict: "id" });
      }
    }
  }

  if (!isOnboarded) redirect("/onboarding");

  const fullName = profile?.full_name || (user.user_metadata as any)?.full_name || user.email?.split("@")[0] || "User";
  const initials = fullName
    ? fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <LayoutWrapper
      initials={initials}
      profile={profile || { onboarding_completed: true, full_name: fullName }}
      user={user}
    >
      {children}
    </LayoutWrapper>
  );
}
