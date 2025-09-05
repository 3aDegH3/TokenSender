// src/utils/eth.ts
export const isEthAddress = (a?: string) => Boolean(a && /^0x[a-fA-F0-9]{40}$/.test(a));
export const parseList = (s: string) =>
  s
    .split(/[,\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
