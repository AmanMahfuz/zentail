"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, FileText, CheckCircle2,
  BarChart3, Video, BookOpen, Users, GraduationCap,
} from "lucide-react";

const navItems = [
  { name: "Dashboard",         href: "/dashboard",    icon: LayoutDashboard },
  { name: "Applications",      href: "/applications", icon: Briefcase },
  { name: "Interviews",        href: "/interviews",   icon: Video,         badge: "NEW" },
  { name: "Resumes",           href: "/resumes",      icon: FileText },
  { name: "Job Matcher",       href: "/jobs/match",   icon: CheckCircle2,  badge: "AI" },
  { name: "Skills & Learning", href: "/skills",       icon: BookOpen,      badge: "NEW" },
  { name: "Analytics",         href: "/analytics",    icon: BarChart3 },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {/* Section label */}
      <p
        className="px-3 py-2 text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--color-fog-text)" }}
      >
        Workspace
      </p>

      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group"
            style={{
              backgroundColor: isActive ? "var(--color-sunset-whisper)" : "transparent",
              color: isActive ? "var(--color-sunset-orange)" : "var(--color-slate-body)",
            }}
            onMouseEnter={e => {
              if (!isActive) {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--color-cloud-mist)";
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-graphite-heading)";
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-slate-body)";
              }
            }}
          >
            <Icon
              className="h-4 w-4 shrink-0 transition-colors"
              style={{ color: isActive ? "var(--color-sunset-orange)" : "var(--color-steel-text)" }}
            />
            <span className="truncate">{item.name}</span>
            {item.badge && (
              <span
                className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                style={{
                  backgroundColor: isActive ? "var(--color-sunset-wash)" : "var(--color-frost-tint)",
                  color: isActive ? "var(--color-sunset-orange)" : "var(--color-steel-text)",
                }}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}

      {/* Coming Soon section */}
      <div className="pt-4">
        <p
          className="px-3 py-2 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-fog-text)" }}
        >
          Coming Soon
        </p>
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed select-none opacity-40"
          style={{ color: "var(--color-slate-body)" }}
        >
          <Users className="h-4 w-4" style={{ color: "var(--color-steel-text)" }} />
          Network
        </div>
      </div>
    </nav>
  );
}
