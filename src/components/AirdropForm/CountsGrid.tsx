// src/components/AirdropForm/CountsGrid.tsx
"use client";
import React from "react";

export default function CountsGrid({ recipientsCount, amountsCount, totalBig }: { recipientsCount: number; amountsCount: number; totalBig: bigint }) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <div className="text-center">
        <div className="text-blue-400 text-sm">Recipients</div>
        <div className="text-gray-200 font-medium">{recipientsCount}</div>
      </div>
      <div className="text-center">
        <div className="text-purple-400 text-sm">Amounts</div>
        <div className="text-gray-200 font-medium">{amountsCount}</div>
      </div>
      <div className="text-center">
        <div className="text-teal-400 text-sm">Total (wei)</div>
        <div className="text-gray-200 font-medium">{totalBig <= BigInt(0) ? "—" : totalBig.toString()}</div>
      </div>
    </div>
  );
}
