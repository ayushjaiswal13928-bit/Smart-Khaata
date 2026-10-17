import { FarmRecord, Khet, KhetCrop, Lang, Partner, PartnerCashEntry } from './types';
import { cropLabel } from './farmI18n';

interface ExportExcelOptions {
  filename?: string;
  lang: Lang;
  records: FarmRecord[];
  khets?: Khet[];
  khetCrops?: KhetCrop[];
  partners?: Partner[];
  partnerCash?: PartnerCashEntry[];
}

export function exportToCsv(options: ExportExcelOptions): void {
  const isHi = options.lang === 'hi';
  const headers = isHi
    ? ['दिनांक', 'खेत', 'फसल', 'प्रकार', 'श्रेणी/विवरण', 'मात्रा', 'इकाई', 'दर (भाव ₹)', 'कुल रकम (₹)', 'प्राप्त रकम (₹)', 'बाकी रकम (₹)', 'खरीदार/श्रमिक', 'टिप्पणी']
    : ['Date', 'Field', 'Crop', 'Type', 'Category/Details', 'Quantity', 'Unit', 'Rate (₹)', 'Amount (₹)', 'Paid Amount (₹)', 'Remaining (₹)', 'Buyer/Worker', 'Note'];

  const rows = options.records.map((r) => [
    r.date || '',
    r.field || '',
    cropLabel(options.lang, r.crop),
    r.type,
    r.expenseCategory || '',
    r.quantity || '',
    r.unit || '',
    r.price || '',
    r.amount || '',
    r.paidAmount || '',
    r.remainingAmount || '',
    r.buyerName || r.worker || '',
    (r.note || '').replace(/"/g, '""'),
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Excel Hindi support
    [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    options.filename || `kheti-records-${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(options: ExportExcelOptions): void {
  // Generates clean CSV with UTF-8 BOM which opens directly in Excel with full Hindi font support
  exportToCsv(options);
}
