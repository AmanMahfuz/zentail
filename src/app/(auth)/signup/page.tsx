"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Zap, Check } from "lucide-react";
import { signupAction } from "@/lib/actions/auth";

function getPasswordStrength(pw: string): { label: string; color: string; bars: number } {
  if (!pw) return { label: "", color: "", bars: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "#ef4444", bars: 1 };
  if (score <= 2) return { label: "Fair", color: "#f59e0b", bars: 2 };
  if (score <= 3) return { label: "Good", color: "#3b82f6", bars: 3 };
  return { label: "Strong", color: "#16a34a", bars: 4 };
}

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [agreed, setAgreed] = useState(false);

  const strength = getPasswordStrength(password);
  const pwMatch = confirmPw === "" || password === confirmPw;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    if (!agreed) { setError("You must agree to the Terms of Service."); return; }
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await signupAction(formData);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  const inputStyle = {
    border: "1.5px solid var(--color-ash-border)",
    backgroundColor: "var(--color-cloud-mist)",
    color: "var(--color-graphite-heading)",
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--color-sunset-orange)";
    e.target.style.boxShadow = "0 0 0 3px rgba(94,76,255,0.1)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--color-ash-border)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #f6f4ff 0%, #ffffff 50%, #f0f4ff 100%)" }}
    >
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

        <h1 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-graphite-heading)", letterSpacing: "-0.025em" }}>
          Create your account
        </h1>
        <p className="text-sm mb-7" style={{ color: "var(--color-slate-body)" }}>
          Free forever. No credit card required.
        </p>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-steel-text)" }}>Full Name</label>
            <input
              name="full_name" required placeholder="Aman Mahfuz"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-steel-text)" }}>Email</label>
            <input
              name="email" type="email" required placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Password + strength meter */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-steel-text)" }}>Password</label>
            <div className="relative">
              <input
                name="password" type={showPw ? "text" : "password"} required
                placeholder="Min. 8 characters"
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm outline-none transition-all"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-fog-text)" }}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Strength bars */}
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="h-1 flex-1 rounded-full transition-all"
                      style={{ backgroundColor: n <= strength.bars ? strength.color : "var(--color-frost-tint)" }} />
                  ))}
                </div>
                <span className="text-[10px] font-bold" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-steel-text)" }}>Confirm Password</label>
            <div className="relative">
              <input
                name="confirm_password" type={showConfirm ? "text" : "password"} required
                placeholder="Repeat password"
                value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm outline-none transition-all"
                style={{
                  ...inputStyle,
                  borderColor: confirmPw && !pwMatch ? "#ef4444" : "var(--color-ash-border)",
                }}
                onFocus={onFocus} onBlur={onBlur}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-fog-text)" }}>
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {confirmPw && pwMatch && (
                <Check className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#16a34a" }} />
              )}
            </div>
            {confirmPw && !pwMatch && (
              <p className="text-xs mt-1" style={{ color: "#ef4444" }}>Passwords don&apos;t match</p>
            )}
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded shrink-0"
              style={{ accentColor: "var(--color-sunset-orange)" }}
            />
            <span className="text-sm" style={{ color: "var(--color-slate-body)" }}>
              I agree to the{" "}
              <span className="font-semibold" style={{ color: "var(--color-sunset-orange)" }}>Terms of Service</span>
              {" "}and{" "}
              <span className="font-semibold" style={{ color: "var(--color-sunset-orange)" }}>Privacy Policy</span>
            </span>
          </label>

          <button
            type="submit" disabled={loading || !agreed || !pwMatch}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: "var(--color-sunset-orange)" }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--color-slate-body)" }}>
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold" style={{ color: "var(--color-sunset-orange)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
