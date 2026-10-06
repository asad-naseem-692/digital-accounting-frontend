"use client";

/**
 * context/BusinessContext.tsx
 *
 * Provides the currently-selected business, the list of businesses the user belongs to,
 * and the user's role/permissions in that business across the app.
 */

import React, { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import type { BusinessWithRole } from "@/types";
import {
  getActiveBusinessId,
  setActiveBusinessId,
  clearActiveBusinessId,
} from "@/lib/business";
import { apiGet } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useAuth } from "./AuthContext";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
interface BusinessState {
  activeBusiness: BusinessWithRole | null;
  businesses: BusinessWithRole[];
  isLoading: boolean;
}

type BusinessAction =
  | { type: "SET_BUSINESS"; business: BusinessWithRole }
  | { type: "SET_BUSINESSES"; businesses: BusinessWithRole[]; active: BusinessWithRole | null }
  | { type: "CLEAR_BUSINESS" }
  | { type: "SET_LOADING"; isLoading: boolean };

function businessReducer(state: BusinessState, action: BusinessAction): BusinessState {
  switch (action.type) {
    case "SET_BUSINESS":
      return { ...state, activeBusiness: action.business, isLoading: false };
    case "SET_BUSINESSES":
      return {
        ...state,
        businesses: action.businesses,
        activeBusiness: action.active,
        isLoading: false,
      };
    case "CLEAR_BUSINESS":
      return { activeBusiness: null, businesses: [], isLoading: false };
    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface BusinessContextValue {
  activeBusiness: BusinessWithRole | null;
  activeBusinessId: string | null;
  businesses: BusinessWithRole[];
  isLoading: boolean;
  selectBusiness: (business: BusinessWithRole) => void;
  clearBusiness: () => void;
  fetchBusinesses: () => Promise<BusinessWithRole[]>;
  canEdit: boolean;
  canDelete: boolean;
  isOwner: boolean;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [state, dispatch] = useReducer(businessReducer, {
    activeBusiness: null,
    businesses: [],
    isLoading: true,
  });

  const fetchBusinesses = useCallback(async (): Promise<BusinessWithRole[]> => {
    const currentToken = getToken();
    if (!currentToken) {
      dispatch({ type: "SET_LOADING", isLoading: false });
      return [];
    }

    try {
      dispatch({ type: "SET_LOADING", isLoading: true });
      const list = await apiGet<BusinessWithRole[]>("/businesses/mine", {
        withBusinessId: false,
      });

      const savedId = getActiveBusinessId();
      let active: BusinessWithRole | null = null;

      if (savedId) {
        active = list.find((b) => b.id === savedId) || null;
        if (!active) {
          clearActiveBusinessId();
        }
      }
      if (!active && list.length > 0) {
        active = list[0];
        setActiveBusinessId(active.id);
      } else if (!active && list.length === 0) {
        clearActiveBusinessId();
      }

      dispatch({ type: "SET_BUSINESSES", businesses: list, active });
      return list;
    } catch {
      dispatch({ type: "SET_LOADING", isLoading: false });
      return [];
    }
  }, []);

  useEffect(() => {
    if (!token || !user) {
      clearActiveBusinessId();
      dispatch({ type: "CLEAR_BUSINESS" });
    } else {
      fetchBusinesses();
    }
  }, [token, user?.id, fetchBusinesses]);

  function selectBusiness(business: BusinessWithRole) {
    setActiveBusinessId(business.id);
    dispatch({ type: "SET_BUSINESS", business });
  }

  function clearBusiness() {
    clearActiveBusinessId();
    dispatch({ type: "CLEAR_BUSINESS" });
  }

  const activeBusiness = state.activeBusiness;
  const canEdit = activeBusiness?.can_edit ?? false;
  const canDelete = activeBusiness?.can_delete ?? false;
  const isOwner = (activeBusiness?.role === "owner") && (user?.account_type !== "staff");

  return (
    <BusinessContext.Provider
      value={{
        activeBusiness,
        activeBusinessId: activeBusiness?.id ?? getActiveBusinessId(),
        businesses: state.businesses,
        isLoading: state.isLoading,
        selectBusiness,
        clearBusiness,
        fetchBusinesses,
        canEdit,
        canDelete,
        isOwner,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used inside <BusinessProvider>");
  return ctx;
}
