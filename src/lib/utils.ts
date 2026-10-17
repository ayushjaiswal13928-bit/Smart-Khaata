export function fmt(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '₹0';
  const isNegative = value < 0;
  const absVal = Math.abs(value);
  const formatted = absVal.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
