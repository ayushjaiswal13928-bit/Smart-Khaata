export type Lang = "hi" | "en";

export type FarmRecordType = "Expense" | "Sale" | "Yield";

export interface FarmRecord {
  id: string;
  date: string;
  type: FarmRecordType;
  crop: string;
  expenseCategory?: string;
  amount: number;
  quantity?: number;
  unit?: string;
  price?: number;
  note?: string;
  field?: string;
  area?: number;
  areaUnit?: string;
  worker?: string;
  machine?: string;
  season?: string;
}

export interface HomeExpense {
  id: string;
  date: string;
  category: string;
  note?: string;
  amount: number;
}

export type RentStatus = "Received" | "Pending" | "Partial";

export interface RentRecord {
  id: string;
  date: string;
  tenant: string;
  month: string;
  whatsapp: string;
  amount: number;
  prevReading: number;
  currentReading: number;
  ratePerUnit: number;
  units: number;
  lightBill: number;
  total: number;
  paidAmount?: number;
  remainingAmount?: number;
  status: RentStatus;
  note: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelUsed?: string;
}
