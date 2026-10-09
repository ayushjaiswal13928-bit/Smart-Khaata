export function fmt(value: number | string | undefined | null): string {
  const num = Number(value || 0);
  if (isNaN(num)) return "₹0";
  const abs = Math.abs(num);
  const formatted = abs.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
  if (num < 0) {
    return `-₹${formatted}`;
  }
  return `₹${formatted}`;
}

export function fmtNum(value: number | string | undefined | null): string {
  const num = Number(value || 0);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}
