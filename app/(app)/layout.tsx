"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { apiPost } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";
import {
  LayoutDashboard,
  Receipt,
  ArrowLeftRight,
  Users2,
  Package,
  Wallet,
  BarChart3,
  UserCheck,
  ShieldCheck,
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import KhataLogo from "@/components/KhataLogo";

interface NavGroup {
  title: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    ownerOnly?: boolean;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Daily Book",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        href: "/transactions",
        label: "Daily Transactions",
        icon: ArrowLeftRight,
      },
      {
        href: "/cash-book",
        label: "Cash Book",
        icon: Wallet,
      },
    ],
  },
  {
    title: "Sales & Stock",
    items: [
      {
        href: "/invoices",
        label: "Invoices & Bills",
        icon: Receipt,
      },
      {
        href: "/parties",
        label: "Customers & Suppliers",
        icon: Users2,
      },
      {
        href: "/stock",
        label: "Products & Stock",
        icon: Package,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        href: "/reports",
        label: "Reports & Accounts",
        icon: BarChart3,
        ownerOnly: true,
      },
      {
        href: "/staff",
        label: "Staff & Attendance",
        icon: UserCheck,
        ownerOnly: true,
      },
      {
        href: "/access-management",
        label: "Access Management",
        icon: ShieldCheck,
        ownerOnly: true,
      },
      {
        href: "/businesses",
        label: "Manage Businesses",
        icon: Building2,
        ownerOnly: true,
      },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading, logout } = useAuth();
  const {
    activeBusiness,
    businesses,
    selectBusiness,
    isLoading: bizLoading,
  } = useBusiness();

  const [isBizDropdownOpen, setIsBizDropdownOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isStaff = user?.account_type === "staff";
  const isOwner = activeBusiness?.role === "owner" && !isStaff;

  const OWNER_ONLY_ROUTES = ["/reports", "/staff", "/access-management"];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBizDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile sidebar on route navigation
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  // Route protection & business guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (!bizLoading) {
        if (!activeBusiness && pathname !== "/businesses") {
          if (!isStaff) {
            router.push("/businesses");
          }
        } else if (isStaff && pathname.startsWith("/businesses")) {
          router.push("/dashboard");
        } else if (
          !isOwner &&
          activeBusiness &&
          OWNER_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))
        ) {
          router.push("/dashboard");
        }
      }
    }
  }, [user, authLoading, activeBusiness, bizLoading, isStaff, isOwner, pathname, router]);

  async function handleLogout() {
    try {
      await apiPost("/auth/logout", {}, { withBusinessId: false });
    } catch {
      // Fire-and-forget
    } finally {
      logout();
      router.push("/login");
    }
  }

  if (authLoading || (bizLoading && !activeBusiness && pathname !== "/businesses")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0d121f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <div className="text-slate-500 dark:text-slate-400 text-xs font-medium tracking-wide">
            Loading Khata...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#11141a] flex flex-col md:flex-row text-slate-900 dark:text-slate-100 transition-colors antialiased">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white/95 dark:bg-[#161a23]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <KhataLogo size={28} />
          <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">
            Khata
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 max-w-[120px] truncate">
            {activeBusiness?.name || "Select Business"}
          </span>
        </div>
      </div>

      {/* Modern High-End Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-[#11141a] border-r border-slate-200/80 dark:border-white/[0.08] flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:static md:h-screen md:sticky md:top-0`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
          <Link
            href={activeBusiness ? "/dashboard" : "/businesses"}
            className="flex items-center gap-2.5 group"
          >
            <KhataLogo size={32} />
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white tracking-tight leading-tight">
                Khata
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                Business Accounts
              </div>
            </div>
          </Link>

          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business Selector */}
        <div className="p-3 border-b border-slate-200/80 dark:border-white/[0.08] relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsBizDropdownOpen(!isBizDropdownOpen)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#181d26] hover:bg-slate-100/80 dark:hover:bg-[#202734] flex items-center justify-between text-left transition-colors cursor-pointer group"
          >
            <div className="truncate pr-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate block">
                  {activeBusiness ? activeBusiness.name : "Select Business"}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate pl-3.5 capitalize">
                {activeBusiness ? `${activeBusiness.business_type} • ${activeBusiness.role}` : "No active business"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0" />
          </button>

          {isBizDropdownOpen && (
            <div className="absolute left-3 right-3 mt-1.5 bg-white dark:bg-[#181d26] rounded-xl shadow-xl border border-slate-200 dark:border-white/[0.08] py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.08]">
                Switch Business
              </div>
              <div className="max-h-52 overflow-y-auto py-1">
                {businesses.map((biz) => {
                  const isSelected = biz.id === activeBusiness?.id;
                  return (
                    <button
                      key={biz.id}
                      onClick={() => {
                        selectBusiness(biz);
                        setIsBizDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                        isSelected
                          ? "text-neutral-900 dark:text-white font-semibold bg-neutral-100 dark:bg-white/[0.08]"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      <span className="truncate pr-2">{biz.name}</span>
                      <span className="text-[10px] font-medium capitalize px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {biz.role}
                      </span>
                    </button>
                  );
                })}
              </div>
              {isOwner && (
                <div className="pt-1 mt-1 border-t border-slate-100 dark:border-white/[0.08]">
                  <Link
                    href="/businesses"
                    onClick={() => setIsBizDropdownOpen(false)}
                    className="block px-3 py-1.5 text-xs font-semibold text-neutral-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    + Manage Businesses
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Grouped Sidebar Navigation */}
        <nav
          className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
          aria-label="Main Navigation"
        >
          {NAV_GROUPS.map((group) => {
            const filteredItems = group.items.filter((item) => !item.ownerOnly || isOwner);
            if (filteredItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                  {group.title}
                </div>
                {filteredItems.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-white/[0.05]"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-white dark:text-neutral-950"
                            : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Profile & Sign Out Bar */}
        <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#11141a]">
          <div className="flex items-center justify-between p-1.5">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center shrink-0 border border-neutral-200 dark:border-white/10">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "KH"}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {user?.name || "Accountant"}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase ${
                      isOwner
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/50"
                        : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-300/60 dark:border-white/10"
                    }`}
                  >
                    {isOwner ? "Owner" : "Staff"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                  {user?.email}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Modern Top Header on Desktop - CLEAN & WITHOUT DUPLICATE BUTTONS */}
        <header className="hidden md:flex h-14 bg-white/80 dark:bg-[#11141a]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] px-6 sm:px-8 items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 dark:text-slate-400 font-medium">
              Active Business:
            </span>
            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-[#181d26] border border-slate-200/80 dark:border-white/[0.08]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{activeBusiness?.name || "All Businesses"}</span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase tracking-wide ${
                  isOwner
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                    : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-white/10"
                }`}
              >
                {isOwner ? "Owner" : "Staff"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="tabular-nums font-medium">
              {new Date().toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}
    </div>
  );
}
