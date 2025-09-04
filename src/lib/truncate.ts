export function truncateAddress(addr?: `0x${string}` | string) {
  if (!addr) return "";
  const start = addr.slice(0, 6);
  const end = addr.slice(-4);
  return `${start}...${end}`;
}
