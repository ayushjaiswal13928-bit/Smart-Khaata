'use client';

import React, { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ChevronRight,
  Plus,
  Sprout,
  Wheat,
  X,
  ListFilter,
  BarChart3,
  Layers,
  AlertCircle,
  Check,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  TrendingUp,
  Printer,
  FileSpreadsheet,
  Users,
  Boxes,
} from 'lucide-react';
import type { FarmRecord, Lang, Khet, KhetCrop, Partner, PartnerCashEntry } from '../../lib/types';
import { FARM_STRINGS, cropLabel } from '../../lib/farmI18n';
import { KhetDetail } from './KhetDetail';
import { FarmTable } from './FarmTable';
import { FarmSummary } from './FarmSummary';
import { FarmForm, POPULAR_CROPS } from './FarmForm';
import { KhetCardView } from './KhetCardView';
import { AddCropModal } from './AddCropModal';
import { PrintReportModal } from './PrintReportModal';
import { PartnershipSection } from './PartnershipSection';
import { StockSection } from '../stock/StockSection';
import { exportToExcel } from '../../lib/excelExport';
import {
  loadAndMigrateKhets,
  loadAndMigrateRecords,
  persistKhetsAndCrops,
  downloadPhysicalBackup,
} from '../../lib/storageMigration';
import {
  getLandSettings,
  formatDualArea,
  LandUnitSettings,
  LAND_SETTINGS_CHANGED_EVENT,
} from '../../lib/landMeasurement';
import { LandSettingsModal } from './LandSettingsModal';
import { getRecordAmount, normalizeToQuintals } from '../../lib/farmAccounting';

interface FarmSectionProps {
  records: FarmRecord[];
  setRecords: React.Dispatch<React.SetStateAction<FarmRecord[]>>;
  lang: Lang;
  autoOpenAdd?: boolean;
  initialAddType?: 'Expense' | 'Sale' | 'Yield';
  onClearAutoOpenAdd?: () => void;
  partners?: Partner[];
  setPartners?: React.Dispatch<React.SetStateAction<Partner[]>>;
  partnerCash?: PartnerCashEntry[];
  setPartnerCash?: React.Dispatch<React.SetStateAction<PartnerCashEntry[]>>;
  initialTab?: 'khets' | 'records' | 'summary' | 'partners' | 'stock';
}

const AREA_UNITS = ['बीघा', 'एकड़', 'हेक्टेयर'];

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export function FarmSection({
  records,
  setRecords,
  lang,
  autoOpenAdd = false,
  initialAddType = 'Expense',
  onClearAutoOpenAdd,
  partners: externalPartners,
  setPartners: setExternalPartners,
  partnerCash: externalPartnerCash,
  setPartnerCash: setExternalPartnerCash,
  initialTab,
}: FarmSectionProps) {
  const farmT = FARM_STRINGS[lang];
  const isHi = lang === 'hi';
  const [activeTab, setActiveTab] = useState<'records' | 'khets' | 'summary' | 'partners' | 'stock'>(
    initialTab || 'partners' // Default to partners since user is asking about Batai/Partner ledger!
  );

  // Default demo partners with realistic village Adhiya and Tihai data
  const [internalPartners, setInternalPartners] = useState<Partner[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sk-partners');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return [
      {
        id: 'p-1',
        name: 'दिनेश गुर्जर',
        phone: '9826112233',
        relationship: 'batai_50_50',
        sharePercent: 50,
        khetName: 'बड़ा चक (उत्तर खेत)',
        crop: 'Wheat',
        season: 'Rabi 2026',
        startDate: '2025-11-01',
        notes: '50-50 अधिया बटाई, बीज व खाद आधा-आधा, हार्वेस्टर कटाई साझी',
      },
      {
        id: 'p-2',
        name: 'मुकेश धाकड़',
        phone: '9425098765',
        relationship: 'batai_third',
        sharePercent: 33.33,
        khetName: 'नहर वाला चक',
        crop: 'Garlic',
        season: 'Rabi 2026',
        startDate: '2025-10-15',
        notes: 'तिहाई बटाईदार (1/3 हिस्सा साझीदार, 2/3 मालिक)',
      },
    ];
  });

  const [internalPartnerCash, setInternalPartnerCash] = useState<PartnerCashEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sk-partner-cash');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return [
      {
        id: 'pc-1',
        partnerId: 'p-1',
        date: '2025-12-05',
        type: 'gave_to_partner',
        purpose: 'advance',
        amount: 8000,
        mode: 'cash',
        note: 'खाद व यूरिया के लिए नकद पेशगी दी',
      },
      {
        id: 'pc-2',
        partnerId: 'p-1',
        date: '2026-01-10',
        type: 'gave_to_partner',
        purpose: 'advance',
        amount: 5000,
        mode: 'online',
        note: 'घरेलू खर्चे हेतु ऑनलाइन ट्रांसफर',
      },
    ];
  });

  const activePartners = externalPartners || internalPartners;
  const setActivePartners = setExternalPartners || setInternalPartners;
  const activePartnerCash = externalPartnerCash || internalPartnerCash;
  const setActivePartnerCash = setExternalPartnerCash || setInternalPartnerCash;

  useEffect(() => {
    if (!externalPartners && typeof window !== 'undefined') {
      localStorage.setItem('sk-partners', JSON.stringify(internalPartners));
    }
  }, [internalPartners, externalPartners]);

  useEffect(() => {
    if (!externalPartnerCash && typeof window !== 'undefined') {
      localStorage.setItem('sk-partner-cash', JSON.stringify(internalPartnerCash));
    }
  }, [internalPartnerCash, externalPartnerCash]);

  const [khets, setKhets] = useState<Khet[]>([]);
  const [khetCrops, setKhetCrops] = useState<KhetCrop[]>([]);
  const [selectedKhetId, setSelectedKhetId] = useState<string | null>(null);
  const [filterCropNameForDetail, setFilterCropNameForDetail] = useState<string | undefined>(undefined);
  const [showAddKhet, setShowAddKhet] = useState(false);
  const [addKhetError, setAddKhetError] = useState<string | null>(null);

  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [selectedKhetForAddCrop, setSelectedKhetForAddCrop] = useState<Khet | null>(null);

  const [landSettings, setLandSettings] = useState<LandUnitSettings>(() => getLandSettings());
  const [showLandModal, setShowLandModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handleExportExcel = () => {
    exportToExcel({
      lang,
      records,
      khets,
      khetCrops,
    });
  };

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [formRecordType, setFormRecordType] = useState<'Expense' | 'Sale' | 'Yield'>('Expense');
  const [editingRecord, setEditingRecord] = useState<FarmRecord | null>(null);
  const [formFixedKhet, setFormFixedKhet] = useState<Khet | null>(null);
  const [formFixedCrop, setFormFixedCrop] = useState<KhetCrop | null>(null);
  const [formFixedPartner, setFormFixedPartner] = useState<Partner | null>(null);

  const handleAddRecordForPartner = useCallback(
    (partner: Partner, type: 'Expense' | 'Sale' | 'Yield') => {
      setEditingRecord(null);
      setFormRecordType(type);
      setFormFixedPartner(partner);
      if (partner.khetId) {
        const k = khets.find((item) => item.id === partner.khetId);
        if (k) setFormFixedKhet(k);
      } else if (partner.khetName) {
        const k = khets.find((item) => item.name.trim().toLowerCase() === partner.khetName?.trim().toLowerCase());
        if (k) setFormFixedKhet(k);
      }
      setShowRecordForm(true);
    },
    [khets]
  );

  const [cropSearch, setCropSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | FarmRecord['type']>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month' | 'year'>('all');
  const [selectedSummaryCrop, setSelectedSummaryCrop] = useState('Wheat');

  const [newKhet, setNewKhet] = useState({
    name: '',
    crop: 'Wheat',
    customCrop: '',
    area: '3',
    areaUnit: 'बीघा',
    sowingDate: getToday(),
  });

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail) setLandSettings(e.detail);
      else setLandSettings(getLandSettings());
    };
    window.addEventListener(LAND_SETTINGS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(LAND_SETTINGS_CHANGED_EVENT, handler);
  }, []);

  useEffect(() => {
    if (autoOpenAdd) {
      setEditingRecord(null);
      setFormFixedKhet(null);
      setFormFixedCrop(null);
      if (initialAddType) setFormRecordType(initialAddType);
      setShowRecordForm(true);
      if (onClearAutoOpenAdd) onClearAutoOpenAdd();
    }
  }, [autoOpenAdd, initialAddType, onClearAutoOpenAdd]);

  useEffect(() => {
    const { khets: loadedKhets, khetCrops: loadedCrops } = loadAndMigrateKhets();
    setKhets(loadedKhets);
    setKhetCrops(loadedCrops);
    setRecords((currRecords) => {
      if (currRecords && currRecords.length > 0) return currRecords;
      const updated = loadAndMigrateRecords(loadedKhets, loadedCrops);
      return updated.length > 0 ? updated : currRecords;
    });
  }, [setRecords]);

  const saveKhetsAndCropsToStorage = (updatedKhets: Khet[], updatedCrops: KhetCrop[]) => {
    setKhets(updatedKhets);
    setKhetCrops(updatedCrops);
    persistKhetsAndCrops(updatedKhets, updatedCrops);
  };

  const handleSaveCrop = (newCrop: KhetCrop) => {
    const updatedCrops = [newCrop, ...khetCrops];
    const updatedKhets = khets.map((k) =>
      k.id === newCrop.khetId ? { ...k, crops: [newCrop, ...(k.crops || [])] } : k
    );
    saveKhetsAndCropsToStorage(updatedKhets, updatedCrops);
  };

  const getExpenseAmount = useCallback((record: FarmRecord) => {
    if (record.type !== 'Expense') return 0;
    return getRecordAmount(record);
  }, []);

  const getSaleAmount = useCallback((record: FarmRecord) => {
    if (record.type !== 'Sale') return 0;
    return getRecordAmount(record);
  }, []);

  const handleAddKhetSubmit = (e: FormEvent) => {
    e.preventDefault();
    setAddKhetError(null);
    const name = newKhet.name.trim();
    if (!name) {
      setAddKhetError(isHi ? 'कृपया खेत का नाम दर्ज करें।' : 'Please enter field name.');
      return;
    }
    const isDuplicate = khets.some((k) => k.name.trim().toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
      setAddKhetError(
        isHi ? `"${name}" नाम से खेत पहले से मौजूद है।` : `Field "${name}" already exists.`
      );
      return;
    }
    const areaNum = parseFloat(newKhet.area);
    if (isNaN(areaNum) || areaNum <= 0) {
      setAddKhetError(isHi ? 'वैध क्षेत्रफल दर्ज करें (> 0)।' : 'Please enter a valid area.');
      return;
    }

    const finalCrop =
      newKhet.crop === 'Other' && newKhet.customCrop.trim() ? newKhet.customCrop.trim() : newKhet.crop;

    const khetId = `khet-${Date.now()}`;
    const initialCrop: KhetCrop = {
      id: `crop-${khetId}-1`,
      khetId,
      cropName: finalCrop,
      cropNameHi: cropLabel(lang, finalCrop),
      season: 'Rabi 2026',
      sowingDate: newKhet.sowingDate || getToday(),
      allocatedArea: areaNum,
      areaUnit: newKhet.areaUnit,
      status: 'growing',
      expectedYield: areaNum * 12,
    };

    const created: Khet = {
      id: khetId,
      name,
      crop: finalCrop,
      totalArea: areaNum,
      area: areaNum,
      areaUnit: newKhet.areaUnit,
      sowingDate: newKhet.sowingDate || getToday(),
      crops: [initialCrop],
    };

    saveKhetsAndCropsToStorage([created, ...khets], [initialCrop, ...khetCrops]);
    setNewKhet({
      name: '',
      crop: 'Wheat',
      customCrop: '',
      area: '3',
      areaUnit: 'बीघा',
      sowingDate: getToday(),
    });
    setShowAddKhet(false);
  };

  const deleteKhet = (khet: Khet) => {
    const updatedKhets = khets.filter((k) => k.id !== khet.id);
    const updatedCrops = khetCrops.filter((c) => c.khetId !== khet.id);
    saveKhetsAndCropsToStorage(updatedKhets, updatedCrops);
    setSelectedKhetId(null);
  };

  const handleUpdateKhet = (updatedKhet: Khet) => {
    const updated = khets.map((k) => (k.id === updatedKhet.id ? updatedKhet : k));
    saveKhetsAndCropsToStorage(updated, khetCrops);
  };

  // Comprehensive Totals
  const allTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let paymentReceived = 0;
    let pendingPayment = 0;
    let yieldKg = 0;
    let yieldQuintal = 0;

    records.forEach((r) => {
      if (r.type === 'Expense') expense += getExpenseAmount(r);
      if (r.type === 'Sale') {
        const gross = getSaleAmount(r);
        income += gross;
        const paid = r.paidAmount !== undefined ? Number(r.paidAmount) : gross;
        const pending = r.remainingAmount !== undefined ? Number(r.remainingAmount) : Math.max(0, gross - paid);
        paymentReceived += paid;
        pendingPayment += pending;
      }
      if (r.type === 'Yield') {
        const qty = Number(r.quantity || 0);
        if (r.unit === 'Quintal') {
          yieldKg += qty * 100;
          yieldQuintal += qty;
        } else if (r.unit === 'Ton') {
          yieldKg += qty * 1000;
          yieldQuintal += qty * 10;
        } else {
          yieldKg += qty;
          yieldQuintal += qty / 100;
        }
      }
    });

    const realizedProfit = paymentReceived - expense;
    const expectedProfit = income - expense;

    return {
      income,
      expense,
      paymentReceived,
      pendingPayment,
      realizedProfit,
      expectedProfit,
      yieldKg,
      yieldQuintal,
    };
  }, [records, getExpenseAmount, getSaleAmount]);

  const filteredRecords = useMemo(() => {
    const today = getToday();
    const thisMonth = today.slice(0, 7);
    const thisYear = today.slice(0, 4);

    return records.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (cropSearch.trim() && !r.crop.toLowerCase().includes(cropSearch.toLowerCase())) {
        return false;
      }
      if (dateFilter === 'today' && r.date !== today) return false;
      if (dateFilter === 'month' && !r.date.startsWith(thisMonth)) return false;
      if (dateFilter === 'year' && !r.date.startsWith(thisYear)) return false;
      return true;
    });
  }, [records, typeFilter, cropSearch, dateFilter]);

  const pieData = useMemo(() => {
    const cats: Record<string, number> = {};
    records.forEach((r) => {
      if (r.type === 'Expense') {
        const cat = r.expenseCategory || 'अन्य';
        cats[cat] = (cats[cat] || 0) + getExpenseAmount(r);
      }
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [records, getExpenseAmount]);

  const cropStats = useMemo(() => {
    const cropRecs = records.filter((r) => r.crop === selectedSummaryCrop);
    let exp = 0;
    let sl = 0;
    let paid = 0;
    let pending = 0;
    let yld = 0;

    cropRecs.forEach((r) => {
      if (r.type === 'Expense') exp += getExpenseAmount(r);
      if (r.type === 'Sale') {
        const gross = getSaleAmount(r);
        sl += gross;
        const p = r.paidAmount !== undefined ? Number(r.paidAmount) : gross;
        paid += p;
        pending += r.remainingAmount !== undefined ? Number(r.remainingAmount) : Math.max(0, gross - p);
      }
      if (r.type === 'Yield') yld += Number(r.quantity || 0);
    });

    return {
      expense: exp,
      sale: sl,
      paymentReceived: paid,
      pendingPayment: pending,
      realizedProfit: paid - exp,
      yieldQty: yld,
      profit: sl - exp,
      yieldUnit: 'Quintal',
    };
  }, [records, selectedSummaryCrop, getExpenseAmount, getSaleAmount]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const curYear = new Date().getFullYear();
    return months.map((m, idx) => {
      const monthPrefix = `${curYear}-${String(idx + 1).padStart(2, '0')}`;
      const sales = records
        .filter((r) => r.type === 'Sale' && r.date.startsWith(monthPrefix))
        .reduce((sum, r) => sum + (r.paidAmount !== undefined ? Number(r.paidAmount) : getSaleAmount(r)), 0);
      const exps = records
        .filter((r) => r.type === 'Expense' && r.date.startsWith(monthPrefix))
        .reduce((sum, r) => sum + getExpenseAmount(r), 0);
      return {
        month: m,
        farm: sales - exps,
      };
    });
  }, [records, getSaleAmount, getExpenseAmount]);

  const selectedKhet = khets.find((k) => k.id === selectedKhetId) || null;

  if (selectedKhet) {
    return (
      <KhetDetail
        khet={selectedKhet}
        records={records}
        setRecords={setRecords}
        lang={lang}
        initialCropFilter={filterCropNameForDetail}
        khetCrops={khetCrops}
        onBack={() => {
          setSelectedKhetId(null);
          setFilterCropNameForDetail(undefined);
        }}
        onDeleteKhet={() => deleteKhet(selectedKhet)}
        onUpdateKhet={handleUpdateKhet}
      />
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-5 lg:px-6 pb-32 sm:pb-20 space-y-3.5">
      {/* SECTION HEADER & QUICK ACTIONS */}
      <div className="flex flex-col gap-2.5 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--sk-text)] flex items-center gap-2">
              <Wheat className="text-emerald-500 shrink-0" size={20} />
              <span className="text-[var(--sk-text)]">{isHi ? 'डिजिटल खेत व बटाई बहीखाता' : 'Digital Farm & Batai Ledger'}</span>
            </h1>
            <p className="text-xs text-[var(--sk-muted)] mt-0.5">
              {isHi
                ? 'अधिया-तिहाई साझेदारी, खाद-बीज खर्च, फसल बिक्री और नकद निपटान का सीधा हिसाब'
                : 'Batai sharecropping, input expenses, harvest sales and net cash settlement'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setShowLandModal(true)}
              className="h-8 px-2.5 rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card)] hover:bg-[var(--sk-card2)] text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="इकाई सेटिंग"
            >
              <Compass size={14} className="text-emerald-500 shrink-0" />
              <span>{isHi ? `इकाई (${landSettings.bighaPerAcre} बीघा/एकड़)` : `Unit (${landSettings.bighaPerAcre} B/Ac)`}</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="h-8 px-2.5 rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card)] hover:bg-[var(--sk-card2)] text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Excel डाउनलोड करें"
            >
              <FileSpreadsheet size={13} className="text-emerald-500 shrink-0" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="h-8 px-2.5 rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card)] hover:bg-[var(--sk-card2)] text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="PDF प्रिंट"
            >
              <Printer size={13} className="text-emerald-500 shrink-0" />
              <span>{isHi ? 'PDF प्रिंट' : 'Print PDF'}</span>
            </button>
            <button
              type="button"
              onClick={downloadPhysicalBackup}
              className="h-8 px-2.5 rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card)] hover:bg-[var(--sk-card2)] text-xs font-semibold text-[var(--sk-text)] transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="सुरक्षित बैकअप"
            >
              <Download size={13} className="text-emerald-500 shrink-0" />
              <span>{isHi ? 'बैकअप' : 'Backup'}</span>
            </button>
          </div>
        </div>

        {/* 4 UNIFORM ACTION BUTTONS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setFormRecordType('Expense');
              setShowRecordForm(true);
            }}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card)] hover:bg-[var(--sk-card2)] hover:border-emerald-500/50 text-[var(--sk-text)] transition active:scale-[0.98] text-left cursor-pointer shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <Plus size={16} className="stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-xs sm:text-sm text-[var(--sk-text)] leading-tight">
                {isHi ? 'नया खर्च' : '+ Add Expense'}
              </span>
              <span className="text-[10px] text-[var(--sk-muted)] mt-0.5 truncate block">
                {isHi ? 'खाद, बीज, मजदूरी' : 'Inputs & costs'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setFormRecordType('Sale');
              setShowRecordForm(true);
            }}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card)] hover:bg-[var(--sk-card2)] hover:border-emerald-500/50 text-[var(--sk-text)] transition active:scale-[0.98] text-left cursor-pointer shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <TrendingUp size={16} />
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-xs sm:text-sm text-[var(--sk-text)] leading-tight">
                {isHi ? 'फसल बिक्री' : '+ Crop Sale'}
              </span>
              <span className="text-[10px] text-[var(--sk-muted)] mt-0.5 truncate block">
                {isHi ? 'मंडी में उपज बेचें' : 'Sales & income'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setFormRecordType('Yield');
              setShowRecordForm(true);
            }}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card)] hover:bg-[var(--sk-card2)] hover:border-emerald-500/50 text-[var(--sk-text)] transition active:scale-[0.98] text-left cursor-pointer shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <Wheat size={16} />
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-xs sm:text-sm text-[var(--sk-text)] leading-tight">
                {isHi ? 'पैदावार लिखें' : '+ Add Yield'}
              </span>
              <span className="text-[10px] text-[var(--sk-muted)] mt-0.5 truncate block">
                {isHi ? 'कटाई की कुल उपज' : 'Harvest volume'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setAddKhetError(null);
              setShowAddKhet(true);
            }}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card)] hover:bg-[var(--sk-card2)] hover:border-emerald-500/50 text-[var(--sk-text)] transition active:scale-[0.98] text-left cursor-pointer shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-xs sm:text-sm text-[var(--sk-text)] leading-tight">
                {isHi ? 'नया खेत' : '+ New Field'}
              </span>
              <span className="text-[10px] text-[var(--sk-muted)] mt-0.5 truncate block">
                {isHi ? 'रकबा व खाता जोड़ें' : 'Plot & acreage'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* COMPACT PROFIT CARD */}
      <div className="rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--sk-muted)]">
                {isHi ? 'शुद्ध नकद मुनाफा' : 'Realized Net Profit'}
              </span>
              {allTotals.realizedProfit < 0 ? (
                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30">
                  {isHi ? 'घाटा' : 'Loss'}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  {isHi ? 'नकद बचत' : 'Net Cash'}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                  allTotals.realizedProfit >= 0 ? 'text-[var(--sk-text)]' : 'text-red-500'
                }`}
              >
                {allTotals.realizedProfit >= 0 ? '+' : ''}{money(allTotals.realizedProfit)}
              </span>
            </div>
            <p className="text-[11px] text-[var(--sk-muted)] mt-0.5">
              {isHi
                ? 'कुल बिक्री में से खर्च काटकर हाथ में बचा नकद'
                : 'Net cash in hand after all input expenses'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--sk-border)]">
            <div className="rounded-lg bg-[var(--sk-card2)] border border-[var(--sk-border)] p-2 text-left min-w-[90px] sm:min-w-[105px]">
              <span className="text-[10px] text-[var(--sk-muted)] block font-medium">
                {isHi ? 'कुल लागत' : 'Total Cost'}
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-[var(--sk-text)] mt-0.5 block truncate">
                {money(allTotals.expense)}
              </span>
            </div>

            <div className="rounded-lg bg-[var(--sk-card2)] border border-[var(--sk-border)] p-2 text-left min-w-[90px] sm:min-w-[105px]">
              <span className="text-[10px] text-[var(--sk-muted)] block font-medium">
                {isHi ? 'कुल बिक्री' : 'Total Sales'}
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-[var(--sk-text)] mt-0.5 block truncate">
                {money(allTotals.income)}
              </span>
            </div>

            <div className="rounded-lg bg-[var(--sk-card2)] border border-[var(--sk-border)] p-2 text-left min-w-[90px] sm:min-w-[105px]">
              <span className="text-[10px] text-[var(--sk-muted)] block font-medium">
                {isHi ? 'लेना बाकी' : 'Receivable'}
              </span>
              <span className={`text-xs sm:text-sm font-bold font-mono mt-0.5 block truncate ${
                allTotals.pendingPayment > 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-[var(--sk-muted)]'
              }`}>
                {money(allTotals.pendingPayment)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] p-1 w-full overflow-x-auto no-scrollbar shadow-sm gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('partners')}
          className={`shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold min-h-[38px] transition cursor-pointer ${
            activeTab === 'partners'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card)]'
          }`}
        >
          <Users size={14} className="shrink-0" />
          <span>{isHi ? 'साझेदारी / बटाईदार' : 'Partners & Batai'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold min-h-[38px] transition cursor-pointer ${
            activeTab === 'records'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card)]'
          }`}
        >
          <ListFilter size={14} className="shrink-0" />
          <span>{isHi ? 'सभी प्रविष्टियां' : 'All Records'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('khets')}
          className={`shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold min-h-[38px] transition cursor-pointer ${
            activeTab === 'khets'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card)]'
          }`}
        >
          <Layers size={14} className="shrink-0" />
          <span>{isHi ? 'खेतवार खाते' : 'Field Ledgers'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          className={`shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold min-h-[38px] transition cursor-pointer ${
            activeTab === 'stock'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card)]'
          }`}
        >
          <Boxes size={14} className="shrink-0" />
          <span>{isHi ? 'गोदाम स्टॉक' : 'Warehouse Stock'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold min-h-[38px] transition cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card)]'
          }`}
        >
          <BarChart3 size={14} className="shrink-0" />
          <span>{isHi ? 'मुनाफा रिपोर्ट' : 'Analytics'}</span>
        </button>
      </div>

      {/* TAB 1: PARTNERSHIP & BATAI LEDGER */}
      {activeTab === 'partners' && (
        <PartnershipSection
          lang={lang}
          partners={activePartners}
          setPartners={setActivePartners}
          partnerCash={activePartnerCash}
          setPartnerCash={setActivePartnerCash}
          farmRecords={records}
          khets={khets}
          onAddRecordForPartner={handleAddRecordForPartner}
        />
      )}

      {/* TAB 2: ALL RECORDS TABLE */}
      {activeTab === 'records' && (
        <FarmTable
          filteredRecords={filteredRecords}
          allRecords={records}
          lang={lang}
          cropSearch={cropSearch}
          setCropSearch={setCropSearch}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          khets={khets}
          khetCrops={khetCrops}
          partners={activePartners}
          onOpenPrintModal={() => setShowPrintModal(true)}
          onEdit={(record) => {
            setEditingRecord(record);
            setShowRecordForm(true);
          }}
          onDelete={(id) => {
            setRecords((cur) => cur.filter((r) => r.id !== id));
          }}
        />
      )}

      {/* TAB 3: KHET CARDS */}
      {activeTab === 'khets' && (
        <div className="space-y-4">
          {khets.length === 0 ? (
            <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-12 text-center">
              <Sprout size={40} className="mx-auto mb-3 text-[var(--sk-dim)]" />
              <h3 className="font-bold text-base text-[var(--sk-text)]">
                {isHi ? 'अभी कोई खेत नहीं जोड़ा गया है' : 'No fields added yet'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setAddKhetError(null);
                  setShowAddKhet(true);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 transition cursor-pointer"
              >
                <Plus size={16} />
                {isHi ? 'पहला खेत जोड़ें' : 'Add First Field'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {khets.map((khet) => (
                <KhetCardView
                  key={khet.id}
                  khet={khet}
                  khetCrops={khetCrops}
                  records={records}
                  lang={lang}
                  landSettings={landSettings}
                  onOpenKhetDetail={(khetId, filterCropName) => {
                    setSelectedKhetId(khetId);
                    setFilterCropNameForDetail(filterCropName);
                  }}
                  onAddCrop={(k) => {
                    setSelectedKhetForAddCrop(k);
                    setShowAddCropModal(true);
                  }}
                  onAddExpenseForCrop={(k, crop) => {
                    setFormFixedKhet(k);
                    setFormFixedCrop(crop);
                    setFormRecordType('Expense');
                    setEditingRecord(null);
                    setShowRecordForm(true);
                  }}
                  onAddHarvestForCrop={(k, crop) => {
                    setFormFixedKhet(k);
                    setFormFixedCrop(crop);
                    setFormRecordType('Yield');
                    setEditingRecord(null);
                    setShowRecordForm(true);
                  }}
                  onAddSaleForCrop={(k, crop) => {
                    setFormFixedKhet(k);
                    setFormFixedCrop(crop);
                    setFormRecordType('Sale');
                    setEditingRecord(null);
                    setShowRecordForm(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INVENTORY STOCK */}
      {activeTab === 'stock' && (
        <StockSection
          lang={lang}
          onNavigateToSale={(crop) => {
            const foundCrop =
              khetCrops.find((c) => c.cropName.toLowerCase() === crop.toLowerCase()) || null;
            setFormRecordType('Sale');
            setFormFixedCrop(foundCrop);
            setShowRecordForm(true);
          }}
        />
      )}

      {/* TAB 5: ANALYTICS */}
      {activeTab === 'summary' && (
        <FarmSummary
          lang={lang}
          totalExpense={allTotals.expense}
          totalSales={allTotals.income}
          paymentReceived={allTotals.paymentReceived}
          pendingPayment={allTotals.pendingPayment}
          realizedProfit={allTotals.realizedProfit}
          totalYield={allTotals.yieldKg}
          totalYieldQuintal={allTotals.yieldQuintal}
          profit={allTotals.expectedProfit}
          pieData={pieData}
          chartData={chartData}
          pieColors={['#10b981', '#ef4444', '#06b6d4', '#f97316', '#6366f1', '#eab308', '#a855f7', '#ec4899', '#64748b']}
          selectedCrop={selectedSummaryCrop}
          setSelectedCrop={setSelectedSummaryCrop}
          crops={POPULAR_CROPS.map((c) => c)}
          cropStats={cropStats}
        />
      )}

      {/* RECORD FORM MODAL */}
      {showRecordForm && (
        <FarmForm
          lang={lang}
          farmT={farmT}
          editingRecord={editingRecord}
          initialType={formRecordType}
          fixedKhet={formFixedKhet}
          fixedCrop={formFixedCrop}
          fixedPartner={formFixedPartner}
          khets={khets}
          khetCrops={khetCrops}
          partners={activePartners}
          onSave={(savedRecord) => {
            setRecords((cur) => {
              const idx = cur.findIndex((r) => r.id === savedRecord.id);
              if (idx >= 0) {
                const next = [...cur];
                next[idx] = savedRecord;
                return next;
              }
              return [savedRecord, ...cur];
            });
            setShowRecordForm(false);
            setEditingRecord(null);
            setFormFixedKhet(null);
            setFormFixedCrop(null);
            setFormFixedPartner(null);
          }}
          onCancel={() => {
            setShowRecordForm(false);
            setEditingRecord(null);
            setFormFixedKhet(null);
            setFormFixedCrop(null);
            setFormFixedPartner(null);
          }}
        />
      )}

      {/* ADD CROP MODAL */}
      {showAddCropModal && selectedKhetForAddCrop && (
        <AddCropModal
          isOpen={showAddCropModal}
          onClose={() => {
            setShowAddCropModal(false);
            setSelectedKhetForAddCrop(null);
          }}
          khet={selectedKhetForAddCrop}
          lang={lang}
          onSaveCrop={handleSaveCrop}
        />
      )}

      {/* LAND UNIT SETTINGS MODAL */}
      <LandSettingsModal
        isOpen={showLandModal}
        onClose={() => setShowLandModal(false)}
        lang={lang}
        onSettingsSaved={(newSettings) => setLandSettings(newSettings)}
      />

      {/* ADD KHET MODAL */}
      {showAddKhet && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAddKhet(false);
          }}
        >
          <form
            onSubmit={handleAddKhetSubmit}
            className="w-full max-w-md rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--sk-border)] pb-3">
              <h2 className="text-base font-bold text-[var(--sk-text)] flex items-center gap-2">
                🌾 {isHi ? 'नया खेत / चक खाता जोड़ें' : 'Add New Field Ledger'}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddKhet(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--sk-muted)] hover:bg-white/5 cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>
            {addKhetError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{addKhetError}</span>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                  {isHi ? 'खेत का नाम (पहचान)' : 'Field Name'} *
                </label>
                <input
                  type="text"
                  value={newKhet.name}
                  onChange={(e) => setNewKhet((c) => ({ ...c, name: e.target.value }))}
                  placeholder={isHi ? 'उदा. खेत 1 (नहर वाला)...' : 'e.g. Field 1...'}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                  {isHi ? 'मुख्य फसल (Crop)' : 'Crop'} *
                </label>
                <select
                  value={newKhet.crop}
                  onChange={(e) => setNewKhet((c) => ({ ...c, crop: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {POPULAR_CROPS.map((crop) => (
                    <option key={crop} value={crop}>
                      {cropLabel(lang, crop)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi ? 'क्षेत्रफल (Area)' : 'Area'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={newKhet.area}
                    onChange={(e) => setNewKhet((c) => ({ ...c, area: e.target.value }))}
                    placeholder="3.5"
                    required
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi ? 'इकाई' : 'Unit'}
                  </label>
                  <select
                    value={newKhet.areaUnit}
                    onChange={(e) => setNewKhet((c) => ({ ...c, areaUnit: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {AREA_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2.5 pt-2 border-t border-[var(--sk-border)]">
              <button
                type="button"
                onClick={() => setShowAddKhet(false)}
                className="flex-1 h-10 rounded-xl border border-[var(--sk-border)] text-xs font-semibold text-[var(--sk-muted)] hover:text-white transition cursor-pointer"
              >
                {isHi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold shadow-md hover:from-emerald-500 hover:to-green-500 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                {isHi ? 'खेत जोड़ें' : 'Create Ledger'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRINT REPORT & PDF STATEMENT MODAL */}
      <PrintReportModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        lang={lang}
        records={records}
        khets={khets}
        khetCrops={khetCrops}
      />
    </div>
  );
}
