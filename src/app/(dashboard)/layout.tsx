import "@/dom-polyfill";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LayoutDashboard, Briefcase, FileText, CheckCircle2, BarChart3, Video, BookOpen, Users, GraduationCap, Zap } from "lucide-react";
import { SidebarNav } from "./SidebarNav";
import { SignOutButton } from "./SignOutButton";
import { MobileNav } from "./MobileNav";

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
    <div className="flex min-h-screen w-full bg-zinc-50">

      {/* ── Sidebar (Desktop) ──────────────────────────────────────── */}
      <aside className="max-md:hidden flex w-60 flex-col fixed inset-y-0 z-20 bg-white border-r border-zinc-200">
        
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-zinc-200">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded flex items-center justify-center transition-all group-hover:scale-105 bg-blue-600">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-zinc-900">
              Zentail
            </span>
          </Link>
        </div>

        {/* Nav */}
        <SidebarNav />

        {/* User footer */}
        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold bg-zinc-100 text-zinc-900 border border-zinc-200">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-zinc-900">
                {profile.full_name || "User"}
              </p>
              <p className="text-xs truncate text-zinc-500">
                {user.email}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Mobile Top Header ──────────────────────────────────────── */}
      <div className="hidden max-md:flex fixed top-0 inset-x-0 h-14 bg-white border-b border-zinc-200 items-center justify-between px-4 z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-blue-600">
            <Zap className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="text-base font-semibold tracking-tight text-zinc-900">
            Zentail <span className="text-zinc-500 font-normal">Dashboard</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button className="relative text-zinc-500 hover:text-zinc-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold bg-zinc-100 text-zinc-900 border border-zinc-200 overflow-hidden">
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || "User")}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────── */}
      <main className="flex-1 ml-60 max-md:ml-0 h-[100dvh] pt-0 max-md:pt-14 pb-0 max-md:pb-16 overflow-y-auto overflow-x-hidden flex flex-col">
        {children}
      </main>

      {/* ── Mobile Bottom Nav ──────────────────────────────────────── */}
      <MobileNav />
    </div>
  );
}
