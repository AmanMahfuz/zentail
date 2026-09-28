"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Video,
  Target,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Settings,
} from "lucide-react";

interface NavSection {
  title?: string;
  items: Array<{
    name: string;
    href: string;
    icon: any;
    badge?: string;
  }>;
}

const navSections: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Applications", href: "/applications", icon: Briefcase },
      { name: "Resumes", href: "/resumes", icon: FileText },
    ],
  },
  {
    title: "Career & AI Prep",
    items: [
      { name: "Interviews", href: "/interviews", icon: Video, badge: "AI" },
      { name: "Job Matches", href: "/jobs/match", icon: Target },
      { name: "Skills Analysis", href: "/skills", icon: Sparkles },
      { name: "Evidence Vault", href: "/profile/evidence", icon: ShieldCheck },
    ],
  },
  {
    title: "Insights & Config",
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
      {navSections.map((section, idx) => (
        <div key={section.title || idx} className="space-y-0.5">
          {section.title && (
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {section.title}
            </p>
          )}

          {section.items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? "bg-blue-50 text-blue-900 font-semibold"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-blue-600"
                      : "text-zinc-400 group-hover:text-zinc-600"
                  }`}
                />
                <span className="truncate">{item.name}</span>
                {item.badge && (
                  <span
                    className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                      isActive
                        ? "bg-blue-200 text-blue-800"
                        : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
