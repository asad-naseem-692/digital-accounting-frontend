"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBusiness } from "@/context/BusinessContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiPost } from "@/lib/api";
import type { Business, BusinessWithRole } from "@/types";

export default function BusinessesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const {
    businesses,
    activeBusinessId,
    selectBusiness,
    fetchBusinesses,
    isLoading: bizLoading,
    isOwner,
  } = useBusiness();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("Retail");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  async function handleCreateBusiness(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (user?.account_type === "staff") {
      setError("Staff accounts are not permitted to register new businesses.");
      return;
    }

    if (!name.trim()) {
      setError("Please provide a business name");
      return;
    }

    try {
      setIsSubmitting(true);
      const newBiz = await apiPost<Business>(
        "/businesses",
        {
          name: name.trim(),
          business_type: businessType.trim(),
        },
        { withBusinessId: false }
      );

      // Refresh list to get BusinessWithRole
      const list = await fetchBusinesses();
      const created = list.find((b) => b.id === newBiz.id) || {
        ...newBiz,
        role: "owner" as const,
        can_edit: true,
        can_delete: true,
      };

      selectBusiness(created);
      showToast(`Business "${created.name}" registered successfully!`, "success");
      setIsModalOpen(false);
      setName("");
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        showToast(err.message, "error");
      } else {
        setError("Failed to create business. Please try again.");
        showToast("Failed to create business. Please try again.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelect(biz: BusinessWithRole) {
    selectBusiness(biz);
    showToast(`Switched to ${biz.name}`, "info");
    router.push("/dashboard");
  }

  if (authLoading || (bizLoading && businesses.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500 text-sm font-medium animate-pulse">Loading businesses...</div>
      </div>
    );
  }

  const isStaffAccount = user?.account_type === "staff" || (!isOwner && businesses.length > 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 tracking-tight">Your Businesses</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-white/10 tabular-nums">
              {businesses.length} active
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Select an entity to open its Khata &amp; Cash Book{isStaffAccount ? "" : " or register a new venture"}
          </p>
        </div>
        {!isStaffAccount && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-medium rounded-lg text-sm shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <span>+</span> Register New Business
          </button>
        )}
      </div>

      {businesses.length === 0 ? (
        <div className="bg-white dark:bg-[#181d26] rounded-xl border border-dashed border-gray-300 dark:border-white/10 p-12 text-center shadow-xs">
          {isStaffAccount ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 text-2xl border border-amber-200 dark:border-amber-900/50">
                🔒
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">
                No Active Business Access
              </h3>
              <p className="text-gray-500 dark:text-slate-400 text-xs max-w-md mx-auto">
                You are registered as a Staff Member. You do not currently have access to any business. Please contact your business owner to grant you access.
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/[0.06] text-neutral-800 dark:text-neutral-200 flex items-center justify-center mx-auto mb-4 text-2xl border border-neutral-200 dark:border-white/10">
                🏢
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">
                No businesses registered yet
              </h3>
              <p className="text-gray-500 dark:text-slate-400 text-xs max-w-md mx-auto mb-6">
                Get started by registering your shop or company entity to begin automated bookkeeping.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 text-white font-semibold rounded-lg text-sm cursor-pointer shadow-xs"
              >
                Create Your First Business
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businesses.map((biz) => {
            const isActive = biz.id === activeBusinessId;
            return (
              <div
                key={biz.id}
                onClick={() => handleSelect(biz)}
                className={`bg-white dark:bg-[#181d26] rounded-xl p-5 border transition-all cursor-pointer relative overflow-hidden ${
                  isActive
                    ? "border-neutral-900 dark:border-white ring-1 ring-neutral-900/20 dark:ring-white/20 shadow-md"
                    : "border-gray-200/80 dark:border-white/[0.08] hover:border-neutral-400 dark:hover:border-white/30 hover:shadow-xs"
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-900 dark:bg-white" />
                )}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                      <span>{biz.name}</span>
                      {isActive && <span className="text-neutral-900 dark:text-white text-xs font-bold">✓ Active</span>}
                    </h3>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-slate-300 capitalize border border-gray-200/60 dark:border-white/10">
                      {biz.business_type}
                    </span>
                  </div>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    biz.role === "owner"
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40"
                      : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-white/10"
                  }`}>
                    {biz.role === "owner" ? "👑 Owner" : "💼 Staff"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 pt-3 border-t border-gray-100 dark:border-white/10 mt-3">
                  <div className="flex items-center gap-2">
                    {biz.can_edit && (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        ✓ Can edit
                      </span>
                    )}
                    {biz.can_delete && (
                      <span className="text-gray-500 dark:text-slate-400 font-medium">
                        • Can delete
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(biz);
                    }}
                    className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs"
                        : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {isActive ? "Currently Open" : "Open Ledger →"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Business Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#181d26] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/[0.08] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-white/10">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">
                  Register Business
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Set up your business entity</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs rounded-lg font-normal">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateBusiness} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Al-Madina Traders"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Business Type
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                >
                  <option value="Retail">Retail Store / Shop</option>
                  <option value="Wholesale">Wholesale / Distributor</option>
                  <option value="Services">Services / Consultancy</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Freelance">Freelance / Individual</option>
                  <option value="General">General Trading / Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
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
                  className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white font-bold rounded-xl text-sm disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isSubmitting ? "Creating..." : "Save Business"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
