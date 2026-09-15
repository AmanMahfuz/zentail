"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Video, FileText, User } from "lucide-react";

const mobileNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Apps", href: "/applications", icon: Briefcase },
  { name: "Resumes", href: "/resumes", icon: FileText },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="hidden max-md:flex fixed bottom-0 inset-x-0 h-16 bg-white border-t border-zinc-200 items-center justify-around z-50 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? "text-blue-600" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-zinc-500"}`} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
