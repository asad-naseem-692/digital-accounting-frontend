"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useBusiness } from "@/context/BusinessContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { StaffMember, StaffInvitePayload, StaffUpdatePermissionsPayload } from "@/types";

export default function AccessManagementPage() {
  const { activeBusiness, isOwner, isLoading: bizLoading } = useBusiness();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<StaffInvitePayload>({
    name: "",
    email: "",
    password: "",
    can_edit: true,
    can_delete: false,
  });
  const [preset, setPreset] = useState<"view_only" | "editor" | "full">("editor");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Revoke Modal
  const [revokingMember, setRevokingMember] = useState<StaffMember | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Load staff list
  const loadStaff = useCallback(async () => {
    if (!activeBusiness || !isOwner) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<StaffMember[]>(`/businesses/${activeBusiness.id}/staff`);
      setStaffList(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load staff members");
    } finally {
      setIsLoading(false);
    }
  }, [activeBusiness, isOwner]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  // Handle Preset Selection in Invite Modal
  function handlePresetChange(type: "view_only" | "editor" | "full") {
    setPreset(type);
    if (type === "view_only") {
      setInviteForm(prev => ({ ...prev, can_edit: false, can_delete: false }));
    } else if (type === "editor") {
      setInviteForm(prev => ({ ...prev, can_edit: true, can_delete: false }));
    } else {
      setInviteForm(prev => ({ ...prev, can_edit: true, can_delete: true }));
    }
  }

  // Generate strong random password
  function handleGeneratePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInviteForm(prev => ({ ...prev, password: gen }));
    setShowPassword(true);
  }

  // Submit invite
  async function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeBusiness) return;
    setInviteError(null);

    if (!inviteForm.name.trim()) {
      setInviteError("Name is required");
      return;
    }
    if (!inviteForm.email.trim()) {
      setInviteError("Email is required");
      return;
    }
    if (inviteForm.password.length < 6) {
      setInviteError("Password must be at least 6 characters");
      return;
    }

    setIsSubmittingInvite(true);
    try {
      await apiPost<StaffMember>(`/businesses/${activeBusiness.id}/staff`, inviteForm);
      showToast(`✅ Successfully added ${inviteForm.name} to ${activeBusiness.name}!`);
      setIsInviteOpen(false);
      setInviteForm({
        name: "",
        email: "",
        password: "",
        can_edit: true,
        can_delete: false,
      });
      setPreset("editor");
      loadStaff();
    } catch (err: any) {
      setInviteError(err?.message || "Failed to invite staff member");
    } finally {
      setIsSubmittingInvite(false);
    }
  }

  // Toggle permission directly from table
  async function handleTogglePermission(
    member: StaffMember,
    field: "can_edit" | "can_delete",
    currentVal: boolean
  ) {
    if (!activeBusiness || member.role === "owner") return;

    const payload: StaffUpdatePermissionsPayload = {
      [field]: !currentVal,
    };

    // Optimistic UI update
    setStaffList(prev =>
      prev.map(m => (m.user_id === member.user_id ? { ...m, [field]: !currentVal } : m))
    );

    try {
      await apiPatch<StaffMember>(
        `/businesses/${activeBusiness.id}/staff/${member.user_id}`,
        payload
      );
      showToast(`Updated ${field === "can_edit" ? "Edit" : "Delete"} rights for ${member.name}`);
    } catch (err: any) {
      // Revert on error
      setStaffList(prev =>
        prev.map(m => (m.user_id === member.user_id ? { ...m, [field]: currentVal } : m))
      );
      showToast(`❌ Failed to update permission: ${err?.message || "Unknown error"}`);
    }
  }

  // Revoke access
  async function handleRevokeConfirm() {
    if (!activeBusiness || !revokingMember) return;
    setIsRevoking(true);
    try {
      await apiDelete(`/businesses/${activeBusiness.id}/staff/${revokingMember.user_id}`);
      showToast(`Revoked access for ${revokingMember.name}`);
      setRevokingMember(null);
      loadStaff();
    } catch (err: any) {
      showToast(`❌ Failed to revoke access: ${err?.message || "Unknown error"}`);
    } finally {
      setIsRevoking(false);
    }
  }

  // Stats computation
  const totalMembers = staffList.length;
  const ownerCount = staffList.filter(s => s.role === "owner").length;
  const editorCount = staffList.filter(s => s.role === "staff" && s.can_edit && !s.can_delete).length;
  const fullAccessCount = staffList.filter(s => s.role === "staff" && s.can_edit && s.can_delete).length;
  const viewOnlyCount = staffList.filter(s => s.role === "staff" && !s.can_edit).length;

  if (bizLoading) {
    return (
      <div className="py-20 text-center text-gray-400 dark:text-slate-500 text-sm animate-pulse">
        Loading business access permissions...
      </div>
    );
  }

  // Non-owner view restriction
  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 text-2xl border border-amber-200 dark:border-amber-900/50">
          🔒
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Access Restricted</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
          Only the <strong>Business Owner</strong> can view or manage staff permissions for{" "}
          <strong>{activeBusiness?.name || "this business"}</strong>.
        </p>
        <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 text-xs text-left max-w-md mx-auto">
          <p className="font-semibold text-gray-800 dark:text-slate-200 mb-2">Your Current Access Rights:</p>
          <ul className="space-y-1.5 text-gray-600 dark:text-slate-400">
            <li className="flex items-center gap-2">
              <span>👤</span> Role: <strong className="capitalize">{activeBusiness?.role || "Staff"}</strong>
            </li>
            <li className="flex items-center gap-2">
              <span>{activeBusiness?.can_edit ? "✅" : "❌"}</span>
              Edit / Create Rights: <strong>{activeBusiness?.can_edit ? "Allowed" : "View-Only"}</strong>
            </li>
            <li className="flex items-center gap-2">
              <span>{activeBusiness?.can_delete ? "✅" : "❌"}</span>
              Delete Rights: <strong>{activeBusiness?.can_delete ? "Allowed" : "Protected"}</strong>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Hero Banner / Header Card */}
      <div className="bg-white dark:bg-[#181d26] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-7 h-7 text-neutral-800 dark:text-neutral-200" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Access Management
              </h1>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1 max-w-xl">
                Grant staff view-only, edit, or delete rights — you decide who sees what.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white text-sm font-semibold rounded-xl cursor-pointer transition-colors shadow-xs shrink-0"
          >
            <span className="text-lg leading-none">+</span>
            <span>Invite Staff Member</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
            Total Members
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalMembers}</p>
        </div>
        <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Owners (Full Control)
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{ownerCount}</p>
        </div>
        <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
            Editors / Operators
          </p>
          <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mt-1">
            {editorCount + fullAccessCount}
          </p>
        </div>
        <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            View-Only Auditors
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{viewOnlyCount}</p>
        </div>
      </div>

      {/* Role Guide Presets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200/70 dark:border-white/10 p-4 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded bg-neutral-100 dark:bg-white/[0.04] text-neutral-700 dark:text-neutral-300">👁️</span>
            <span className="font-semibold text-gray-900 dark:text-neutral-100 text-sm">View-Only Rights</span>
          </div>
          <p className="text-gray-500 dark:text-neutral-400 leading-relaxed">
            Staff can view parties, stock, bills, cash book, and reports. <strong>Cannot</strong> add or modify any records.
          </p>
        </div>

        <div className="bg-white dark:bg-[#181d26] rounded-xl border border-neutral-300 dark:border-white/15 p-4 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded bg-neutral-100 dark:bg-white/[0.04] text-neutral-800 dark:text-neutral-200">✏️</span>
            <span className="font-semibold text-neutral-900 dark:text-white text-sm">Editor Rights (Recommended)</span>
          </div>
          <p className="text-gray-600 dark:text-neutral-300 leading-relaxed">
            Staff can create daily bills, add customers/suppliers, and record payments. <strong>Cannot</strong> delete records.
          </p>
        </div>

        <div className="bg-white dark:bg-[#181d26] rounded-xl border border-neutral-200 dark:border-white/10 p-4 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded bg-neutral-100 dark:bg-white/[0.04] text-neutral-800 dark:text-neutral-200">🛡️</span>
            <span className="font-semibold text-neutral-900 dark:text-white text-sm">Full Management Rights</span>
          </div>
          <p className="text-gray-600 dark:text-neutral-300 leading-relaxed">
            Staff can add, edit, and delete transactions and entries across all modules.
          </p>
        </div>
      </div>

      {/* Staff Members Table */}
      <div className="bg-white dark:bg-[#181d26] rounded-2xl border border-gray-200 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Staff &amp; Members with Access
            </h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
              Manage permission levels in real time for {activeBusiness?.name}
            </p>
          </div>
          <button
            onClick={loadStaff}
            title="Refresh List"
            className="text-xs font-medium text-gray-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>🔄</span> Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-gray-400 dark:text-neutral-500 text-sm animate-pulse">
            Loading staff members...
          </div>
        ) : staffList.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-gray-600 dark:text-neutral-400 text-sm font-medium">No staff members found.</p>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="mt-3 text-neutral-900 dark:text-white text-xs font-semibold hover:underline cursor-pointer"
            >
              + Invite your first staff member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/[0.02] text-gray-500 dark:text-neutral-400 uppercase text-[11px] font-medium border-b border-gray-200 dark:border-white/10">
                  <th className="py-3 px-5">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Access Level</th>
                  <th className="py-3 px-4 text-center">Can Edit</th>
                  <th className="py-3 px-4 text-center">Can Delete</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {staffList.map(member => {
                  const isSelf = member.user_id === currentUser?.id;
                  const isMemberOwner = member.role === "owner";

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-white/3 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                            isMemberOwner
                              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                              : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-800 dark:text-neutral-200"
                          }`}>
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-900 dark:text-neutral-100">
                                {member.name}
                              </span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-neutral-300">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-neutral-400">{member.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        {isMemberOwner ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                            👑 Owner
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-neutral-300">
                            👤 Staff
                          </span>
                        )}
                      </td>

                      {/* Access Level Badge */}
                      <td className="py-3 px-4">
                        {isMemberOwner || (member.can_edit && member.can_delete) ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40">
                            🛡️ Full Access
                          </span>
                        ) : member.can_edit ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-white/[0.06] text-neutral-800 dark:text-neutral-200 border border-neutral-200/50 dark:border-white/10">
                            ✏️ Editor
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-white/10">
                            👁️ View Only
                          </span>
                        )}
                      </td>

                      {/* Can Edit Toggle */}
                      <td className="py-3 px-4 text-center">
                        {isMemberOwner ? (
                          <span className="text-gray-400 font-medium text-[11px]">Always</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(member, "can_edit", member.can_edit)}
                            className={`w-11 h-6 inline-flex items-center rounded-full transition-colors p-0.5 cursor-pointer ${
                              member.can_edit ? "bg-emerald-600" : "bg-gray-300 dark:bg-slate-700"
                            }`}
                            title={`Click to ${member.can_edit ? "revoke" : "grant"} Edit rights`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                                member.can_edit ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        )}
                      </td>

                      {/* Can Delete Toggle */}
                      <td className="py-3 px-4 text-center">
                        {isMemberOwner ? (
                          <span className="text-gray-400 font-medium text-[11px]">Always</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(member, "can_delete", member.can_delete)}
                            className={`w-11 h-6 inline-flex items-center rounded-full transition-colors p-0.5 cursor-pointer ${
                              member.can_delete ? "bg-emerald-600" : "bg-gray-300 dark:bg-slate-700"
                            }`}
                            title={`Click to ${member.can_delete ? "revoke" : "grant"} Delete rights`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                                member.can_delete ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        {isMemberOwner ? (
                          <span className="text-[11px] text-gray-400 dark:text-slate-500 italic">
                            Business Owner
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRevokingMember(member)}
                            className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors cursor-pointer"
                          >
                            Revoke Access
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

      {/* ── INVITE MODAL ── */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#181d26] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-6 w-full max-w-lg my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/[0.04] text-neutral-800 dark:text-neutral-200 flex items-center justify-center font-bold">
                  👥
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Invite Staff Member
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Add user to <strong>{activeBusiness?.name}</strong> with role-based rights
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {inviteError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs rounded-xl">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Bilal"
                  value={inviteForm.name}
                  onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#11141a] text-gray-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. bilal@shop.com"
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#11141a] text-gray-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
                <p className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1">
                  Staff member will use this email to sign in.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">
                    Temporary Sign-in Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 hover:underline cursor-pointer"
                  >
                    ⚡ Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Min 6 characters"
                    value={inviteForm.password}
                    onChange={e => setInviteForm({ ...inviteForm, password: e.target.value })}
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#11141a] text-gray-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200 text-xs cursor-pointer"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Permission Presets */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-2">
                  Assign Access Level Preset *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* View Only */}
                  <button
                    type="button"
                    onClick={() => handlePresetChange("view_only")}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      preset === "view_only"
                        ? "border-neutral-900 dark:border-white bg-neutral-100 dark:bg-white/[0.08] ring-2 ring-neutral-900/10 dark:ring-white/20"
                        : "border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="font-semibold text-xs text-gray-900 dark:text-white">👁️ View Only</div>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1">
                      Read-only access to ledgers & reports.
                    </p>
                  </button>

                  {/* Editor */}
                  <button
                    type="button"
                    onClick={() => handlePresetChange("editor")}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      preset === "editor"
                        ? "border-neutral-900 dark:border-white bg-neutral-100 dark:bg-white/[0.08] ring-2 ring-neutral-900/10 dark:ring-white/20"
                        : "border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="font-semibold text-xs text-gray-900 dark:text-white">✏️ Editor</div>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1">
                      Can create bills, transactions & stock.
                    </p>
                  </button>

                  {/* Full */}
                  <button
                    type="button"
                    onClick={() => handlePresetChange("full")}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      preset === "full"
                        ? "border-neutral-900 dark:border-white bg-neutral-100 dark:bg-white/[0.08] ring-2 ring-neutral-900/10 dark:ring-white/20"
                        : "border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="font-semibold text-xs text-gray-900 dark:text-white">🛡️ Full Access</div>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1">
                      Can edit & delete transactions.
                    </p>
                  </button>
                </div>
              </div>

              {/* Granular Checkboxes */}
              <div className="bg-gray-50 dark:bg-[#11141a] p-3 rounded-xl border border-gray-100 dark:border-white/5 space-y-2 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inviteForm.can_edit}
                    onChange={e => setInviteForm({ ...inviteForm, can_edit: e.target.checked })}
                    className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 dark:focus:ring-white cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-neutral-200">
                      Can Edit / Create
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                      Allow creating invoices, transactions, products, and parties
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer pt-1 border-t border-gray-200/50 dark:border-white/5">
                  <input
                    type="checkbox"
                    checked={inviteForm.can_delete}
                    onChange={e => setInviteForm({ ...inviteForm, can_delete: e.target.checked })}
                    className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 dark:focus:ring-white cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-neutral-200">
                      Can Delete Records
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                      Allow removing transactions, invoices, or customer ledgers
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="flex-1 py-2.5 px-3 bg-gray-100 dark:bg-white/[0.04] hover:bg-gray-200 dark:hover:bg-white/[0.08] text-gray-700 dark:text-neutral-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="flex-1 py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 disabled:opacity-50 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  {isSubmittingInvite ? "Granting Access..." : "Grant Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REVOKE CONFIRMATION MODAL ── */}
      {revokingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#181d26] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-6 w-full max-w-md">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xl mb-3">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
              Revoke Access for {revokingMember.name}?
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to remove <strong>{revokingMember.name}</strong> ({revokingMember.email}) from <strong>{activeBusiness?.name}</strong>?
              They will immediately lose all access to view or edit this business.
            </p>

            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setRevokingMember(null)}
                disabled={isRevoking}
                className="flex-1 py-2.5 px-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeConfirm}
                disabled={isRevoking}
                className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs"
              >
                {isRevoking ? "Revoking..." : "Yes, Revoke Access"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
