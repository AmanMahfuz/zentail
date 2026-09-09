"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Zap } from "lucide-react";
import { signinAction } from "@/lib/actions/auth";

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signinAction(formData);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #f6f4ff 0%, #ffffff 50%, #f0f4ff 100%)",
      }}
    >
      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 8px 40px rgba(94,76,255,0.10), 0 2px 8px rgba(0,0,0,0.04)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--color-sunset-orange)" }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg" style={{ color: "var(--color-graphite-heading)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Zentail
          </span>
        </div>

        <h1
          className="text-2xl font-semibold mb-1"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-graphite-heading)", letterSpacing: "-0.025em" }}
        >
          Welcome back
        </h1>
        <p className="text-sm mb-7" style={{ color: "var(--color-slate-body)" }}>
          Sign in to continue your job search.
        </p>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-steel-text)" }}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                border: "1.5px solid var(--color-ash-border)",
                backgroundColor: "var(--color-cloud-mist)",
                color: "var(--color-graphite-heading)",
              }}
              onFocus={e => { e.target.style.borderColor = "var(--color-sunset-orange)"; e.target.style.boxShadow = "0 0 0 3px rgba(94,76,255,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--color-ash-border)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-steel-text)" }}>
                Password
              </label>
              <button type="button" className="text-xs font-medium" style={{ color: "var(--color-sunset-orange)" }}>
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPw ? "text" : "password"}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm outline-none transition-all"
                style={{
                  border: "1.5px solid var(--color-ash-border)",
                  backgroundColor: "var(--color-cloud-mist)",
                  color: "var(--color-graphite-heading)",
                }}
                onFocus={e => { e.target.style.borderColor = "var(--color-sunset-orange)"; e.target.style.boxShadow = "0 0 0 3px rgba(94,76,255,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--color-ash-border)"; e.target.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-fog-text)" }}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Keep signed in */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="remember"
              className="w-4 h-4 rounded"
              style={{ accentColor: "var(--color-sunset-orange)" }}
            />
            <span className="text-sm" style={{ color: "var(--color-slate-body)" }}>Keep me signed in</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: "var(--color-sunset-orange)" }}
            onMouseEnter={e => !loading && ((e.target as HTMLElement).style.backgroundColor = "#4c3ede")}
            onMouseLeave={e => !loading && ((e.target as HTMLElement).style.backgroundColor = "var(--color-sunset-orange)")}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--color-slate-body)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold" style={{ color: "var(--color-sunset-orange)" }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
