import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, Shield, Bell, Sparkles } from "lucide-react";
import { SignOutButton } from "../SignOutButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">
          Settings
        </h1>
        <p className="text-sm text-zinc-500">
          Manage your account preferences and application workspace.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Profile Information</h2>
              <p className="text-xs text-zinc-500">Your personal details shown on your applications</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <div className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                {profile?.full_name || "Not set"}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">
                Current Role
              </label>
              <div className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                {(profile as any)?.current_role || (profile as any)?.target_role || "Professional"}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">
                Account Status
              </label>
              <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active (Free Tier)
              </div>
            </div>
          </div>
        </div>

        {/* AI & Automation Preferences */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">AI Application Engine</h2>
              <p className="text-xs text-zinc-500">How Zentail analyzes and tailors your resumes</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-xl border border-zinc-100">
              <div>
                <p className="text-sm font-medium text-zinc-900">Honest Fit Score Mode</p>
                <p className="text-xs text-zinc-500">Evaluates actual matched criteria without artificial inflation</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
                Enabled
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-xl border border-zinc-100">
              <div>
                <p className="text-sm font-medium text-zinc-900">Auto-Draft Application Evidence</p>
                <p className="text-xs text-zinc-500">Extracts skills & achievements into your Evidence Base</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
                Enabled
              </span>
            </div>
          </div>
        </div>

        {/* Sign Out Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Sign Out</h3>
            <p className="text-xs text-zinc-500">Log out of your active session on this device</p>
          </div>
          <div className="w-32">
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
