import { Lang } from './types';

export interface FarmTranslation {
  title: string;
  subtitle: string;
  addRecord: string;
  addExpense: string;
  addYield: string;
  addSale: string;
  expense: string;
  yield: string;
  sale: string;
  type: string;
  crop: string;
  date: string;
  amount: string;
  quantity: string;
  unit: string;
  rate: string;
  field: string;
  area: string;
  worker: string;
  notes: string;
  totalExpense: string;
  totalSales: string;
  paymentReceived: string;
  pendingPayment: string;
  realizedProfit: string;
  noRecords: string;
}

export const FARM_STRINGS: Record<Lang, FarmTranslation> = {
  hi: {
    title: 'डिजिटल कृषि बहीखाता',
    subtitle: 'खाद-बीज खर्च, पैदावार, बिक्री और बटाईदार का सम्पूर्ण हिसाब',
    addRecord: '+ नया हिसाब दर्ज करें',
    addExpense: '+ नया खर्च',
    addYield: '+ पैदावार',
    addSale: '+ फसल बिक्री',
    expense: 'लागत खर्च',
    yield: 'उपज / पैदावार',
    sale: 'फसल बिक्री',
    type: 'प्रकार',
    crop: 'फसल',
    date: 'दिनांक',
    amount: 'रकम (₹)',
    quantity: 'मात्रा',
    unit: 'इकाई',
    rate: 'भाव (दर)',
    field: 'खेत (चक)',
    area: 'क्षेत्रफल (रकबा)',
    worker: 'श्रमिक / ऑपरेटर',
    notes: 'विवरण / टिप्पणी',
    totalExpense: 'कुल खर्च',
    totalSales: 'कुल बिक्री',
    paymentReceived: 'प्राप्त भुगतान',
    pendingPayment: 'बकाया लेना',
    realizedProfit: 'शुद्ध नकद मुनाफा',
    noRecords: 'कोई रिकॉर्ड दर्ज नहीं है',
  },
  en: {
    title: 'Digital Farm Ledger',
    subtitle: 'Track crop expenses, harvest yields, sales and partner sharecropping',
    addRecord: '+ Add Record',
    addExpense: '+ Add Expense',
    addYield: '+ Add Yield',
    addSale: '+ Add Sale',
    expense: 'Expense',
    yield: 'Yield',
    sale: 'Sale',
    type: 'Type',
    crop: 'Crop',
    date: 'Date',
    amount: 'Amount (₹)',
    quantity: 'Quantity',
    unit: 'Unit',
    rate: 'Rate (₹)',
    field: 'Field / Plot',
    area: 'Area',
    worker: 'Worker / Operator',
    notes: 'Notes / Remarks',
    totalExpense: 'Total Expenses',
    totalSales: 'Total Sales',
    paymentReceived: 'Payment Received',
    pendingPayment: 'Pending Due',
    realizedProfit: 'Realized Profit',
    noRecords: 'No records found',
  },
};

export const CROP_LABELS_HI: Record<string, string> = {
  Wheat: 'गेहूं',
  Soybean: 'सोयाबीन',
  Gram: 'चना',
  Mustard: 'सरसों',
  Rice: 'धान / चावल',
  Cotton: 'कपास',
  Maize: 'मक्का',
  Garlic: 'लहसुन',
  Groundnut: 'मूंगफली',
  Onion: 'प्याज',
  Potato: 'आलू',
  Tomato: 'टमाटर',
  Sugarcane: 'गन्ना',
  Bajra: 'बाजरा',
  Jowar: 'ज्वार',
  Peas: 'मटर',
  Other: 'अन्य फसल',
};

export function cropLabel(lang: Lang, cropName: string): string {
  if (!cropName) return '';
  if (lang === 'hi') {
    return CROP_LABELS_HI[cropName] || cropName;
  }
  return cropName;
}

export function typeLabel(lang: Lang, type: 'Expense' | 'Yield' | 'Sale'): string {
  if (lang === 'hi') {
    if (type === 'Expense') return 'लागत खर्च';
    if (type === 'Yield') return 'पैदावार';
    return 'फसल बिक्री';
  }
  return type;
}

export function unitLabel(lang: Lang, unit?: string): string {
  if (!unit) return '';
  if (lang === 'hi') {
    if (unit === 'Quintal') return 'क्विंटल';
    if (unit === 'Kg') return 'किलो';
    if (unit === 'Ton') return 'टन';
    return unit;
  }
  return unit;
}
