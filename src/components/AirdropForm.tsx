"use client";
import { useState, useEffect, useMemo } from "react";
import { InputForm, InputFormProps } from "@/components/ui/InputField";

export default function AirdropForm() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipients, setRecipients] = useState("");
  const [amounts, setAmounts] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  // Helper: جداکننده با کاما یا newline
  const parseList = (s: string) =>
    s
      .split(/[\n,]+/)
      .map((x) => x.trim())
      .filter(Boolean);

  // Helper: تشخیص آدرس اتریوم ساده
  const isEthAddress = (a?: string) =>
    Boolean(a && /^0x[a-fA-F0-9]{40}$/.test(a));

  // مجموع (عدد ساده؛ فرض بر wei یا واحدی که کاربر وارد می‌کند)
  const total = useMemo(() => {
    const arr = parseList(amounts).map((x) => Number(x));
    if (arr.length === 0) return 0;
    if (arr.some((n) => Number.isNaN(n))) return NaN;
    return arr.reduce((s, n) => s + n, 0);
  }, [amounts]);

  const recipientsList = useMemo(() => parseList(recipients), [recipients]);
  const amountsList = useMemo(() => parseList(amounts), [amounts]);
  const countsMatch =
    recipientsList.length > 0 && recipientsList.length === amountsList.length;

  // persist ساده در localStorage (اختیاری ولی مفید)
  useEffect(() => {
    const t = localStorage.getItem("tokenAddress");
    const r = localStorage.getItem("recipients");
    const a = localStorage.getItem("amounts");
    if (t) setTokenAddress(t);
    if (r) setRecipients(r);
    if (a) setAmounts(a);
  }, []);
  
  useEffect(() => localStorage.setItem("tokenAddress", tokenAddress), [tokenAddress]);
  useEffect(() => localStorage.setItem("recipients", recipients), [recipients]);
  useEffect(() => localStorage.setItem("amounts", amounts), [amounts]);

  // submit ساده — فعلاً فقط اعتبارسنجی و لاگ
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    
    // basic validations
    if (!isEthAddress(tokenAddress)) {
      setError("Invalid token address (must be 0x...40hex)");
      return;
    }
    
    if (!countsMatch) {
      setError("Recipients and amounts must have same count and not be empty.");
      return;
    }
    
    if (amountsList.some((x) => Number.isNaN(Number(x)))) {
      setError("Amounts must be numeric (wei).");
      return;
    }
    
    if (total <= 0 || Number.isNaN(total)) {
      setError("Total amount invalid or zero.");
      return;
    }
    
    // همه چیز درست؛ آماده اجرای منطق بلاک‌چینی بعدی
    setIsWorking(true);
    try {
      // در این مرحله فقط لاگ می‌کنیم — بعداً اینجا call به useAirdrop یا writeContract قرار می‌گیرد
      console.log("Token:", tokenAddress);
      console.log("Recipients:", recipientsList);
      console.log("Amounts:", amountsList);
      console.log("Total:", total);
      
      // نمایشی: پیام کوتاه
      alert(
        `Ready: ${recipientsList.length} recipients • total (wei): ${total}\nCheck console for arrays.`
      );
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unknown error");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <InputForm
          label="Token address"
          placeholder="0x..."
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
        />
      </div>
      
      <div>
        <InputForm
          label="Recipients (comma or newline)"
          placeholder="0xabc..., 0xdef...  (or newline separated)"
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          large={true}
        />
      </div>
      
      <div>
        <InputForm
          label="Amounts (wei; comma or newline)"
          placeholder="1000, 2000, 3000"
          value={amounts}
          onChange={(e) => setAmounts(e.target.value)}
          large={true}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
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
          <div className="text-gray-200 font-medium">{Number.isNaN(total) ? "—" : total}</div>
        </div>
      </div>
      
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}
      
      <div className="pt-4">
        <button
          type="submit"
          disabled={isWorking}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:via-purple-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
        >
          {isWorking ? "Processing..." : "Send Tokens"}
        </button>
      </div>
    </form>
  );
}