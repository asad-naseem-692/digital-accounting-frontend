"use client";

import React from "react";

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
  return (
    <div className="inline-flex items-center gap-2.5 shrink-0 select-none">
      {/* Unboxed logo container - No background box, no borders */}
      <div
        className={`relative flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          <defs>
            {/* Rich Indigo to Electric Blue Diary Cover Gradient */}
            <linearGradient id="fl_cover" x1="10" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="45%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            {/* Leather Bound Spine */}
            <linearGradient id="fl_spine" x1="8" y1="8" x2="16" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
            {/* Paper Page Block Trim */}
            <linearGradient id="fl_pages" x1="44" y1="12" x2="54" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            {/* Emerald Silk Bookmark Ribbon */}
            <linearGradient id="fl_ribbon" x1="28" y1="6" x2="34" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            {/* Digital Data Pulse Waveform Gradient */}
            <linearGradient id="fl_digital" x1="20" y1="44" x2="43" y2="23" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Layered Page Block (White / Silver Sheets visible on the open right edge) */}
          <path d="M18 10H48C51.3 10 54 12.7 54 16V48C54 51.3 51.3 54 48 54H18V10Z" fill="url(#fl_pages)" />
          <line x1="51" y1="14" x2="51" y2="50" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          <line x1="48" y1="12" x2="48" y2="52" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />

          {/* Main Executive Diary Front Cover */}
          <rect x="10" y="8" width="38" height="48" rx="4" fill="url(#fl_cover)" />
          {/* Glossy Bevel Highlight on Cover Top Edge */}
          <path d="M14 9H44C46.2 9 47.8 10.3 47.8 12V13H14V9Z" fill="#FFFFFF" opacity="0.12" />

          {/* Left Spine Binding */}
          <path d="M10 8H16V56H10C8.9 56 8 55.1 8 54V10C8 8.9 8.9 8 10 8Z" fill="url(#fl_spine)" />
          <line x1="16" y1="8" x2="16" y2="56" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.35" />

          {/* Spine Stitches (Diary Craftsmanship Detail) */}
          <line x1="10.5" y1="16" x2="13.5" y2="16" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="10.5" y1="28" x2="13.5" y2="28" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="10.5" y1="40" x2="13.5" y2="40" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="10.5" y1="48" x2="13.5" y2="48" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" />

          {/* Silk Ribbon Bookmark Marker flowing from the top */}
          <path d="M26 6H32V23L29 20L26 23V6Z" fill="url(#fl_ribbon)" />

          {/* DIGITALIZATION ACCENTS on Diary Cover: */}
          {/* 1. Digital Accounting Grid Rows (Dotted and Solid Ledger Guides) */}
          <line x1="22" y1="20" x2="42" y2="20" stroke="#38BDF8" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.35" strokeDasharray="2.5 2.5" />
          <line x1="22" y1="27" x2="42" y2="27" stroke="#38BDF8" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.2" />

          {/* 2. Ascending Financial Pulse / Growth Waveform Line */}
          <path d="M21 44L27 36L33 40L41 26" stroke="url(#fl_digital)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* 3. Glowing Digital Tech Nodes */}
          <circle cx="21" cy="44" r="2.2" fill="#06B6D4" />
          <circle cx="27" cy="36" r="2.2" fill="#22D3EE" />
          <circle cx="33" cy="40" r="2.2" fill="#34D399" />
          <circle cx="41" cy="26" r="3" fill="#10B981" />
          <circle cx="41" cy="26" r="5" stroke="#34D399" strokeWidth="1" strokeOpacity="0.65" />

          {/* 4. Digital Cloud Sparkle / Innovation Beacon */}
          <path d="M42 13L43 16L46 17L43 18L42 21L41 18L38 17L41 16L42 13Z" fill="#38BDF8" opacity="0.9" />
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
