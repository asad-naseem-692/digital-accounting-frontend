"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useBusiness } from "@/context/BusinessContext";
import { apiGet, apiPost, apiPatch, apiDelete, downloadPdf } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import WhatsAppShareModal from "@/components/WhatsAppShareModal";
import type {
  Worker,
  WorkerCreate,
  AttendanceStatus,
  AttendanceRecord,
  WorkerAttendanceMonth,
  SalaryCalculation,
  SalaryPaymentRecord,
  AdvanceRecord,
  StaffBookSummary,
} from "@/types";

// ─── helpers ────────────────────────────────────────────────────────────────

function today(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentMonth(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  half_day: "Half Day",
  leave: "Leave",
};

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  absent: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  half_day: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  leave: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
};


const STATUS_DOT: Record<AttendanceStatus, string> = {
  present: "bg-emerald-500",
  absent: "bg-red-500",
  half_day: "bg-amber-500",
  leave: "bg-blue-500",
};

// ─── main component ──────────────────────────────────────────────────────────

type Tab = "workers" | "attendance" | "salary" | "advances";

export default function StaffPage() {
  const { activeBusiness, canEdit } = useBusiness();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [tab, setTab] = useState<Tab>("workers");

  // Summary
  const [summary, setSummary] = useState<StaffBookSummary | null>(null);

  // Workers tab
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [workerForm, setWorkerForm] = useState<WorkerCreate>({
    name: "",
    phone: "",
    designation: "",
    monthly_salary: 0,
    joining_date: "",
  });
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [isSubmittingWorker, setIsSubmittingWorker] = useState(false);

  // Edit worker
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editForm, setEditForm] = useState<Partial<WorkerCreate>>({});

  // Attendance tab
  const [attMonth, setAttMonth] = useState(currentMonth());
  const [monthlyAtt, setMonthlyAtt] = useState<WorkerAttendanceMonth[]>([]);
  const [isLoadingAtt, setIsLoadingAtt] = useState(false);
  const [savingAtt, setSavingAtt] = useState<string | null>(null); // worker_id being saved

  // Salary tab
  const [salMonth, setSalMonth] = useState(currentMonth());
  const [salCalc, setSalCalc] = useState<SalaryCalculation | null>(null);
  const [salWorker, setSalWorker] = useState<string>("");
  const [salHistory, setSalHistory] = useState<SalaryPaymentRecord[]>([]);
  const [isLoadingSalHistory, setIsLoadingSalHistory] = useState(false);
  const [isPayingSalary, setIsPayingSalary] = useState(false);
  const [salMsg, setSalMsg] = useState<string | null>(null);
  const [cashInHand, setCashInHand] = useState<number | null>(null);

  // WhatsApp modal
  const [whatsAppModal, setWhatsAppModal] = useState<{
    isOpen: boolean;
    workerName: string;
    phone: string;
    message: string;
  }>({ isOpen: false, workerName: "", phone: "", message: "" });

  function getSalaryWhatsAppMessage(sp: SalaryPaymentRecord): string {
    const bizName = activeBusiness?.name || "Business";
    const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
    const slipUrl = `${apiBase}/staff-book/salary/public/${sp.id}/pdf`;
    return `Assalam-o-Alaikum *${sp.worker_name}*,\n\n*${bizName}* ki taraf se aapki Month *${sp.month}* ki Salary Slip:\n\n📅 *Working Days:* ${sp.working_days}\n🟢 *Present Days:* ${sp.days_present}\n🟡 *Half Days:* ${sp.days_half}\n💵 *Gross Salary:* Rs ${Number(sp.gross_salary).toLocaleString()}\n➖ *Advance Deducted:* Rs ${Number(sp.advance_deducted).toLocaleString()}\n💰 *Net Salary Paid:* Rs ${Number(sp.net_salary).toLocaleString()}\n🗓️ *Paid Date:* ${new Date(sp.paid_at).toLocaleDateString()}\n\n📥 *Download Official Salary Slip (PDF):*\n👉 ${slipUrl}\n\nShukriya!\n*${bizName}*`;
  }

  // Advances tab
  const [advances, setAdvances] = useState<AdvanceRecord[]>([]);
  const [showAddAdv, setShowAddAdv] = useState(false);
  const [advForm, setAdvForm] = useState({ worker_id: "", amount: "", description: "", date: today() });
  const [advError, setAdvError] = useState<string | null>(null);
  const [isSubmittingAdv, setIsSubmittingAdv] = useState(false);

  // ── loaders ──────────────────────────────────────────────────────────────

  const loadCashSummary = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      const res = await apiGet<{ cash_in_hand: number }>("/cash-entries/summary");
      setCashInHand(res.cash_in_hand);
    } catch { /* ignore */ }
  }, [activeBusiness]);

  const loadSummary = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      const s = await apiGet<StaffBookSummary>(`/staff-book/summary?for_date=${today()}`);
      setSummary(s);
    } catch { /* ignore */ }
  }, [activeBusiness]);

  const loadWorkers = useCallback(async () => {
    if (!activeBusiness) return;
    setIsLoadingWorkers(true);
    try {
      const list = await apiGet<Worker[]>(`/staff-book/workers?for_date=${today()}`);
      setWorkers(list);
      if (!salWorker && list.length > 0) setSalWorker(list[0].id);
    } catch { /* ignore */ }
    finally { setIsLoadingWorkers(false); }
  }, [activeBusiness]);

  const loadAttendance = useCallback(async () => {
    if (!activeBusiness) return;
    setIsLoadingAtt(true);
    try {
      const data = await apiGet<WorkerAttendanceMonth[]>(`/staff-book/attendance?month=${attMonth}`);
      setMonthlyAtt(data);
    } catch { /* ignore */ }
    finally { setIsLoadingAtt(false); }
  }, [activeBusiness, attMonth]);

  const loadSalHistory = useCallback(async () => {
    if (!activeBusiness) return;
    setIsLoadingSalHistory(true);
    try {
      const hist = await apiGet<SalaryPaymentRecord[]>("/staff-book/salary/history");
      setSalHistory(hist);
    } catch { /* ignore */ }
    finally {
      setIsLoadingSalHistory(false);
    }
  }, [activeBusiness]);

  const loadAdvances = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      const list = await apiGet<AdvanceRecord[]>("/staff-book/advances");
      setAdvances(list);
    } catch { /* ignore */ }
  }, [activeBusiness]);

  useEffect(() => {
    loadSummary();
    loadWorkers();
    loadCashSummary();
    loadSalHistory();
  }, [loadSummary, loadWorkers, loadCashSummary, loadSalHistory]);

  useEffect(() => { if (tab === "attendance") loadAttendance(); }, [tab, loadAttendance]);
  useEffect(() => { if (tab === "salary") { loadSalHistory(); loadCashSummary(); } }, [tab, loadSalHistory, loadCashSummary]);
  useEffect(() => { if (tab === "advances") { loadAdvances(); loadCashSummary(); } }, [tab, loadAdvances, loadCashSummary]);

  // ── calculate salary when worker or month changes ─────────────────────────

  useEffect(() => {
    if (!salWorker || !salMonth || tab !== "salary") return;
    apiGet<SalaryCalculation>(`/staff-book/salary/calculate?worker_id=${salWorker}&month=${salMonth}`)
      .then(setSalCalc)
      .catch(() => setSalCalc(null));
  }, [salWorker, salMonth, tab]);

  // ── handlers ─────────────────────────────────────────────────────────────

  async function handleAddWorker(e: React.FormEvent) {
    e.preventDefault();
    setWorkerError(null);
    if (!workerForm.name.trim()) { setWorkerError("Name is required"); return; }
    try {
      setIsSubmittingWorker(true);
      const payload: WorkerCreate = {
        name: workerForm.name.trim(),
        phone: workerForm.phone?.trim() || undefined,
        designation: workerForm.designation?.trim() || undefined,
        monthly_salary: Number(workerForm.monthly_salary) || 0,
        joining_date: workerForm.joining_date || undefined,
      };
      await apiPost<Worker>("/staff-book/workers", payload);
      toastSuccess(`Worker "${payload.name}" added successfully!`);
      setShowAddWorker(false);
      setWorkerForm({ name: "", phone: "", designation: "", monthly_salary: 0, joining_date: "" });
      loadWorkers();
      loadSummary();
    } catch (err: unknown) {
      setWorkerError(err instanceof Error ? err.message : "Failed to add worker");
      toastError(err instanceof Error ? err.message : "Failed to add worker");
    } finally { setIsSubmittingWorker(false); }
  }

  async function handleUpdateWorker(e: React.FormEvent) {
    e.preventDefault();
    if (!editingWorker) return;
    try {
      await apiPatch(`/staff-book/workers/${editingWorker.id}`, editForm);
      toastSuccess("Worker details updated!");
      setEditingWorker(null);
      loadWorkers();
    } catch {
      toastError("Failed to update worker");
    }
  }

  async function handleMarkAttendance(workerId: string, date: string, status: AttendanceStatus) {
    setSavingAtt(workerId);

    // 1. Instant optimistic update on worker cards if marking today
    if (date === today()) {
      setWorkers(prev =>
        prev.map(w => (w.id === workerId ? { ...w, today_status: status } : w))
      );
    }

    // 2. Optimistic update on monthly attendance grid if loaded
    setMonthlyAtt(prev =>
      prev.map(m => {
        if (m.worker_id !== workerId) return m;
        const exists = m.attendance.some(a => a.date === date);
        const newAttList = exists
          ? m.attendance.map(a => (a.date === date ? { ...a, status } : a))
          : [...m.attendance, { id: `temp-${Date.now()}`, worker_id: workerId, date, status, note: null, created_at: new Date().toISOString() }];
        return { ...m, attendance: newAttList };
      })
    );

    const targetWorker = workers.find(w => w.id === workerId);
    try {
      await apiPost("/staff-book/attendance", { worker_id: workerId, date, status });
      toastSuccess(`Marked ${STATUS_LABEL[status]} for ${targetWorker?.name || "worker"}`);
      await Promise.all([
        loadAttendance(),
        loadSummary(),
        loadWorkers(),
      ]);
    } catch {
      toastError("Failed to record attendance");
      await loadWorkers();
      await loadAttendance();
    } finally {
      setSavingAtt(null);
    }
  }

  async function handleMarkAllPresent() {
    if (!canEdit) return;
    const todayStr = today();
    const bulkRecords = workers.map(w => ({ worker_id: w.id, date: todayStr, status: "present" as AttendanceStatus }));
    try {
      await apiPost("/staff-book/attendance/bulk", { date: todayStr, records: bulkRecords });
      toastSuccess("All workers marked Present today!");
      await loadAttendance();
      await loadSummary();
      await loadWorkers();
    } catch {
      toastError("Failed to mark all present");
    }
  }

  async function handlePaySalary() {
    if (!salCalc || !salWorker) return;
    setSalMsg(null);
    setIsPayingSalary(true);
    try {
      await apiPost("/staff-book/salary/pay", { worker_id: salWorker, month: salMonth });
      toastSuccess(`Salary paid: Rs ${salCalc.net_salary.toLocaleString()} deducted.`);
      setSalMsg(`✅ Salary paid! Rs ${salCalc.net_salary.toLocaleString()} deducted from Cash in Hand.`);
      await loadSalHistory();
      await loadAdvances();
      await loadCashSummary();
      // Recalculate
      const updated = await apiGet<SalaryCalculation>(`/staff-book/salary/calculate?worker_id=${salWorker}&month=${salMonth}`);
      setSalCalc(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      setSalMsg(`❌ ${msg}`);
      toastError(msg);
    } finally { setIsPayingSalary(false); }
  }

  async function handleAddAdvance(e: React.FormEvent) {
    e.preventDefault();
    setAdvError(null);
    if (!advForm.worker_id) { setAdvError("Select a worker"); return; }
    const amt = Number(advForm.amount);
    if (!amt || amt <= 0) { setAdvError("Enter a valid amount"); return; }
    if (cashInHand !== null && amt > cashInHand) {
      setAdvError(`Insufficient Cash in Hand! You only have Rs ${cashInHand.toLocaleString()} available.`);
      return;
    }
    try {
      setIsSubmittingAdv(true);
      await apiPost("/staff-book/advances", {
        worker_id: advForm.worker_id,
        amount: amt,
        description: advForm.description.trim() || undefined,
        date: advForm.date,
      });
      toastSuccess(`Advance of Rs ${amt.toLocaleString()} recorded!`);
      setShowAddAdv(false);
      setAdvForm({ worker_id: "", amount: "", description: "", date: today() });
      await loadAdvances();
      await loadCashSummary();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record advance";
      setAdvError(msg);
      toastError(msg);
    } finally { setIsSubmittingAdv(false); }
  }

  // ── get attendance map for a worker in current attMonth ──────────────────

  function getAttMap(workerId: string): Record<string, AttendanceStatus> {
    const row = monthlyAtt.find(w => w.worker_id === workerId);
    if (!row) return {};
    const map: Record<string, AttendanceStatus> = {};
    row.attendance.forEach(a => { map[a.date] = a.status; });
    return map;
  }

  function daysInMonth(ym: string): number[] {
    const [y, m] = ym.split("-").map(Number);
    const count = new Date(y, m, 0).getDate();
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  // ── UI ───────────────────────────────────────────────────────────────────

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
      tab === t
        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm font-semibold"
        : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
    }`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 tracking-tight">Staff Book</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Attendance, salary & advance management</p>
        </div>
        {tab === "workers" && canEdit && (
          <button
            onClick={() => setShowAddWorker(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
            Add Worker
          </button>
        )}
        {tab === "attendance" && canEdit && (
          <button
            onClick={handleMarkAllPresent}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors"
          >
            <span>✓</span> Mark All Present Today
          </button>
        )}
        {tab === "advances" && canEdit && (
          <button
            onClick={() => setShowAddAdv(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Record Advance
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Workers", value: summary.total_workers, color: "text-neutral-900 dark:text-white" },
            { label: "Present Today", value: summary.present_today, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Absent Today", value: summary.absent_today, color: "text-red-600 dark:text-red-400" },
            { label: "On Leave", value: summary.on_leave_today, color: "text-neutral-600 dark:text-neutral-300" },
            { label: "Not Marked", value: summary.unmarked_today, color: "text-gray-500 dark:text-slate-400" },
            {
              label: "Pending Advance",
              value: `Rs ${summary.total_pending_advances.toLocaleString()}`,
              color: "text-amber-600 dark:text-amber-400",
            },
          ].map(card => (
            <div key={card.label} className="bg-white dark:bg-[#181d26] rounded-xl border border-gray-200 dark:border-white/[0.08] p-3.5 shadow-xs">
              <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800/60 rounded-xl p-1 w-fit">
        {(["workers", "attendance", "salary", "advances"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={tabCls(t)}>
            {t === "workers" ? "👷 Workers" : t === "attendance" ? "📅 Attendance" : t === "salary" ? "💰 Salary & History" : "💵 Advances"}
          </button>
        ))}
      </div>

      {/* ── WORKERS TAB ── */}
      {tab === "workers" && (
        <div>
          {isLoadingWorkers ? (
            <div className="py-12 text-center text-gray-400 text-sm animate-pulse">Loading workers...</div>
          ) : workers.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">👷</p>
              <p className="text-gray-500 dark:text-slate-400 text-sm">No workers added yet.</p>
              {canEdit && (
                <button onClick={() => setShowAddWorker(true)} className="mt-3 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline cursor-pointer">
                  + Add your first worker
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workers.map(w => (
                <div key={w.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-base">
                        {w.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">{w.name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{w.designation || "Worker"}</p>
                      </div>
                    </div>
                    {w.today_status ? (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[w.today_status]}`}>
                        {STATUS_LABEL[w.today_status]}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
                        Not Marked
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-slate-400">Monthly Salary</span>
                      <span className="font-semibold text-gray-900 dark:text-slate-100">Rs {Number(w.monthly_salary).toLocaleString()}</span>
                    </div>
                    {w.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-slate-400">Phone</span>
                        <span className="text-gray-800 dark:text-slate-200">{w.phone}</span>
                      </div>
                    )}
                    {w.joining_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-slate-400">Joined</span>
                        <span className="text-gray-800 dark:text-slate-200">{new Date(w.joining_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Today's Attendance Quick Mark on Worker Card */}
                  {canEdit && (
                    <div className="pt-2.5 mt-2.5 border-t border-gray-100 dark:border-white/5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Today&apos;s Attendance</span>
                        {savingAtt === w.id && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Saving...</span>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {(["present", "absent", "half_day", "leave"] as AttendanceStatus[]).map(st => {
                          const isSelected = w.today_status === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleMarkAttendance(w.id, today(), st)}
                              disabled={savingAtt === w.id}
                              className={`py-1 rounded text-xs font-semibold transition-all cursor-pointer text-center ${
                                isSelected
                                  ? `${STATUS_COLOR[st]} ring-1 ring-inset ring-current shadow-xs`
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                              }`}
                              title={STATUS_LABEL[st]}
                            >
                              {st === "present" ? "P" : st === "absent" ? "A" : st === "half_day" ? "H" : "L"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {canEdit && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                      <button
                        onClick={() => { setEditingWorker(w); setEditForm({ name: w.name, phone: w.phone || "", designation: w.designation || "", monthly_salary: w.monthly_salary }); }}
                        className="flex-1 py-1.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => { setSalWorker(w.id); setTab("salary"); }}
                        className="flex-1 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg cursor-pointer transition-colors"
                      >
                        Salary
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ATTENDANCE TAB ── */}
      {tab === "attendance" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Month:</label>
            <input
              type="month"
              value={attMonth}
              onChange={e => setAttMonth(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#181d26] text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20"
            />
          </div>

          {isLoadingAtt ? (
            <div className="py-10 text-center text-gray-400 text-sm animate-pulse">Loading attendance...</div>
          ) : workers.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">Add workers first.</div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-white/10">
                      <th className="py-3 px-4 text-left font-semibold text-gray-700 dark:text-slate-300 whitespace-nowrap min-w-[140px]">Worker</th>
                      {daysInMonth(attMonth).map(d => (
                        <th key={d} className="py-3 px-1 text-center font-medium text-gray-500 dark:text-slate-400 min-w-[32px]">{d}</th>
                      ))}
                      <th className="py-3 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">P</th>
                      <th className="py-3 px-4 text-center font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">H</th>
                      <th className="py-3 px-4 text-center font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">A</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {workers.map(w => {
                      const attMap = getAttMap(w.id);
                      const wRow = monthlyAtt.find(m => m.worker_id === w.id);
                      return (
                        <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-white/3">
                          <td className="py-2 px-4 font-medium text-gray-900 dark:text-slate-100 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {savingAtt === w.id && (
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                              )}
                              {w.name}
                            </div>
                          </td>
                          {daysInMonth(attMonth).map(d => {
                            const dateStr = `${attMonth}-${String(d).padStart(2, "0")}`;
                            const st = attMap[dateStr];
                            const isToday = dateStr === today();
                            const isFuture = dateStr > today();
                            return (
                              <td key={d} className={`py-2 px-0.5 text-center ${isToday ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}`}>
                                {isFuture ? (
                                  <span className="text-gray-200 dark:text-slate-700">-</span>
                                ) : canEdit ? (
                                  <select
                                    value={st || ""}
                                    onChange={e => handleMarkAttendance(w.id, dateStr, e.target.value as AttendanceStatus)}
                                    className={`w-8 text-[10px] rounded border-0 text-center cursor-pointer focus:ring-0 focus:outline-none ${
                                      st ? STATUS_COLOR[st] : "bg-gray-100 dark:bg-slate-800 text-gray-400"
                                    }`}
                                  >
                                    <option value="">?</option>
                                    <option value="present">P</option>
                                    <option value="absent">A</option>
                                    <option value="half_day">H</option>
                                    <option value="leave">L</option>
                                  </select>
                                ) : st ? (
                                  <span className={`inline-block w-5 h-5 rounded-full ${STATUS_DOT[st]}`} title={STATUS_LABEL[st]} />
                                ) : (
                                  <span className="text-gray-300 dark:text-slate-600">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{wRow?.days_present ?? 0}</td>
                          <td className="py-2 px-4 text-center font-bold text-amber-600 dark:text-amber-400">{wRow?.days_half ?? 0}</td>
                          <td className="py-2 px-4 text-center font-bold text-red-600 dark:text-red-400">{wRow?.days_absent ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t border-gray-100 dark:border-white/5 text-[11px] text-gray-400 dark:text-slate-500">
                P = Present &nbsp;|&nbsp; H = Half Day &nbsp;|&nbsp; A = Absent &nbsp;|&nbsp; L = Leave
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SALARY TAB ── */}
      {tab === "salary" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-slate-400 block mb-1">Worker</label>
              <select
                value={salWorker}
                onChange={e => { setSalWorker(e.target.value); setSalMsg(null); }}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">— Select Worker —</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-slate-400 block mb-1">Month</label>
              <input
                type="month"
                value={salMonth}
                onChange={e => { setSalMonth(e.target.value); setSalMsg(null); }}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Salary Calculator Card */}
          {salCalc && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-xs max-w-md">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-4">
                💰 Salary Calculation — {salCalc.worker_name}
              </h3>
              <div className="space-y-2.5 text-sm">
                {[
                  ["Monthly Salary", `Rs ${salCalc.monthly_salary.toLocaleString()}`],
                  ["Working Days (Month)", salCalc.working_days],
                  ["Days Present", salCalc.days_present],
                  ["Half Days", salCalc.days_half],
                  ["Payable Days", salCalc.payable_days],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex justify-between text-gray-700 dark:text-slate-300">
                    <span className="text-gray-500 dark:text-slate-400">{label}</span>
                    <span className="font-medium">{String(val)}</span>
                  </div>
                ))}
                <div className="border-t border-dashed border-gray-200 dark:border-white/10 pt-2.5">
                  <div className="flex justify-between text-gray-700 dark:text-slate-300">
                    <span>Gross Salary</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">Rs {salCalc.gross_salary.toLocaleString()}</span>
                  </div>
                  {salCalc.pending_advances > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400 mt-1">
                      <span>Advance Deduction</span>
                      <span className="font-semibold">- Rs {salCalc.pending_advances.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between bg-neutral-100 dark:bg-white/[0.06] rounded-xl px-3.5 py-2.5">
                  <span className="font-bold text-neutral-900 dark:text-white">Net Payable</span>
                  <span className="font-bold text-neutral-900 dark:text-white text-base">Rs {salCalc.net_salary.toLocaleString()}</span>
                </div>

                {/* Available Cash in Hand Guard */}
                <div className="flex justify-between items-center text-xs py-2 px-3 rounded-lg bg-gray-50 dark:bg-slate-800/80 border border-gray-100 dark:border-white/5">
                  <span className="text-gray-500 dark:text-slate-400">Available Cash in Hand:</span>
                  <span className={`font-semibold ${cashInHand !== null && cashInHand < salCalc.net_salary ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    Rs {cashInHand !== null ? cashInHand.toLocaleString() : "..."}
                  </span>
                </div>

                {cashInHand !== null && cashInHand < salCalc.net_salary && (
                  <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs">
                    ⚠️ <strong>Insufficient Cash in Hand!</strong> Available cash (Rs {cashInHand.toLocaleString()}) is less than net salary (Rs {salCalc.net_salary.toLocaleString()}). Please add cash to Cash Book first before paying.
                  </div>
                )}
              </div>
              {salMsg && (
                <p className={`mt-3 text-sm ${salMsg.startsWith("✅") ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{salMsg}</p>
              )}
              {canEdit && (
                <button
                  onClick={handlePaySalary}
                  disabled={isPayingSalary || salCalc.net_salary <= 0 || (cashInHand !== null && cashInHand < salCalc.net_salary)}
                  className="mt-4 w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl cursor-pointer transition-colors shadow-sm"
                >
                  {isPayingSalary
                    ? "Processing..."
                    : cashInHand !== null && cashInHand < salCalc.net_salary
                    ? `Cannot Pay (Cash in Hand: Rs ${cashInHand.toLocaleString()})`
                    : `Pay Rs ${salCalc.net_salary.toLocaleString()}`}
                </button>
              )}
            </div>
          )}

          {/* Salary History */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Salary Payment History</h3>
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                  {salHistory.length}
                </span>
              </div>
              <button
                type="button"
                onClick={loadSalHistory}
                disabled={isLoadingSalHistory}
                title="Refresh History"
                className="text-xs text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-medium cursor-pointer inline-flex items-center gap-1"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>

            {isLoadingSalHistory ? (
              <div className="py-12 text-center text-gray-400 text-xs animate-pulse">Loading salary payment history...</div>
            ) : salHistory.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <p className="text-3xl mb-2">📄</p>
                <p className="text-gray-700 dark:text-slate-300 font-medium text-sm">No Salary Payments Recorded Yet</p>
                <p className="text-gray-400 dark:text-slate-500 text-xs mt-1 max-w-md mx-auto">
                  Select a worker & month above, calculate payable amount, and click &quot;Pay&quot; to disburse salary. Each paid salary will show here with 1-click PDF Slip download & WhatsApp share.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 uppercase text-[11px] font-medium">
                      <th className="py-2.5 px-4 text-left">Worker</th>
                      <th className="py-2.5 px-4 text-left">Month</th>
                      <th className="py-2.5 px-4 text-center">Days</th>
                      <th className="py-2.5 px-4 text-right">Gross</th>
                      <th className="py-2.5 px-4 text-right">Advance</th>
                      <th className="py-2.5 px-4 text-right">Net Paid</th>
                      <th className="py-2.5 px-4 text-left">Date</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {salHistory.map(sp => (
                      <tr key={sp.id} className="hover:bg-gray-50 dark:hover:bg-white/3">
                        <td className="py-2.5 px-4 font-medium text-gray-900 dark:text-slate-100">{sp.worker_name}</td>
                        <td className="py-2.5 px-4 text-gray-600 dark:text-slate-400">{sp.month}</td>
                        <td className="py-2.5 px-4 text-center text-gray-700 dark:text-slate-300">{sp.days_present}P + {sp.days_half}H</td>
                        <td className="py-2.5 px-4 text-right text-gray-700 dark:text-slate-300">Rs {Number(sp.gross_salary).toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right text-amber-600 dark:text-amber-400">
                          {sp.advance_deducted > 0 ? `- Rs ${Number(sp.advance_deducted).toLocaleString()}` : "—"}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-emerald-700 dark:text-emerald-400">Rs {Number(sp.net_salary).toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-gray-500 dark:text-slate-400 whitespace-nowrap">{new Date(sp.paid_at).toLocaleDateString()}</td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => downloadPdf(`/staff-book/salary/${sp.id}/pdf`, `Salary_Slip_${sp.worker_name}_${sp.month}.pdf`)}
                              title="Download Salary Slip PDF"
                              className="px-2 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <span>📄</span>
                              <span>PDF Slip</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const workerObj = workers.find(w => w.id === sp.worker_id);
                                setWhatsAppModal({
                                  isOpen: true,
                                  workerName: sp.worker_name || "Worker",
                                  phone: workerObj?.phone || "",
                                  message: getSalaryWhatsAppMessage(sp),
                                });
                              }}
                              title="Send Salary Slip via WhatsApp"
                              className="px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.167 8.167 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.08l-.29-.17-3.02.79.81-2.94-.19-.3a8.188 8.188 0 01-1.25-4.35c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.71 4.3 3.79.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
                              </svg>
                              <span>WhatsApp Slip</span>
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
        </div>
      )}

      {/* ── ADVANCES TAB ── */}
      {tab === "advances" && (
        <div className="space-y-4">
          {advances.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2">💵</p>
              <p className="text-gray-500 dark:text-slate-400 text-sm">No advance payments recorded.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 uppercase text-[11px] font-medium border-b border-gray-200 dark:border-white/10">
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Worker</th>
                      <th className="py-3 px-4 text-left">Description</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {advances.map(adv => (
                      <tr key={adv.id} className="hover:bg-gray-50 dark:hover:bg-white/3">
                        <td className="py-2.5 px-4 text-gray-500 dark:text-slate-400 whitespace-nowrap">{new Date(adv.date).toLocaleDateString()}</td>
                        <td className="py-2.5 px-4 font-medium text-gray-900 dark:text-slate-100">{adv.worker_name}</td>
                        <td className="py-2.5 px-4 text-gray-600 dark:text-slate-400">{adv.description || "—"}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-amber-700 dark:text-amber-400">Rs {Number(adv.amount).toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-center">
                          {adv.is_deducted ? (
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-semibold">Deducted</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-semibold">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ADD WORKER MODAL ── */}
      {showAddWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Add Worker</h2>
              <button onClick={() => setShowAddWorker(false)} className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer">&times;</button>
            </div>
            {workerError && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs rounded-lg">{workerError}</div>
            )}
            <form onSubmit={handleAddWorker} className="space-y-3.5">
              {[
                { label: "Full Name *", key: "name", type: "text", placeholder: "e.g. Muhammad Ali" },
                { label: "Phone", key: "phone", type: "tel", placeholder: "e.g. 0300-1234567" },
                { label: "Designation", key: "designation", type: "text", placeholder: "e.g. Cashier, Guard, Helper" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={((workerForm as unknown) as Record<string, string | number>)[f.key] as string}
                    onChange={e => setWorkerForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Monthly Salary (Rs)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={workerForm.monthly_salary}
                  onChange={e => setWorkerForm(prev => ({ ...prev, monthly_salary: Number(e.target.value) }))}
                  placeholder="e.g. 25000"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={workerForm.joining_date}
                  onChange={e => setWorkerForm(prev => ({ ...prev, joining_date: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddWorker(false)} className="flex-1 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmittingWorker} className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white text-sm font-bold rounded-xl disabled:opacity-50 cursor-pointer shadow-md">
                  {isSubmittingWorker ? "Saving..." : "Add Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT WORKER MODAL ── */}
      {editingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#181d26] rounded-2xl shadow-xl border border-gray-200 dark:border-white/[0.08] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Edit Worker — {editingWorker.name}</h2>
              <button onClick={() => setEditingWorker(null)} className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleUpdateWorker} className="space-y-3.5">
              {[
                { label: "Full Name", key: "name", type: "text" },
                { label: "Phone", key: "phone", type: "tel" },
                { label: "Designation", key: "designation", type: "text" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(editForm as Record<string, string | number | undefined>)[f.key] as string || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Monthly Salary (Rs)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.monthly_salary ?? ""}
                  onChange={e => setEditForm(prev => ({ ...prev, monthly_salary: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingWorker(null)} className="flex-1 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 active:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white text-sm font-bold rounded-xl cursor-pointer shadow-md">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD ADVANCE MODAL ── */}
      {showAddAdv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#181d26] rounded-2xl shadow-xl border border-gray-200 dark:border-white/[0.08] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Record Advance Payment</h2>
              <button onClick={() => setShowAddAdv(false)} className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer">&times;</button>
            </div>
            {advError && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs rounded-lg">{advError}</div>
            )}
            <form onSubmit={handleAddAdvance} className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Worker *</label>
                <select
                  value={advForm.worker_id}
                  onChange={e => setAdvForm(prev => ({ ...prev, worker_id: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                >
                  <option value="">— Select Worker —</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Amount (Rs) *</label>
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    Available: <strong className={cashInHand !== null && Number(advForm.amount) > cashInHand ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}>Rs {cashInHand !== null ? cashInHand.toLocaleString() : "..."}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={advForm.amount}
                  onChange={e => setAdvForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="e.g. 5000"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date *</label>
                <input
                  type="date"
                  value={advForm.date}
                  onChange={e => setAdvForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={advForm.description}
                  onChange={e => setAdvForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Eid advance"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddAdv(false)} className="flex-1 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmittingAdv} className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer">
                  {isSubmittingAdv ? "Saving..." : "Record Advance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Share Modal */}
      {whatsAppModal.isOpen && (
        <WhatsAppShareModal
          isOpen={whatsAppModal.isOpen}
          onClose={() => setWhatsAppModal({ isOpen: false, workerName: "", phone: "", message: "" })}
          title={`Share Salary Slip — ${whatsAppModal.workerName}`}
          recipientName={whatsAppModal.workerName}
          defaultPhone={whatsAppModal.phone}
          defaultMessage={whatsAppModal.message}
        />
      )}
    </div>
  );
}
