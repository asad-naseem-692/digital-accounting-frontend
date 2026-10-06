"use client";

import React, { useState, useEffect } from "react";
import { useBusiness } from "@/context/BusinessContext";
import { useToast } from "@/context/ToastContext";
import { apiGet, apiPost } from "@/lib/api";
import WhatsAppShareModal from "@/components/WhatsAppShareModal";
import type {
  Party,
  PartyCreate,
  PartiesSummary,
  LedgerTransaction,
  LedgerTransactionCreate,
} from "@/types";

export default function PartiesPage() {
  const { activeBusiness, canEdit, isOwner } = useBusiness();
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<"customer" | "supplier">("customer");
  const [parties, setParties] = useState<Party[]>([]);
  const [summary, setSummary] = useState<PartiesSummary>({ total_receivable: 0, total_payable: 0 });
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // WhatsApp modal
  const [whatsAppModal, setWhatsAppModal] = useState<{
    isOpen: boolean;
    party: Party | null;
  }>({ isOpen: false, party: null });

  // Add party modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openingBalance, setOpeningBalance] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Selected party for ledger view
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  // Quick transaction modal (Charge / Payment)
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<"credit" | "debit">("credit");
  const [txAmount, setTxAmount] = useState<number | "">("");
  const [txDescription, setTxDescription] = useState("");
  const [txError, setTxError] = useState<string | null>(null);

  function getPartyWhatsAppMessage(p: Party): string {
    const balance = Number(p.current_balance) || 0;
    const bizName = activeBusiness?.name || "Business";
    let balanceText = "";
    if (p.type === "customer") {
      if (balance > 0) {
        balanceText = `📌 *Aapke zimme Baqi Rakam (Receivable):* Rs ${balance.toLocaleString()}`;
      } else if (balance < 0) {
        balanceText = `📌 *Hamare zimme Baqi (Advance / Credit):* Rs ${Math.abs(balance).toLocaleString()}`;
      } else {
        balanceText = `📌 *Aapka hisab bilkul clear hai (Rs 0).*`;
      }
    } else {
      if (balance > 0) {
        balanceText = `📌 *Hamare zimme Baqi (Payable to you):* Rs ${balance.toLocaleString()}`;
      } else if (balance < 0) {
        balanceText = `📌 *Aapke paas hamara Advance:* Rs ${Math.abs(balance).toLocaleString()}`;
      } else {
        balanceText = `📌 *Hisab bilkul clear hai (Rs 0).*`;
      }
    }

    return `Assalam-o-Alaikum *${p.name}*,\n\nYeh *${bizName}* ki taraf se aapka Khata / Balance summary hai:\n\n${balanceText}\n\nBaraye meherbani hisab check farmayein aur baqi rakam ki adaigi jald az jald karein.\n\nShukriya!\n*${bizName}*`;
  }


  async function loadParties() {
    if (!activeBusiness) return;
    try {
      setIsLoading(true);
      const [list, sum] = await Promise.all([
        apiGet<Party[]>(`/parties?type=${activeTab}${search ? `&search=${encodeURIComponent(search)}` : ""}`),
        apiGet<PartiesSummary>("/parties/summary"),
      ]);
      setParties(list);
      setSummary(sum);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadParties();
  }, [activeBusiness, activeTab, search]);

  // Load single party transactions when opened
  async function openLedger(party: Party) {
    setSelectedParty(party);
    try {
      setIsLedgerLoading(true);
      const [freshParty, txs] = await Promise.all([
        apiGet<Party>(`/parties/${party.id}`),
        apiGet<LedgerTransaction[]>(`/parties/${party.id}/transactions`),
      ]);
      setSelectedParty(freshParty);
      setTransactions(txs);
    } catch {
      // ignore
    } finally {
      setIsLedgerLoading(false);
    }
  }

  async function handleAddParty(e: React.FormEvent) {
    e.preventDefault();
    setModalError(null);

    if (!name.trim()) {
      setModalError("Party name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: PartyCreate = {
        name: name.trim(),
        type: activeTab,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        opening_balance: Number(openingBalance) || 0.0,
      };

      await apiPost<Party>("/parties", payload);
      toastSuccess(`${activeTab === "customer" ? "Customer" : "Supplier"} "${payload.name}" added successfully!`);
      setIsAddModalOpen(false);
      setName("");
      setPhone("");
      setAddress("");
      setOpeningBalance("");
      loadParties();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save party";
      setModalError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedParty) return;
    setTxError(null);

    const num = Number(txAmount);
    if (!num || num <= 0) {
      setTxError("Please enter a valid amount greater than zero.");
      return;
    }
    if (!txDescription.trim()) {
      setTxError("Please enter a description for this entry.");
      return;
    }

    if (selectedParty.type === "supplier" && txType === "debit" && !isOwner) {
      setTxError("Supplier payments are restricted to the Business Owner only.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: LedgerTransactionCreate = {
        type: txType,
        amount: num,
        description: txDescription.trim(),
      };

      await apiPost<LedgerTransaction>(`/parties/${selectedParty.id}/transactions`, payload);
      toastSuccess(`Rs ${num.toLocaleString()} entry recorded for ${selectedParty.name}`);
      setIsTxModalOpen(false);
      setTxAmount("");
      setTxDescription("");
      setTxError(null);
      openLedger(selectedParty);
      loadParties();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record transaction.";
      setTxError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 tracking-tight">
            Parties &amp; Ledgers
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Manage your customers, suppliers, and running account balances
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <span>+</span> Add {activeTab === "customer" ? "Customer" : "Supplier"}
          </button>
        )}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#181d26] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Customer Receivables
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            Rs {summary.total_receivable.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-2">Total balance to collect from customers</p>
        </div>

        <div className="bg-white dark:bg-[#181d26] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Supplier Payables
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            Rs {summary.total_payable.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-2">Total balance to pay to suppliers</p>
        </div>
      </div>

      {/* Main Grid: Parties List + Statement Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parties List Column */}
        <div className={selectedParty ? "lg:col-span-5" : "lg:col-span-12"}>
          <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200 dark:border-white/[0.08] shadow-xs p-5">
            {/* Tabs & Search */}
            <div className="flex gap-1 bg-gray-100 dark:bg-slate-950/40 p-1 rounded-lg border border-gray-200 dark:border-white/10 mb-4">
              <button
                onClick={() => {
                  setActiveTab("customer");
                  setSelectedParty(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-center ${
                  activeTab === "customer"
                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-xs"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                }`}
              >
                Customers
              </button>
              <button
                onClick={() => {
                  setActiveTab("supplier");
                  setSelectedParty(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-center ${
                  activeTab === "supplier"
                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-xs"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                }`}
              >
                Suppliers
              </button>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab}s by name...`}
              className="w-full px-3.5 py-2 mb-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
            />

            {isLoading ? (
              <div className="py-8 text-center text-gray-500 text-xs animate-pulse">
                Loading {activeTab}s...
              </div>
            ) : parties.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                No {activeTab}s found. Click &ldquo;+ Add {activeTab === "customer" ? "Customer" : "Supplier"}&rdquo; to create one.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-[500px] overflow-y-auto">
                {parties.map((p) => {
                  const isSelected = selectedParty?.id === p.id;
                  const isPositive = p.current_balance > 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => openLedger(p)}
                      className={`p-3 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-neutral-100 dark:bg-white/[0.08] border border-neutral-300 dark:border-white/20"
                          : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-slate-100">{p.name}</div>
                        {p.phone && <div className="text-xs text-gray-500 dark:text-slate-400">{p.phone}</div>}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <div
                            className={`font-semibold text-sm ${
                              isPositive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : p.current_balance < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-gray-600 dark:text-slate-400"
                            }`}
                          >
                            Rs {Math.abs(p.current_balance).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-slate-400 capitalize">
                            {activeTab === "customer"
                              ? isPositive
                                ? "receivable"
                                : p.current_balance < 0
                                ? "payable"
                                : "settled"
                              : isPositive
                              ? "payable"
                              : "advance"}
                          </div>
                        </div>
                        <button
                          type="button"
                          title="Share balance on WhatsApp"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWhatsAppModal({ isOpen: true, party: p });
                          }}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-full cursor-pointer transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.167 8.167 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.08l-.29-.17-3.02.79.81-2.94-.19-.3a8.188 8.188 0 01-1.25-4.35c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.71 4.3 3.79.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ledger Detail Column */}
        {selectedParty && (
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200 dark:border-white/[0.08] shadow-xs p-5">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-white/10 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{selectedParty.name}</h2>
                    <span className="px-2 py-0.5 rounded text-[11px] font-normal uppercase bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                      {selectedParty.type}
                    </span>
                  </div>
                  {selectedParty.phone && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Phone: {selectedParty.phone}</p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-500 dark:text-slate-400 block">
                    Current Balance
                  </span>
                  <span
                    className={`text-xl font-semibold ${
                      selectedParty.current_balance > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : selectedParty.current_balance < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-800 dark:text-slate-200"
                    }`}
                  >
                    Rs {Math.abs(selectedParty.current_balance).toLocaleString()}
                  </span>
                  <div>
                    <button
                      type="button"
                      onClick={() => setWhatsAppModal({ isOpen: true, party: selectedParty })}
                      className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/40 transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.167 8.167 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.08l-.29-.17-3.02.79.81-2.94-.19-.3a8.188 8.188 0 01-1.25-4.35c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.71 4.3 3.79.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
                      </svg>
                      <span>Share on WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Transaction Action Buttons */}
              {canEdit && (
                <div className="space-y-2 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setTxType("credit");
                        setTxError(null);
                        setIsTxModalOpen(true);
                      }}
                      className="py-2.5 px-3 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 font-semibold text-xs rounded-lg border border-red-200 dark:border-red-900/40 transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>-</span>
                      <span>You Will Give</span>
                    </button>

                    {selectedParty.type === "supplier" && !isOwner ? (
                      <div
                        title="Supplier payments are restricted to Business Owner only"
                        className="py-2.5 px-3 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 font-medium text-xs rounded-lg border border-gray-200 dark:border-white/10 text-center flex items-center justify-center gap-1.5 select-none"
                      >
                        <span>🔒</span>
                        <span>Pay Supplier (Owner only)</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setTxType("debit");
                          setTxError(null);
                          setIsTxModalOpen(true);
                        }}
                        className="py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-lg border border-emerald-200 dark:border-emerald-900/40 transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>+</span>
                        <span>You Will Get</span>
                      </button>
                    )}
                  </div>
                  {selectedParty.type === "supplier" && !isOwner && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                      ℹ️ Supplier payments (cash out) are restricted to the Business Owner only.
                    </p>
                  )}
                </div>
              )}

              {/* Transaction History Statement */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Account Statement
                </h3>

                {isLedgerLoading ? (
                  <div className="py-8 text-center text-gray-400 text-xs animate-pulse">
                    Loading ledger statement...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    No transactions recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 uppercase text-[11px] font-medium">
                          <th className="py-2">Date</th>
                          <th className="py-2">Details</th>
                          <th className="py-2 text-right text-red-600 dark:text-red-400 font-semibold">You Will Give</th>
                          <th className="py-2 text-right text-emerald-600 dark:text-emerald-400 font-semibold">You Will Get</th>
                          <th className="py-2 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                            <td className="py-2.5 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                              {new Date(tx.date).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 text-gray-800 dark:text-slate-200">
                              {tx.description}
                            </td>
                            <td className="py-2.5 text-right font-medium text-red-600 dark:text-red-400">
                              {tx.type === "credit" ? `$${Number(tx.amount).toFixed(2)}` : "-"}
                            </td>
                            <td className="py-2.5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                              {tx.type === "debit" ? `$${Number(tx.amount).toFixed(2)}` : "-"}
                            </td>
                            <td className="py-2.5 text-right font-medium text-gray-900 dark:text-slate-100">
                              ${Number(tx.running_balance).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Party Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#181d26] rounded-2xl shadow-xl border border-gray-200 dark:border-white/[0.08] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Add {activeTab === "customer" ? "Customer" : "Supplier"}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs rounded-lg font-normal">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddParty} className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Full name / Business name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`e.g. ${activeTab === "customer" ? "Ahmed Bilal" : "Metro Wholesale"}`}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Phone number (optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Address (optional)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Suite 204, Market Plaza"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Opening balance ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 px-3 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-slate-200 font-medium rounded-xl text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-bold rounded-xl text-sm disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isSubmitting ? "Saving..." : "Save Party"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Transaction Modal */}
      {isTxModalOpen && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#181d26] rounded-2xl shadow-xl border border-gray-200 dark:border-white/[0.08] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                  {txType === "credit" ? "Record Entry (You Will Give)" : "Record Entry (You Will Get)"}
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Party: <span className="font-medium text-gray-800 dark:text-slate-200">{selectedParty.name}</span>{" "}
                  <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold ml-1">
                    {selectedParty.type}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {txError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs rounded-lg font-normal">
                {txError}
              </div>
            )}

            <form onSubmit={handleAddTransaction} className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  required
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder={
                    txType === "credit"
                      ? "e.g. Items given on credit / Amount to pay"
                      : "e.g. Payment to collect / Cash to receive"
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="flex-1 py-2 px-3 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-slate-200 font-medium rounded-xl text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2 px-3 text-white font-medium rounded-lg text-sm disabled:opacity-50 cursor-pointer ${
                    txType === "credit"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isSubmitting
                    ? "Saving..."
                    : txType === "credit"
                    ? "Save (You Will Give)"
                    : "Save (You Will Get)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Share Modal */}
      {whatsAppModal.isOpen && whatsAppModal.party && (
        <WhatsAppShareModal
          isOpen={whatsAppModal.isOpen}
          onClose={() => setWhatsAppModal({ isOpen: false, party: null })}
          title={`Share ${whatsAppModal.party.name}'s Khata on WhatsApp`}
          recipientName={whatsAppModal.party.name}
          defaultPhone={whatsAppModal.party.phone || ""}
          defaultMessage={getPartyWhatsAppMessage(whatsAppModal.party)}
        />
      )}
    </div>
  );
}
