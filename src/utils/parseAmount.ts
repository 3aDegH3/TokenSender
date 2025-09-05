// src/utils/parseAmount.ts
import { parseUnits } from "viem";

export function parseAmountStringToBigInt(str: string, decimals?: number): bigint {
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

export function formatTokenAmount(weiAmount: bigint, decimals: number): string {
  const factor = BigInt(10) ** BigInt(decimals);
  const whole = weiAmount / factor;
  const remainder = weiAmount % factor;
  const fractional = Number((remainder * BigInt(100)) / factor);
  return `${whole.toString()}.${fractional.toString().padStart(2, "0")}`;
}
