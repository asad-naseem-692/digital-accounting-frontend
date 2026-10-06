"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useBusiness } from "@/context/BusinessContext";
import { useToast } from "@/context/ToastContext";
import { apiGet, apiPost } from "@/lib/api";
import type { Product, ProductCreate, StockAdjustmentCreate } from "@/types";

export default function StockPage() {
  const { activeBusiness, canEdit } = useBusiness();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add Product Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [initialStock, setInitialStock] = useState<number | "">(0);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Adjust Stock Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustmentQty, setAdjustmentQty] = useState<number | "">("");
  const [adjustmentReason, setAdjustmentReason] = useState("Restock");

  async function loadProducts() {
    if (!activeBusiness) return;
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set("search", search.trim());
      if (lowStockOnly) queryParams.set("low_stock", "true");

      const list = await apiGet<Product[]>(`/products?${queryParams.toString()}`);
      setProducts(list);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [activeBusiness, search, lowStockOnly]);

  // Inventory KPI statistics
  const inventoryStats = useMemo(() => {
    let totalItems = products.length;
    let lowStockCount = 0;
    let totalStockValue = 0;

    products.forEach((p) => {
      if (p.stock_quantity <= 5) lowStockCount++;
      const cost = p.cost_price || p.unit_price || 0;
      totalStockValue += p.stock_quantity * cost;
    });

    return { totalItems, lowStockCount, totalStockValue };
  }, [products]);

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setModalError(null);

    if (!name.trim()) {
      setModalError("Product name is required");
      return;
    }
    if (unitPrice === "" || Number(unitPrice) < 0) {
      setModalError("Unit price must be 0 or greater");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: ProductCreate = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        unit_price: Number(unitPrice),
        cost_price: Number(costPrice) || 0,
        initial_stock: Number(initialStock) || 0,
      };

      const newProd = await apiPost<Product>("/products", payload);
      showToast(`Product "${newProd.name}" added to catalog`, "success");
      setIsAddModalOpen(false);
      setName("");
      setSku("");
      setUnitPrice("");
      setCostPrice("");
      setInitialStock(0);
      loadProducts();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setModalError(err.message);
        showToast(err.message, "error");
      } else {
        setModalError("Failed to add product");
        showToast("Failed to add product", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAdjustStock(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = Number(adjustmentQty);
    if (!qty || qty === 0) return;

    try {
      setIsSubmitting(true);
      const payload: StockAdjustmentCreate = {
        change_amount: qty,
        reason: adjustmentReason.trim() || "Manual adjustment",
      };

      await apiPost(`/products/${selectedProduct.id}/adjust`, payload);
      showToast(
        `Updated stock for ${selectedProduct.name} (${qty > 0 ? `+${qty}` : qty})`,
        "success"
      );
      setIsAdjustModalOpen(false);
      setAdjustmentQty("");
      setSelectedProduct(null);
      loadProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to adjust stock";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 tracking-tight">
              Products &amp; Inventory
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-white/10 tabular-nums">
              {products.length} products
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Manage catalog items, pricing, costs, and real-time inventory levels
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-medium rounded-lg text-sm shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <span>+</span> Add Product
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Catalog Items */}
        <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200/80 dark:border-white/[0.08] p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-900 dark:bg-white" />
          <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            Total Catalog Items
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1 tabular-nums">
            {inventoryStats.totalItems}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
            Active items available for billing
          </p>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200/80 dark:border-white/[0.08] p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Low Stock Alerts (&le; 5)
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {inventoryStats.lowStockCount}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
            Items requiring supplier re-order
          </p>
        </div>

        {/* Total Inventory Valuation */}
        <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200/80 dark:border-white/[0.08] p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Total Inventory Valuation
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            Rs {inventoryStats.totalStockValue.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
            Estimated wholesale cost valuation
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200/80 dark:border-white/[0.08] shadow-xs p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name or SKU..."
          className="w-full sm:max-w-md px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
        />

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
            />
            <span>Low stock only (&le; 5 units)</span>
          </label>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200/80 dark:border-white/[0.08] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-500 dark:text-slate-400 text-sm animate-pulse">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-slate-500 text-sm">
            No products found. Click &ldquo;+ Add Product&rdquo; to add items.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/90 dark:bg-slate-950/60 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4 text-right">Sale Price</th>
                  <th className="py-3.5 px-4 text-right">Cost Price</th>
                  <th className="py-3.5 px-4 text-center">Stock</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {products.map((p) => {
                  const isLowStock = p.stock_quantity <= 5;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-slate-100">{p.name}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-500 dark:text-slate-400">
                        {p.sku || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-slate-100 tabular-nums">
                        Rs {Number(p.unit_price).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-500 dark:text-slate-400 tabular-nums">
                        Rs {Number(p.cost_price || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            p.stock_quantity <= 0
                              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
                              : isLowStock
                              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40"
                              : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
                          }`}
                        >
                          {p.stock_quantity} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsAdjustModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 rounded-md transition-colors cursor-pointer border border-neutral-200 dark:border-white/10"
                          >
                            Adjust Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#181d26] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/[0.08] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-white/10">
              <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Add Product</h2>
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

            <form onSubmit={handleAddProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Basmati Rice 25kg"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  SKU / Code (optional)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. RIC-025"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Sale Price (Rs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Cost Price (Rs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Initial Stock Quantity
                </label>
                <input
                  type="number"
                  min={0}
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
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
                  {isSubmitting ? "Adding..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#181d26] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/[0.08] p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-white/10">
              <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Adjust Stock</h2>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="mb-4 p-3 bg-neutral-100 dark:bg-white/[0.04] rounded-xl border border-neutral-200 dark:border-white/10">
              <span className="text-xs font-semibold text-gray-800 dark:text-slate-200 block">
                {selectedProduct.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                Current Stock: <strong className="text-gray-900 dark:text-slate-100">{selectedProduct.stock_quantity}</strong> units
              </span>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Change Quantity (+ to add, - to reduce)
                </label>
                <input
                  type="number"
                  required
                  value={adjustmentQty}
                  onChange={(e) =>
                    setAdjustmentQty(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="e.g. +10 or -5"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                >
                  <option value="Restock">Restock / New shipment</option>
                  <option value="Damaged">Damaged / Expired stock</option>
                  <option value="Physical Count Correction">Physical count correction</option>
                  <option value="Customer Return">Customer return</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="flex-1 py-2 px-3 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-slate-200 font-medium rounded-xl text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-bold rounded-xl text-sm disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isSubmitting ? "Updating..." : "Update Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
