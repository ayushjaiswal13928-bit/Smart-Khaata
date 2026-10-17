'use client';

import React, { useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Plus,
  Sprout,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Wheat,
  Sparkles,
  Droplets,
  Fuel,
  Users,
  Zap,
  Truck,
  HelpCircle,
  Store,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import type { FarmRecord, Lang, Khet, KhetCrop, Partner } from '../../lib/types';
import { cropLabel, unitLabel } from '../../lib/farmI18n';
import { getRecordAmount, normalizeToQuintals } from '../../lib/farmAccounting';
import { FarmForm, POPULAR_CROPS } from './FarmForm';
import { PrintReportModal } from './PrintReportModal';
import { exportToExcel } from '../../lib/excelExport';
import {
  getLandSettings,
  formatDualArea,
  calculatePerLandMetrics,
} from '../../lib/landMeasurement';
import { LandSettingsModal } from './LandSettingsModal';

interface KhetDetailProps {
  lang: Lang;
  khet: Khet;
  records: FarmRecord[];
  setRecords: React.Dispatch<React.SetStateAction<FarmRecord[]>>;
  onBack: () => void;
  onDeleteKhet: () => void;
  onUpdateKhet?: (updatedKhet: Khet) => void;
  initialCropFilter?: string;
  khetCrops?: KhetCrop[];
  partners?: Partner[];
}

const AREA_UNITS = ['बीघा', 'एकड़', 'हेक्टेयर'];

export function KhetDetail({
  lang,
  khet,
  records,
  setRecords,
  onBack,
  onDeleteKhet,
  onUpdateKhet,
  initialCropFilter,
  khetCrops = [],
  partners = [],
}: KhetDetailProps) {
  const isHi = lang === 'hi';
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FarmRecord | null>(null);
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>(initialCropFilter || 'all');
  const [showLandModal, setShowLandModal] = useState(false);
  const [landSettings, setLandSettings] = useState(() => getLandSettings());
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [showEditKhet, setShowEditKhet] = useState(false);
  const [editKhetData, setEditKhetData] = useState(() => {
    const isKnown = (POPULAR_CROPS as readonly string[]).includes(khet.crop as any);
    return {
      name: khet.name,
      crop: isKnown ? khet.crop : 'Other',
      customCrop: isKnown ? '' : khet.crop,
      area: String(khet.area),
      areaUnit: khet.areaUnit,
      sowingDate: khet.sowingDate || '',
    };
  });
  const [editKhetError, setEditKhetError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const allFieldRecords = useMemo(() => {
    return records.filter(
      (record) =>
        record.khetId === khet.id ||
        (record.field || '').trim().toLowerCase() === khet.name.trim().toLowerCase()
    );
  }, [records, khet.id, khet.name]);

  const fieldCrops = useMemo(() => {
    const crops = new Set<string>();
    if (khet.crop) crops.add(khet.crop);
    if (khet.crops) khet.crops.forEach((c) => crops.add(c.cropName));
    khetCrops.filter((c) => c.khetId === khet.id).forEach((c) => crops.add(c.cropName));
    allFieldRecords.forEach((r) => {
      if (r.crop) crops.add(r.crop);
    });
    return Array.from(crops);
  }, [allFieldRecords, khet, khetCrops]);

  const khetRecords = useMemo(() => {
    if (selectedCropFilter === 'all') return allFieldRecords;
    return allFieldRecords.filter((r) => r.crop === selectedCropFilter);
  }, [allFieldRecords, selectedCropFilter]);

  const financials = useMemo(() => {
    let totalExpense = 0;
    let totalSales = 0;
    let paymentReceived = 0;
    let pendingPayment = 0;
    let totalYieldKg = 0;
    let totalYieldQuintal = 0;

    khetRecords.forEach((record) => {
      const qty = Number(record.quantity || 0);
      const amt = getRecordAmount(record);

      if (record.type === 'Expense') {
        totalExpense += amt;
      } else if (record.type === 'Sale') {
        totalSales += amt;
        const paid = record.paidAmount !== undefined && record.paidAmount !== null ? Number(record.paidAmount) : amt;
        paymentReceived += paid;
        const pending = record.remainingAmount !== undefined && record.remainingAmount !== null
          ? Number(record.remainingAmount)
          : Math.max(0, amt - paid);
        pendingPayment += pending;
      } else if (record.type === 'Yield') {
        const qtl = normalizeToQuintals(qty, record.unit);
        totalYieldQuintal += qtl;
        totalYieldKg += qtl * 100;
      }
    });

    const realizedNetProfit = paymentReceived - totalExpense;
    return {
      totalExpense,
      totalSales,
      paymentReceived,
      pendingPayment,
      realizedNetProfit,
      totalYieldKg,
      totalYieldQuintal: Math.round(totalYieldQuintal * 100) / 100,
    };
  }, [khetRecords]);

  const dualLand = useMemo(() => {
    return formatDualArea(khet.area, khet.areaUnit, landSettings, lang);
  }, [khet.area, khet.areaUnit, landSettings, lang]);

  const handleDelete = (id: string) => {
    setRecords((current) => current.filter((record) => record.id !== id));
  };

  const handleEdit = (record: FarmRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleSave = (record: FarmRecord) => {
    const fixedRecord: FarmRecord = {
      ...record,
      khetId: khet.id,
      field: khet.name,
      crop: record.crop || (selectedCropFilter !== 'all' ? selectedCropFilter : (khet.crop || 'Wheat')),
      area: record.area !== undefined ? record.area : khet.area,
      areaUnit: record.areaUnit || khet.areaUnit,
    };
    setRecords((current) => {
      const exists = current.some((item) => item.id === fixedRecord.id);
      if (exists) {
        return current.map((item) => (item.id === fixedRecord.id ? fixedRecord : item));
      }
      return [fixedRecord, ...current];
    });
    setEditingRecord(null);
    setShowForm(false);
  };

  return (
    <div className="w-full max-w-[1050px] mx-auto px-3 sm:px-5 lg:px-6 pb-16 space-y-4">
      {/* TOP NAV & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--sk-text)] hover:text-emerald-400 transition cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span className="text-base sm:text-lg">{khet.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25">
            {cropLabel(lang, khet.crop || 'Wheat')}
          </span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowLandModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] px-2.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition cursor-pointer"
          >
            <Compass size={14} className="text-amber-400" />
            <span className="hidden sm:inline">1 एकड़ = {landSettings.bighaPerAcre} बीघा</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] px-2.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
          >
            <Printer size={14} className="text-emerald-400" />
            <span>PDF</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 px-3.5 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition cursor-pointer"
          >
            <Plus size={16} />
            {isHi ? '+ खर्च/उपज/बिक्री' : '+ Add Entry'}
          </button>
        </div>
      </div>

      {/* FIELD SUMMARY BANNER */}
      <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
              <Sprout size={24} />
            </div>
            <div>
              <div className="text-base font-bold text-[var(--sk-text)] flex items-center gap-2">
                <span>{khet.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
                  {cropLabel(lang, khet.crop || 'Wheat')}
                </span>
              </div>
              <div className="text-xs text-[var(--sk-muted)] mt-1 flex flex-wrap items-center gap-2">
                <span>
                  क्षेत्रफल: <b className="text-emerald-400 font-mono font-bold">{dualLand.label}</b>
                </span>
                {khet.sowingDate && (
                  <span>बुवाई: <b className="text-[var(--sk-text)]">{khet.sowingDate}</b></span>
                )}
              </div>
            </div>
          </div>

          {fieldCrops.length > 1 && (
            <div className="flex items-center gap-1.5 bg-[var(--sk-card2)] p-1 rounded-xl border border-[var(--sk-border)] text-xs">
              <button
                type="button"
                onClick={() => setSelectedCropFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  selectedCropFilter === 'all'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
                }`}
              >
                {isHi ? 'सभी फसलें' : 'All'}
              </button>
              {fieldCrops.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCropFilter(c)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    selectedCropFilter === c
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
                  }`}
                >
                  {cropLabel(lang, c)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CORE FINANCIALS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-3 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] shadow-sm">
          <span className="text-[var(--sk-muted)] block">{isHi ? 'कुल लागत (खर्च)' : 'Cost'}</span>
          <span className="text-base font-bold font-mono text-red-500 mt-0.5 block">
            ₹{financials.totalExpense.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] shadow-sm">
          <span className="text-[var(--sk-muted)] block">{isHi ? 'कुल बिक्री' : 'Sales'}</span>
          <span className="text-base font-bold font-mono text-[var(--sk-text)] mt-0.5 block">
            ₹{financials.totalSales.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] shadow-sm">
          <span className="text-[var(--sk-muted)] block">{isHi ? 'प्राप्त नकद' : 'Received'}</span>
          <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            ₹{financials.paymentReceived.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] shadow-sm">
          <span className="text-[var(--sk-muted)] block font-semibold">{isHi ? 'शुद्ध नकद मुनाफा' : 'Net Profit'}</span>
          <span
            className={`text-base font-bold font-mono mt-0.5 block ${
              financials.realizedNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            }`}
          >
            {financials.realizedNetProfit >= 0 ? '+' : ''}₹{financials.realizedNetProfit.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* TRANSACTIONS LIST */}
      <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--sk-border)] px-4 py-3 bg-[var(--sk-card2)]">
          <div className="font-bold text-sm text-[var(--sk-text)] flex items-center gap-2">
            <span>{isHi ? 'खेत का सम्पूर्ण लेनदेन (Transactions)' : 'Field Transactions'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--sk-card)] border border-[var(--sk-border)] text-[var(--sk-muted)] font-mono">
              {khetRecords.length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-[var(--sk-border)]">
          {khetRecords.map((record) => {
            const qty = Number(record.quantity || 0);
            const price = Number(record.price || 0);
            const calc = qty * price;
            const amt = calc > 0 ? calc : Number(record.amount || 0);
            const isSale = record.type === 'Sale';
            return (
              <div
                key={record.id}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.02] transition"
              >
                <div>
                  <div className="font-semibold text-xs text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                      {record.type}
                    </span>
                    <span>{cropLabel(lang, record.crop)}</span>
                    <span className="text-slate-400 text-[11px] font-mono">{record.date}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {record.expenseCategory || record.note || `${qty} ${record.unit || ''}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right font-mono font-bold text-sm">
                    {record.type === 'Yield' ? `${qty} Qtl` : `${isSale ? '+' : '-'} ₹${amt.toLocaleString('en-IN')}`}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(record)}
                      className="p-1 rounded text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(record.id)}
                      className="p-1 rounded text-red-400 hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODALS */}
      {showForm && (
        <FarmForm
          lang={lang}
          editingRecord={editingRecord}
          fixedKhet={khet}
          khets={[khet]}
          khetCrops={khetCrops}
          partners={partners}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
        />
      )}

      <LandSettingsModal
        isOpen={showLandModal}
        onClose={() => setShowLandModal(false)}
        lang={lang}
        onSettingsSaved={(newSettings) => setLandSettings(newSettings)}
      />

      <PrintReportModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        lang={lang}
        records={allFieldRecords}
        khets={[khet]}
        khetCrops={khetCrops.filter((c) => c.khetId === khet.id)}
        selectedKhetId={khet.id}
      />
    </div>
  );
}
