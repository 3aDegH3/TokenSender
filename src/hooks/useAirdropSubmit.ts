// src/hooks/useAirdropSubmit.ts
"use client";
import { useState, useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useConfig } from "wagmi";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { erc20Abi, tsenderAbi, chainsToTSender } from "@/constants";

/**
 * Hook that exposes a submit() to handle approve + airdrop flow.
 * Returns { submit, isPending, isConfirming, isConfirmed, writeError, isReceiptError }
 */

type TxHash = `0x${string}`;

function isTxHash(x: unknown): x is TxHash {
  return typeof x === "string" && /^0x[0-9a-fA-F]{64}$/.test(x);
}

/** Safely coerce unknown response to a string suitable for BigInt(...) */
function toStringSafe(x: unknown): string {
  if (x === null || x === undefined) return "0";
  const t = typeof x;
  if (t === "bigint" || t === "number" || t === "boolean" || t === "string") {
    return String(x);
  }
  // if object with toString function, use it
  try {
    if (typeof (x as any)?.toString === "function") {
      const s = (x as any).toString();
      if (s === "[object Object]") {
        // avoid converting generic objects
        return "0";
      }
      return String(s ?? "0");
    }
  } catch {
    // fallthrough
  }
  return "0";
}

export function useAirdropSubmit() {
  const config = useConfig();
  // useWriteContract gives writeContractAsync function
  const { data: writeHashData, error: writeError, writeContractAsync } = useWriteContract();
  const [lastHash, setLastHash] = useState<TxHash | undefined>(undefined);

  // monitor confirmations for lastHash
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isReceiptError } =
    useWaitForTransactionReceipt({
      confirmations: 1,
      hash: lastHash,
    });

  const submit = useCallback(
    async (opts: {
      tokenAddress: string;
      accountAddress: string;
      chainId: number;
      recipients: string[];
      amountsBig: bigint[];
      totalBig: bigint;
      unsafe: boolean;
    }) => {
      const { tokenAddress, accountAddress, chainId, recipients, amountsBig, totalBig, unsafe } = opts;

      const contractType = unsafe ? "no_check" : "tsender";
      const tSenderAddress = chainsToTSender[chainId ?? 0]?.[contractType];
      if (!tSenderAddress) {
        throw new Error("TSender not deployed on this chain.");
      }

      // read allowance
      let approvedAmount = BigInt(0);
      try {
        const response = await readContract(config, {
          abi: erc20Abi,
          address: tokenAddress as `0x${string}`,
          functionName: "allowance",
          args: [accountAddress as `0x${string}`, tSenderAddress as `0x${string}`],
        } as any);

        const respStr = toStringSafe(response);
        approvedAmount = BigInt(respStr);
      } catch (err) {
        // ignore read failure - treat as 0
        approvedAmount = BigInt(0);
      }

      // request approval if needed
      if (approvedAmount < totalBig) {
        try {
          const approvalHash = await writeContractAsync({
            abi: erc20Abi,
            address: tokenAddress as `0x${string}`,
            functionName: "approve",
            args: [tSenderAddress as `0x${string}`, totalBig],
          } as any);

          // approvalHash should be a tx hash string; validate before waiting
          if (!isTxHash(approvalHash)) {
            const maybe = typeof approvalHash === "string" ? approvalHash : undefined;
            if (!maybe || !isTxHash(maybe)) {
              throw new Error("Received invalid approval transaction hash.");
            }
            await waitForTransactionReceipt(config, { hash: maybe, confirmations: 1 });
          } else {
            await waitForTransactionReceipt(config, { hash: approvalHash, confirmations: 1 });
          }
        } catch (err: any) {
          // bubble up error
          throw err;
        }
      }

      // call airdrop on TSender
      try {
        const txHash = await writeContractAsync({
          abi: tsenderAbi,
          address: tSenderAddress as `0x${string}`,
          functionName: "airdropERC20",
          args: [tokenAddress, recipients, amountsBig, totalBig],
        } as any);

        // Validate txHash before storing/monitoring it
        if (!isTxHash(txHash)) {
          const maybe = typeof txHash === "string" ? txHash : undefined;
          if (!maybe || !isTxHash(maybe)) {
            throw new Error("Received invalid transaction hash from writeContractAsync.");
          }
          setLastHash(maybe);
        } else {
          setLastHash(txHash);
        }

        return txHash;
      } catch (err) {
        throw err;
      }
    },
    [config, writeContractAsync]
  );

  return {
    submit,
    // isPending: there is a write in progress (writeHashData) and not yet confirming/confirmed
    isPending: Boolean(writeHashData) && !isConfirming && !isConfirmed,
    isConfirming,
    isConfirmed,
    writeError,
    isReceiptError,
  };
}
