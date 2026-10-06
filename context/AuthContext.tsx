"use client";

/**
 * context/AuthContext.tsx
 *
 * Provides the current authenticated user across the app.
 * Reads the initial user from localStorage on mount (SSR-safe).
 */

import React, { createContext, useContext, useEffect, useReducer } from "react";
import type { User } from "@/types";
import {
  getToken,
  getCurrentUser,
  setToken,
  setCurrentUser,
  clearSession,
} from "@/lib/auth";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: "SET_SESSION"; user: User; token: string }
  | { type: "CLEAR_SESSION" }
  | { type: "HYDRATED" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_SESSION":
      return { user: action.user, token: action.token, isLoading: false };
    case "CLEAR_SESSION":
      return { user: null, token: null, isLoading: false };
    case "HYDRATED":
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setSession: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    isLoading: true,
  });

  // Hydrate from localStorage on first render (client-side only)
  useEffect(() => {
    const token = getToken();
    const user = getCurrentUser();
    if (token && user) {
      dispatch({ type: "SET_SESSION", user, token });
    } else {
      dispatch({ type: "HYDRATED" });
    }
  }, []);

  function setSession(user: User, token: string) {
    setToken(token);
    setCurrentUser(user);
    dispatch({ type: "SET_SESSION", user, token });
  }

  function logout() {
    clearSession();
    dispatch({ type: "CLEAR_SESSION" });
  }

  return (
    <AuthContext.Provider
      value={{ ...state, setSession, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
