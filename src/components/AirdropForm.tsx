// src/components/AirdropForm.tsx
"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { RiAlertFill, RiInformationLine } from "react-icons/ri";
import {
  useChainId,
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
  useReadContracts,
  useConfig,
} from "wagmi";
import { chainsToTSender, tsenderAbi, erc20Abi } from "@/constants";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { CgSpinner } from "react-icons/cg";
import { parseUnits } from "viem";
import { InputForm } from "@/components/ui/InputField";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";

interface AirdropFormProps {
  isUnsafeMode: boolean;
  onModeChange?: (unsafe: boolean) => void;
}

/* helpers */
const isEthAddress = (a?: string) => Boolean(a && /^0x[a-fA-F0-9]{40}$/.test(a));
const parseList = (s: string) =>
  s
    .split(/[,\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);

function parseAmountStringToBigInt(str: string, decimals?: number): bigint {
  const s = str.trim();
  if (s === "") throw new Error("Empty amount");
  if (s.includes(".")) {
    if (decimals === undefined || decimals === null) {
      throw new Error("Token decimals unknown; cannot parse fractional token amount.");
    }
    return parseUnits(s, decimals);
  } else {
    if (!/^\d+$/.test(s)) throw new Error(`Invalid numeric amount: ${s}`);
    return BigInt(s);
  }
}

function formatTokenAmount(weiAmount: bigint, decimals: number): string {
  const factor = BigInt(10) ** BigInt(decimals);
  const whole = weiAmount / factor;
  const remainder = weiAmount % factor;
  const fractional = Number((remainder * BigInt(100)) / factor);
  return `${whole.toString()}.${fractional.toString().padStart(2, "0")}`;
}

export default function AirdropForm({ isUnsafeMode, onModeChange }: AirdropFormProps) {
  const safeOnModeChange = typeof onModeChange === "function" ? onModeChange : () => {};
  const isFirstRender = useRef(true);
  const [localIsUnsafeMode, setLocalIsUnsafeMode] = useState(false);
  
  // Force Safe Mode on first render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setLocalIsUnsafeMode(false);
      safeOnModeChange(false);
    }
  }, []);
  
  // Update local state when parent state changes
  useEffect(() => {
    if (!isFirstRender.current && isUnsafeMode !== localIsUnsafeMode) {
      setLocalIsUnsafeMode(isUnsafeMode);
    }
  }, [isUnsafeMode, localIsUnsafeMode]);
  
  /* form state */
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipients, setRecipients] = useState("");
  const [amounts, setAmounts] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  
  /* wagmi / chain */
  const config = useConfig();
  const account = useAccount();
  const chainId = useChainId();
  const [hasEnoughTokens, setHasEnoughTokens] = useState(true);
  
  const isValidTokenAddress = useMemo(() => isEthAddress(tokenAddress), [tokenAddress]);
  
  useEffect(() => {
    if (!account.isConnected) {
      setTokenAddress("");
      setRecipients("");
      setAmounts("");
      setError(null);
      localStorage.removeItem("tokenAddress");
      localStorage.removeItem("recipients");
      localStorage.removeItem("amounts");
    }
  }, [account.isConnected]);
  
  /* read token decimals/name/balance when available */
  const { data: tokenData } = useReadContracts({
    contracts:
      isValidTokenAddress && account?.address
        ? [
            { abi: erc20Abi, address: tokenAddress as `0x${string}`, functionName: "decimals" },
            { abi: erc20Abi, address: tokenAddress as `0x${string}`, functionName: "name" },
            {
              abi: erc20Abi,
              address: tokenAddress as `0x${string}`,
              functionName: "balanceOf",
              args: [account.address as `0x${string}`],
            },
          ]
        : [],
  });
  
  const { data: hash, isPending, error: writeError, writeContractAsync } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError } = useWaitForTransactionReceipt({
    confirmations: 1,
    hash,
  });
  
  /* derived */
  const recipientsList = useMemo(() => parseList(recipients), [recipients]);
  const amountsList = useMemo(() => parseList(amounts), [amounts]);
  
  const totalBig = useMemo(() => {
    if (amountsList.length === 0) return BigInt(0);
    try {
      const decimals = tokenData?.[0]?.result as number | undefined;
      const arr = amountsList.map((a) => parseAmountStringToBigInt(a, decimals));
      return arr.reduce((s, n) => s + n, BigInt(0));
    } catch {
      return BigInt(-1);
    }
  }, [amountsList, tokenData?.[0]?.result]);
  
  const countsMatch = recipientsList.length > 0 && recipientsList.length === amountsList.length;
  
  /* persist */
  useEffect(() => {
    if (account.isConnected) {
      const t = localStorage.getItem("tokenAddress");
      const r = localStorage.getItem("recipients");
      const a = localStorage.getItem("amounts");
      if (t) setTokenAddress(t);
      if (r) setRecipients(r);
      if (a) setAmounts(a);
    }
  }, [account.isConnected]);
  
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
  
  /* balance check */
  useEffect(() => {
    if (isValidTokenAddress && totalBig > BigInt(0) && tokenData?.[2]?.result !== undefined) {
      try {
        const bal = BigInt((tokenData[2].result as any)?.toString?.() ?? tokenData[2].result);
        setHasEnoughTokens(bal >= totalBig);
      } catch {
        setHasEnoughTokens(true);
      }
    } else {
      setHasEnoughTokens(true);
    }
  }, [isValidTokenAddress, totalBig, tokenData]);
  
  /* read allowance helper */
  async function getApprovedAmount(tSenderAddress: string): Promise<bigint> {
    const response = await readContract(config, {
      abi: erc20Abi,
      address: tokenAddress as `0x${string}`,
      functionName: "allowance",
      args: [account.address as `0x${string}`, tSenderAddress as `0x${string}`],
    } as any);
    return BigInt(response?.toString?.() ?? response);
  }
  
  function isUserRejected(err: any) {
    const msg = String(err?.message || err?.reason || "");
    return (
      err?.code === 4001 ||
      err?.name === "UserRejectedRequestError" ||
      /user (rejected|denied)|user denied transaction|user rejected transaction|user rejected/i.test(msg)
    );
  }
  
  /* submit */
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    
    if (!isValidTokenAddress) {
      setError("Invalid token address (must be 0x...40hex)");
      return;
    }
    if (!countsMatch) {
      setError("Recipients and amounts must have same count and not be empty.");
      return;
    }
    if (recipientsList.some((r) => !isEthAddress(r))) {
      setError("One or more recipient addresses are invalid.");
      return;
    }
    if (amountsList.some((x) => x.trim() === "")) {
      setError("Empty amount values present.");
      return;
    }
    if (totalBig === BigInt(-1)) {
      setError("Unable to parse amounts (check format and token decimals).");
      return;
    }
    if (totalBig <= BigInt(0)) {
      setError("Total amount invalid or zero.");
      return;
    }
    if (!account?.address) {
      setError("Wallet not connected.");
      return;
    }
    
    setIsWorking(true);
    try {
      const contractType = localIsUnsafeMode ? "no_check" : "tsender";
      const tSenderAddress = chainsToTSender[chainId ?? 0]?.[contractType];
      if (!tSenderAddress) {
        setError("TSender not deployed on this chain.");
        setIsWorking(false);
        return;
      }
      
      let approvedAmount = BigInt(0);
      try {
        approvedAmount = await getApprovedAmount(tSenderAddress);
      } catch (err: any) {
        console.warn("Failed to read allowance:", err);
        approvedAmount = BigInt(0);
      }
      
      if (approvedAmount < totalBig) {
        try {
          const approvalHash = await writeContractAsync({
            abi: erc20Abi,
            address: tokenAddress as `0x${string}`,
            functionName: "approve",
            args: [tSenderAddress as `0x${string}`, totalBig],
          } as any);
          await waitForTransactionReceipt(config, { hash: approvalHash as string, confirmations: 1 });
        } catch (err: any) {
          if (isUserRejected(err)) {
            setError("Approve request was cancelled by the user.");
            setIsWorking(false);
            return;
          }
          console.error("Approve failed:", err);
          setError(err?.message || "Approve transaction failed");
          setIsWorking(false);
          return;
        }
      }
      
      const decimals = tokenData?.[0]?.result as number | undefined;
      const amountsBig: bigint[] = amountsList.map((a) => parseAmountStringToBigInt(a, decimals));
      
      try {
        await writeContractAsync({
          abi: tsenderAbi,
          address: tSenderAddress as `0x${string}`,
          functionName: "airdropERC20",
          args: [tokenAddress, recipientsList, amountsBig, totalBig],
        } as any);
        setError(null);
        // wallet will prompt for signature
        alert("Airdrop submitted — please check your wallet to sign the transaction.");
      } catch (err: any) {
        if (isUserRejected(err)) {
          setError("Airdrop request was cancelled by the user.");
          setIsWorking(false);
          return;
        }
        console.error("Airdrop failed:", err);
        setError(err?.message || "Airdrop transaction failed");
        setIsWorking(false);
        return;
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError(err?.message || "Transaction failed");
    } finally {
      setIsWorking(false);
    }
  }
  
  function getButtonContent() {
    if (isPending || isWorking) {
      return (
        <div className="flex items-center justify-center gap-2 w-full">
          <CgSpinner className="animate-spin" size={20} />
          <span>Processing...</span>
        </div>
      );
    }
    if (isConfirming) {
      return (
        <div className="flex items-center justify-center gap-2 w-full">
          <CgSpinner className="animate-spin" size={20} />
          <span>Waiting for confirmation...</span>
        </div>
      );
    }
    if (writeError || isError) {
      return (
        <div className="flex items-center justify-center gap-2 w-full">
          <span>Error, try again</span>
        </div>
      );
    }
    if (isConfirmed) return "Transaction confirmed.";
    return "Send Tokens";
  }
  
  /* layout: container with a header row (title left, tabs right) and form below */
  return (
    <div className="max-w-3xl mx-auto w-full px-4">
      <div className="flex items-center justify-between w-full mb-6">
        <h2 className="text-xl font-semibold text-white flex-shrink-0">T-Sender</h2>
        <div className="ml-auto">
          <Tabs
            value={localIsUnsafeMode ? "true" : "false"}
            onValueChange={(v) => {
              const newMode = v === "true";
              setLocalIsUnsafeMode(newMode);
              safeOnModeChange(newMode);
            }}
            className="inline-flex"
          >
            <TabsList className="inline-flex items-center bg-gray-800 border border-gray-700 rounded-lg">
              <TabsTrigger
                value="false"
                className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white rounded-l-lg px-4 py-2"
              >
                Safe Mode
              </TabsTrigger>
              <TabsTrigger
                value="true"
                className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white rounded-r-lg px-4 py-2"
              >
                Unsafe Mode
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 bg-transparent">
        <InputForm label="Token address" placeholder="0x..." value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
        <InputForm
          label="Recipients (comma or newline)"
          placeholder="0xabc..., 0xdef...  (or newline separated)"
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          large
        />
        <InputForm
          label="Amounts (token units — supports decimals if token has decimals)"
          placeholder="1.5, 2.0, 0.1 or 1500000000000000000 (wei)  (or newline separated)"
          value={amounts}
          onChange={(e) => setAmounts(e.target.value)}
          large
        />
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <div className="text-center">
            <div className="text-blue-400 text-sm">Recipients</div>
            <div className="text-gray-200 font-medium">{recipientsList.length}</div>
          </div>
          <div className="text-center">
            <div className="text-purple-400 text-sm">Amounts</div>
            <div className="text-gray-200 font-medium">{amountsList.length}</div>
          </div>
          <div className="text-center">
            <div className="text-teal-400 text-sm">Total (wei)</div>
            <div className="text-gray-200 font-medium">{totalBig <= BigInt(0) ? "—" : totalBig.toString()}</div>
          </div>
        </div>
        {isValidTokenAddress && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-200 mb-3">Transaction Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Token Name:</span>
                <span className="font-mono text-gray-200">{(tokenData?.[1]?.result as string) || "Loading..."}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Token Decimals:</span>
                <span className="font-mono text-gray-200">{typeof tokenData?.[0]?.result === "number" ? tokenData[0].result : "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Amount (tokens):</span>
                <span className="font-mono text-gray-200">
                  {typeof tokenData?.[0]?.result === "number" && totalBig > BigInt(0) ? formatTokenAmount(totalBig, tokenData[0].result as number) : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Amount (wei):</span>
                <span className="font-mono text-gray-200">{totalBig.toString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Your balance (tokens):</span>
                <span className="font-mono text-gray-200">
                  {typeof tokenData?.[0]?.result === "number" && tokenData?.[2]?.result !== undefined
                    ? formatTokenAmount(BigInt((tokenData[2].result as any)?.toString?.() ?? tokenData[2].result), tokenData[0].result as number)
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Your balance (wei):</span>
                <span className="font-mono text-gray-200">{(tokenData?.[2]?.result as any)?.toString?.() ?? "—"}</span>
              </div>
            </div>
          </div>
        )}
        {localIsUnsafeMode && (
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
        )}
        {error && <div className="p-3 bg-red-900/30 border border-red-700/30 rounded-lg text-red-300 text-sm">{error}</div>}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending || isConfirming || isWorking || (!hasEnoughTokens && isValidTokenAddress)}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!hasEnoughTokens && isValidTokenAddress ? "Insufficient token balance" : getButtonContent()}
          </button>
        </div>
      </form>
    </div>
  );
}