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

  if (!profile?.onboarding_completed) redirect("/onboarding");

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <LayoutWrapper
      initials={initials}
      profile={profile}
      user={user}
    >
      {children}
    </LayoutWrapper>
  );
}
