// src/hooks/useTokenData.ts
"use client";
import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import { erc20Abi } from "@/constants";

/**
 * Reads token decimals, name, and balance (for accountAddress).
 * Returns { decimals, name, balanceRaw, isLoading, error }
 */
export function useTokenData(tokenAddress?: string, accountAddress?: `0x${string}`) {
  const isValid = Boolean(tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress));

  const { data, isLoading, error } = useReadContracts({
    contracts:
      isValid && accountAddress
        ? [
            { abi: erc20Abi, address: tokenAddress as `0x${string}`, functionName: "decimals" },
            { abi: erc20Abi, address: tokenAddress as `0x${string}`, functionName: "name" },
            {
              abi: erc20Abi,
              address: tokenAddress as `0x${string}`,
              functionName: "balanceOf",
              args: [accountAddress as `0x${string}`],
            },
          ]
        : [],
  });

  const decimals = data?.[0]?.result as number | undefined;
  const name = data?.[1]?.result as string | undefined;
  const balanceRaw = data?.[2]?.result;

  return { decimals, name, balanceRaw, isLoading, error, raw: data };
}
