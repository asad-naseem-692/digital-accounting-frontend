"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import ThermalReceiptModal from "@/components/ThermalReceiptModal";
import KhataLogo from "@/components/KhataLogo";

interface PublicInvoice {
  id: string;
  invoice_number: string;
  invoice_type: "sale" | "purchase";
  date: string;
  due_date: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
  total_amount: number;
  paid_amount: number;
  status: "unpaid" | "partial" | "paid";
  business_name: string;
  business_type: string;
  party_name: string;
  party_phone: string | null;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

export default function PublicBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isThermalOpen, setIsThermalOpen] = useState(false);


  useEffect(() => {
    async function loadInvoice() {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/invoices/public/${invoiceId}`);
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "Invoice not found or link has expired."
              : "Failed to load invoice."
          );
        }
        const data = await res.json();
        setInvoice(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load invoice.");
      } finally {
        setIsLoading(false);
      }
    }
    loadInvoice();
  }, [invoiceId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-600">Loading digital invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h1 className="text-lg font-bold text-gray-900">Invoice Unavailable</h1>
          <p className="text-xs text-gray-500">{error || "Could not retrieve invoice."}</p>
        </div>
      </div>
    );
  }

  const remaining = Math.max(0, invoice.total_amount - invoice.paid_amount);

  return (
    <div className="min-h-screen bg-gray-100/70 py-6 px-4 sm:py-10">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Top Branding Bar */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <KhataLogo size={22} />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              FISTA Accounts • Digital Invoice &amp; Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsThermalOpen(true)}
              className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>🧾</span>
              <span>Thermal Slip</span>
            </button>
            <button
              onClick={() => window.print()}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-300 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer"
            >
              🖨️ Print
            </button>
            <a
              href={`${API_BASE_URL}/invoices/public/${invoice.id}/pdf`}
              download={`${invoice.invoice_number}.pdf`}
              className="text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 px-3.5 py-1.5 rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>📥</span>
              <span>Download PDF</span>
            </a>
          </div>
        </div>

        {/* The Digital Invoice Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="p-6 sm:p-8 border-b border-gray-100 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {invoice.business_name}
                </h1>
                <p className="text-xs text-gray-500 capitalize mt-0.5">
                  {invoice.business_type} • Verified Merchant
                </p>
              </div>
              <div className="sm:text-right">
                <span
                  className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wider ${
                    invoice.status === "paid"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : invoice.status === "partial"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  {invoice.status}
                </span>
                <p className="text-xs font-mono font-semibold text-gray-600 mt-1">
                  #{invoice.invoice_number}
                </p>
              </div>
            </div>

            {/* Bill Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-200/70 text-xs">
              <div>
                <span className="text-gray-400 block uppercase font-medium text-[10px]">
                  Billed To
                </span>
                <span className="font-semibold text-gray-900 text-sm block mt-0.5">
                  {invoice.party_name}
                </span>
                {invoice.party_phone && (
                  <span className="text-gray-500 block">{invoice.party_phone}</span>
                )}
              </div>
              <div>
                <span className="text-gray-400 block uppercase font-medium text-[10px]">
                  Issue Date
                </span>
                <span className="font-semibold text-gray-800 block mt-0.5">
                  {new Date(invoice.date).toLocaleDateString("en-PK", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {invoice.due_date && (
                <div>
                  <span className="text-gray-400 block uppercase font-medium text-[10px]">
                    Due Date
                  </span>
                  <span className="font-semibold text-gray-800 block mt-0.5">
                    {new Date(invoice.due_date).toLocaleDateString("en-PK", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="p-6 sm:p-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Itemized Charges
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase text-[10px]">
                    <th className="py-2.5">Item Description</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Rate</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {invoice.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 font-medium text-gray-900">{it.description}</td>
                      <td className="py-3 text-center">{it.quantity}</td>
                      <td className="py-3 text-right">Rs {Number(it.unit_price).toLocaleString()}</td>
                      <td className="py-3 text-right font-semibold">
                        Rs {(Number(it.quantity) * Number(it.unit_price)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary */}
            <div className="border-t border-gray-200 mt-4 pt-4 flex flex-col items-end">
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Total Amount</span>
                  <span className="font-semibold text-gray-900">
                    Rs {Number(invoice.total_amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Paid Amount</span>
                  <span className="font-semibold">
                    Rs {Number(invoice.paid_amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-dashed border-gray-200 pt-2 text-sm font-bold">
                  <span className={remaining > 0 ? "text-red-600" : "text-gray-900"}>
                    {remaining > 0 ? "Balance Due" : "Net Settled"}
                  </span>
                  <span className={remaining > 0 ? "text-red-600" : "text-emerald-600"}>
                    Rs {remaining.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer CTA */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 text-center sm:text-left">
              Thank you for your business! Please keep this digital receipt for your records.
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsThermalOpen(true)}
                className="flex-1 sm:flex-none text-center px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🧾</span>
                <span>POS Slip</span>
              </button>
              <a
                href={`${API_BASE_URL}/invoices/public/${invoice.id}/pdf`}
                download={`${invoice.invoice_number}.pdf`}
                className="flex-1 sm:flex-none text-center px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                📥 Download PDF
              </a>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-gray-400">
          Generated via FISTA Accounts &amp; Bookkeeping System
        </p>
      </div>

      {/* Thermal Receipt Modal */}
      {isThermalOpen && invoice && (
        <ThermalReceiptModal
          isOpen={isThermalOpen}
          onClose={() => setIsThermalOpen(false)}
          data={{
            businessName: invoice.business_name,
            businessType: invoice.business_type,
            invoiceNumber: invoice.invoice_number,
            date: invoice.date,
            partyName: invoice.party_name,
            partyPhone: invoice.party_phone || undefined,
            invoiceType: invoice.invoice_type,
            items: invoice.items,
            totalAmount: invoice.total_amount,
            paidAmount: invoice.paid_amount,
            status: invoice.status,
          }}
        />
      )}
    </div>
  );
}
