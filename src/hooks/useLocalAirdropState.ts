// src/hooks/useLocalAirdropState.ts
"use client";
import { useEffect, useRef, useState } from "react";
import { useAccount, useChainId } from "wagmi";

/**
 * Manages local form state and localStorage persistence.
 * Exposes tokenAddress, recipients, amounts, localIsUnsafeMode, setters.
 */
export function useLocalAirdropState() {
  const account = useAccount();
  const chainId = useChainId();

  const isFirstRender = useRef(true);
  const [localIsUnsafeMode, setLocalIsUnsafeMode] = useState(false);

  const [tokenAddress, setTokenAddress] = useState("");
  const [recipients, setRecipients] = useState("");
  const [amounts, setAmounts] = useState("");

  // Force Safe Mode on first render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setLocalIsUnsafeMode(false);
    }
  }, []);

  // clear on disconnect
  useEffect(() => {
    if (!account.isConnected) {
      setTokenAddress("");
      setRecipients("");
      setAmounts("");
      localStorage.removeItem("tokenAddress");
      localStorage.removeItem("recipients");
      localStorage.removeItem("amounts");
    }
  }, [account.isConnected]);

  // load persisted if connected
  useEffect(() => {
    if (account.isConnected) {
      const t = localStorage.getItem("tokenAddress");
      const r = localStorage.getItem("recipients");
      const a = localStorage.getItem("amounts");
      if (t) setTokenAddress(t);
      if (r) setRecipients(r);
      if (a) setAmounts(a);
    }
  }, [account.isConnected, chainId]); // also reload when chain changes (optional)

  useEffect(() => {
    if (account.isConnected) {
      localStorage.setItem("tokenAddress", tokenAddress);
    }
  }, [tokenAddress, account.isConnected]);

  useEffect(() => {
    if (account.isConnected) {
      localStorage.setItem("recipients", recipients);
    }
  }, [recipients, account.isConnected]);

  useEffect(() => {
    if (account.isConnected) {
      localStorage.setItem("amounts", amounts);
    }
  }, [amounts, account.isConnected]);

  return {
    tokenAddress,
    setTokenAddress,
    recipients,
    setRecipients,
    amounts,
    setAmounts,
    localIsUnsafeMode,
    setLocalIsUnsafeMode,
  };
}
