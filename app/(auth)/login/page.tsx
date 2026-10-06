"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { useToast } from "@/context/ToastContext";
import { clearActiveBusinessId } from "@/lib/business";
import type { AuthResponse } from "@/types";
import { motion } from "motion/react";
import { LogIn, Lock, Mail, Eye, EyeOff, ArrowRight } from "lucide-react";
import KhataLogo from "@/components/KhataLogo";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { fetchBusinesses, selectBusiness } = useBusiness();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiPost<AuthResponse>(
        "/auth/login",
        {
          email: email.trim().toLowerCase(),
          password,
        },
        { withBusinessId: false }
      );

      clearActiveBusinessId();
      setSession(res.user, res.access_token);
      showToast(`Welcome back, ${res.user.name || "User"}!`, "success");

      // Check businesses for direct navigation
      const businesses = await fetchBusinesses();
      if (businesses.length > 0) {
        selectBusiness(businesses[0]);
        router.push("/dashboard");
      } else {
        router.push(res.user.account_type === "staff" ? "/dashboard" : "/businesses");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid email or password. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center mb-3 relative"
        >
          <KhataLogo size={64} />
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5">
          Sign in to access your Khata business accounts
        </p>
      </div>

      {/* Switcher Tabs */}
      <div className="flex bg-neutral-200/90 dark:bg-[#11141a] p-1 rounded-xl mb-4 border border-neutral-300 dark:border-white/10">
        <button
          type="button"
          className="flex-1 py-2 text-xs font-bold rounded-lg bg-white dark:bg-[#202736] text-neutral-900 dark:text-white shadow-sm border border-transparent dark:border-white/15 transition-all flex items-center justify-center gap-1.5"
        >
          <LogIn className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
          <span>Sign In</span>
        </button>
        <Link
          href="/signup"
          className="flex-1 py-2 text-xs font-semibold rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all text-center"
        >
          Create Account
        </Link>
      </div>

      {/* Main Glass Form Card */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl shadow-xl border border-neutral-200/80 dark:border-white/10 p-6 sm:p-8 bg-white dark:bg-[#181d26] relative"
      >
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2.5 font-medium"
          >
            <span className="text-rose-500 font-bold shrink-0">⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-white/10 bg-neutral-50/50 dark:bg-[#11141a] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-neutral-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:underline transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-11 py-2.5 rounded-xl border border-neutral-300 dark:border-white/10 bg-neutral-50/50 dark:bg-[#11141a] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-neutral-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors p-1 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-white/10 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-neutral-900 dark:text-white font-bold hover:underline transition-colors"
          >
            Create free account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
