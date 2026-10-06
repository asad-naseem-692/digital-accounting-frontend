"use client";

import React, { useState } from "react";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import KhataLogo from "@/components/KhataLogo";

interface RequestResetResponse {
  message: string;
  reset_token?: string;
}

interface MessageResponse {
  message: string;
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError("Please provide your email address.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiPost<RequestResetResponse>(
        "/auth/request-reset",
        { email: email.trim().toLowerCase() },
        { withBusinessId: false }
      );

      if (res.reset_token) {
        setToken(res.reset_token);
        setStep("confirm");
        setSuccessMessage(
          "Reset token generated. For local development, it is pre-filled below."
        );
      } else {
        setSuccessMessage(res.message);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to request password reset.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError("Reset token is required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiPost<MessageResponse>(
        "/auth/confirm-reset",
        {
          token: token.trim(),
          new_password: newPassword,
        },
        { withBusinessId: false }
      );

      setSuccessMessage(res.message || "Password updated successfully. You can now sign in.");
      setStep("request");
      setEmail("");
      setToken("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update password.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center mb-3">
          <KhataLogo size={56} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Reset password
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          {step === "request"
            ? "Enter your email to receive a password reset token"
            : "Enter your new password to complete the reset"}
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-[#181d26] rounded-2xl shadow-xl border border-gray-200 dark:border-white/[0.08] p-6 sm:p-8">
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm rounded-lg flex items-start gap-2.5">
            <span className="text-red-500 font-medium">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-sm rounded-lg flex items-start gap-2.5">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
            >
              {isLoading ? "Generating token..." : "Send Reset Token"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Reset token (Dev Mode)
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste reset token"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                New password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Confirm new password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white transition-all"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("request")}
                className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-slate-200 font-medium rounded-xl text-sm transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/10 text-center text-sm text-gray-500 dark:text-slate-400">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="text-neutral-900 dark:text-white font-bold hover:underline transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
