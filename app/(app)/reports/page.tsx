"use client";

import React, { useState, useEffect } from "react";
import { useBusiness } from "@/context/BusinessContext";
import { apiGet, downloadPdf } from "@/lib/api";
import type {
  ProfitLossReport,
  BalanceSheetReport,
  GeneralLedgerItem,
} from "@/types";

type ReportTab = "pnl" | "balance_sheet" | "general_ledger";

export default function ReportsPage() {
  const { activeBusiness } = useBusiness();

  const [activeTab, setActiveTab] = useState<ReportTab>("pnl");
  const [pnl, setPnl] = useState<ProfitLossReport | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetReport | null>(null);
  const [ledgerItems, setLedgerItems] = useState<GeneralLedgerItem[]>([]);
  const [glFilter, setGlFilter] = useState<"all" | "ledger" | "cash">("all");
  const [isLoading, setIsLoading] = useState(true);

  async function loadReportData() {
    if (!activeBusiness) return;
    try {
      setIsLoading(true);
      if (activeTab === "pnl") {
        const data = await apiGet<ProfitLossReport>("/reports/profit-loss");
        setPnl(data);
      } else if (activeTab === "balance_sheet") {
        const data = await apiGet<BalanceSheetReport>("/reports/balance-sheet");
        setBalanceSheet(data);
      } else if (activeTab === "general_ledger") {
        const data = await apiGet<GeneralLedgerItem[]>(`/reports/transactions?type=${glFilter}`);
        setLedgerItems(data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReportData();
  }, [activeBusiness, activeTab, glFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 tracking-tight">
            Financial Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Profit &amp; Loss, Balance Sheet, and unified General Ledger audit trail
          </p>
        </div>

        {activeTab === "general_ledger" && (
          <button
            onClick={() =>
              downloadPdf(
                `/reports/transactions/pdf?type=${glFilter}`,
                `General_Ledger_${activeBusiness?.name.replace(/\s+/g, "_") || "Report"}.pdf`
              )
            }
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-medium rounded-lg text-sm shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            Export PDF Report
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-gray-100 dark:bg-[#181d26] p-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] max-w-md">
        <button
          onClick={() => setActiveTab("pnl")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
            activeTab === "pnl"
              ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs border border-gray-200/60 dark:border-white/10"
              : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
          }`}
        >
          Profit &amp; Loss
        </button>
        <button
          onClick={() => setActiveTab("balance_sheet")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
            activeTab === "balance_sheet"
              ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs border border-gray-200/60 dark:border-white/10"
              : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
          }`}
        >
          Balance Sheet
        </button>
        <button
          onClick={() => setActiveTab("general_ledger")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
            activeTab === "general_ledger"
              ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs border border-gray-200/60 dark:border-white/10"
              : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
          }`}
        >
          General Ledger
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-gray-500 dark:text-slate-400 text-sm animate-pulse">
          Generating financial statements...
        </div>
      ) : (
        <>
          {/* 1. PROFIT & LOSS STATEMENT */}
          {activeTab === "pnl" && pnl && (
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-xl border border-gray-200/80 dark:border-white/10 shadow-xs p-6 sm:p-8 max-w-2xl">
              <div className="border-b border-gray-200 dark:border-white/10 pb-4 mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                  {activeBusiness?.name} — Profit &amp; Loss Statement
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Summary of revenue, direct costs, operating expenses, and net profit
                </p>
              </div>

              <div className="space-y-4">
                {/* Revenue */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs text-gray-700 dark:text-slate-300 pb-2 border-b border-gray-100 dark:border-white/5">
                    <span className="font-medium">1. Total Sales Revenue</span>
                    <span className="font-bold text-gray-900 dark:text-slate-100 tabular-nums">
                      Rs {Number(pnl.total_sales).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-700 dark:text-slate-300 pb-2 border-b border-gray-100 dark:border-white/5">
                    <span className="font-medium">2. Cost of Goods Sold (Purchases)</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      - Rs {Number(pnl.total_purchases).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-neutral-900 dark:text-white pt-1">
                    <span>Gross Profit</span>
                    <span className="tabular-nums">
                      Rs {Number(pnl.gross_profit).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Operating Expenses */}
                <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                  <div className="flex justify-between items-center text-xs text-gray-700 dark:text-slate-300 pb-2 border-b border-gray-100 dark:border-white/5">
                    <span className="font-medium">3. Operating Expenses</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      - Rs {Number(pnl.total_expenses).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Net Profit Banner */}
                <div
                  className={`p-5 rounded-xl flex items-center justify-between border ${
                    pnl.net_profit >= 0
                      ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-200"
                      : "bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-950 dark:text-rose-200"
                  }`}
                >
                  <div>
                    <span className="text-xs font-semibold text-gray-600 dark:text-slate-400 block uppercase tracking-wider">
                      Net Profit / (Loss)
                    </span>
                    <span className="text-3xl font-extrabold mt-1 block tabular-nums">
                      Rs {Math.abs(pnl.net_profit).toLocaleString()}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                      pnl.net_profit >= 0
                        ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700"
                        : "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700"
                    }`}
                  >
                    {pnl.net_profit >= 0 ? "✓ Profitable" : "⚠️ Net Loss"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. BALANCE SHEET STATEMENT */}
          {activeTab === "balance_sheet" && balanceSheet && (
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-xl border border-gray-200/80 dark:border-white/10 shadow-xs p-6 sm:p-8 max-w-4xl">
              <div className="border-b border-gray-200 dark:border-white/10 pb-4 mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                  {activeBusiness?.name} — Balance Sheet
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Accounting Equation: Total Assets = Total Liabilities + Net Equity
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets Column */}
                <div className="p-5 bg-gray-50/80 dark:bg-slate-950/40 rounded-xl border border-gray-200 dark:border-white/10 space-y-3.5">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2">
                    Assets (What the business owns)
                  </h3>

                  <div className="flex justify-between items-center text-xs text-gray-700 dark:text-slate-300">
                    <span>Cash in Hand</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100 tabular-nums">
                      Rs {Number(balanceSheet.cash_in_hand).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-700 dark:text-slate-300">
                    <span>Accounts Receivable</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100 tabular-nums">
                      Rs {Number(balanceSheet.accounts_receivable).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-700 dark:text-slate-300">
                    <span>Inventory Value (Wholesale)</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100 tabular-nums">
                      Rs {Number(balanceSheet.inventory_value).toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-white/10 flex justify-between items-center text-sm font-bold text-neutral-900 dark:text-white">
                    <span>Total Assets</span>
                    <span className="tabular-nums">
                      Rs {Number(balanceSheet.total_assets).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Liabilities & Equity Column */}
                <div className="p-5 bg-gray-50/80 dark:bg-slate-950/40 rounded-xl border border-gray-200 dark:border-white/10 space-y-3.5">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2">
                    Liabilities &amp; Equity
                  </h3>

                  <div className="flex justify-between items-center text-xs text-gray-700 dark:text-slate-300">
                    <span>Accounts Payable</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100 tabular-nums">
                      Rs {Number(balanceSheet.accounts_payable).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-700 dark:text-slate-300">
                    <span>Total Liabilities</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                      Rs {Number(balanceSheet.total_liabilities).toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-white/10 flex justify-between items-center text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    <span>Business Net Worth (Equity)</span>
                    <span className="tabular-nums">
                      Rs {Number(balanceSheet.net_worth).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. GENERAL LEDGER */}
          {activeTab === "general_ledger" && (
            <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200/80 dark:border-white/[0.08] shadow-xs p-5">
              {/* Filter */}
              <div className="flex gap-1.5 bg-gray-100 dark:bg-slate-950/60 p-1.5 rounded-xl border border-gray-200 dark:border-white/10 max-w-sm mb-4">
                <button
                  onClick={() => setGlFilter("all")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                    glFilter === "all"
                      ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs border border-gray-200/60 dark:border-white/10"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                  }`}
                >
                  All Entries
                </button>
                <button
                  onClick={() => setGlFilter("ledger")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                    glFilter === "ledger"
                      ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs border border-gray-200/60 dark:border-white/10"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                  }`}
                >
                  Parties Only
                </button>
                <button
                  onClick={() => setGlFilter("cash")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                    glFilter === "cash"
                      ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs border border-gray-200/60 dark:border-white/10"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                  }`}
                >
                  Cash Only
                </button>
              </div>

              {ledgerItems.length === 0 ? (
                <div className="py-16 text-center text-gray-400 dark:text-slate-500 text-sm">
                  No general ledger entries recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/90 dark:bg-slate-950/60 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 uppercase text-[11px] font-semibold">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Source</th>
                        <th className="py-3 px-4">Account / Party</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">Debit</th>
                        <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {ledgerItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-white/10">
                              {item.source}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-900 dark:text-slate-100">
                            {item.category_or_party}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-slate-300">
                            {item.description}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                            {item.debit > 0 ? `Rs ${Number(item.debit).toLocaleString()}` : "-"}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {item.credit > 0 ? `Rs ${Number(item.credit).toLocaleString()}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
