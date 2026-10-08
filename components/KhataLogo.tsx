"use client";

import React, { useId } from "react";

interface KhataLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export default function KhataLogo({
  className = "",
  size = 32,
  showText = false,
  textClassName = "text-base font-bold",
}: KhataLogoProps) {
  // Generate unique IDs per instance to prevent SVG gradient clipping and cross-element collision bugs in desktop/mobile
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const coverId = `fl_cov_${uid}`;
  const digitalId = `fl_dig_${uid}`;
  const ribbonId = `fl_rib_${uid}`;
  const pageRId = `fl_pgr_${uid}`;

  return (
    <div className="inline-flex items-center gap-2.5 shrink-0 select-none">
      {/* Unboxed open diary logo - Completely standalone, identical across all screen sizes */}
      <div
        className={`relative flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            {/* Executive Blue Cover Gradient */}
            <linearGradient id={coverId} x1="10" y1="15" x2="90" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Digital Growth Pulse Gradient */}
            <linearGradient id={digitalId} x1="56" y1="64" x2="82" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            {/* Bookmark Ribbon Gradient */}
            <linearGradient id={ribbonId} x1="47" y1="10" x2="53" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Right Folio Soft High-Contrast Tint */}
            <linearGradient id={pageRId} x1="52" y1="16" x2="84" y2="82" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>

          {/* Open Diary Cover Backing (No enclosing box) */}
          <path
            d="M12 24C12 18.4772 16.4772 14 22 14H48L50 16L52 14H78C83.5228 14 88 18.4772 88 24V76C88 81.5228 83.5228 86 78 86H52L50 84L48 86H22C16.4772 86 12 81.5228 12 76V24Z"
            fill={`url(#${coverId})`}
          />

          {/* Left Ledger Page (Bright White High-Contrast Folio) */}
          <path
            d="M16 22C16 18.6863 18.6863 16 22 16H48V82H22C18.6863 82 16 79.3137 16 76V22Z"
            fill="#FFFFFF"
          />

          {/* Right Ledger Page (Soft Digital High-Contrast Folio) */}
          <path
            d="M52 16H78C81.3137 16 84 18.6863 84 22V76C84 79.3137 81.3137 82 78 82H52V16Z"
            fill={`url(#${pageRId})`}
          />

          {/* Center Spine Fold */}
          <line
            x1="50"
            y1="14"
            x2="50"
            y2="86"
            stroke="#0F172A"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Left Page: Classic Ledger Entries */}
          <line x1="22" y1="28" x2="42" y2="28" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="22" y1="38" x2="42" y2="38" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.75" />
          <line x1="22" y1="48" x2="42" y2="48" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5" />
          <line x1="22" y1="58" x2="36" y2="58" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.35" />
          <line x1="22" y1="68" x2="40" y2="68" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.25" strokeDasharray="2 3" />

          {/* Right Page: Digitalization Grid & Growth Waveform */}
          <line x1="58" y1="28" x2="78" y2="28" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35" strokeDasharray="3 3" />
          <line x1="58" y1="38" x2="78" y2="38" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.25" strokeDasharray="3 3" />

          {/* Digital Waveform Line */}
          <path
            d="M58 64L64 54L71 58L79 40"
            stroke={`url(#${digitalId})`}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Digital Tech Pulse Nodes */}
          <circle cx="58" cy="64" r="2.5" fill="#06B6D4" />
          <circle cx="64" cy="54" r="2.5" fill="#22D3EE" />
          <circle cx="71" cy="58" r="2.5" fill="#34D399" />
          <circle cx="79" cy="40" r="3.2" fill="#10B981" />
          <circle cx="79" cy="40" r="5.5" stroke="#10B981" strokeWidth="1.2" strokeOpacity="0.5" />

          {/* Top Silk Ribbon Bookmark */}
          <path
            d="M47 11H53V26L50 23L47 26V11Z"
            fill={`url(#${ribbonId})`}
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
