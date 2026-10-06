"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: {
    (message: string, type?: ToastType, title?: string): void;
    (toast: Omit<Toast, "id">): void;
  };
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      arg: string | Omit<Toast, "id">,
      type: ToastType = "info",
      title?: string,
      duration = 4000
    ) => {
      let toastItem: Omit<Toast, "id">;
      if (typeof arg === "string") {
        toastItem = {
          message: arg,
          type,
          title,
          duration: type === "error" ? 5500 : duration,
        };
      } else {
        toastItem = arg;
      }

      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = {
        id,
        type: toastItem.type,
        title: toastItem.title,
        message: toastItem.message,
        duration: toastItem.duration ?? (toastItem.type === "error" ? 5500 : 4000),
      };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 active

      const dur = newToast.duration ?? 4000;
      if (dur > 0) {
        setTimeout(() => {
          removeToast(id);
        }, dur);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: "success", title, message }),
    [showToast]
  );
  const error = useCallback(
    (message: string, title?: string) => showToast({ type: "error", title, message, duration: 5500 }),
    [showToast]
  );
  const info = useCallback(
    (message: string, title?: string) => showToast({ type: "info", title, message }),
    [showToast]
  );
  const warning = useCallback(
    (message: string, title?: string) => showToast({ type: "warning", title, message }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, removeToast, success, error, info, warning }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";
        const isWarning = toast.type === "warning";

        const borderClass = isSuccess
          ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100"
          : isError
          ? "border-rose-500/40 bg-rose-50 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100"
          : isWarning
          ? "border-amber-500/40 bg-amber-50 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100"
          : "border-blue-500/40 bg-blue-50 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100";

        const iconBg = isSuccess
          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50"
          : isError
          ? "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50"
          : isWarning
          ? "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50"
          : "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50";

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${iconBg}`}>
              {isSuccess && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isError && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {isWarning && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {!isSuccess && !isError && !isWarning && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              {toast.title && (
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-0.5">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs font-medium leading-relaxed break-words">{toast.message}</p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 -mr-1 -mt-1 rounded-md"
              aria-label="Dismiss toast"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
