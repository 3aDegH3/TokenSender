// src/hooks/useAirdropSubmit.ts
"use client";
import { useState, useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useConfig } from "wagmi";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { erc20Abi, tsenderAbi, chainsToTSender } from "@/constants";

/**
 * Hook that exposes a submit() to handle approve + airdrop flow.
 * Returns { submit, isPending, isConfirming, isConfirmed, writeError }
 */
export function useAirdropSubmit() {
  const config = useConfig();
  // useWriteContract gives writeContractAsync function
  const { data: writeHashData, error: writeError, writeContractAsync } = useWriteContract();
  const [lastHash, setLastHash] = useState<string | undefined>(undefined);

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
        approvedAmount = BigInt(response?.toString?.() ?? response ?? "0");
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
          // wait for confirmation using core util
          await waitForTransactionReceipt(config, { hash: approvalHash as string, confirmations: 1 });
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
        // store last hash to monitor confirmations (useWaitForTransactionReceipt reads lastHash)
        setLastHash(txHash as string);
        return txHash;
      } catch (err) {
        throw err;
      }
    },
    [config, writeContractAsync]
  );

  return {
    submit,
    isPending: Boolean(writeHashData) && !isConfirming && !isConfirmed,
    isConfirming,
    isConfirmed,
    writeError,
    isReceiptError,
  };
}
