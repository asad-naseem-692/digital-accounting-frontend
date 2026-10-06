"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useBusiness } from "@/context/BusinessContext";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/api";
import type { DashboardOverview, Product, GeneralLedgerItem } from "@/types";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  FileText,
  PackagePlus,
  Receipt,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";

function formatCurrency(amount: number): string {
  return "Rs " + Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeBusiness } = useBusiness();

  const [summary, setSummary] = useState<DashboardOverview | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<GeneralLedgerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isOwner = activeBusiness?.role === "owner" && user?.account_type !== "staff";

  useEffect(() => {
    if (!activeBusiness) return;
    async function loadDashboard() {
      try {
        setIsLoading(true);
        const [dash, prods, txs] = await Promise.all([
          apiGet<DashboardOverview>("/dashboard/summary"),
          apiGet<Product[]>("/products?low_stock=true"),
          apiGet<GeneralLedgerItem[]>("/reports/transactions?type=all"),
        ]);
        setSummary(dash);
        setLowStockProducts(prods);
        setRecentTransactions(txs.slice(0, 7));
      } catch {
        // UI fallback handled by null summary
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, [activeBusiness]);

  if (isLoading || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <div className="text-slate-500 dark:text-slate-400 text-xs font-medium">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header - ONLY ONE CLEAR PRIMARY ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Dashboard
            </h1>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide uppercase ${
                isOwner
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40"
              }`}
            >
              {isOwner ? "Owner" : "Staff"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Overview of your daily cash, sales, and dues for{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{activeBusiness?.name}</span>
          </p>
        </div>

        {/* Single Primary Action Button */}
        <div className="flex items-center">
          <Link
            href="/transactions"
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-semibold rounded-xl text-xs transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Transaction</span>
          </Link>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash in Hand */}
        <div className="bg-white dark:bg-[#181d26] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs transition-all hover:shadow-md relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Cash in Hand
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2.5 tabular-nums tracking-tight">
            {formatCurrency(summary.cash_in_hand)}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Available Cash</span>
            <Link
              href="/cash-book"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>Cash Book</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Customer Dues (Receivable) */}
        <div className="bg-white dark:bg-[#181d26] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs transition-all hover:shadow-md relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Customer Dues
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2.5 tabular-nums tracking-tight">
            {formatCurrency(summary.total_receivable)}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Money to Collect</span>
            <Link
              href="/parties"
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>Customer List</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Supplier Dues (Payable) */}
        <div className="bg-white dark:bg-[#181d26] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs transition-all hover:shadow-md relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Supplier Dues
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2.5 tabular-nums tracking-tight">
            {formatCurrency(summary.total_payable)}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Money to Pay</span>
            <Link
              href="/parties"
              className="text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>Supplier List</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-white dark:bg-[#181d26] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs transition-all hover:shadow-md relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today&apos;s Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2.5 tabular-nums tracking-tight">
            {formatCurrency(summary.today_sales)}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Expenses: {formatCurrency(summary.today_expenses)}
            </span>
            <Link
              href="/reports"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>Reports</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Fast Action Shortcuts */}
      <div className="bg-white dark:bg-[#181d26] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Quick Actions
          </h2>
          <span className="text-xs text-slate-400">One-click entries</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            href="/invoices"
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#1e2430] hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-800/50 transition-all text-center group cursor-pointer active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Sales Invoice</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Bill a customer</div>
          </Link>

          <Link
            href="/invoices"
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#1e2430] hover:bg-blue-50/60 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-800/50 transition-all text-center group cursor-pointer active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Purchase Bill</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Add inventory</div>
          </Link>

          <Link
            href="/transactions"
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#1e2430] hover:bg-rose-50/60 dark:hover:bg-rose-950/30 hover:border-rose-300 dark:hover:border-rose-800/50 transition-all text-center group cursor-pointer active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Add Expense</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Shop expenses</div>
          </Link>

          <Link
            href="/cash-book"
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#1e2430] hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-800/50 transition-all text-center group cursor-pointer active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Receive Payment</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Customer cash in</div>
          </Link>

          <Link
            href="/cash-book"
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#1e2430] hover:bg-amber-50/60 dark:hover:bg-amber-950/30 hover:border-amber-300 dark:hover:border-amber-800/50 transition-all text-center group cursor-pointer active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Pay Supplier</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Supplier cash out</div>
          </Link>
        </div>
      </div>

      {/* Split Section: Recent Activity & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-8 bg-white dark:bg-[#181d26] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Transactions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Latest entries posted to your books
              </p>
            </div>
            <Link
              href="/transactions"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              <Clock className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              No recent transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.08] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Party / Item</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {recentTransactions.map((tx) => {
                    const isInflow = tx.type === "cash_in" || tx.type === "credit" || tx.source === "invoice";
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors">
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                              tx.source === "cash_book"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                                : tx.source === "invoice"
                                ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {tx.source.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                          {tx.category_or_party}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                          {tx.description || "-"}
                        </td>
                        <td className="py-3 px-3 text-right font-bold tabular-nums">
                          <span
                            className={
                              isInflow
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }
                          >
                            {isInflow ? "+" : "-"}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="lg:col-span-4 bg-white dark:bg-[#181d26] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Low Stock Alert</span>
                  {lowStockProducts.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Items needing reorder</p>
              </div>
              <Link
                href="/stock"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Stock List</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Stock Healthy
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  All items are above minimum stock levels.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">SKU: {p.sku || "-"}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0 tabular-nums">
                      {p.stock_quantity} Left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/[0.05]">
            <Link
              href="/stock"
              className="w-full block py-2.5 rounded-xl text-center text-xs font-semibold bg-slate-100 dark:bg-[#1a233a] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#202c49] transition-colors"
            >
              Update Stock
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
