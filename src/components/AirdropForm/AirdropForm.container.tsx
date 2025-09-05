// src/components/AirdropForm/AirdropForm.container.tsx
"use client";
import React, { useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import AirdropFormUI from "./AirdropForm.ui";
import { useLocalAirdropState } from "@/hooks/useLocalAirdropState";
import { useTokenData } from "@/hooks/useTokenData";
import { useAirdropSubmit } from "@/hooks/useAirdropSubmit";
import { parseList } from "@/utils/eth";
import { parseAmountStringToBigInt } from "@/utils/parseAmount";

export default function AirdropFormContainer(props: { onModeChange?: (unsafe: boolean) => void }) {
  const { onModeChange } = props;
  const account = useAccount();
  const isConnected = Boolean(account.isConnected);
  const chainId = useChainId();
  const { tokenAddress, setTokenAddress, recipients, setRecipients, amounts, setAmounts, localIsUnsafeMode, setLocalIsUnsafeMode } =
    useLocalAirdropState();

  const { decimals, name, balanceRaw } = useTokenData(tokenAddress, account.address);
  const { submit, isPending, isConfirming, isConfirmed, writeError } = useAirdropSubmit();

  // derived lists
  const recipientsList = useMemo(() => parseList(recipients), [recipients]);
  const amountsList = useMemo(() => parseList(amounts), [amounts]);

  const totalBig = useMemo(() => {
    if (amountsList.length === 0) return BigInt(0);
    try {
      const arr = amountsList.map((a) => parseAmountStringToBigInt(a, decimals));
      return arr.reduce((s, n) => s + n, BigInt(0));
    } catch {
      return BigInt(-1);
    }
  }, [amountsList, decimals]);

  const countsMatch = recipientsList.length > 0 && recipientsList.length === amountsList.length;

  // hasEnoughTokens
  const hasEnoughTokens = useMemo(() => {
    try {
      if (!tokenAddress || totalBig <= BigInt(0) || !balanceRaw) return true;
      const bal = BigInt((balanceRaw as any)?.toString?.() ?? balanceRaw);
      return bal >= totalBig;
    } catch {
      return true;
    }
  }, [tokenAddress, totalBig, balanceRaw]);

  // submit handler wrapper
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();

    // basic validations (kept as before)
    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      throw new Error("Invalid token address (must be 0x...40hex)");
    }
    if (!countsMatch) {
      throw new Error("Recipients and amounts must have same count and not be empty.");
    }
    if (recipientsList.some((r) => !/^0x[a-fA-F0-9]{40}$/.test(r))) {
      throw new Error("One or more recipient addresses are invalid.");
    }
    if (amountsList.some((x) => x.trim() === "")) {
      throw new Error("Empty amount values present.");
    }
    if (totalBig === BigInt(-1)) {
      throw new Error("Unable to parse amounts (check format and token decimals).");
    }
    if (totalBig <= BigInt(0)) {
      throw new Error("Total amount invalid or zero.");
    }
    if (!account?.address) {
      throw new Error("Wallet not connected.");
    }

    const decimalsLocal = decimals;
    const amountsBig: bigint[] = amountsList.map((a) => parseAmountStringToBigInt(a, decimalsLocal));
    try {
      // submit() ممکن است خطا پرتاب کند (مثل user rejected) که UI آن را نمایش می‌دهد
      await submit({
        tokenAddress,
        accountAddress: account.address as `0x${string}`,
        chainId: (chainId ?? 0) as number,
        recipients: recipientsList,
        amountsBig,
        totalBig,
        unsafe: localIsUnsafeMode,
      });
      // دیگر از alert استفاده نمی‌کنیم — نمایش موفقیت در UI و با isConfirmed انجام می‌شود
    } catch (err: any) {
      // propagate error to UI
      throw err;
    }
  }

  return (
    <AirdropFormUI
      tokenAddress={tokenAddress}
      setTokenAddress={setTokenAddress}
      recipients={recipients}
      setRecipients={setRecipients}
      amounts={amounts}
      setAmounts={setAmounts}
      localIsUnsafeMode={localIsUnsafeMode}
      setLocalIsUnsafeMode={(v) => {
        setLocalIsUnsafeMode(v);
        if (typeof onModeChange === "function") onModeChange(v);
      }}
      recipientsList={recipientsList}
      amountsList={amountsList}
      totalBig={totalBig}
      countsMatch={countsMatch}
      decimals={decimals}
      name={name}
      balanceRaw={balanceRaw}
      hasEnoughTokens={hasEnoughTokens}
      onSubmit={handleSubmit}
      isPending={isPending}
      isConfirming={isConfirming}
      isConfirmed={isConfirmed}
      writeError={writeError}
      isConnected={isConnected}
    />
  );
}
