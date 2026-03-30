"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { authApi, unwrap } from "@/lib/api";
import { setToken, setRefreshToken } from "@/lib/auth";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; role: string; firstName: string; lastName: string };
}

const STATS = [
  { value: "50K+", label: "Tickets sold" },
  { value: "1,200+", label: "Events hosted" },
  { value: "KES 42M+", label: "Revenue processed" },
];

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      const response = await authApi.login(data.email, data.password);
      const result = unwrap<LoginResponse>(response);
      const adminRoles = ["ADMIN", "SUPER_ADMIN", "ORGANIZER"];
      if (!adminRoles.includes(result.user.role)) {
        setError("Access denied. Admin or Organizer role required.");
        return;
      }
      setToken(result.accessToken);
      if (result.refreshToken) setRefreshToken(result.refreshToken);
      Cookies.set("partypass_token", result.accessToken, { expires: 1 });
      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e?.response?.data?.error?.message || "Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">

      {/* ── Left panel — branding ─────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col justify-between p-12 overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0808] via-[#0d0d1a] to-[#0a0a0f]" />
        <div className="absolute top-[-120px] left-[-80px] w-[480px] h-[480px] rounded-full bg-[#D93B2F]/10 blur-[100px]" />
        <div className="absolute bottom-[-80px] right-[-60px] w-[360px] h-[360px] rounded-full bg-[#D93B2F]/8 blur-[80px]" />
        <div className="absolute top-[40%] left-[60%] w-[200px] h-[200px] rounded-full bg-purple-900/20 blur-[60px]" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D93B2F] flex items-center justify-center shadow-lg shadow-[#D93B2F]/30">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d="M13 2L4.5 13.5H11L9 22L19.5 10H13L13 2Z" fill="white" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">PartyPass</p>
            <p className="text-white/40 text-xs font-medium tracking-widest uppercase">Admin Console</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/60 text-xs font-medium">Platform live · All systems operational</span>
          </div>

          <div>
            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              The OS for<br />
              <span className="text-[#D93B2F]">unforgettable</span><br />
              nights.
            </h1>
            <p className="mt-4 text-white/50 text-base leading-relaxed max-w-sm">
              Manage events, track revenue, and control every moving part of your ticketing platform from one place.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 pt-2">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <div className="flex items-start gap-3">
            <div className="text-[#D93B2F] text-3xl leading-none font-serif">"</div>
            <div>
              <p className="text-white/60 text-sm italic leading-relaxed">
                From door count to final payout — everything in one dashboard.
              </p>
              <p className="text-white/30 text-xs mt-1.5">PartyPass · Nairobi, Kenya</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">

        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div className="w-10 h-10 rounded-xl bg-[#D93B2F] flex items-center justify-center">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d="M13 2L4.5 13.5H11L9 22L19.5 10H13L13 2Z" fill="white" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white font-bold text-lg">PartyPass Admin</span>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white">Welcome back</h2>
            <p className="text-white/40 text-sm mt-1">Sign in to your admin console</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            {error && (
              <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Email address</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="admin@partypass.com"
                {...register("email")}
                className={cn(
                  "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition-colors",
                  "focus:border-[#D93B2F]/60 focus:bg-white/8",
                  errors.email && "border-red-500/50"
                )}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={cn(
                    "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-11 text-sm text-white placeholder:text-white/20 outline-none transition-colors",
                    "focus:border-[#D93B2F]/60 focus:bg-white/8",
                    errors.password && "border-red-500/50"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl bg-[#D93B2F] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#D93B2F]/25 transition-all hover:bg-[#c0342a] hover:shadow-[#D93B2F]/40 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/20">
            Restricted access · Authorised personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
