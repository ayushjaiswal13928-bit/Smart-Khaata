import { FarmRecord, Lang } from "./types";

export interface FarmTranslation {
  farmTitle: string;
  expense: string;
  sale: string;
  yield: string;
  totalExpense: string;
  totalSales: string;
  profit: string;
  totalYield: string;
  crop: string;
  date: string;
  type: string;
  details: string;
  amount: string;
  noRecords: string;
}

export const FARM_STRINGS: Record<Lang, FarmTranslation> = {
  hi: {
    farmTitle: "खेती व फसल",
    expense: "खर्च (Expense)",
    sale: "बिक्री (Sale)",
    yield: "उत्पादन (Yield)",
    totalExpense: "कुल खेती खर्च",
    totalSales: "कुल फसल बिक्री",
    profit: "शुद्ध मुनाफा",
    totalYield: "कुल पैदावार",
    crop: "फसल (Crop)",
    date: "तारीख",
    type: "प्रकार",
    details: "विवरण",
    amount: "राशि (₹)",
    noRecords: "कोई खेती रिकॉर्ड उपलब्ध नहीं है",
  },
  en: {
    farmTitle: "Farming & Crops",
    expense: "Expense",
    sale: "Sale",
    yield: "Yield",
    totalExpense: "Total Farm Expense",
    totalSales: "Total Crop Sales",
    profit: "Net Farm Profit",
    totalYield: "Total Production",
    crop: "Crop",
    date: "Date",
    type: "Type",
    details: "Details",
    amount: "Amount (₹)",
    noRecords: "No farming records available",
  },
};

const CROPS_HI: Record<string, string> = {
  Wheat: "गेहूं",
  Rice: "धान / चावल",
  Soybean: "सोयाबीन",
  Cotton: "कपास",
  Mustard: "सरसों",
  Groundnut: "मूंगफली",
  Gram: "चना",
  Garlic: "लहसुन",
  Maize: "मक्का",
  Other: "अन्य फसल",
};

export function cropLabel(lang: Lang, crop: string): string {
  if (lang === "hi") {
    return CROPS_HI[crop] || crop;
  }
  return crop;
}

export function unitLabel(lang: Lang, unit?: string): string {
  if (!unit) return "";
  if (lang === "hi") {
    if (unit === "Quintal") return "क्विंटल";
    if (unit === "Kg") return "किलो";
    if (unit === "Ton") return "टन";
  }
  return unit;
}

export function typeLabel(lang: Lang, type: FarmRecord["type"]): string {
  if (lang === "hi") {
    if (type === "Expense") return "खर्च";
    if (type === "Sale") return "बिक्री";
    if (type === "Yield") return "उत्पादन";
  }
  return type;
}
