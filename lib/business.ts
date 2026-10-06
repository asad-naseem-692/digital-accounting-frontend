/**
 * lib/business.ts
 *
 * FEAT-04 / FEAT-08 — Active Business Context helpers
 *
 * Stores the active business_id in localStorage so it survives page refreshes.
 * Every business-scoped API call reads this via getActiveBusinessId().
 */

const BUSINESS_KEY = "active_business_id";

const isBrowser = typeof window !== "undefined";

export function getActiveBusinessId(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(BUSINESS_KEY);
}

export function setActiveBusinessId(id: string): void {
  if (!isBrowser) return;
  localStorage.setItem(BUSINESS_KEY, id);
}

export function clearActiveBusinessId(): void {
  if (!isBrowser) return;
  localStorage.removeItem(BUSINESS_KEY);
}
