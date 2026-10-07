"use client";

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import KhataLogo from "@/components/KhataLogo";
import { motion, useScroll, useSpring } from "motion/react";
import {
  FileText,
  BookOpen,
  Users,
  Printer,
  Share2,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Check,
  Receipt,
  Wallet,
  Package,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Smartphone,
  Store,
  Boxes,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Scroll Progress Bar attached to the bottom edge of the fixed navbar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const FAQS = [
    {
      q: "How does FISTA Accounts keep my accounts balanced automatically?",
      a: "Every time you enter a sale, payment, or expense, FISTA Accounts automatically updates your customer balance, cash in hand, and inventory. No manual calculation or complex accounting knowledge is needed.",
    },
    {
      q: "How do I share bills with customers on WhatsApp?",
      a: "With one tap on any sale, FISTA Accounts generates an invoice summary that you can send directly to your customer on WhatsApp with the amount due and bill link.",
    },
    {
      q: "Can I print receipts on small thermal POS receipt printers?",
      a: "Yes. FISTA Accounts has built-in support for 80mm and 58mm thermal counter printers as well as standard full-page A4 invoices.",
    },
    {
      q: "Can I add cashiers or staff without showing business profits?",
      a: "Yes. You can invite staff members with restricted permissions so they can enter sales and customer payments without seeing your net profit, total investment, or sensitive reports.",
    },
    {
      q: "Can I manage more than one shop or branch?",
      a: "Yes. You can create multiple businesses inside one FISTA Accounts account and switch between them anytime with a single click.",
    },
    {
      q: "Is my business data secure and backed up?",
      a: "All records are securely encrypted and automatically backed up to the cloud. You will never lose your customer ledgers or transaction history, even if you change your phone or computer.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#11141a] text-slate-800 dark:text-slate-100 transition-colors duration-200 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Subtle Ambient Background Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-white/[0.03] to-transparent blur-[140px] pointer-events-none" />

      {/* ------------------------------------------------------------------- */}
      {/* 1. FIXED TOP NAVIGATION BAR WITH INTEGRATED SCROLL PROGRESS        */}
      {/* ------------------------------------------------------------------- */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-[#11141a]/90 border-b border-slate-200/80 dark:border-white/[0.08] transition-colors">
        {/* Scroll Progress Bar fixed to the bottom edge of the navbar */}
        <motion.div
          style={{ scaleX }}
          className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-neutral-900 dark:bg-white origin-left pointer-events-none"
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo with Official Khata Digital System Icon */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <KhataLogo size={34} />
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                FISTA Accounts
              </span>
            </Link>

            {/* Exactly 3 Clean Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <a
                href="#features"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#faq"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                FAQ
              </a>
            </div>

            {/* Header Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.05]"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown - Exactly 3 links */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-white/[0.08] px-4 pt-2 pb-4 space-y-2 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-xl">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            >
              How It Works
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            >
              FAQ
            </a>
            <div className="pt-2 border-t border-slate-200 dark:border-white/[0.08] flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="w-full text-center py-2 text-xs font-bold text-white bg-blue-600 rounded-lg shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ------------------------------------------------------------------- */}
      {/* 2. HERO SECTION - LEFT-ALIGNED WITH ELEGANT TYPOGRAPHY & STAT PILL  */}
      {/* ------------------------------------------------------------------- */}
      <section className="relative pt-32 pb-14 sm:pt-40 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="max-w-3xl text-left">
          {/* Status Subtitle Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/5 dark:bg-white/[0.06] border border-slate-300/60 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-6 shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Digital Accounting &amp; Ledger Platform</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.12]"
          >
            Your business accounts,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-neutral-400">
              made effortless.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl"
          >
            Record daily sales, track customer udhaar, and manage shop cash in
            seconds. Send bills directly on WhatsApp and keep your accounts
            automatically balanced — no accounting knowledge required.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center gap-3.5"
          >
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-semibold text-sm shadow-md transition-all flex items-center gap-2 active:scale-[0.98]"
            >
              <span>Start Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="px-6 py-3.5 rounded-xl bg-white dark:bg-[#181d26] hover:bg-neutral-100 dark:hover:bg-[#202733] text-neutral-800 dark:text-neutral-200 font-semibold text-sm border border-neutral-300 dark:border-white/10 transition-all flex items-center gap-2 active:scale-[0.98]"
            >
              <span>See Features</span>
            </a>
          </motion.div>

          {/* Key Trust Points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex flex-wrap items-center gap-6 text-xs text-neutral-500 dark:text-neutral-400 font-medium"
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Automated
              Double-Entry
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Bill
              Sharing
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Thermal POS
              Ready
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Multi-Branch
              Support
            </span>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 3. CORE FEATURES - BEAUTIFUL FISTA-STYLE DARK HARMONY CARDS        */}
      {/* ------------------------------------------------------------------- */}
      <section
        id="features"
        className="py-20 bg-slate-100/60 dark:bg-[#141923] border-y border-slate-200/80 dark:border-white/[0.08] px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-14"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-full bg-neutral-200/60 dark:bg-white/[0.06] border border-neutral-300/60 dark:border-white/10">
              Complete Accounting Toolkit
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight mt-3">
              Everything your shop or business needs
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm mt-3 leading-relaxed">
              Designed specifically for merchants, distributors, and business
              owners who want reliable accounts without complicated software.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Customer Udhaar & Digital Khata */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="p-6 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200/80 dark:border-white/[0.08] hover:border-neutral-400 dark:hover:border-white/20 transition-all hover:-translate-y-1 group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/[0.08] border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Customer &amp; Supplier Udhaar
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs mt-2 leading-relaxed">
                Record credit sales and payments in 3 seconds. Each customer
                gets their own automated digital ledger with real-time balance
                calculations.
              </p>
            </motion.div>

            {/* Feature 2: 1-Tap WhatsApp Billing */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="p-6 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200/80 dark:border-white/[0.08] hover:border-neutral-400 dark:hover:border-white/20 transition-all hover:-translate-y-1 group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/[0.08] border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                1-Tap WhatsApp Billing
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs mt-2 leading-relaxed">
                Send professional digital invoices and polite payment reminders
                directly to your customer&apos;s WhatsApp with full transaction
                breakdown.
              </p>
            </motion.div>

            {/* Feature 3: Daily Cash Drawer & Roznamcha */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-6 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200/80 dark:border-white/[0.08] hover:border-neutral-400 dark:hover:border-white/20 transition-all hover:-translate-y-1 group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/[0.08] border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Daily Cash Drawer &amp; Expenses
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs mt-2 leading-relaxed">
                Track opening cash, daytime expenses (shop electricity, chai,
                courier), and counter cash in. Reconcile daily drawer balance
                with zero discrepancies.
              </p>
            </motion.div>

            {/* Feature 4: Smart Stock & Inventory Tracking */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="p-6 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200/80 dark:border-white/[0.08] hover:border-neutral-400 dark:hover:border-white/20 transition-all hover:-translate-y-1 group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/[0.08] border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Inventory &amp; Low-Stock Alerts
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs mt-2 leading-relaxed">
                Product stock auto-decreases when you punch sales and increases
                on purchases. Get instant alerts when items reach low threshold.
              </p>
            </motion.div>

            {/* Feature 5: Thermal Receipt & POS Printer Ready */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="p-6 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200/80 dark:border-white/[0.08] hover:border-neutral-400 dark:hover:border-white/20 transition-all hover:-translate-y-1 group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/[0.08] border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Thermal POS Receipt Printing
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs mt-2 leading-relaxed">
                Instant counter receipts formatted specifically for standard
                80mm and 58mm thermal printers. Perfect for grocery stores and
                busy counters.
              </p>
            </motion.div>

            {/* Feature 6: Staff Permissions & Profit Privacy */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="p-6 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200/80 dark:border-white/[0.08] hover:border-neutral-400 dark:hover:border-white/20 transition-all hover:-translate-y-1 group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/[0.08] border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Staff Access &amp; Privacy Lock
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs mt-2 leading-relaxed">
                Give cashiers permission to enter transactions without exposing
                your net profit margins, total capital, or financial ledger
                history.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 4. HOW IT WORKS - 3 SIMPLE STEPS                                    */}
      {/* ------------------------------------------------------------------- */}
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-full bg-neutral-200/60 dark:bg-white/[0.06] border border-neutral-300/60 dark:border-white/10">
            Effortless Onboarding
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight mt-3">
            Start in 3 easy steps
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm mt-3">
            No accounting training or complex setup required. You will be up and
            running in less than two minutes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-6 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200/80 dark:border-white/[0.08] relative hover:-translate-y-1 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-extrabold text-xs flex items-center justify-center mb-4 shadow-xs">
              1
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Add Your Shop &amp; Customers
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-xs mt-2 leading-relaxed">
              Create your business profile, add your regular customers or
              suppliers with their phone numbers, and set up your initial stock
              items.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200/80 dark:border-white/[0.08] relative hover:-translate-y-1 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-extrabold text-xs flex items-center justify-center mb-4 shadow-xs">
              2
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Record Sales &amp; Payments
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-xs mt-2 leading-relaxed">
              Punch sales, enter cash collections, or record shop expenses.
              Every ledger balance and inventory count updates instantaneously.
            </p>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200/80 dark:border-white/[0.08] relative hover:-translate-y-1 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-extrabold text-xs flex items-center justify-center mb-4 shadow-xs">
              3
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Send Bills &amp; Track Profits
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-xs mt-2 leading-relaxed">
              Share instant WhatsApp invoice links, print thermal slips, and
              view your daily revenue and net profits with crystal clarity.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 5. SOLUTIONS BY INDUSTRY - WHO USES KHATA                           */}
      {/* ------------------------------------------------------------------- */}
      <section
        id="solutions"
        className="py-20 bg-slate-100/60 dark:bg-[#141923] border-y border-slate-200/80 dark:border-white/[0.08] px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-14"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-full bg-neutral-200/60 dark:bg-white/[0.06] border border-neutral-300/60 dark:border-white/10">
              Built For Your Industry
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight mt-3">
              Trusted across diverse retail and wholesale trades
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm mt-3">
              Tailored workflows that match how actual local businesses operate
              every single day.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="p-5 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200/80 dark:border-white/[0.08] hover:-translate-y-1 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/10 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
                <Store className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Retail &amp; Supermarkets
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
                Fast counter billing, quick thermal POS printing, and
                neighborhood monthly customer credit tracking.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="p-5 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200/80 dark:border-white/[0.08] hover:-translate-y-1 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/10 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
                <Boxes className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Wholesalers &amp; Distributors
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
                Large bulk party ledgers, partial payment tracking, supply
                receipts, and customer aging statements.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-5 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200/80 dark:border-white/[0.08] hover:-translate-y-1 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/10 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
                <Smartphone className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Mobile &amp; Electronics
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
                Track unit inventory, punch warranty invoices, and maintain
                customer installment records with ease.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="p-5 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200/80 dark:border-white/[0.08] hover:-translate-y-1 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/10 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Pharmacies &amp; Boutiques
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
                Itemized billing, supplier purchase invoices, and automated
                daily cash book reconciliation.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 6. COMPARISON TABLE - KHATA VS PAPER VS SPREADSHEETS                */}
      {/* ------------------------------------------------------------------- */}
      <section
        id="comparison"
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-xl mx-auto mb-12"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-full bg-neutral-200/60 dark:bg-white/[0.06] border border-neutral-300/60 dark:border-white/10">
            Why Upgrade
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight mt-3">
            Why businesses choose FISTA Accounts
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm mt-2">
            See how FISTA Accounts transforms traditional bookkeeping into an effortless
            digital process.
          </p>
        </motion.div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-lg bg-white dark:bg-[#181d26]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#141923]">
                <th className="py-4 px-5 font-bold text-slate-900 dark:text-white">
                  Capability
                </th>
                <th className="py-4 px-5 font-bold text-slate-500 dark:text-slate-400">
                  Paper Notebooks
                </th>
                <th className="py-4 px-5 font-bold text-slate-500 dark:text-slate-400">
                  Generic Spreadsheets
                </th>
                <th className="py-4 px-5 font-extrabold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/[0.06]">
                  FISTA Accounts Digital System
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/[0.05]">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                  Automatic Math &amp; Balance Updates
                </td>
                <td className="py-3.5 px-5 text-rose-500">
                  Manual (error-prone)
                </td>
                <td className="py-3.5 px-5 text-amber-500">
                  Formula dependent
                </td>
                <td className="py-3.5 px-5 font-bold text-emerald-600 dark:text-emerald-400 bg-neutral-100/50 dark:bg-white/[0.04]">
                  ✓ Instant &amp; 100% Guaranteed
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                  1-Click WhatsApp Invoices
                </td>
                <td className="py-3.5 px-5 text-rose-500">Not possible</td>
                <td className="py-3.5 px-5 text-rose-500">
                  Complex export required
                </td>
                <td className="py-3.5 px-5 font-bold text-emerald-600 dark:text-emerald-400 bg-neutral-100/50 dark:bg-white/[0.04]">
                  ✓ 1-Tap Built In
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                  Thermal POS Receipt Support
                </td>
                <td className="py-3.5 px-5 text-rose-500">Handwritten only</td>
                <td className="py-3.5 px-5 text-rose-500">
                  Difficult formatting
                </td>
                <td className="py-3.5 px-5 font-bold text-emerald-600 dark:text-emerald-400 bg-neutral-100/50 dark:bg-white/[0.04]">
                  ✓ 80mm &amp; 58mm POS Ready
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                  Staff Role Controls (Hide Profits)
                </td>
                <td className="py-3.5 px-5 text-rose-500">Zero privacy</td>
                <td className="py-3.5 px-5 text-rose-500">All data visible</td>
                <td className="py-3.5 px-5 font-bold text-emerald-600 dark:text-emerald-400 bg-neutral-100/50 dark:bg-white/[0.04]">
                  ✓ Granular Staff Permissions
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                  Cloud Backup &amp; Device Sync
                </td>
                <td className="py-3.5 px-5 text-rose-500">
                  Risk of loss/theft/damage
                </td>
                <td className="py-3.5 px-5 text-amber-500">
                  Manual upload needed
                </td>
                <td className="py-3.5 px-5 font-bold text-emerald-600 dark:text-emerald-400 bg-neutral-100/50 dark:bg-white/[0.04]">
                  ✓ Automatic Encrypted Cloud Sync
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 7. FREQUENTLY ASKED QUESTIONS (ACCORDION)                           */}
      {/* ------------------------------------------------------------------- */}
      <section
        id="faq"
        className="py-20 bg-slate-100/60 dark:bg-[#141923] border-y border-slate-200/80 dark:border-white/[0.08] px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-full bg-neutral-200/60 dark:bg-white/[0.06] border border-neutral-300/60 dark:border-white/10">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight mt-3">
              Frequently Asked Questions
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm mt-2">
              Everything you need to know about setting up and using Khata for
              your daily business.
            </p>
          </motion.div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#181d26] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full py-4 px-5 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      activeFaq === idx
                        ? "rotate-180 text-neutral-900 dark:text-white"
                        : ""
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/[0.04] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 8. BOTTOM CALL TO ACTION BANNER                                     */}
      {/* ------------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-neutral-900 dark:bg-[#181d26] border border-neutral-800 dark:border-white/10 text-white shadow-2xl relative overflow-hidden">
          {/* Subtle ambient lighting */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/[0.04] rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Ready to simplify your business accounts?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-neutral-300 dark:text-neutral-400 leading-relaxed">
              Join businesses managing their daily sales, customer ledgers, and
              cash with total confidence.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="px-6 py-3 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
              >
                Create Free Account
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs sm:text-sm border border-white/10 transition-all active:scale-[0.98]"
              >
                Sign In to FISTA Accounts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 9. FOOTER                                                           */}
      {/* ------------------------------------------------------------------- */}
      <footer className="border-t border-slate-200/80 dark:border-white/[0.08] py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#11141a]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <KhataLogo size={30} />
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                FISTA Accounts
              </span>
              <p className="text-[10px] text-slate-400">
                Digital Accounting &amp; Ledger Bookkeeping System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <a
              href="#features"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#faq"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              FAQ
            </a>
            <Link
              href="/login"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Sign In
            </Link>
          </div>

          <p className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} Khata. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
