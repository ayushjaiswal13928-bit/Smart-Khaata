import { FarmRecord, Khet, KhetCrop } from './types';

export interface CropFinancials {
  totalExpense: number;
  totalSales: number;
  paymentReceived: number;
  pendingDue: number;
  netProfit: number;
  harvestedYieldQuintal: number;
  soldYieldQuintal: number;
  remainingStockQuintal: number;
}

export interface KhetFinancials {
  totalExpense: number;
  totalSales: number;
  paymentReceived: number;
  pendingDue: number;
  netProfit: number;
  totalHarvestYieldQuintal: number;
  totalSoldYieldQuintal: number;
  totalRemainingStockQuintal: number;
  cropsCount: number;
}

export function normalizeToQuintals(quantity: number, unit?: string): number {
  const q = Number(quantity) || 0;
  if (!unit) return q;
  const u = unit.trim().toLowerCase();
  if (u === 'kg' || u === 'किलो') return q / 100;
  if (u === 'ton' || u === 'टन') return q * 10;
  if (u.includes('बोरी') || u.includes('bag')) return q * 0.5;
  return q;
}

/**
 * Standardized single source of truth for FarmRecord monetary value.
 * Prioritizes record.amount as canonical. Only computes from qty * price if amount is missing/zero.
 */
export function getRecordAmount(record: FarmRecord): number {
  if (record.type === 'Yield') return 0;
  
  const savedAmount = Number(record.amount);
  if (Number.isFinite(savedAmount) && savedAmount > 0) {
    return savedAmount;
  }

  const qty = Number(record.quantity || 0);
  const price = Number(record.price || 0);
  if (qty > 0 && price > 0) {
    if (record.type === 'Sale') {
      const quintals = normalizeToQuintals(qty, record.unit);
      return Math.round(quintals * price * 100) / 100;
    }
    return Math.round(qty * price * 100) / 100;
  }

  return Number.isFinite(savedAmount) ? savedAmount : 0;
}

export function calculateCropFinancials(
  records: FarmRecord[],
  crop: KhetCrop,
  khet: Khet
): CropFinancials {
  const relevantRecords = records.filter((r) => {
    if (r.cropId && r.cropId === crop.id) return true;
    const sameKhet =
      (r.khetId && r.khetId === khet.id) ||
      (r.field && r.field.trim().toLowerCase() === khet.name.trim().toLowerCase());
    const sameCrop = r.crop && r.crop.trim().toLowerCase() === crop.cropName.trim().toLowerCase();
    return sameKhet && sameCrop;
  });

  let totalExpense = 0;
  let totalSales = 0;
  let paymentReceived = 0;
  let pendingDue = 0;
  let harvestedYieldQuintal = 0;
  let soldYieldQuintal = 0;

  for (const r of relevantRecords) {
    const qty = Number(r.quantity || 0);
    const amount = getRecordAmount(r);

    if (r.type === 'Expense') {
      totalExpense += amount;
    } else if (r.type === 'Sale') {
      totalSales += amount;
      const paid = r.paidAmount !== undefined && r.paidAmount !== null ? Number(r.paidAmount) : amount;
      paymentReceived += paid;
      const pending = r.remainingAmount !== undefined && r.remainingAmount !== null
        ? Number(r.remainingAmount)
        : Math.max(0, amount - paid);
      pendingDue += pending;
      soldYieldQuintal += normalizeToQuintals(qty, r.unit);
    } else if (r.type === 'Yield') {
      harvestedYieldQuintal += normalizeToQuintals(qty, r.unit);
    }
  }

  const remainingStockQuintal = Math.max(0, harvestedYieldQuintal - soldYieldQuintal);
  const netProfit = paymentReceived - totalExpense;

  return {
    totalExpense,
    totalSales,
    paymentReceived,
    pendingDue,
    netProfit,
    harvestedYieldQuintal: Math.round(harvestedYieldQuintal * 100) / 100,
    soldYieldQuintal: Math.round(soldYieldQuintal * 100) / 100,
    remainingStockQuintal: Math.round(remainingStockQuintal * 100) / 100,
  };
}

export function calculateKhetFinancials(
  records: FarmRecord[],
  khet: Khet,
  crops: KhetCrop[]
): KhetFinancials {
  const relevantRecords = records.filter(
    (r) =>
      r.khetId === khet.id ||
      (r.field && r.field.trim().toLowerCase() === khet.name.trim().toLowerCase())
  );

  let totalExpense = 0;
  let totalSales = 0;
  let paymentReceived = 0;
  let pendingDue = 0;
  let totalHarvestYieldQuintal = 0;
  let totalSoldYieldQuintal = 0;

  for (const r of relevantRecords) {
    const qty = Number(r.quantity || 0);
    const amount = getRecordAmount(r);

    if (r.type === 'Expense') {
      totalExpense += amount;
    } else if (r.type === 'Sale') {
      totalSales += amount;
      const paid = r.paidAmount !== undefined && r.paidAmount !== null ? Number(r.paidAmount) : amount;
      paymentReceived += paid;
      const pending = r.remainingAmount !== undefined && r.remainingAmount !== null
        ? Number(r.remainingAmount)
        : Math.max(0, amount - paid);
      pendingDue += pending;
      totalSoldYieldQuintal += normalizeToQuintals(qty, r.unit);
    } else if (r.type === 'Yield') {
      totalHarvestYieldQuintal += normalizeToQuintals(qty, r.unit);
    }
  }

  const totalRemainingStockQuintal = Math.max(0, totalHarvestYieldQuintal - totalSoldYieldQuintal);
  const netProfit = paymentReceived - totalExpense;

  return {
    totalExpense,
    totalSales,
    paymentReceived,
    pendingDue,
    netProfit,
    totalHarvestYieldQuintal: Math.round(totalHarvestYieldQuintal * 100) / 100,
    totalSoldYieldQuintal: Math.round(totalSoldYieldQuintal * 100) / 100,
    totalRemainingStockQuintal: Math.round(totalRemainingStockQuintal * 100) / 100,
    cropsCount: crops.length,
  };
}
