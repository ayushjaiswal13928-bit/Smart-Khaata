'use client';

import React, { type Dispatch, type SetStateAction } from 'react';
import { Search, Printer, Sprout, FileSpreadsheet } from 'lucide-react';
import { FarmRecord, Lang, Khet, KhetCrop } from '../../lib/types';
import { FarmTranslation, cropLabel } from '../../lib/farmI18n';
import { exportToExcel } from '../../lib/excelExport';
import { getRecordAmount } from '../../lib/farmAccounting';

interface FarmFiltersProps {
  lang: Lang;
  farmT: FarmTranslation;
  cropSearch: string;
  setCropSearch: Dispatch<SetStateAction<string>>;
  selectedCropTab: string;
  setSelectedCropTab: Dispatch<SetStateAction<string>>;
  availableCrops: string[];
  typeFilter: 'all' | FarmRecord['type'];
  setTypeFilter: Dispatch<SetStateAction<'all' | FarmRecord['type']>>;
  dateFilter: 'all' | 'today' | 'month' | 'year';
  setDateFilter: Dispatch<SetStateAction<'all' | 'today' | 'month' | 'year'>>;
  filteredRecords: FarmRecord[];
  allRecords: FarmRecord[];
  khets?: Khet[];
  khetCrops?: KhetCrop[];
  onOpenPrintModal?: () => void;
}

export function FarmFilters({
  lang,
  farmT,
  cropSearch,
  setCropSearch,
  selectedCropTab,
  setSelectedCropTab,
  availableCrops,
  typeFilter,
  setTypeFilter,
  dateFilter,
  setDateFilter,
  filteredRecords,
  allRecords,
  khets = [],
  khetCrops = [],
  onOpenPrintModal,
}: FarmFiltersProps) {
  const isHindi = lang === 'hi';

  const getAmount = (record: FarmRecord) => {
    return getRecordAmount(record);
  };

  const exportCSV = async () => {
    const recordsToExport = filteredRecords.length > 0 ? filteredRecords : allRecords;
    if (recordsToExport.length === 0) {
      alert(isHindi ? 'निर्यात के लिए कोई रिकॉर्ड उपलब्ध नहीं है।' : 'No records available to export.');
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const cropSuffix = selectedCropTab !== 'all' ? `-${selectedCropTab}` : '';

    exportToExcel({
      filename: `kheti-report${cropSuffix}-${todayStr}.xlsx`,
      lang,
      records: recordsToExport,
      khets,
      khetCrops,
    });
  };

  const allTypes = lang === 'hi' ? 'सभी प्रकार' : 'All Types';
  const allDates = lang === 'hi' ? 'सभी तारीख' : 'All Dates';
  const today = lang === 'hi' ? 'आज' : 'Today';
  const thisMonth = lang === 'hi' ? 'इस माह' : 'This Month';
  const thisYear = lang === 'hi' ? 'इस वर्ष' : 'This Year';
  const searchPlaceholder = lang === 'hi' ? 'खेत, विवरण या नाम से खोजें...' : 'Search field, note or worker...';

  return (
    <div className="mb-4 space-y-3">
      {/* 1. CROP FILTER TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[var(--sk-border)]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--sk-text)]">
          <Sprout size={15} className="text-emerald-500 shrink-0" />
          <span>{isHindi ? 'फसल अनुसार देखें:' : 'Select Crop:'}</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedCropTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              selectedCropTab === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-[var(--sk-card)] text-[var(--sk-muted)] hover:text-[var(--sk-text)] border border-[var(--sk-border)] hover:bg-[var(--sk-card2)]'
            }`}
          >
            <span>{isHindi ? 'सभी फसलें' : 'All Crops'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {allRecords.length}
            </span>
          </button>
          {availableCrops.map((cropName) => {
            const isSelected = selectedCropTab === cropName;
            const count = allRecords.filter((r) => r.crop === cropName).length;
            const cropExpenses = allRecords
              .filter((r) => r.crop === cropName && r.type === 'Expense')
              .reduce((sum, r) => sum + getAmount(r), 0);
            const cropSales = allRecords
              .filter((r) => r.crop === cropName && r.type === 'Sale')
              .reduce((sum, r) => sum + getAmount(r), 0);
            const net = cropSales - cropExpenses;
            return (
              <button
                key={cropName}
                type="button"
                onClick={() => setSelectedCropTab(cropName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/60 shadow-sm'
                    : 'bg-[var(--sk-card)] text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card2)] border border-[var(--sk-border)]'
                }`}
              >
                <span>🌾 {cropLabel(lang, cropName)}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--sk-card2)] border border-[var(--sk-border)] font-mono text-[var(--sk-muted)]">
                  {count}
                </span>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-mono font-semibold ${
                      net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                    }`}
                  >
                    ({net >= 0 ? '+' : ''}₹{(net / 1000).toFixed(1)}k)
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CONTROLS */}
      <div className="space-y-2">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sk-muted)] pointer-events-none"
          />
          <input
            type="text"
            value={cropSearch}
            onChange={(e) => setCropSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-10 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] pl-9 pr-3 text-xs sm:text-sm text-[var(--sk-text)] outline-none transition focus:border-emerald-500 placeholder:text-[var(--sk-faint)]"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | FarmRecord['type'])}
            className="h-10 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] px-2.5 text-xs text-[var(--sk-text)] outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">{allTypes}</option>
            <option value="Expense">{farmT.expense}</option>
            <option value="Yield">{farmT.yield}</option>
            <option value="Sale">{farmT.sale}</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'month' | 'year')}
            className="h-10 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] px-2.5 text-xs text-[var(--sk-text)] outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">{allDates}</option>
            <option value="today">{today}</option>
            <option value="month">{thisMonth}</option>
            <option value="year">{thisYear}</option>
          </select>

          <button
            type="button"
            onClick={exportCSV}
            className="h-10 px-3 rounded-xl border border-[var(--sk-border)] text-emerald-700 dark:text-emerald-300 bg-[var(--sk-card)] hover:bg-[var(--sk-card2)] active:scale-95 transition flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm"
            title={lang === 'hi' ? 'Excel (.xlsx) व CSV में डाउनलोड करें' : 'Export Excel & CSV'}
          >
            <FileSpreadsheet size={14} className="text-emerald-500" />
            <span>Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenPrintModal}
            className="h-10 px-3 rounded-xl border border-[var(--sk-border)] text-emerald-700 dark:text-emerald-300 bg-[var(--sk-card)] hover:bg-[var(--sk-card2)] active:scale-95 transition flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm"
            title={lang === 'hi' ? 'PDF प्रिंट / डाउनलोड करें' : 'Print PDF Statement'}
          >
            <Printer size={14} className="text-emerald-500" />
            <span>PDF प्रिंट</span>
          </button>
        </div>
      </div>
    </div>
  );
}
