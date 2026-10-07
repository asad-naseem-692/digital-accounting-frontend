"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { clearActiveBusinessId } from "@/lib/business";
import type { AuthResponse } from "@/types";
import { motion } from "motion/react";
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ArrowRight, ShieldCheck } from "lucide-react";
import KhataLogo from "@/components/KhataLogo";

export default function SignupPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiPost<AuthResponse>(
        "/auth/signup",
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
        { withBusinessId: false }
      );

      clearActiveBusinessId();
      setSession(res.user, res.access_token);
      showToast("Account created successfully! Welcome to FISTA Accounts.", "success");
      router.push("/businesses");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create account. Please try again.");
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
          Create an account
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5">
          Join businesses managing their daily accounts on FISTA Accounts
        </p>
      </div>

      {/* Switcher Tabs */}
      <div className="flex bg-neutral-200/90 dark:bg-[#11141a] p-1 rounded-xl mb-4 border border-neutral-300 dark:border-white/10">
        <Link
          href="/login"
          className="flex-1 py-2 text-xs font-semibold rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all text-center"
        >
          Sign In
        </Link>
        <button
          type="button"
          className="flex-1 py-2 text-xs font-bold rounded-lg bg-white dark:bg-[#202736] text-neutral-900 dark:text-white shadow-sm border border-transparent dark:border-white/15 transition-all flex items-center justify-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
          <span>Create Account</span>
        </button>
      </div>

      {/* Main Glass Form Card */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-8 backdrop-blur-xl bg-white/95 dark:bg-[#181d26] relative"
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Asad Naseem"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password (min. 8 characters)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full pl-9 pr-11 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-neutral-950/30 dark:border-t-neutral-950 rounded-full animate-spin" />
                Creating your account...
              </span>
            ) : (
              <>
                <span>Register &amp; Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400">
          Already registered?{" "}
          <Link
            href="/login"
            className="text-neutral-900 dark:text-white font-bold hover:underline transition-colors"
          >
            Sign in here
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
