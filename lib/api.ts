/**
 * lib/api.ts
 *
 * FEAT-04 — Single API client module
 *
 * ALL API calls in the app go through this module — never call fetch() directly.
 *
 * Responsibilities:
 * - Reads NEXT_PUBLIC_API_BASE_URL from env (never hardcoded)
 * - Attaches Authorization: Bearer <token> on every request
 * - Attaches X-Business-Id: <id> on every business-scoped request
 * - On 401: clears session and redirects to /login
 * - Returns typed responses or throws ApiError
 */

import { getToken, clearSession } from "@/lib/auth";
import { getActiveBusinessId } from "@/lib/business";
import type { ApiError } from "@/types";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

type RequestOptions = {
  method?: string;
  body?: unknown;
  /** Set to false for endpoints that don't need X-Business-Id (e.g. /auth/*, /businesses/mine) */
  withBusinessId?: boolean;
};

/**
 * Core fetch wrapper. Use the typed helpers (apiGet, apiPost, etc.) in
 * your components rather than calling this directly.
 */
async function request<T>(
  path: string,
  { method = "GET", body, withBusinessId = true }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Attach JWT
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Attach X-Business-Id for business-scoped requests
  if (withBusinessId) {
    const businessId = getActiveBusinessId();
    if (businessId) {
      headers["X-Business-Id"] = businessId;
    }
    // If businessId is null here, the backend will return 400/401 — that's correct.
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Auto-logout on 401 for authenticated session expiry
  // (Do not auto-redirect on public auth endpoints like /auth/login or if already on /login)
  if (res.status === 401) {
    const isPublicAuthRoute =
      path.startsWith("/auth/login") ||
      path.startsWith("/auth/signup") ||
      path.startsWith("/auth/request-reset") ||
      path.startsWith("/auth/confirm-reset");

    if (!isPublicAuthRoute) {
      clearSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please log in again.");
    }
  }

  // Parse JSON errors
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = (await res.json()) as ApiError;
      detail = err.detail ?? detail;
    } catch {
      // ignore parse failure
    }
    throw new Error(detail);
  }

  // Handle empty responses (e.g. 204 No Content)
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// ---------------------------------------------------------------------------
// Typed HTTP verb helpers
// ---------------------------------------------------------------------------

export function apiGet<T>(path: string, opts?: Omit<RequestOptions, "method" | "body">): Promise<T> {
  return request<T>(path, { ...opts, method: "GET" });
}

export function apiPost<T>(path: string, body: unknown, opts?: Omit<RequestOptions, "method">): Promise<T> {
  return request<T>(path, { ...opts, method: "POST", body });
}

export function apiPatch<T>(path: string, body: unknown, opts?: Omit<RequestOptions, "method">): Promise<T> {
  return request<T>(path, { ...opts, method: "PATCH", body });
}

export function apiDelete<T>(path: string, opts?: Omit<RequestOptions, "method" | "body">): Promise<T> {
  return request<T>(path, { ...opts, method: "DELETE" });
}

/**
 * Download a PDF from a URL and trigger a browser download.
 * Used for invoice PDF export (FEAT-20) and report PDF export (FEAT-30).
 */
export async function downloadPdf(path: string, filename: string): Promise<void> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const businessId = getActiveBusinessId();
  if (businessId) headers["X-Business-Id"] = businessId;

  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`PDF download failed: HTTP ${res.status}`);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
