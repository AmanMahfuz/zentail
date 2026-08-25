import "@/dom-polyfill";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LayoutDashboard, Briefcase, FileText, BarChart3, Users, Settings, LogOut, CheckCircle2 } from "lucide-react";
import { signoutAction } from "@/lib/actions/auth";
import { SidebarNav } from "./SidebarNav";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-blue-600 rounded p-1.5 shadow-sm">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Zentail</span>
          </Link>
        </div>
        
        <SidebarNav />

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold truncate">{profile.full_name || "User"}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <form action={signoutAction}>
            <button type="submit" className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut className="h-5 w-5" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-y-auto p-8 relative flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  );
}
