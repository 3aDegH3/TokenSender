// src/components/AirdropForm/TransactionDetails.tsx
"use client";
import React from "react";
import { formatTokenAmount } from "@/utils/parseAmount";

interface Props {
  decimals?: number;
  name?: string;
  totalBig: bigint;
  balanceRaw?: any;
}

export default function TransactionDetails({ decimals, name, totalBig, balanceRaw }: Props) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-200 mb-3">Transaction Details</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Token Name:</span>
          <span className="font-mono text-gray-200">{name || "Loading..."}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Token Decimals:</span>
          <span className="font-mono text-gray-200">{typeof decimals === "number" ? decimals : "—"}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Amount (tokens):</span>
          <span className="font-mono text-gray-200">
            {typeof decimals === "number" && totalBig > BigInt(0) ? formatTokenAmount(totalBig, decimals) : "—"}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Amount (wei):</span>
          <span className="font-mono text-gray-200">{totalBig.toString()}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Your balance (tokens):</span>
          <span className="font-mono text-gray-200">
            {typeof decimals === "number" && balanceRaw !== undefined
              ? formatTokenAmount(BigInt((balanceRaw as any)?.toString?.() ?? balanceRaw), decimals)
              : "—"}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Your balance (wei):</span>
          <span className="font-mono text-gray-200">{(balanceRaw as any)?.toString?.() ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}
