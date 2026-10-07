"use client";

import React from "react";

interface KhataLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export default function KhataLogo({
  className = "w-8 h-8",
  size = 32,
  showText = false,
  textClassName = "text-base font-bold",
}: KhataLogoProps) {
  return (
    <div className="inline-flex items-center gap-2.5 shrink-0 select-none">
      <div
        className={`relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-neutral-700/80 dark:border-white/10 bg-neutral-900 dark:bg-[#1a1f29] shadow-sm transition-transform hover:scale-[1.03] ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-2"
        >
          {/* Subtle Outer Frame / Spine Base */}
          <path
            d="M22 28C22 23.5817 25.5817 20 30 20H70C74.4183 20 78 23.5817 78 28V72C78 76.4183 74.4183 80 70 80H30C25.5817 80 22 76.4183 22 72V28Z"
            fill="#171C24"
            stroke="currentColor"
            strokeWidth="3.5"
            className="text-neutral-700 dark:text-neutral-600"
          />

          {/* Left Ledger Page (Crisp High-Contrast White) */}
          <path
            d="M26 28C26 25.7909 27.7909 24 30 24H47V76H30C27.7909 76 26 74.2091 26 72V28Z"
            fill="#FFFFFF"
          />

          {/* Right Ledger Page (Deep Slate / Graphite Contrast) */}
          <path
            d="M53 24H70C72.2091 24 74 25.7909 74 28V72C74 74.2091 72.2091 76 70 76H53V24Z"
            fill="#E5E7EB"
            className="dark:fill-[#2A3241]"
          />

          {/* Precision Center Spine Fold */}
          <line
            x1="50"
            y1="22"
            x2="50"
            y2="78"
            stroke="#11141A"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Left Folio Rows / Ledger Balance Entry Lines */}
          <line x1="31" y1="36" x2="43" y2="36" stroke="#11141A" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="31" y1="46" x2="43" y2="46" stroke="#11141A" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.7" />
          <line x1="31" y1="56" x2="39" y2="56" stroke="#11141A" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.45" />

          {/* Right Folio Rows / Credits Entry Lines */}
          <line x1="57" y1="36" x2="69" y2="36" stroke="#11141A" strokeWidth="2.5" strokeLinecap="round" className="dark:stroke-neutral-300" />
          <line x1="57" y1="46" x2="69" y2="46" stroke="#11141A" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.7" className="dark:stroke-neutral-400" />
          <line x1="57" y1="56" x2="65" y2="56" stroke="#11141A" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.45" className="dark:stroke-neutral-500" />

          {/* Clean Top Status Bookmark / Khata Ribbon Pip */}
          <path
            d="M47 18H53V27L50 25L47 27V18Z"
            fill="#10B981"
          />
        </svg>
      </div>

      {showText && (
        <span className={`tracking-tight text-neutral-900 dark:text-neutral-100 ${textClassName}`}>
          FISTA Accounts
        </span>
      )}
    </div>
  );
}
