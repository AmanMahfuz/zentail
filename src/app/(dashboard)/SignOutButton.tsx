"use client";

import { LogOut } from "lucide-react";
import { signoutAction } from "@/lib/actions/auth";

export function SignOutButton() {
  return (
    <form action={signoutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-50 hover:text-red-600"
        style={{ color: "var(--color-slate-body)" }}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Sign Out
      </button>
    </form>
  );
}
