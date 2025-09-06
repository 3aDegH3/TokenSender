"use client";
import React, { useState, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";
import { InputForm } from "@/components/ui/InputField";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import TransactionDetails from "./TransactionDetails";
import ModeBanner from "./ModeBanner";
import CountsGrid from "./CountsGrid";

interface Props {
  tokenAddress: string;
  setTokenAddress: (v: string) => void;
  recipients: string;
  setRecipients: (v: string) => void;
  amounts: string;
  setAmounts: (v: string) => void;
  localIsUnsafeMode: boolean;
  setLocalIsUnsafeMode: (v: boolean) => void;
  recipientsList: string[];
  amountsList: string[];
  totalBig: bigint;
  countsMatch: boolean;
  decimals?: number;
  name?: string;
  balanceRaw?: any;
  hasEnoughTokens: boolean;
  onSubmit: (e?: React.FormEvent) => Promise<void>;
  isPending?: boolean;
  isConfirming?: boolean;
  isConfirmed?: boolean;
  writeError?: any;
  isConnected?: boolean;
}

export default function AirdropFormUI(props: Props) {
  const {
    tokenAddress,
    setTokenAddress,
    recipients,
    setRecipients,
    amounts,
    setAmounts,
    localIsUnsafeMode,
    setLocalIsUnsafeMode,
    recipientsList,
    amountsList,
    totalBig,
    decimals,
    name,
    balanceRaw,
    hasEnoughTokens,
    onSubmit,
    isPending,
    isConfirming,
    isConfirmed,
    writeError,
    isConnected = false,
  } = props;
  
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setIsWorking(true);
    try {
      await onSubmit(e);
    } catch (err: any) {
      if (err?.message) setError(err.message);
      else setError(String(err));
    } finally {
      setIsWorking(false);
    }
  }
  
  function isUserFacingProcessing() {
    return Boolean(isPending || isWorking);
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
    if (writeError) {
      return (
        <div className="flex items-center justify-center gap-2 w-full">
          <span>Error, try again</span>
        </div>
      );
    }
    if (isConfirmed) return "Transaction confirmed.";
    return "Send Tokens";
  }
  
  // If wallet is not connected => show attractive connection banner
  if (!isClient || !isConnected) {
    return (
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
        <div className="mb-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-teal-900/30 border border-purple-500/20 shadow-xl backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-purple-400/30">
          {/* Background effects */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-teal-500/10 rounded-full filter blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Wallet icon */}
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-gray-200 mb-4 max-w-md">
              To use this form, please connect your wallet (like MetaMask) using the 
              <span className="font-medium text-purple-300"> Connect </span>
              button at the top of the page.
            </p>
            <div className="mt-2 text-sm text-gray-300 flex flex-col sm:flex-row items-center justify-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-600/20 text-purple-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Fast & Secure
              </span>
              <span>Connection button is in the page header</span>
            </div>
            
            {/* Help button */}
            <button 
              className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg text-sm text-purple-200 hover:bg-purple-600/30 transition-all duration-300 flex items-center"
              onClick={() => {
                alert("To connect your wallet:\n1. Click the Connect button at the top of the page\n2. Select your wallet\n3. Approve the connection request");
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Connection Guide
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
      {/* Subtle success banner */}
      {isConfirmed && (
        <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-700/40 rounded-lg text-emerald-100">
          <div className="font-medium">Airdrop transaction confirmed ✅</div>
          <div className="text-sm text-emerald-100/90">The airdrop transaction was confirmed on-chain.</div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-6 gap-4">
        <h2 className="text-xl font-semibold text-white flex-shrink-0">T-Sender</h2>
        <div className="w-full sm:w-auto">
          {/* Responsive Tabs */}
          <Tabs
            defaultValue={localIsUnsafeMode ? "true" : "false"}
            onValueChange={(v: string) => {
              setLocalIsUnsafeMode(v === "true");
            }}
            className="w-full"
          >
            <TabsList className="w-full">
              <TabsTrigger 
                value="false" 
                className="flex items-center justify-center"
              >
                Safe Mode
              </TabsTrigger>
              <TabsTrigger 
                value="true" 
                className="flex items-center justify-center"
              >
                Unsafe Mode
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-transparent">
        <InputForm 
          label="Token address" 
          placeholder="0x..." 
          value={tokenAddress} 
          onChange={(e) => setTokenAddress(e.target.value)} 
        />
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
        <div className="overflow-x-auto">
          <CountsGrid 
            recipientsCount={recipientsList.length} 
            amountsCount={amountsList.length} 
            totalBig={totalBig} 
          />
        </div>
        {/^\s*0x[a-fA-F0-9]{40}\s*$/.test(tokenAddress) && (
          <div className="overflow-x-auto">
            <TransactionDetails 
              decimals={decimals} 
              name={name} 
              totalBig={totalBig} 
              balanceRaw={balanceRaw} 
            />
          </div>
        )}
        {localIsUnsafeMode && <ModeBanner />}
        {error && <div className="p-3 bg-red-900/30 border border-red-700/30 rounded-lg text-red-300 text-sm">{error}</div>}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isUserFacingProcessing() || (!hasEnoughTokens && /^\s*0x[a-fA-F0-9]{40}\s*$/.test(tokenAddress))}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {!hasEnoughTokens && /^\s*0x[a-fA-F0-9]{40}\s*$/.test(tokenAddress) ? "Insufficient token balance" : getButtonContent()}
          </button>
        </div>
      </form>
    </div>
  );
}