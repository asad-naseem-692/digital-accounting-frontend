/**
 * lib/auth.ts
 *
 * FEAT-04 — Token Storage helpers
 *
 * Stores the access token and current user in localStorage.
 * Trade-off: localStorage is vulnerable to XSS; acceptable for local dev.
 * For production hardening, move to httpOnly cookies.
 *
 * Key names are constants so they never drift between files.
 */
import type { User } from "@/types";
import { clearActiveBusinessId } from "./business";

const TOKEN_KEY = "access_token";
const USER_KEY = "current_user";

// Guard for SSR — localStorage is not available on the server
const isBrowser = typeof window !== "undefined";

export function getToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (!isBrowser) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (!isBrowser) return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getCurrentUser(): User | null {
  if (!isBrowser) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User): void {
  if (!isBrowser) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearCurrentUser(): void {
  if (!isBrowser) return;
  localStorage.removeItem(USER_KEY);
}

export function clearSession(): void {
  clearToken();
  clearCurrentUser();
  clearActiveBusinessId();
}
