"use client";

import React, { useState, useEffect } from "react";
import { useBusiness } from "@/context/BusinessContext";
import { useToast } from "@/context/ToastContext";
import { apiGet, apiPost } from "@/lib/api";
import type { CashEntry, CashEntryCreate, CashSummary } from "@/types";

function formatCurrency(amount: number): string {
  return "Rs " + Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CashBookPage() {
  const { activeBusiness, canEdit } = useBusiness();
  const { success: toastSuccess, error: toastError } = useToast();

  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [summary, setSummary] = useState<CashSummary>({
    cash_in_hand: 0,
    total_cash_in: 0,
    total_cash_out: 0,
    today_cash_in: 0,
    today_cash_out: 0,
  });
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Add Cash Entry Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<"cash_in" | "cash_out">("cash_in");
  const [amount, setAmount] = useState<number | "">("");
  const [category, setCategory] = useState("Sales");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  async function loadCashData() {
    if (!activeBusiness) return;
    try {
      setIsLoading(true);
      const url = filterType === "all" ? "/cash-entries" : `/cash-entries?type=${filterType}`;
      const [list, sum] = await Promise.all([
        apiGet<CashEntry[]>(url),
        apiGet<CashSummary>("/cash-entries/summary"),
      ]);
      setEntries(list);
      setSummary(sum);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCashData();
  }, [activeBusiness, filterType]);

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    setModalError(null);

    const num = Number(amount);
    if (!num || num <= 0) {
      setModalError("Please enter a valid amount greater than zero");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CashEntryCreate = {
        type: entryType,
        amount: num,
        category: category.trim(),
        description: description.trim() || undefined,
      };

      await apiPost<CashEntry>("/cash-entries", payload);
      toastSuccess(
        `${entryType === "cash_in" ? "Cash In" : "Cash Out"} of ${formatCurrency(num)} recorded!`
      );
      setIsModalOpen(false);
      setAmount("");
      setDescription("");
      loadCashData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add cash entry";
      setModalError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Cash Book</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time record of cash inflows, outflows, and running cash in hand
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer inline-flex items-center gap-2 active:scale-98"
          >
            <span className="text-base leading-none">+</span>
            <span>Record Cash Movement</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cash in Hand */}
        <div className="bg-white dark:bg-[#181d26] rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-900 dark:bg-white"></div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Cash in Hand
          </span>
          <div
            className={`text-2xl font-bold mt-2 tabular-nums ${
              summary.cash_in_hand >= 0 ? "text-slate-900 dark:text-slate-100" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatCurrency(summary.cash_in_hand)}
          </div>
          <p className="text-xs text-slate-400 mt-2">Net liquid funds currently available</p>
        </div>

        {/* Today's Cash In */}
        <div className="bg-white dark:bg-[#181d26] rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Today&apos;s Cash In
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            +{formatCurrency(summary.today_cash_in)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            All-time received: {formatCurrency(summary.total_cash_in)}
          </p>
        </div>

        {/* Today's Cash Out */}
        <div className="bg-white dark:bg-[#181d26] rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Today&apos;s Cash Out
          </span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 tabular-nums">
            -{formatCurrency(summary.today_cash_out)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            All-time disbursed: {formatCurrency(summary.total_cash_out)}
          </p>
        </div>
      </div>

      {/* Cash Entries Table Card */}
      <div className="bg-white dark:bg-[#181d26] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs p-5">
        {/* Filters */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 max-w-sm w-full sm:w-auto">
            <button
              onClick={() => setFilterType("all")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                filterType === "all"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              All Movements
            </button>
            <button
              onClick={() => setFilterType("cash_in")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                filterType === "cash_in"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Cash In (+)
            </button>
            <button
              onClick={() => setFilterType("cash_out")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                filterType === "cash_out"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Cash Out (-)
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Showing {entries.length} entries
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
            Loading cash entries...
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No cash movements recorded yet for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-white/10 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">Cash In</th>
                  <th className="py-3 px-3 text-right text-rose-600 dark:text-rose-400">Cash Out</th>
                  <th className="py-3 px-3 text-right">Running Cash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-medium max-w-[200px] truncate">
                      {e.description || "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {e.type === "cash_in" ? `+${formatCurrency(e.amount)}` : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      {e.type === "cash_out" ? `-${formatCurrency(e.amount)}` : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {e.running_balance !== undefined ? formatCurrency(e.running_balance) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Cash Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#181d26] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.08] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Record Cash Movement</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Movement Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType("cash_in");
                      setCategory("Sales");
                    }}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      entryType === "cash_in"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    + Cash In (Received)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType("cash_out");
                      setCategory("Operating Expense");
                    }}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      entryType === "cash_out"
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 text-rose-800 dark:text-rose-300 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    - Cash Out (Paid)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Sales, Rent, Electricity, Tea"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Amount (Rs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Description / Note (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Chai for shop guests / March shop rent"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-bold rounded-xl text-xs sm:text-sm disabled:opacity-50 cursor-pointer transition-colors shadow-md"
                >
                  {isSubmitting ? "Recording..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
