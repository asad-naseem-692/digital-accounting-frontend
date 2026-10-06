"use client";

import React from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import KhataLogo from "@/components/KhataLogo";
import { motion } from "motion/react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#11141a] text-neutral-800 dark:text-neutral-100 flex flex-col lg:flex-row relative overflow-hidden transition-colors duration-200">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[140px] pointer-events-none" />

      {/* Theme toggle & Back to Home */}
      <div className="absolute top-5 right-6 z-50 flex items-center gap-3">
        <Link
          href="/"
          className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/5 flex items-center gap-1.5"
        >
          <span>←</span> Back to Home
        </Link>
        <ThemeToggle />
      </div>

      {/* LEFT COLUMN: Visual Showcase (Visible on lg screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 xl:p-16 border-r border-neutral-200/80 dark:border-white/10 bg-neutral-100/40 dark:bg-[#141923]">
        {/* Top Brand Tag */}
        <div className="flex items-center gap-3">
          <KhataLogo size={36} />
          <div>
            <span className="font-bold text-xl tracking-tight text-neutral-900 dark:text-white block leading-none">
              Khata
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 dark:text-neutral-400">
              Business Accounts &amp; Billing
            </span>
          </div>
        </div>

        {/* Center Animated Showcase Graphic */}
        <div className="relative my-auto py-8">
          {/* Main Floating Mockup Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="rounded-2xl p-6 shadow-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#181d26] relative z-10 max-w-md mx-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200/60 dark:border-white/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Live Business Overview
                </span>
                <h4 className="text-base font-bold text-neutral-900 dark:text-white">Al-Rehman Enterprises</h4>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Sync
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#11141a] border border-neutral-200/60 dark:border-white/5">
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block font-medium">Cash in Hand</span>
                <span className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">Rs 348,200</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#11141a] border border-neutral-200/60 dark:border-white/5">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">Accounts Receivable</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">Rs 824,000</span>
              </div>
            </div>

            {/* Mini Activity Line */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-neutral-50 dark:bg-[#11141a] border border-neutral-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neutral-400" />
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">Inv #INV-1092</span>
                </div>
                <span className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">Rs 38,500</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-neutral-50 dark:bg-[#11141a] border border-neutral-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">Collection: Tariq Electronics</span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">+Rs 20,000</span>
              </div>
            </div>
          </motion.div>

          {/* Floating Pill Badge 1 */}
          <div className="absolute -top-6 -left-4 z-20 animate-float">
            <div className="px-4 py-2.5 rounded-xl shadow-lg border border-neutral-200/80 dark:border-white/10 flex items-center gap-2.5 bg-white dark:bg-[#181d26]">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
                ✓
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block leading-none font-medium">Automatic Double-Entry</span>
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Zero Math Errors</span>
              </div>
            </div>
          </div>

          {/* Floating Pill Badge 2 */}
          <div className="absolute -bottom-6 -right-4 z-20 animate-float-delayed">
            <div className="px-4 py-2.5 rounded-xl shadow-lg border border-neutral-200/80 dark:border-white/10 flex items-center gap-2.5 bg-white dark:bg-[#181d26]">
              <div className="w-8 h-8 rounded-lg bg-neutral-200/60 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 flex items-center justify-center text-sm font-bold">
                🧾
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block leading-none font-medium">POS &amp; Thermal Receipts</span>
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Instant WhatsApp Bills</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="pt-6 border-t border-neutral-200/60 dark:border-white/10 flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="px-3 py-1 rounded-lg bg-white dark:bg-[#181d26] border border-neutral-200/80 dark:border-white/5 font-medium">
            🔒 Bank-Grade Encryption
          </span>
          <span className="px-3 py-1 rounded-lg bg-white dark:bg-[#181d26] border border-neutral-200/80 dark:border-white/5 font-medium">
            📱 Multi-Staff Role Control
          </span>
          <span className="px-3 py-1 rounded-lg bg-white dark:bg-[#181d26] border border-neutral-200/80 dark:border-white/5 font-medium">
            🧾 80mm/58mm Thermal Print
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 my-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
