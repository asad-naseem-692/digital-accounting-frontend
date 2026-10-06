"use client";

import React, { useState, useEffect } from "react";

export interface ThermalReceiptData {
  businessName: string;
  businessType?: string;
  businessAddress?: string;
  businessPhone?: string;
  invoiceNumber: string;
  date: string;
  time?: string;
  partyName?: string;
  partyPhone?: string | null;
  invoiceType?: "sale" | "purchase";
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
  totalAmount: number;
  paidAmount: number;
  status: "unpaid" | "partial" | "paid";
  footerNote?: string;
}

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ThermalReceiptData | null;
}

export default function ThermalReceiptModal({
  isOpen,
  onClose,
  data,
}: ThermalReceiptModalProps) {
  const [paperWidth, setPaperWidth] = useState<"80mm" | "58mm">("80mm");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const remaining = Math.max(0, data.totalAmount - data.paidAmount);
  const totalQty = data.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

  function handlePrint() {
    window.print();
  }

  return (
    <>
      {/* Print-specific style injection */}
      <style jsx global>{`
        @media print {
          /* Hide everything except the thermal receipt */
          body * {
            visibility: hidden;
          }
          #thermal-receipt-print-area,
          #thermal-receipt-print-area * {
            visibility: visible;
          }
          #thermal-receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: ${paperWidth === "80mm" ? "78mm" : "56mm"} !important;
            margin: 0 !important;
            padding: 2mm 3mm !important;
            font-size: ${paperWidth === "80mm" ? "12px" : "10px"} !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: ${paperWidth === "80mm" ? "80mm auto" : "58mm auto"};
            margin: 0;
          }
        }
      `}</style>

      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150 my-auto">
          {/* Top Control Bar */}
          <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🖨️</span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  Thermal POS Receipt
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Standard 80mm / 58mm roll format
                </p>
              </div>
            </div>

            {/* Paper Size Selector */}
            <div className="flex items-center gap-1 bg-gray-200 dark:bg-slate-700/60 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setPaperWidth("80mm")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  paperWidth === "80mm"
                    ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-2xs"
                    : "text-gray-600 dark:text-slate-300 hover:text-gray-900"
                }`}
              >
                80mm (Standard)
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth("58mm")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  paperWidth === "58mm"
                    ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-2xs"
                    : "text-gray-600 dark:text-slate-300 hover:text-gray-900"
                }`}
              >
                58mm (Mini)
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-lg leading-none cursor-pointer ml-2"
            >
              &times;
            </button>
          </div>

          {/* Preview Container (Scrollable) */}
          <div className="p-6 bg-gray-100 dark:bg-slate-950/70 flex justify-center max-h-[65vh] overflow-y-auto">
            {/* The Actual Thermal Receipt */}
            <div
              id="thermal-receipt-print-area"
              style={{ width: paperWidth === "80mm" ? "320px" : "240px" }}
              className="bg-white text-black font-mono text-[11px] p-4 shadow-md border border-gray-200 select-text leading-tight"
            >
              {/* Business Header */}
              <div className="text-center space-y-1 mb-2">
                <h1 className="text-sm font-bold tracking-wider uppercase">
                  {data.businessName}
                </h1>
                {data.businessType && (
                  <p className="text-[10px] text-gray-600 uppercase">
                    {data.businessType}
                  </p>
                )}
                {data.businessPhone && (
                  <p className="text-[10px] text-gray-700">
                    Ph: {data.businessPhone}
                  </p>
                )}
                {data.businessAddress && (
                  <p className="text-[10px] text-gray-700">
                    {data.businessAddress}
                  </p>
                )}
              </div>

              {/* Dotted Divider */}
              <div className="border-b border-dashed border-gray-400 my-2" />

              {/* Invoice Meta */}
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>INVOICE:</span>
                  <span className="font-bold">{data.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{new Date(data.date).toLocaleDateString("en-PK")}</span>
                </div>
                {data.partyName && (
                  <div className="flex justify-between">
                    <span>CUSTOMER:</span>
                    <span className="font-bold truncate max-w-[150px]">
                      {data.partyName}
                    </span>
                  </div>
                )}
                {data.partyPhone && (
                  <div className="flex justify-between">
                    <span>PHONE:</span>
                    <span>{data.partyPhone}</span>
                  </div>
                )}
              </div>

              {/* Dotted Divider */}
              <div className="border-b border-dashed border-gray-400 my-2" />

              {/* Item List Header */}
              <div className="flex justify-between font-bold text-[10px] mb-1">
                <span className="w-1/2">ITEM</span>
                <span className="w-1/6 text-center">QTY</span>
                <span className="w-1/6 text-right">RATE</span>
                <span className="w-1/6 text-right">TOTAL</span>
              </div>

              <div className="border-b border-dashed border-gray-400 my-1" />

              {/* Items Rows */}
              <div className="space-y-1.5 text-[10px]">
                {data.items.map((it, idx) => {
                  const itemTotal = Number(it.quantity) * Number(it.unit_price);
                  return (
                    <div key={idx} className="flex justify-between items-start">
                      <span className="w-1/2 break-words pr-1 font-medium">
                        {it.description}
                      </span>
                      <span className="w-1/6 text-center">{it.quantity}</span>
                      <span className="w-1/6 text-right">
                        {Number(it.unit_price).toLocaleString()}
                      </span>
                      <span className="w-1/6 text-right font-bold">
                        {itemTotal.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Dotted Divider */}
              <div className="border-b border-dashed border-gray-400 my-2" />

              {/* Totals Section */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>Total Items / Qty:</span>
                  <span>{totalQty}</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
                  <span>TOTAL AMOUNT:</span>
                  <span>Rs {Number(data.totalAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASH PAID:</span>
                  <span>Rs {Number(data.paidAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-dashed border-gray-400">
                  <span>{remaining > 0 ? "BALANCE DUE:" : "NET STATUS:"}</span>
                  <span>
                    {remaining > 0
                      ? `Rs ${remaining.toLocaleString()}`
                      : "PAID / CLEARED"}
                  </span>
                </div>
              </div>

              {/* Dotted Divider */}
              <div className="border-b border-dashed border-gray-400 my-2.5" />

              {/* Footer Note / Barcode / Thanks */}
              <div className="text-center text-[10px] space-y-1 text-gray-600">
                <p className="font-semibold uppercase tracking-wider text-black">
                  *** THANK YOU ***
                </p>
                <p>{data.footerNote || "Software by Digital Khata System"}</p>
                <p className="text-[9px] pt-1">
                  Printed: {new Date().toLocaleDateString("en-PK")} {new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-white/10 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-slate-400 hidden sm:inline">
              Ready for 80mm / 58mm Thermal Printers
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🖨️</span>
                <span>Print Receipt Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
