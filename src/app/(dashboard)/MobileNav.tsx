"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, FileText, Video, User } from "lucide-react";

const mobileNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Jobs", href: "/applications", icon: Briefcase },
  { name: "Resumes", href: "/resumes", icon: FileText },
  { name: "Interviews", href: "/interviews", icon: Video },
  { name: "Profile", href: "/resume", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="hidden max-md:flex fixed bottom-0 inset-x-0 h-16 bg-white border-t border-slate-200 items-center justify-around z-50 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {mobileNavItems.map((item) => {
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
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
            <span className="text-[11px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
