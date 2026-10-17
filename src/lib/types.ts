export type Lang = 'hi' | 'en';

export type TransactionType = 'Expense' | 'Yield' | 'Sale';

export interface FarmRecord {
  id: string;
  date: string;
  type: TransactionType;
  crop: string;
  khetId?: string;
  cropId?: string;
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
  paidAmount?: number;
  remainingAmount?: number;
  paymentStatus?: 'Received' | 'Pending' | 'Partial';
  buyerName?: string;
  saleReceivedBy?: 'me' | 'partner' | 'shared';
  partnerId?: string;
  paidBy?: 'me' | 'partner' | 'shared';
  // Actual amounts paid for shared expenses
  ownerPaidAmount?: number;
  partnerPaidAmount?: number;
  partnerSharePercent?: number;
  ratePerQuintal?: number;
}

export interface KhetCrop {
  id: string;
  khetId: string;
  cropName: string;
  cropNameHi?: string;
  season?: string;
  sowingDate?: string;
  harvestDate?: string;
  allocatedArea: number;
  areaUnit?: string;
  status: 'sown' | 'growing' | 'harvested';
  expectedYield?: number;
  notes?: string;
}

export interface Khet {
  id: string;
  name: string;
  crop: string;
  totalArea: number;
  area: number;
  areaUnit: string;
  sowingDate?: string;
  soilType?: string;
  irrigationSource?: string;
  season?: string;
  crops?: KhetCrop[];
}

export interface Partner {
  id: string;
  name: string;
  phone?: string;
  relationship: 'batai_50_50' | 'batai_third' | 'batai_quarter' | 'batai_custom';
  sharePercent: number; // e.g., 50 for अधिया, 33.33 for तिहाई, 25 for चौथाई
  costShareType?: 'same_as_share' | 'owner_zero_cost' | 'custom_cost';
  customCostSharePercent?: number;
  khetName?: string;
  khetId?: string;
  crop?: string;
  season?: string;
  startDate?: string;
  notes?: string;
}

export interface PartnerCashEntry {
  id: string;
  partnerId: string;
  date: string;
  type: 'gave_to_partner' | 'received_from_partner';
  purpose?: 'advance' | 'settlement' | 'loan' | 'other';
  amount: number;
  mode?: 'cash' | 'online' | 'bank';
  alreadyRecordedInFarmRecords?: boolean;
  note?: string;
}

export interface StockItem {
  id: string;
  crop: string;
  quantity: number;
  unit: string;
  harvestDate?: string;
  khetName?: string;
  storageLocation?: string;
  expectedPrice?: number;
  notes?: string;
}

// Rent / Property Management Types
export type RentStatus = 'Pending' | 'Received' | 'Partial';

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

// Home Expense Types
export interface HomeExpense {
  id: string;
  date: string;
  category: string;
  note?: string;
  amount: number;
}

// Farmer Profile & Security Settings
export interface FarmerProfile {
  name: string;
  phone: string;
  village: string;
  tehsil: string;
  district: string;
  state?: string;
}

export interface SecuritySettings {
  pin: string;
  isLockEnabled: boolean;
  recoveryQuestion?: string;
  recoveryAnswer?: string;
}
