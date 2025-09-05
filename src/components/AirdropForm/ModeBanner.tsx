// src/components/AirdropForm/ModeBanner.tsx
"use client";
import React from "react";
import { RiAlertFill, RiInformationLine } from "react-icons/ri";

export default function ModeBanner() {
  return (
    <div className="mb-4 p-4 bg-red-900/20 border border-red-700/50 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <RiAlertFill size={20} className="text-red-400" />
        <span className="text-red-300">
          Using <span className="font-medium underline">unsafe</span> super gas optimized mode
        </span>
      </div>
      <div className="relative group">
        <RiInformationLine className="cursor-help w-5 h-5 text-red-400 opacity-70" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-64">
          This mode skips certain safety checks to optimize for gas. Do not use this mode unless you know how to verify calldata.
        </div>
      </div>
    </div>
  );
}
