"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, FileText, CheckCircle2,
  BarChart3, Video, BookOpen, Users, GraduationCap,
} from "lucide-react";

const navItems: Array<{ name: string; href: string; icon: any; badge?: string }> = [
  { name: "Dashboard",         href: "/dashboard",    icon: LayoutDashboard },
  { name: "Applications",      href: "/applications", icon: Briefcase },
  { name: "Resumes",           href: "/resumes",      icon: FileText },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {/* Section label */}
      <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
        Workspace
      </p>

      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
              isActive 
                ? "bg-zinc-100 text-zinc-900" 
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                isActive ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-600"
              }`}
            />
            <span className="truncate">{item.name}</span>
            {item.badge && (
              <span
                className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200 group-hover:text-zinc-700"
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}

      {/* Coming Soon section */}
      <div className="pt-4">
        <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          Coming Soon
        </p>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed select-none opacity-40 text-zinc-600">
          <Users className="h-4 w-4 text-zinc-400" />
          Network
        </div>
      </div>
    </nav>
  );
}
