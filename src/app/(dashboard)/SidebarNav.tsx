"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  FileText,
  Video,
  User,
  LayoutDashboard,
  Settings,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  description?: string;
}

const primaryNavItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & metrics",
  },
  {
    name: "Applications",
    href: "/applications",
    icon: Briefcase,
    badge: "Active",
    description: "Job workspace & pipeline",
  },
  {
    name: "Resumes",
    href: "/resumes",
    icon: FileText,
    description: "Builder, templates & versions",
  },
  {
    name: "Interviews",
    href: "/interviews",
    icon: Video,
    badge: "AI Prep",
    description: "Simulations & Q&A practice",
  },
  {
    name: "Career Profile",
    href: "/resume",
    icon: User,
    badge: "Core",
    description: "Master evidence & skills",
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
      <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Active Workspace
      </div>

      <div className="space-y-1">
        {primaryNavItems.map((item) => {
          let isActive = false;
          if (item.href === "/dashboard") {
            isActive = pathname === "/dashboard";
          } else if (item.href === "/resume") {
            isActive = pathname === "/resume" || (pathname.startsWith("/resume/") && !pathname.startsWith("/resumes"));
          } else if (item.href === "/resumes") {
            isActive = pathname === "/resumes" || pathname.startsWith("/resumes/");
          } else if (item.href === "/interviews") {
            isActive = pathname === "/interviews" || pathname.startsWith("/interviews/");
          } else if (item.href === "/applications") {
            isActive = pathname === "/applications" || pathname.startsWith("/applications/");
          } else {
            isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          }
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-700"
                }`}
              />
              <div className="truncate flex-1">
                <div>{item.name}</div>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-blue-50 text-blue-700 group-hover:bg-blue-100"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
