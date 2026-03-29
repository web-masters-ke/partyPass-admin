"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  user: {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      const response = await authApi.login(data.email, data.password);
      const result = unwrap<LoginResponse>(response);

      // Check admin access
      const adminRoles = ["ADMIN", "SUPER_ADMIN", "ORGANIZER", "CLUB_OWNER"];
      if (!adminRoles.includes(result.user.role)) {
        setError("Access denied. Admin or Organizer role required.");
        return;
      }

      setToken(result.accessToken);
      if (result.refreshToken) {
        setRefreshToken(result.refreshToken);
      }
      // Also set cookie so middleware can check it
      Cookies.set("partypass_token", result.accessToken, { expires: 1 });
      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      const msg =
        e?.response?.data?.error?.message ||
        "Invalid email or password. Please try again.";
      setError(msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo card */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#111827] shadow-xl">
            <Zap className="h-8 w-8 text-[#D93B2F]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">PartyPass Admin</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sign in to manage your platform
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error alert */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@partypass.com"
                autoComplete="email"
                {...register("email")}
                className={cn(errors.email && "border-red-400 focus-visible:ring-red-400")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                  className={cn(
                    "pr-10",
                    errors.password && "border-red-400 focus-visible:ring-red-400"
                  )}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="h-10 w-full text-sm font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">
            Default: admin@partypass.com / PartyPass_Admin2026!
          </p>
        </div>
      </div>
    </div>
  );
}
