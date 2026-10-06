"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useBusiness } from "@/context/BusinessContext";
import { useToast } from "@/context/ToastContext";
import { apiGet, apiPost, apiPatch, downloadPdf } from "@/lib/api";
import WhatsAppShareModal from "@/components/WhatsAppShareModal";
import ThermalReceiptModal, { ThermalReceiptData } from "@/components/ThermalReceiptModal";
import type { Invoice, InvoiceCreate, Party, Product, InvoiceItem } from "@/types";

export default function InvoicesPage() {
  const { activeBusiness, canEdit, isOwner } = useBusiness();
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // WhatsApp Modal
  const [whatsAppModal, setWhatsAppModal] = useState<{
    isOpen: boolean;
    invoice: Invoice | null;
  }>({ isOpen: false, invoice: null });

  // Thermal Receipt Modal
  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    data: ThermalReceiptData | null;
  }>({ isOpen: false, data: null });

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"sale" | "purchase">("sale");
  const [partyId, setPartyId] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwner) {
      setFilterType("sale");
      setInvoiceType("sale");
    }
  }, [isOwner]);

  function getInvoiceWhatsAppMessage(inv: Invoice): string {
    const bizName = activeBusiness?.name || "Business";
    const remaining = Math.max(0, inv.total_amount - inv.paid_amount);

    let itemsText = "";
    if (inv.items && inv.items.length > 0) {
      itemsText =
        "\n📋 *Items / Tafseelat:*\n" +
        inv.items
          .map(
            (it, idx) =>
              `${idx + 1}. ${it.description} — ${it.quantity} x Rs ${Number(it.unit_price).toLocaleString()} = Rs ${(
                Number(it.quantity) * Number(it.unit_price)
              ).toLocaleString()}`
          )
          .join("\n") +
        "\n";
    }

    const billUrl = typeof window !== "undefined" ? `${window.location.origin}/bill/${inv.id}` : "";
    const billLinkText = billUrl ? `\n🌐 *View & Download Official Receipt:*\n👉 ${billUrl}\n` : "";

    return `Assalam-o-Alaikum *${inv.party_name || "Valued Customer"}*,\n\nYeh *${bizName}* ki taraf se aapka Invoice Bill hai:\n\n📄 *Invoice #:* ${inv.invoice_number}\n📅 *Date:* ${new Date(inv.date).toLocaleDateString()}\n💵 *Total Bill:* Rs ${Number(inv.total_amount).toLocaleString()}\n✅ *Paid Amount:* Rs ${Number(inv.paid_amount).toLocaleString()}\n⏳ *Remaining Balance:* Rs ${remaining.toLocaleString()}\n📌 *Status:* ${inv.status.toUpperCase()}\n${itemsText}${billLinkText}\nBaraye meherbani invoice check farmayein. Shukriya!\n*${bizName}*`;
  }

  async function loadData() {
    if (!activeBusiness) return;
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      const effectiveType = !isOwner ? "sale" : filterType;
      if (effectiveType !== "all") params.set("invoice_type", effectiveType);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const [invList, pList, prList] = await Promise.all([
        apiGet<Invoice[]>(`/invoices?${params.toString()}`),
        apiGet<Party[]>("/parties"),
        apiGet<Product[]>("/products"),
      ]);
      setInvoices(invList);
      setParties(pList);
      setProducts(prList);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeBusiness, filterType, filterStatus, isOwner]);

  // Derived KPI metrics
  const kpiStats = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalPending = 0;

    invoices.forEach((inv) => {
      totalInvoiced += Number(inv.total_amount || 0);
      totalCollected += Number(inv.paid_amount || 0);
      totalPending += Math.max(0, Number(inv.total_amount || 0) - Number(inv.paid_amount || 0));
    });

    return { totalInvoiced, totalCollected, totalPending };
  }, [invoices]);

  function handleAddItem() {
    setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  }

  function handleRemoveItem(index: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function handleItemChange(index: number, field: keyof InvoiceItem, value: any) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  function handleProductPick(index: number, productId: string) {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const price = invoiceType === "sale" ? prod.unit_price : prod.cost_price || prod.unit_price;
    const updated = [...items];
    updated[index] = {
      product_id: prod.id,
      description: prod.name,
      quantity: updated[index].quantity || 1,
      unit_price: price,
    };
    setItems(updated);
  }

  const modalTotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0);

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setModalError(null);

    if (!isOwner && invoiceType === "purchase") {
      setModalError("Purchase bills can only be created by the Business Owner.");
      return;
    }

    if (!partyId) {
      setModalError(`Please select a ${invoiceType === "sale" ? "customer" : "supplier"}`);
      return;
    }
    if (items.some((it) => !it.description.trim() || it.quantity <= 0)) {
      setModalError("Please provide a valid description and quantity for all items");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: InvoiceCreate = {
        invoice_type: invoiceType,
        party_id: partyId,
        items: items.map((it) => ({
          product_id: it.product_id || undefined,
          description: it.description.trim(),
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      };

      const newInv = await apiPost<Invoice>("/invoices", payload);
      setIsModalOpen(false);
      setPartyId("");
      setItems([{ description: "", quantity: 1, unit_price: 0 }]);
      showToast(
        `Created ${newInv.invoice_type === "sale" ? "Sales Invoice" : "Purchase Bill"} #${newInv.invoice_number}`,
        "success"
      );
      loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setModalError(err.message);
        showToast(err.message, "error");
      } else {
        setModalError("Failed to create document");
        showToast("Failed to create document", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusUpdate(invoiceId: string, newStatus: "unpaid" | "partial" | "paid") {
    try {
      await apiPatch(`/invoices/${invoiceId}/status`, { status: newStatus });
      showToast(`Invoice status updated to ${newStatus.toUpperCase()}`, "success");
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      showToast(msg, "error");
    }
  }

  const relevantParties = parties.filter((p) =>
    invoiceType === "sale" ? p.type === "customer" : p.type === "supplier"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 tracking-tight">
              Invoices &amp; Bills
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-white/10 tabular-nums">
              {invoices.length} docs
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {isOwner
              ? "Create itemized customer invoices, track supplier bills, and generate thermal receipts"
              : "Create itemized customer invoices and print instant POS receipts"}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              setInvoiceType("sale");
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-medium rounded-lg text-sm shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <span>+</span> {isOwner ? "Create Document" : "Create Sale Invoice"}
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200/80 dark:border-white/[0.08] p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-900 dark:bg-white" />
          <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            Total Billed
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1 tabular-nums">
            Rs {kpiStats.totalInvoiced.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
            Gross value across all displayed documents
          </p>
        </div>

        {/* Total Paid/Collected */}
        <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200/80 dark:border-white/[0.08] p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Total Collections Received
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            Rs {kpiStats.totalCollected.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
            Cleared cash and bank receipts
          </p>
        </div>

        {/* Pending Balance */}
        <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-xl border border-gray-200/80 dark:border-white/10 p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Outstanding Balance Due
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            Rs {kpiStats.totalPending.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
            Unpaid or partial amounts outstanding
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-xl border border-gray-200/80 dark:border-white/10 shadow-xs p-4 flex flex-wrap gap-4 items-center justify-between">
        {isOwner ? (
          <div className="flex gap-1 bg-gray-100 dark:bg-slate-950/60 p-1 rounded-lg border border-gray-200 dark:border-white/10">
            <button
              onClick={() => setFilterType("all")}
              className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filterType === "all"
                  ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-xs"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
            >
              All Documents
            </button>
            <button
              onClick={() => setFilterType("sale")}
              className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filterType === "sale"
                  ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-xs"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
            >
              Sales Invoices
            </button>
            <button
              onClick={() => setFilterType("purchase")}
              className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filterType === "purchase"
                  ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-xs"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
            >
              Purchase Bills
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-800 dark:text-neutral-200 text-xs font-medium">
            <span>📄</span>
            <span>Customer Sales Invoices</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#181d26] text-xs font-normal text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20"
          >
            <option value="all">All statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200/80 dark:border-white/[0.08] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-500 dark:text-slate-400 text-sm animate-pulse">
            Loading invoices and bills...
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-slate-500 text-sm">
            No invoices or bills found. Click &ldquo;+ Create Document&rdquo; to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/90 dark:bg-slate-950/60 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Doc #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Party</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-gray-900 dark:text-slate-100">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 dark:text-slate-400">
                      {new Date(inv.date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800 dark:text-slate-200">
                      {inv.party_name || "-"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                          inv.invoice_type === "sale"
                            ? "bg-neutral-100 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-white/10"
                            : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40"
                        }`}
                      >
                        {inv.invoice_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-slate-100 tabular-nums">
                      Rs {Number(inv.total_amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={inv.status}
                        disabled={!canEdit}
                        onChange={(e) =>
                          handleStatusUpdate(inv.id, e.target.value as "unpaid" | "partial" | "paid")
                        }
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border cursor-pointer ${
                          inv.status === "paid"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                            : inv.status === "partial"
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                        }`}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptModal({
                              isOpen: true,
                              data: {
                                businessName: activeBusiness?.name || "Business",
                                businessType: activeBusiness?.business_type,
                                invoiceNumber: inv.invoice_number,
                                date: inv.date,
                                partyName: inv.party_name,
                                partyPhone: parties.find((p) => p.id === inv.party_id)?.phone,
                                invoiceType: inv.invoice_type,
                                items: inv.items || [],
                                totalAmount: inv.total_amount,
                                paidAmount: inv.paid_amount,
                                status: inv.status,
                              },
                            });
                          }}
                          title="Print Thermal POS Receipt (80mm/58mm)"
                          className="px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-md transition-colors cursor-pointer flex items-center gap-1 border border-amber-200 dark:border-amber-800/40"
                        >
                          <span>🧾</span>
                          <span>Receipt</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setWhatsAppModal({ isOpen: true, invoice: inv })}
                          title="Share Invoice on WhatsApp"
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-md transition-colors cursor-pointer flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/40"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.167 8.167 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.08l-.29-.17-3.02.79.81-2.94-.19-.3a8.188 8.188 0 01-1.25-4.35c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.71 4.3 3.79.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
                          </svg>
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => downloadPdf(`/invoices/${inv.id}/pdf`, `${inv.invoice_number}.pdf`)}
                          className="px-2.5 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 rounded-md transition-colors cursor-pointer border border-neutral-200 dark:border-white/10"
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice / Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#181d26] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/[0.08] p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-white/10">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">
                  Create {invoiceType === "sale" ? "Sales Invoice" : "Purchase Bill"}
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Itemized billing with automated totals</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              {/* Document Type Toggle */}
              {isOwner ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInvoiceType("sale");
                      setPartyId("");
                    }}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      invoiceType === "sale"
                        ? "bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-950"
                        : "bg-gray-50 dark:bg-slate-950/40 border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Sales Invoice (Customer)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInvoiceType("purchase");
                      setPartyId("");
                    }}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      invoiceType === "purchase"
                        ? "bg-amber-50 dark:bg-amber-950/50 border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-300"
                        : "bg-gray-50 dark:bg-slate-950/40 border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Purchase Bill (Supplier)
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-800 dark:text-neutral-200 text-xs font-medium">
                  Creating Customer Sales Invoice
                </div>
              )}

              {/* Party Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  {invoiceType === "sale" ? "Select Customer" : "Select Supplier"}
                </label>
                <select
                  required
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                >
                  <option value="">
                    Select {invoiceType === "sale" ? "Customer" : "Supplier"}
                  </option>
                  {relevantParties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                    Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-neutral-900 dark:text-white font-semibold cursor-pointer hover:underline"
                  >
                    + Add line
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50/80 dark:bg-slate-950/40 rounded-lg border border-gray-200 dark:border-white/10 space-y-2">
                      {products.length > 0 && (
                        <select
                          value={item.product_id || ""}
                          onChange={(e) => handleProductPick(index, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-950/50 border border-gray-200 dark:border-white/10 text-xs font-normal text-gray-800 dark:text-slate-200"
                        >
                          <option value="">Select from catalog (optional)</option>
                          {products.map((pr) => (
                            <option key={pr.id} value={pr.id}>
                              {pr.name} (Rs {Number(pr.unit_price).toLocaleString()})
                            </option>
                          ))}
                        </select>
                      )}

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <input
                            type="text"
                            required
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-950/50 border border-gray-300 dark:border-white/10 text-xs font-normal text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min={1}
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-950/50 border border-gray-300 dark:border-white/10 text-xs font-normal text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price (Rs)"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, "unit_price", Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-950/50 border border-gray-300 dark:border-white/10 text-xs font-normal text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-gray-400 hover:text-rose-600 text-base leading-none cursor-pointer"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex items-center justify-between p-3.5 bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 rounded-xl">
                <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
                  Total Computed Amount
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-slate-100 tabular-nums">
                  Rs {modalTotal.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 px-3 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-slate-200 font-medium rounded-xl text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-bold rounded-xl text-sm disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isSubmitting ? "Generating..." : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Share Modal */}
      {whatsAppModal.isOpen && whatsAppModal.invoice && (
        <WhatsAppShareModal
          isOpen={whatsAppModal.isOpen}
          onClose={() => setWhatsAppModal({ isOpen: false, invoice: null })}
          title={`Share Invoice #${whatsAppModal.invoice.invoice_number} on WhatsApp`}
          recipientName={whatsAppModal.invoice.party_name || "Customer"}
          defaultPhone={parties.find((p) => p.id === whatsAppModal.invoice?.party_id)?.phone || ""}
          defaultMessage={getInvoiceWhatsAppMessage(whatsAppModal.invoice)}
        />
      )}

      {/* Thermal Receipt Modal */}
      {receiptModal.isOpen && receiptModal.data && (
        <ThermalReceiptModal
          isOpen={receiptModal.isOpen}
          onClose={() => setReceiptModal({ isOpen: false, data: null })}
          data={receiptModal.data}
        />
      )}
    </div>
  );
}
