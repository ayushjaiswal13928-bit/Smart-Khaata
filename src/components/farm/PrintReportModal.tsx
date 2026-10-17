import React, { useRef, useState } from 'react';
import { Printer, Download, FileSpreadsheet, X, CheckCircle, ShieldCheck, FileDown, Loader2 } from 'lucide-react';
import { FarmRecord, Khet, KhetCrop, Lang } from '../../lib/types';
import { cropLabel } from '../../lib/farmI18n';
import { exportToExcel, exportToCsv } from '../../lib/excelExport';
import { downloadPrintableHtml, exportElementToPdf, printElement } from '../../lib/pdfExport';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  records: FarmRecord[];
  khets: Khet[];
  khetCrops: KhetCrop[];
  selectedCrop?: string;
  selectedKhetId?: string;
}

export function PrintReportModal({
  isOpen,
  onClose,
  lang,
  records,
  khets,
  khetCrops,
  selectedCrop,
  selectedKhetId,
}: PrintReportModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const isHi = lang === 'hi';

  if (!isOpen) return null;

  const filteredRecords = records.filter((r) => {
    if (selectedCrop && selectedCrop !== 'all' && r.crop !== selectedCrop) {
      return false;
    }
    if (selectedKhetId && selectedKhetId !== 'all') {
      if (r.khetId && r.khetId !== selectedKhetId) return false;
      const khet = khets.find((k) => k.id === selectedKhetId);
      if (khet && r.field && r.field !== khet.name && !r.khetId) return false;
    }
    return true;
  });

  let totalExpense = 0;
  let totalSales = 0;
  let totalReceived = 0;
  let totalPending = 0;
  let totalYieldQtl = 0;

  filteredRecords.forEach((r) => {
    const qty = Number(r.quantity || 0);
    const price = Number(r.price || 0);
    const calcAmt = qty * price;
    const amt = calcAmt > 0 ? calcAmt : Number(r.amount || 0);

    if (r.type === 'Expense') {
      totalExpense += amt;
    } else if (r.type === 'Yield') {
      let q = qty;
      if (r.unit === 'Kg' || r.unit === 'किलो') q = qty / 100;
      else if (r.unit === 'Ton' || r.unit === 'टन') q = qty * 10;
      else if (r.unit?.includes('बोरी') || r.unit?.includes('Bags')) q = qty * 0.5;
      totalYieldQtl += q;
    } else if (r.type === 'Sale') {
      totalSales += amt;
      const paid = r.paidAmount !== undefined ? Number(r.paidAmount) : amt;
      totalReceived += paid;
      const pending = r.remainingAmount !== undefined ? Number(r.remainingAmount) : Math.max(0, amt - paid);
      totalPending += pending;
    }
  });

  const netProfit = totalSales - totalExpense;
  const todayStr = new Date().toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const selectedKhetObj = selectedKhetId && selectedKhetId !== 'all'
    ? khets.find((k) => k.id === selectedKhetId)
    : null;

  const titleText = isHi
    ? `खेती बहीखाता वित्तीय पर्चा${selectedKhetObj ? ` - ${selectedKhetObj.name}` : ''}${
        selectedCrop && selectedCrop !== 'all' ? ` (${cropLabel('hi', selectedCrop)})` : ''
      }`
    : `Farm Financial Statement${selectedKhetObj ? ` - ${selectedKhetObj.name}` : ''}`;

  const subtitleText = isHi
    ? 'कृषि लागत खर्च, पैदावार व फसल बिक्री का प्रमाणित ब्यौरा'
    : 'Certified statement of farm inputs, harvest yield and crop sales';

  const handlePrint = () => {
    printElement(printAreaRef.current);
  };

  const handleSavePdf = async () => {
    if (!printAreaRef.current || isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);
      const khetLabel = selectedKhetObj?.name ? selectedKhetObj.name.replace(/[/\\?%*:|"<> ]/g, '-') : 'khet';
      const cleanFileName = `khet-hisab-${khetLabel}-${new Date().toISOString().slice(0, 10)}.pdf`;
      await exportElementToPdf(printAreaRef.current, cleanFileName);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      printElement(printAreaRef.current);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadExcel = () => {
    exportToExcel({
      lang,
      records: filteredRecords,
      khets,
      khetCrops,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-[#0c1a13] border border-[#1e3c2c] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:bg-white print:w-full">
        {/* MODAL HEADER */}
        <div className="px-4 py-3 border-b border-[#1a3525] flex items-center justify-between bg-[#07130e] print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Printer size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {isHi ? 'PDF प्रिंट एवं रिपोर्ट डाउनलोड' : 'Print PDF & Download Statement'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isHi ? 'प्रिंट, PDF सेव, Excel (.xlsx) और CSV' : 'Print preview, PDF, Excel (.xlsx) and CSV'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ACTION TOOLBAR */}
        <div className="px-4 py-2.5 bg-[#0a1811] border-b border-[#1a3525] flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span className="font-semibold">{isHi ? `कुल रिकॉर्ड: ${filteredRecords.length}` : `Records: ${filteredRecords.length}`}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              <Printer size={14} />
              <span>{isHi ? '🖨️ प्रिंट / Save as PDF' : 'Print / Save PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleSavePdf}
              disabled={isGeneratingPdf}
              className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 disabled:opacity-60"
            >
              <FileDown size={14} />
              <span>{isHi ? '📄 PDF डाउनलोड करें' : 'Download PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="h-8 px-2.5 rounded-lg border border-[#1e3c2c] bg-[#0c1a13] hover:bg-[#152e20] text-emerald-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet size={13} className="text-emerald-400" />
              <span>Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* REPORT CONTENT */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950/50 print:p-0 print:overflow-visible print:bg-white">
          <div
            ref={printAreaRef}
            id="printable-farm-report"
            className="w-full max-w-3xl mx-auto bg-white text-slate-900 rounded-xl p-4 sm:p-8 shadow-md border border-slate-200 text-xs font-sans print:border-none print:shadow-none print:p-0 print:max-w-none"
          >
            {/* STATEMENT HEADER */}
            <div className="border-b-2 border-emerald-600 pb-3 mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌾</span>
                  <h1 className="text-lg sm:text-xl font-bold text-emerald-800 leading-tight">
                    {titleText}
                  </h1>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{subtitleText}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                  {isHi ? 'दिनांक' : 'Date'}: {todayStr}
                </div>
              </div>
            </div>

            {/* FINANCIAL BANNER */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2">
                <span className="text-[10px] text-emerald-800 font-semibold block">{isHi ? 'कुल बिक्री' : 'Total Sales'}</span>
                <span className="text-sm font-bold text-emerald-900 font-mono">₹{totalSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-red-50/70 border border-red-200 rounded-lg p-2">
                <span className="text-[10px] text-red-800 font-semibold block">{isHi ? 'कुल खर्च' : 'Total Expenses'}</span>
                <span className="text-sm font-bold text-red-900 font-mono">₹{totalExpense.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-sky-50/70 border border-sky-200 rounded-lg p-2">
                <span className="text-[10px] text-sky-800 font-semibold block">{isHi ? 'प्राप्त भुगतान' : 'Received'}</span>
                <span className="text-sm font-bold text-sky-900 font-mono">₹{totalReceived.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2">
                <span className="text-[10px] text-amber-800 font-semibold block">{isHi ? 'बकाया रकम' : 'Pending Due'}</span>
                <span className="text-sm font-bold text-amber-900 font-mono">₹{totalPending.toLocaleString('en-IN')}</span>
              </div>
              <div className={`col-span-2 sm:col-span-1 rounded-lg p-2 border ${netProfit >= 0 ? 'bg-emerald-100/80 border-emerald-300' : 'bg-red-100/80 border-red-300'}`}>
                <span className={`text-[10px] font-bold block ${netProfit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                  {isHi ? 'शुद्ध मुनाफा' : 'Net Profit'}
                </span>
                <span className={`text-sm font-bold font-mono ${netProfit >= 0 ? 'text-emerald-950' : 'text-red-950'}`}>
                  ₹{netProfit.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* STATEMENT TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300 text-slate-700">
                    <th className="py-2 px-2 text-left font-semibold">#</th>
                    <th className="py-2 px-2 text-left font-semibold">{isHi ? 'दिनांक' : 'Date'}</th>
                    <th className="py-2 px-2 text-left font-semibold">{isHi ? 'खेत / फसल' : 'Field / Crop'}</th>
                    <th className="py-2 px-2 text-left font-semibold">{isHi ? 'प्रकार' : 'Type'}</th>
                    <th className="py-2 px-2 text-left font-semibold">{isHi ? 'विवरण' : 'Details'}</th>
                    <th className="py-2 px-2 text-right font-semibold">{isHi ? 'रकम (₹)' : 'Amount (₹)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.map((r, idx) => {
                    const qty = Number(r.quantity || 0);
                    const price = Number(r.price || 0);
                    const calcAmt = qty * price;
                    const amt = calcAmt > 0 ? calcAmt : Number(r.amount || 0);
                    const isSale = r.type === 'Sale';
                    return (
                      <tr key={r.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-2 px-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-2 whitespace-nowrap text-slate-600">{r.date}</td>
                        <td className="py-2 px-2 font-medium text-slate-800">
                          {cropLabel(lang, r.crop)} {r.field ? `(${r.field})` : ''}
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.type === 'Expense' ? 'bg-red-100 text-red-800' : isSale ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'
                          }`}>
                            {r.type}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-slate-700">
                          {r.type === 'Expense' ? r.expenseCategory || r.note : `${qty} ${r.unit || ''} @ ₹${price}`}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-semibold">
                          {r.type === 'Yield' ? '-' : `₹${amt.toLocaleString('en-IN')}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
