import { FarmRecord, Khet, KhetCrop, Partner, PartnerCashEntry } from './types';

export const KHETS_STORAGE_KEY = 'kisan-sathi-khets';
export const CROPS_STORAGE_KEY = 'kisan-sathi-khet-crops';
export const RECORDS_STORAGE_KEY = 'kisan-sathi-records';
export const PARTNERS_STORAGE_KEY = 'sk-partners';
export const PARTNER_CASH_STORAGE_KEY = 'sk-partner-cash';

export const DEFAULT_KHETS: Khet[] = [
  {
    id: 'khet-1',
    name: 'बड़ा चक (उत्तर खेत)',
    crop: 'Wheat',
    totalArea: 5,
    area: 5,
    areaUnit: 'बीघा',
    sowingDate: '2025-11-10',
    soilType: 'काली चिकनी मिट्टी',
    irrigationSource: 'नलकूप / बोरवेल',
    crops: [
      {
        id: 'crop-khet-1-wheat',
        khetId: 'khet-1',
        cropName: 'Wheat',
        cropNameHi: 'गेहूं',
        season: 'Rabi 2026',
        sowingDate: '2025-11-10',
        allocatedArea: 5,
        areaUnit: 'बीघा',
        status: 'growing',
        expectedYield: 60,
      },
    ],
  },
  {
    id: 'khet-2',
    name: 'नहर वाला चक',
    crop: 'Garlic',
    totalArea: 3,
    area: 3,
    areaUnit: 'बीघा',
    sowingDate: '2025-10-25',
    soilType: 'दोमट मिट्टी',
    irrigationSource: 'नहर',
    crops: [
      {
        id: 'crop-khet-2-garlic',
        khetId: 'khet-2',
        cropName: 'Garlic',
        cropNameHi: 'लहसुन',
        season: 'Rabi 2026',
        sowingDate: '2025-10-25',
        allocatedArea: 3,
        areaUnit: 'बीघा',
        status: 'growing',
        expectedYield: 35,
      },
    ],
  },
];

export const DEFAULT_RECORDS: FarmRecord[] = [
  {
    id: 'rec-1',
    date: '2025-11-12',
    type: 'Expense',
    crop: 'Wheat',
    khetId: 'khet-1',
    field: 'बड़ा चक (उत्तर खेत)',
    expenseCategory: 'बीज',
    amount: 6500,
    quantity: 2,
    unit: 'Quintal',
    price: 3250,
    note: 'प्रमाणित गेहूं बीज 2 क्विंटल',
    paidBy: 'me',
    partnerSharePercent: 50,
  },
  {
    id: 'rec-2',
    date: '2025-11-15',
    type: 'Expense',
    crop: 'Wheat',
    khetId: 'khet-1',
    field: 'बड़ा चक (उत्तर खेत)',
    expenseCategory: 'खाद',
    amount: 5400,
    quantity: 4,
    unit: 'बोरी (Bags)',
    price: 1350,
    note: 'डीएपी 4 बोरी',
    paidBy: 'me',
    partnerSharePercent: 50,
  },
  {
    id: 'rec-3',
    date: '2025-11-20',
    type: 'Expense',
    crop: 'Wheat',
    khetId: 'khet-1',
    field: 'बड़ा चक (उत्तर खेत)',
    expenseCategory: 'डीजल/ट्रैक्टर',
    amount: 4000,
    quantity: 5,
    unit: 'घंटे (Hours)',
    price: 800,
    note: 'जुताई व बोवनी ट्रैक्टर',
    paidBy: 'partner',
    partnerSharePercent: 50,
  },
  {
    id: 'rec-4',
    date: '2026-03-20',
    type: 'Yield',
    crop: 'Wheat',
    khetId: 'khet-1',
    field: 'बड़ा चक (उत्तर खेत)',
    amount: 0,
    quantity: 58,
    unit: 'Quintal',
    note: 'हार्वेस्टर से कटाई, कुल 58 क्विंटल उपज',
  },
  {
    id: 'rec-5',
    date: '2026-03-25',
    type: 'Sale',
    crop: 'Wheat',
    khetId: 'khet-1',
    field: 'बड़ा चक (उत्तर खेत)',
    amount: 110400,
    quantity: 48,
    unit: 'Quintal',
    price: 2300,
    paidAmount: 110400,
    remainingAmount: 0,
    paymentStatus: 'Received',
    buyerName: 'कृषि उपज मंडी (शुभम ट्रेडर्स)',
    saleReceivedBy: 'me',
    note: '48 क्विंटल गेहूं ₹2300 भाव पर बेचा',
    partnerSharePercent: 50,
  },
];


export function loadAndMigrateKhets(): {
  khets: Khet[];
  khetCrops: KhetCrop[];
} {
  // Server या browser उपलब्ध न होने पर खाली डेटा
  if (typeof window === 'undefined') {
    return { khets: [], khetCrops: [] };
  }

  try {
    const rawKhets = localStorage.getItem(KHETS_STORAGE_KEY);

    // पहली बार ऐप खोलने पर डेमो खेत न जोड़ें
    if (rawKhets === null) {
      return { khets: [], khetCrops: [] };
    }

    const parsedKhets: unknown = JSON.parse(rawKhets);

    if (!Array.isArray(parsedKhets)) {
      return { khets: [], khetCrops: [] };
    }

    // सभी खेत डिलीट हो चुके हैं तो फसलें भी खाली रखें
    if (parsedKhets.length === 0) {
      return { khets: [], khetCrops: [] };
    }

    const rawCrops = localStorage.getItem(CROPS_STORAGE_KEY);

    let parsedCrops: KhetCrop[] = [];

    if (rawCrops !== null) {
      const value: unknown = JSON.parse(rawCrops);
      if (Array.isArray(value)) {
        parsedCrops = value as KhetCrop[];
      }
    } else {
      // पुराने डेटा में फसलें खेत के अंदर सेव हो सकती हैं
      parsedCrops = (parsedKhets as Khet[]).flatMap(
        (khet) => khet.crops || []
      );
    }

    return {
      khets: parsedKhets as Khet[],
      khetCrops: parsedCrops,
    };
  } catch (error) {
    console.error('Error loading khets from storage:', error);
    return { khets: [], khetCrops: [] };
  }
}

export function loadAndMigrateRecords(
  _khets: Khet[],
  _khetCrops: KhetCrop[]
): FarmRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);

    // रिकॉर्ड पहले कभी सेव नहीं हुए, तो खाली सूची दें
    if (raw === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    // [] भी एक वैध और सेव की गई सूची है
    if (Array.isArray(parsed)) {
      return parsed as FarmRecord[];
    }

    return [];
  } catch (error) {
    console.error('Error loading records:', error);
    return [];
  }
}

export function persistKhetsAndCrops(khets: Khet[], khetCrops: KhetCrop[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KHETS_STORAGE_KEY, JSON.stringify(khets));
    localStorage.setItem(CROPS_STORAGE_KEY, JSON.stringify(khetCrops));
  } catch (err) {
    console.error('Error persisting khets:', err);
  }
}

function getParsedStorage(key: string, fallback: any = null) {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function downloadPhysicalBackup(): void {
  if (typeof window === 'undefined') return;
  try {
    const backupData = {
      app: 'Smart Khata - Digital Farm, Batai, Rent & Home Ledger',
      version: '2.5',
      timestamp: new Date().toISOString(),
      khets: getParsedStorage(KHETS_STORAGE_KEY, []),
      crops: getParsedStorage(CROPS_STORAGE_KEY, []),
      records: getParsedStorage(RECORDS_STORAGE_KEY, []),
      partners: getParsedStorage(PARTNERS_STORAGE_KEY, []),
      partnerCash: getParsedStorage(PARTNER_CASH_STORAGE_KEY, []),
      rentRecords: getParsedStorage('sk-rent-records', []),
      homeExpenses: getParsedStorage('sk-home-expenses', []),
      stocks: getParsedStorage('kisan-sathi-stocks', []),
      landSettings: getParsedStorage('sk-land-settings', null),
      farmerProfile: getParsedStorage('sk-farmer-profile', null),
      appName: localStorage.getItem('sk-app-name') || 'स्मार्ट खाता',
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart-khata-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error generating backup:', err);
  }
}
