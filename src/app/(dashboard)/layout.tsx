import "@/dom-polyfill";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Zap } from "lucide-react";
import { SidebarNav } from "./SidebarNav";
import { SignOutButton } from "./SignOutButton";

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
    <div className="flex min-h-screen w-full" style={{ backgroundColor: "var(--color-cloud-mist)" }}>

      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside
        className="w-60 flex flex-col fixed inset-y-0 z-20"
        style={{
          backgroundColor: "var(--color-canvas-white)",
          borderRight: "1px solid var(--color-ash-border)",
        }}
      >
        {/* Logo */}
        <div
          className="h-14 flex items-center px-5"
          style={{ borderBottom: "1px solid var(--color-ash-border)" }}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div
              className="w-7 h-7 rounded flex items-center justify-center transition-all group-hover:scale-105"
              style={{ backgroundColor: "var(--color-sunset-orange)" }}
            >
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span
              className="text-lg font-semibold tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-graphite-heading)",
                letterSpacing: "-0.03em",
              }}
            >
              Zentail
            </span>
          </Link>
        </div>

        {/* Nav */}
        <SidebarNav />

        {/* User footer */}
        <div
          className="p-4"
          style={{ borderTop: "1px solid var(--color-ash-border)" }}
        >
          <div className="flex items-center gap-3 mb-3 px-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
              style={{
                backgroundColor: "var(--color-sunset-whisper)",
                color: "var(--color-sunset-orange)",
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--color-graphite-heading)" }}
              >
                {profile.full_name || "User"}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--color-steel-text)" }}
              >
                {user.email}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────── */}
      <main className="flex-1 ml-60 h-screen overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
