"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, FileText, CheckCircle2, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Applications", href: "/applications", icon: Briefcase },
    { name: "Resumes", href: "/resumes", icon: FileText },
    { name: "Job Matcher", href: "/jobs/match", icon: CheckCircle2, badge: "AI" },
    { name: "Analytics", href: "/analytics", icon: BarChart3, badge: "NEW" },
  ];

  return (
    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-blue-50 text-blue-700" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-slate-400")} /> 
            {item.name}
            {item.badge && (
              <span className={cn(
                "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                isActive ? "bg-blue-200 text-blue-800" : "bg-blue-100 text-blue-700"
              )}>
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}

      <div className="pt-6 pb-2 px-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Coming Soon</p>
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 cursor-not-allowed opacity-60">
        <Users className="h-5 w-5 text-slate-400" /> Network
      </div>
    </nav>
  );
}
