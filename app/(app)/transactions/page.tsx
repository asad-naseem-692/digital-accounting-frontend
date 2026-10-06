"use client";

import React, { useState, useEffect } from "react";
import { useBusiness } from "@/context/BusinessContext";
import { useToast } from "@/context/ToastContext";
import { apiGet, apiPost } from "@/lib/api";
import type {
  Party,
  Product,
  UnifiedTransactionCreate,
  UnifiedTransactionResponse,
} from "@/types";

type TxType = "sale" | "purchase" | "expense" | "receive_money" | "payment_money";

const TABS: { type: TxType; label: string; icon: string; ownerOnly?: boolean }[] = [
  { type: "sale", label: "Sale (Customer)", icon: "🛍️" },
  { type: "purchase", label: "Purchase (Supplier)", icon: "📦", ownerOnly: true },
  { type: "expense", label: "Expense", icon: "💸" },
  { type: "receive_money", label: "Receive Payment", icon: "📥" },
  { type: "payment_money", label: "Supplier Payment", icon: "📤", ownerOnly: true },
];

export default function DailyTransactionsPage() {
  const { activeBusiness, isOwner } = useBusiness();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TxType>("sale");
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form states
  const [partyId, setPartyId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [category, setCategory] = useState("Operating Expense");
  const [description, setDescription] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "credit">("cash");

  // Selected product item for sale / purchase
  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number | "">("");

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResponse, setSuccessResponse] = useState<UnifiedTransactionResponse | null>(null);

  // Load parties & products when business is active
  useEffect(() => {
    if (!activeBusiness) return;
    async function loadData() {
      try {
        const [pList, prList] = await Promise.all([
          apiGet<Party[]>("/parties"),
          apiGet<Product[]>("/products"),
        ]);
        setParties(pList);
        setProducts(prList);
      } catch {
        // ignore load errors
      }
    }
    loadData();
  }, [activeBusiness]);

  useEffect(() => {
    if (!isOwner && (activeTab === "purchase" || activeTab === "payment_money")) {
      setActiveTab("sale");
    }
  }, [isOwner, activeTab]);

  // Filter parties by relevant type
  const relevantParties = parties.filter((p) => {
    if (activeTab === "sale" || activeTab === "receive_money") {
      return p.type === "customer";
    }
    if (activeTab === "purchase" || activeTab === "payment_money") {
      return p.type === "supplier";
    }
    return true;
  });

  // Handle product selection to auto-fill unit price & total
  function handleProductSelect(prodId: string) {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      const price = activeTab === "purchase" ? prod.cost_price || prod.unit_price : prod.unit_price;
      setItemUnitPrice(price);
      setAmount(price * itemQuantity);
      if (!description) {
        setDescription(`${activeTab === "sale" ? "Sale of" : "Purchase of"} ${prod.name}`);
      }
    }
  }

  function handleQuantityChange(qty: number) {
    setItemQuantity(qty);
    if (typeof itemUnitPrice === "number") {
      setAmount(qty * itemUnitPrice);
    }
  }

  function handleUnitPriceChange(price: number) {
    setItemUnitPrice(price);
    setAmount(price * itemQuantity);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessResponse(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid transaction amount greater than zero.");
      return;
    }

    if (activeTab !== "expense" && !partyId) {
      setError(
        activeTab === "sale" || activeTab === "receive_money"
          ? "Please select a customer."
          : "Please select a supplier."
      );
      return;
    }

    const payload: UnifiedTransactionCreate = {
      transaction_type: activeTab,
      amount: numAmount,
      description: description.trim() || `${activeTab} recorded`,
      party_id: activeTab !== "expense" ? partyId : undefined,
      category: activeTab === "expense" ? category : undefined,
      payment_mode: paymentMode,
      items: selectedProductId
        ? [
            {
              product_id: selectedProductId,
              description: description.trim() || "Item",
              quantity: itemQuantity,
              unit_price: typeof itemUnitPrice === "number" ? itemUnitPrice : numAmount,
            },
          ]
        : undefined,
    };

    try {
      setIsLoading(true);
      const res = await apiPost<UnifiedTransactionResponse>("/transactions", payload);
      setSuccessResponse(res);
      showToast(res.message || "Transaction recorded successfully!", "success");

      // Reset fields
      setAmount("");
      setDescription("");
      setSelectedProductId("");
      setItemQuantity(1);
      setItemUnitPrice("");

      // Refresh party balance list
      const updatedParties = await apiGet<Party[]>("/parties");
      setParties(updatedParties);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        showToast(err.message, "error");
      } else {
        setError("Failed to process transaction.");
        showToast("Failed to process transaction.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="pb-2 border-b border-gray-200 dark:border-white/10">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 tracking-tight">
          Daily Transactions
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          Record everyday business transactions — automatically posts to ledgers, cash book, and inventory
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-gray-100 dark:bg-[#181d26] p-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08]">
        {TABS.filter((t) => !t.ownerOnly || isOwner).map((tab) => (
          <button
            key={tab.type}
            type="button"
            onClick={() => {
              setActiveTab(tab.type);
              setPartyId("");
              setError(null);
              setSuccessResponse(null);
            }}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === tab.type
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs border border-gray-200/60 dark:border-white/10"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-white/40"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Transaction Form Card */}
      <div className="bg-white dark:bg-[#181d26] rounded-xl shadow-xs border border-gray-200/80 dark:border-white/[0.08] p-6 sm:p-8">
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-start gap-2.5 font-medium">
            <span className="text-rose-500 font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successResponse && (
          <div className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-900 dark:text-emerald-300 text-sm">
            <div className="font-bold text-emerald-800 dark:text-emerald-200 mb-1 flex items-center gap-1.5">
              <span>✓</span>
              <span>{successResponse.message}</span>
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
              Automated Accounting Entries:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-xs text-emerald-800 dark:text-emerald-300">
              {successResponse.created_records.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Party selection */}
          {activeTab !== "expense" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                {activeTab === "sale" || activeTab === "receive_money"
                  ? "Select Customer"
                  : "Select Supplier"}
              </label>
              <select
                required
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#11141a] text-gray-900 dark:text-neutral-100 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white transition-colors"
              >
                <option value="">
                  Select {activeTab === "sale" || activeTab === "receive_money" ? "Customer" : "Supplier"}
                </option>
                {relevantParties.map((p) => {
                  const isCustomer = p.type === "customer";
                  const bal = Math.abs(p.current_balance);
                  const balLabel = isCustomer
                    ? p.current_balance >= 0 ? `Receivable: Rs ${bal.toLocaleString()}` : `Advance: Rs ${bal.toLocaleString()}`
                    : p.current_balance >= 0 ? `Payable: Rs ${bal.toLocaleString()}` : `Advance: Rs ${bal.toLocaleString()}`;

                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({balLabel})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Catalog Item for Sales & Purchases */}
          {(activeTab === "sale" || activeTab === "purchase") && products.length > 0 && (
            <div className="p-4 bg-gray-50/80 dark:bg-white/[0.02] rounded-xl border border-gray-200 dark:border-white/10 space-y-3">
              <span className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block">
                Catalog Product (Auto-adjusts stock inventory)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">
                    Product
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#11141a] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-neutral-100 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                  >
                    <option value="">None (Custom item)</option>
                    {products.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.name} (Stock: {pr.stock_quantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={itemQuantity}
                    onChange={(e) => handleQuantityChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#11141a] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-neutral-100 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">
                    Unit Price (Rs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemUnitPrice}
                    onChange={(e) => handleUnitPriceChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#11141a] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-neutral-100 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Expense Category */}
          {activeTab === "expense" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                Expense Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#11141a] text-gray-900 dark:text-neutral-100 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white transition-colors"
              >
                <option value="Rent">Shop / Office Rent</option>
                <option value="Utilities">Utilities (Electricity, Water, Gas)</option>
                <option value="Salaries">Staff Salaries &amp; Wages</option>
                <option value="Transportation">Transportation &amp; Delivery</option>
                <option value="Repairs">Repairs &amp; Maintenance</option>
                <option value="Marketing">Advertising &amp; Marketing</option>
                <option value="Operating Expense">General Operating Expense</option>
              </select>
            </div>
          )}

          {/* Amount & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                Total Amount (Rs)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#11141a] text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white transition-colors tabular-nums"
              />
            </div>

            {(activeTab === "sale" || activeTab === "purchase") && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as "cash" | "credit")}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#11141a] text-gray-900 dark:text-neutral-100 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white transition-colors"
                >
                  <option value="cash">Immediate Cash (Cash in Hand)</option>
                  <option value="credit">Credit / Khata (Baqaya / Udhar)</option>
                </select>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
              Description / Notes
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Sold 10 bags of flour to Ahmed"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#11141a] text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white transition-colors"
            />
          </div>

          {/* Accounting preview */}
          <div className="p-3 bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-700 dark:text-neutral-300">
            <span className="font-semibold block mb-0.5 text-neutral-900 dark:text-white">
              Automated Ledger &amp; Cash Flow Action:
            </span>
            {activeTab === "sale" && (
              <span>Creates a Sales Invoice. Updates Cash in Hand (if Cash) or Customer Khata (if Credit).</span>
            )}
            {activeTab === "purchase" && (
              <span>Creates a Purchase Bill. Deducts Cash in Hand (if Cash) or records Supplier Payable (if Credit).</span>
            )}
            {activeTab === "expense" && (
              <span>Records cash outflow in Cash Book under category &ldquo;{category}&rdquo; and updates Profit &amp; Loss.</span>
            )}
            {activeTab === "receive_money" && (
              <span>Increases Cash in Hand and credits Customer Ledger, reducing their outstanding dues.</span>
            )}
            {activeTab === "payment_money" && (
              <span>Decreases Cash in Hand and debits Supplier Ledger, reducing payable balance.</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isLoading ? "Recording..." : `Record ${TABS.find((t) => t.type === activeTab)?.label}`}
          </button>
        </form>
      </div>
    </div>
  );
}
