'use client';

import React, { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Pencil,
  Trash2,
  Wheat,
  Sparkles,
  Droplets,
  Fuel,
  Users,
  Zap,
  Truck,
  HelpCircle,
  Table as TableIcon,
  BookOpen,
  LayoutGrid,
  Layers,
  Share2,
} from 'lucide-react';
import type { FarmRecord, Lang, Khet, KhetCrop, Partner } from '../../lib/types';
import { fmt, formatDate } from '../../lib/utils';
import {
  FARM_STRINGS,
  cropLabel,
  typeLabel,
  unitLabel,
} from '../../lib/farmI18n';
import { FormCard } from '../common/UI';
import { FarmFilters } from './FarmFilters';
import { shareViaWhatsApp, generateRecordWhatsAppMessage } from '../../lib/whatsappSharing';
import { getRecordAmount } from '../../lib/farmAccounting';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

interface FarmTableProps {
  filteredRecords: FarmRecord[];
  allRecords?: FarmRecord[];
  lang: Lang;
  cropSearch: string;
  setCropSearch: Dispatch<SetStateAction<string>>;
  typeFilter: 'all' | FarmRecord['type'];
  setTypeFilter: Dispatch<SetStateAction<'all' | FarmRecord['type']>>;
  dateFilter: 'all' | 'today' | 'month' | 'year';
  setDateFilter: Dispatch<SetStateAction<'all' | 'today' | 'month' | 'year'>>;
  onEdit: (record: FarmRecord) => void;
  onDelete: (id: string) => void;
  khets?: Khet[];
  khetCrops?: KhetCrop[];
  partners?: Partner[];
  onOpenPrintModal?: () => void;
}

const EXPENSE_ICONS: Record<string, any> = {
  बीज: Wheat,
  खाद: Sparkles,
  कीटनाशक: Droplets,
  'डीजल/ट्रैक्टर': Fuel,
  मजदूरी: Users,
  सिंचाई: Droplets,
  बिजली: Zap,
  ढुलाई: Truck,
  अन्य: HelpCircle,
};

export function FarmTable({
  filteredRecords,
  allRecords = filteredRecords,
  lang,
  cropSearch,
  setCropSearch,
  typeFilter,
  setTypeFilter,
  dateFilter,
  setDateFilter,
  onEdit,
  onDelete,
  khets = [],
  khetCrops = [],
  partners = [],
  onOpenPrintModal,
}: FarmTableProps) {
  const farmT = FARM_STRINGS[lang];
  const isHi = lang === 'hi';

  const [selectedCropTab, setSelectedCropTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'table' | 'cards'>('grouped');
  const [recordToDelete, setRecordToDelete] = useState<FarmRecord | null>(null);

  const availableCrops = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.crop) set.add(r.crop);
    });
    return Array.from(set);
  }, [allRecords]);

  const cropFilteredRecords = useMemo(() => {
    if (selectedCropTab === 'all') return filteredRecords;
    return filteredRecords.filter((r) => r.crop === selectedCropTab);
  }, [filteredRecords, selectedCropTab]);

  const getAmount = (record: FarmRecord) => {
    if (record.type === 'Yield') {
      const quantity = Number(record.quantity) || 0;
      return quantity > 0 ? `${quantity} ${unitLabel(lang, record.unit)}` : '-';
    }
    const amount = getRecordAmount(record);
    return amount > 0 ? fmt(amount) : '-';
  };

  const getPartnerBadge = (record: FarmRecord) => {
    let pName = '';
    if (record.partnerId) {
      const found = partners.find((p) => p.id === record.partnerId);
      if (found) pName = found.name;
    } else if (record.field) {
      const found = partners.find(
        (p) =>
          (record.khetId && p.khetId === record.khetId) ||
          (p.khetName && p.khetName.trim().toLowerCase() === record.field?.trim().toLowerCase())
      );
      if (found) pName = found.name;
    }
    if (!pName) return null;
    let label = `${pName}`;
    if (record.type === 'Expense') {
      label += record.paidBy === 'partner' ? (isHi ? ' (साझीदार ने दिया)' : ' (Partner Paid)') : record.paidBy === 'shared' ? (isHi ? ' (साझा)' : ' (Shared)') : '';
    } else if (record.type === 'Sale') {
      label += record.saleReceivedBy === 'partner' ? (isHi ? ' (साझीदार को मिला)' : ' (Partner Recv)') : record.saleReceivedBy === 'shared' ? (isHi ? ' (साझा)' : ' (Shared)') : '';
    }
    return (
      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-semibold">
        👥 {label}
      </span>
    );
  };

  const getDetails = (record: FarmRecord) => {
    if (record.type === 'Expense') {
      const category = record.expenseCategory || 'खर्च';
      const quantity = Number(record.quantity) || 0;
      const price = Number(record.price) || 0;
      const workerPart = record.worker ? ` | ${record.worker}` : '';
      const notePart = record.note ? ` | ${record.note}` : '';
      if (quantity > 0 && price > 0) {
        return `${category} (${quantity} ${unitLabel(lang, record.unit)} @ ₹${price.toLocaleString('en-IN')})${workerPart}${notePart}`;
      }
      return `${category}${workerPart}${notePart}`;
    }
    if (record.type === 'Yield') {
      const quantity = Number(record.quantity) || 0;
      const notePart = record.note ? ` | ${record.note}` : '';
      if (quantity <= 0) return '-';
      return `${quantity} ${unitLabel(lang, record.unit)}${notePart}`;
    }
    if (record.type === 'Sale') {
      const quantity = Number(record.quantity) || 0;
      const price = Number(record.price) || 0;
      const buyerPart = record.buyerName ? ` | ${record.buyerName}` : '';
      const notePart = record.note ? ` | ${record.note}` : '';
      if (quantity > 0 && price > 0) {
        return `${quantity} ${unitLabel(lang, record.unit)} @ ₹${price.toLocaleString('en-IN')}/Qtl${buyerPart}${notePart}`;
      }
      return `${buyerPart ? buyerPart.slice(3) : ''}${notePart}`.trim() || '-';
    }
    return record.note || '-';
  };

  const getTypeClass = (type: FarmRecord['type']) => {
    if (type === 'Expense') return 'bg-red-500/15 text-red-300 border-red-500/25';
    if (type === 'Yield') return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25';
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25';
  };

  const getAmountClass = (type: FarmRecord['type']) => {
    if (type === 'Expense') return 'text-red-400';
    if (type === 'Sale') return 'text-emerald-400';
    return 'text-cyan-400';
  };

  const recordsByCrop = useMemo(() => {
    const map: Record<string, FarmRecord[]> = {};
    const targetRecords = selectedCropTab === 'all' ? filteredRecords : cropFilteredRecords;
    targetRecords.forEach((r) => {
      const crop = r.crop || 'Other';
      if (!map[crop]) map[crop] = [];
      map[crop].push(r);
    });
    return map;
  }, [filteredRecords, cropFilteredRecords, selectedCropTab]);

  return (
    <FormCard>
      {/* 1. Crop tabs & filters */}
      <FarmFilters
        lang={lang}
        farmT={farmT}
        cropSearch={cropSearch}
        setCropSearch={setCropSearch}
        selectedCropTab={selectedCropTab}
        setSelectedCropTab={setSelectedCropTab}
        availableCrops={availableCrops}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        filteredRecords={cropFilteredRecords}
        allRecords={allRecords}
        khets={khets}
        khetCrops={khetCrops}
        onOpenPrintModal={onOpenPrintModal}
      />

      {/* 2. VIEW MODE TOGGLE BAR */}
      <div className="mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--sk-text)] flex items-center gap-1.5">
            <BookOpen size={14} className="text-emerald-500" />
            <span>{isHi ? 'प्रदर्शन शैली (View Mode):' : 'Display Style:'}</span>
          </span>
        </div>
        <div className="flex items-center gap-1 bg-[var(--sk-card)] p-1 rounded-lg border border-[var(--sk-border)] text-xs">
          <button
            type="button"
            onClick={() => setViewMode('grouped')}
            className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'grouped'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
            }`}
          >
            <Layers size={13} />
            <span>{isHi ? 'फसलवार फोल्डर' : 'Grouped by Crop'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
            }`}
          >
            <LayoutGrid size={13} />
            <span>{isHi ? 'कार्ड दृश्य' : 'Passbook Cards'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
            }`}
          >
            <TableIcon size={13} />
            <span>{isHi ? 'तालिका' : 'Full Table'}</span>
          </button>
        </div>
      </div>

      {/* 3. GROUPED BY CROP VIEW */}
      {viewMode === 'grouped' && (
        <div className="space-y-4">
          {Object.entries(recordsByCrop).map(([cropName, recs]) => {
            const exp = recs.filter((r) => r.type === 'Expense').reduce((sum, r) => sum + getRecordAmount(r), 0);
            const sale = recs.filter((r) => r.type === 'Sale').reduce((sum, r) => sum + getRecordAmount(r), 0);
            const net = sale - exp;
            return (
              <div
                key={cropName}
                className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] overflow-hidden shadow-sm"
              >
                {/* Crop Folder Header */}
                <div className="p-3.5 bg-[var(--sk-card2)] border-b border-[var(--sk-border)] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold">
                      🌾
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--sk-text)] flex items-center gap-2">
                        <span>{cropLabel(lang, cropName)}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-[var(--sk-card)] border border-[var(--sk-border)] text-[var(--sk-muted)] font-mono font-normal">
                          {recs.length} {isHi ? 'प्रविष्टियां' : 'entries'}
                        </span>
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-[10px] text-red-500 block">{isHi ? 'कुल लागत' : 'Cost'}</span>
                      <span className="font-bold text-red-500">₹{exp.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-blue-500 block">{isHi ? 'कुल बिक्री' : 'Sales'}</span>
                      <span className="font-bold text-blue-500">₹{sale.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-right pl-2 border-l border-[var(--sk-border)]">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-300 block font-bold">{isHi ? 'शुद्ध लाभ' : 'Profit'}</span>
                      <span className={`font-bold ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {net >= 0 ? '+' : ''}₹{net.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-records list */}
                <div className="divide-y divide-[var(--sk-border)]">
                  {recs.map((record) => {
                    const isSale = record.type === 'Sale';
                    const isPending = isSale && Number(record.remainingAmount || 0) > 0;
                    return (
                      <div
                        key={record.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-[var(--sk-card2)]/60 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeClass(
                                record.type
                              )}`}
                            >
                              {record.type === 'Expense'
                                ? record.expenseCategory || typeLabel(lang, record.type)
                                : typeLabel(lang, record.type)}
                            </span>
                            <span className="text-[var(--sk-muted)] font-mono text-[11px]">
                              📅 {formatDate(record.date)}
                            </span>
                            {record.field && (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-300 font-mono">
                                🌱 {record.field}
                              </span>
                            )}
                            {getPartnerBadge(record)}
                          </div>
                          <div className="text-[11px] text-[var(--sk-muted)] mt-1 truncate">
                            {getDetails(record)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className={`font-bold font-mono text-sm ${getAmountClass(record.type)}`}>
                              {record.type === 'Sale' ? '+' : record.type === 'Expense' ? '-' : ''}
                              {getAmount(record)}
                            </div>
                            {isSale && isPending && (
                              <div className="text-[10px] text-amber-500 font-mono">
                                (बाकी: ₹{record.remainingAmount?.toLocaleString('en-IN')})
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const msg = generateRecordWhatsAppMessage({
                                  crop: record.crop,
                                  field: record.field,
                                  type: record.type,
                                  amount: Number(record.amount) || 0,
                                  quantity: record.quantity,
                                  unit: record.unit,
                                  price: record.price,
                                  date: record.date,
                                  note: record.note,
                                  buyerName: record.buyerName,
                                  worker: record.worker,
                                  remainingAmount: record.remainingAmount,
                                });
                                shareViaWhatsApp(msg);
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 transition cursor-pointer"
                              title="WhatsApp शेयर"
                            >
                              <Share2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEdit(record)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 transition cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRecordToDelete(record)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-500/20 active:scale-95 transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. PASSBOOK CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cropFilteredRecords.map((record) => {
            const isSale = record.type === 'Sale';
            const isPending = isSale && Number(record.remainingAmount || 0) > 0;
            return (
              <div
                key={record.id}
                className="p-3.5 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] hover:border-emerald-500/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                        🌾 {cropLabel(lang, record.crop)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeClass(record.type)}`}>
                        {record.type === 'Expense'
                          ? record.expenseCategory || typeLabel(lang, record.type)
                          : typeLabel(lang, record.type)}
                      </span>
                    </div>
                    <div className={`font-mono font-bold text-sm ${getAmountClass(record.type)}`}>
                      {record.type === 'Sale' ? '+' : record.type === 'Expense' ? '-' : ''}
                      {getAmount(record)}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-[var(--sk-muted)]">
                    {getDetails(record)}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--sk-muted)] font-mono flex-wrap gap-1">
                    <span>📅 {formatDate(record.date)}</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {record.field && <span>🌱 {record.field}</span>}
                      {getPartnerBadge(record)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[var(--sk-border)] flex items-center justify-between text-xs">
                  <div>
                    {isSale && isPending && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 font-mono font-semibold">
                        बाकी: ₹{record.remainingAmount?.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(record)}
                      className="px-2 py-1 rounded-lg text-blue-500 hover:bg-blue-500/10 active:scale-95 transition text-[11px] font-semibold cursor-pointer"
                    >
                      {isHi ? 'बदलें' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecordToDelete(record)}
                      className="px-2 py-1 rounded-lg text-red-500 hover:bg-red-500/10 active:scale-95 transition text-[11px] font-semibold cursor-pointer"
                    >
                      {isHi ? 'हटाएं' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="w-full overflow-x-auto">
          <table className="min-w-[700px] w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--sk-border)] bg-[var(--sk-card2)]">
                <th className="px-3 py-3 text-left font-semibold text-[var(--sk-faint)]">{farmT.date}</th>
                <th className="px-3 py-3 text-left font-semibold text-[var(--sk-faint)]">{farmT.crop}</th>
                <th className="px-3 py-3 text-left font-semibold text-[var(--sk-faint)]">{farmT.type}</th>
                <th className="px-3 py-3 text-left font-semibold text-[var(--sk-faint)]">विवरण / मात्रा</th>
                <th className="px-3 py-3 text-right font-semibold text-[var(--sk-faint)]">{farmT.amount}</th>
                <th className="px-3 py-3 text-center font-semibold text-[var(--sk-faint)]">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sk-border)]">
              {cropFilteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-[var(--sk-card2)]/60">
                  <td className="px-3 py-2.5 font-mono text-[var(--sk-text)]">{formatDate(record.date)}</td>
                  <td className="px-3 py-2.5 font-bold text-[var(--sk-text)]">{cropLabel(lang, record.crop)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeClass(record.type)}`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--sk-text2)]">
                    <div>{getDetails(record)}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[var(--sk-muted)] flex-wrap">
                      {record.field && <span>🌱 {record.field}</span>}
                      {getPartnerBadge(record)}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-bold ${getAmountClass(record.type)}`}>
                    {getAmount(record)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onEdit(record)}
                      className="p-1 rounded text-blue-500 hover:bg-blue-500/10 cursor-pointer mr-1"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecordToDelete(record)}
                      className="p-1 rounded text-red-500 hover:bg-red-500/10 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={() => {
          if (recordToDelete) {
            onDelete(recordToDelete.id);
            setRecordToDelete(null);
          }
        }}
        title={isHi ? 'प्रविष्टि हटाएं?' : 'Delete Record?'}
        message={
          isHi
            ? 'क्या आप वाकई इस प्रविष्टि को बहीखाते से हटाना चाहते हैं? यह डेटा हमेशा के लिए हटा दिया जाएगा।'
            : 'Are you sure you want to delete this record? This action cannot be undone.'
        }
        confirmText={isHi ? 'हाँ, हटाएं' : 'Delete'}
        cancelText={isHi ? 'रद्द करें' : 'Cancel'}
        itemDetails={
          recordToDelete ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--sk-text)] flex items-center gap-1.5">
                  <span>🌾 {cropLabel(lang, recordToDelete.crop)}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {recordToDelete.type === 'Expense'
                      ? recordToDelete.expenseCategory || 'खर्च'
                      : recordToDelete.type === 'Sale'
                      ? 'बिक्री'
                      : 'पैदावार'}
                  </span>
                </span>
                <span className="font-mono font-bold text-red-500 text-sm">
                  {recordToDelete.type === 'Yield'
                    ? `${recordToDelete.quantity} ${recordToDelete.unit || 'Qtl'}`
                    : `₹${getRecordAmount(recordToDelete).toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="text-[11px] text-[var(--sk-muted)] flex items-center gap-2 font-mono">
                <span>📅 {formatDate(recordToDelete.date)}</span>
                {recordToDelete.field && <span>• 🌱 {recordToDelete.field}</span>}
              </div>
              {recordToDelete.note && (
                <div className="text-[11px] text-[var(--sk-muted)] italic truncate">
                  "{recordToDelete.note}"
                </div>
              )}
            </div>
          ) : null
        }
      />
    </FormCard>
  );
}
