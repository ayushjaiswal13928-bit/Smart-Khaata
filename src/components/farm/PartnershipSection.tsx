'use client';

import React, { useMemo, useState } from 'react';
import {
  Users,
  Plus,
  ArrowRightLeft,
  Trash2,
  Printer,
  UserCheck,
  Share2,
  X,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Warehouse,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Pencil,
} from 'lucide-react';
import { Partner, PartnerCashEntry, FarmRecord, Lang, Khet } from '../../lib/types';
import { fmt, formatDate } from '../../lib/utils';
import { FormCard } from '../common/UI';
import { printFinancialReport } from '../../lib/pdfExport';
import { generatePartnerWhatsAppSummary } from '../../lib/whatsappSharing';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { calculateBataiSettlement, getRelationshipLabel } from '../../lib/bataiLogic';
import { BataiSettlementExplainer } from './BataiSettlementExplainer';
import { getRecordAmount, normalizeToQuintals } from '../../lib/farmAccounting';
import { cropLabel } from '../../lib/farmI18n';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

interface PartnershipSectionProps {
  lang: Lang;
  partners: Partner[];
  setPartners: React.Dispatch<React.SetStateAction<Partner[]>>;
  partnerCash: PartnerCashEntry[];
  setPartnerCash: React.Dispatch<React.SetStateAction<PartnerCashEntry[]>>;
  farmRecords: FarmRecord[];
  khets?: Khet[];
  onAddRecordForPartner?: (partner: Partner, type: 'Expense' | 'Sale' | 'Yield') => void;
  onEditRecord?: (record: FarmRecord) => void;
  onDeleteRecord?: (id: string) => void;
}

export function PartnershipSection({
  lang,
  partners,
  setPartners,
  partnerCash,
  setPartnerCash,
  farmRecords,
  khets = [],
  onAddRecordForPartner,
  onEditRecord,
  onDeleteRecord,
}: PartnershipSectionProps) {
  const isHi = lang === 'hi';

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    partners[0]?.id || ''
  );

  const [partnerViewTab, setPartnerViewTab] = useState<'records' | 'cash'>('records');

  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showCashEntryModal, setShowCashEntryModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showExplainerModal, setShowExplainerModal] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
  const [cashToDelete, setCashToDelete] = useState<PartnerCashEntry | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<FarmRecord | null>(null);

  const [newPartner, setNewPartner] = useState({
    name: '',
    phone: '',
    relationship: 'batai_50_50' as Partner['relationship'],
    sharePercent: '50',
    costShareType: 'same_as_share' as Partner['costShareType'],
    khetId: '',
    khetName: '',
    crop: 'Wheat',
    season: 'Rabi 2026',
    notes: '',
  });

  const [newCash, setNewCash] = useState({
    partnerId: selectedPartnerId || (partners[0]?.id || ''),
    date: new Date().toISOString().slice(0, 10),
    type: 'gave_to_partner' as PartnerCashEntry['type'],
    purpose: 'advance' as 'advance' | 'settlement' | 'loan',
    amount: '',
    mode: 'cash' as PartnerCashEntry['mode'],
    note: '',
  });

  const activePartner = useMemo(() => {
    return partners.find((p) => p.id === selectedPartnerId) || partners[0] || null;
  }, [partners, selectedPartnerId]);

  // Robust, mathematically certified settlement calculation
  const settlement = useMemo(() => {
    return calculateBataiSettlement(activePartner, farmRecords, partnerCash);
  }, [activePartner, farmRecords, partnerCash]);

  const handleRelationshipSelect = (rel: Partner['relationship']) => {
    let defaultShare = '50';
    if (rel === 'batai_third') defaultShare = '33.33';
    else if (rel === 'batai_quarter') defaultShare = '25';
    setNewPartner((prev) => ({
      ...prev,
      relationship: rel,
      sharePercent: defaultShare,
    }));
  };

  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.name.trim()) return;
    const share = parseFloat(newPartner.sharePercent) || 50;
    const created: Partner = {
      id: `partner-${Date.now()}`,
      name: newPartner.name.trim(),
      phone: newPartner.phone.trim(),
      relationship: newPartner.relationship,
      sharePercent: share,
      costShareType: newPartner.costShareType,
      khetId: newPartner.khetId || undefined,
      khetName: newPartner.khetName.trim(),
      crop: newPartner.crop.trim(),
      season: newPartner.season.trim(),
      startDate: new Date().toISOString().slice(0, 10),
      notes: newPartner.notes.trim(),
    };
    const updated = [...partners, created];
    setPartners(updated);
    setSelectedPartnerId(created.id);
    setShowAddPartnerModal(false);
    setNewPartner({
      name: '',
      phone: '',
      relationship: 'batai_50_50',
      sharePercent: '50',
      costShareType: 'same_as_share',
      khetId: '',
      khetName: '',
      crop: 'Wheat',
      season: 'Rabi 2026',
      notes: '',
    });
  };

  const handleSaveCashEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newCash.amount);
    if (!amt || amt <= 0 || !activePartner) return;

    const entry: PartnerCashEntry = {
      id: `cash-${Date.now()}`,
      partnerId: activePartner.id,
      date: newCash.date,
      type: newCash.type,
      purpose: newCash.purpose,
      amount: amt,
      mode: newCash.mode,
      note: newCash.note.trim(),
    };

    setPartnerCash([entry, ...partnerCash]);
    setShowCashEntryModal(false);

    setNewCash({
      partnerId: activePartner.id,
      date: new Date().toISOString().slice(0, 10),
      type: 'gave_to_partner',
      purpose: 'advance',
      amount: '',
      mode: 'cash',
      note: '',
    });
  };

  const confirmDeletePartner = () => {
    if (!partnerToDelete) return;
    const targetId = partnerToDelete.id;
    const updated = partners.filter((p) => p.id !== targetId);
    setPartners(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sk-partners', JSON.stringify(updated));
    }
    if (selectedPartnerId === targetId) {
      setSelectedPartnerId(updated[0]?.id || '');
    }
    setPartnerToDelete(null);
  };

  const confirmDeleteCash = () => {
    if (!cashToDelete) return;
    const targetId = cashToDelete.id;
    const updated = partnerCash.filter((entry) => entry.id !== targetId);
    setPartnerCash(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sk-partner-cash', JSON.stringify(updated));
    }
    setCashToDelete(null);
  };

  const printStatement = () => {
    if (!activePartner) return;
    const partnerCashEntries = partnerCash.filter((c) => c.partnerId === activePartner.id);
    const balanceText =
      settlement.netBalance > 0
        ? `साझीदार से लेने हैं: ₹${settlement.netBalance.toLocaleString('en-IN')}`
        : settlement.netBalance < 0
        ? `साझीदार को देने हैं: ₹${Math.abs(settlement.netBalance).toLocaleString('en-IN')}`
        : 'हिसाब चुकता (₹0)';

    printFinancialReport({
      title: `बटाई हिसाब पर्चा - ${activePartner.name}`,
      subtitle: `${getRelationshipLabel(activePartner.relationship, 'hi')} (${activePartner.sharePercent}% हिस्सा) | खेत: ${activePartner.khetName || 'साझा खेत'}`,
      lang: lang === 'hi' ? 'hi' : 'en',
      summaryCards: [
        {
          label: 'कुल खेती खर्च',
          value: fmt(settlement.totalExpense),
          color: '#dc2626',
        },
        {
          label: `साझीदार का खर्च (${settlement.costSharePercent}%)`,
          value: fmt(settlement.partnerCostShare),
          color: '#d97706',
        },
        {
          label: 'कुल फसल बिक्री',
          value: fmt(settlement.totalSales),
          color: '#16a34a',
        },
        {
          label: `साझीदार का बिक्री हिस्सा (${settlement.partnerSharePercent}%)`,
          value: fmt(settlement.partnerSalesShare),
          color: '#2563eb',
        },
        {
          label: 'अंतिम शुद्ध फैसला',
          value: balanceText,
          color: settlement.netBalance >= 0 ? '#16a34a' : '#dc2626',
        },
      ],
      tableHeaders: ['दिनांक', 'प्रकार', 'विवरण / माध्यम', 'रकम (₹)'],
      tableRows: partnerCashEntries.map((c) => ({
        cells: [
          formatDate(c.date),
          c.type === 'gave_to_partner' ? 'साझीदार को नकद दिया (Advance)' : 'साझीदार से नकद मिला (Received)',
          `${c.note || '-'} (${c.mode === 'cash' ? 'नकद' : 'ऑनलाइन'})`,
          fmt(c.amount),
        ],
      })),
      footerNotes: `प्रमाणित दिनांक: ${new Date().toLocaleDateString('hi-IN')} | स्मार्ट खाता डिजिटल कृषि बहीखाता`,
    });
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-5 lg:px-6 pb-28 sm:pb-16 space-y-4">
      {/* HEADER & QUICK ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--sk-text)] flex items-center gap-2">
            <Users className="text-emerald-500" size={24} />
            <span>{isHi ? 'बटाई व साझीदार हिसाब-किताब' : 'Batai & Partner Settlement'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--sk-muted)] mt-0.5">
            {isHi
              ? 'अधिया (50-50) व तिहाई साझेदारी, सांझा खाद-बीज खर्च, बिक्री और नकद निपटान'
              : 'Complete ledger for 50-50 partnership, shared inputs, harvest sales and net cash settlement'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExplainerModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition cursor-pointer"
          >
            <HelpCircle size={15} />
            <span>{isHi ? 'गणित कैसे काम करता है?' : 'How it works'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddPartnerModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 px-3.5 py-2 min-h-[40px] text-xs font-bold text-white shadow-md active:scale-95 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>{isHi ? '+ साझीदार जोड़ें' : '+ Add Partner'}</span>
          </button>
        </div>
      </div>

      {/* PARTNER SELECTION TABS */}
      {partners.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {partners.map((p) => {
            const isSelected = p.id === activePartner?.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPartnerId(p.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/60 shadow-sm'
                    : 'bg-[var(--sk-card)] text-[var(--sk-muted)] border border-[var(--sk-border)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card2)]'
                }`}
              >
                <UserCheck size={14} className={isSelected ? 'text-emerald-500' : 'text-[var(--sk-muted)]'} />
                <span>{p.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--sk-card2)] border border-[var(--sk-border)] text-[var(--sk-muted)] font-mono">
                  {p.sharePercent}%
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)]">
          <Users size={36} className="mx-auto mb-2 text-slate-500" />
          <h3 className="text-sm font-bold text-[var(--sk-text)]">
            {isHi ? 'कोई साझीदार नहीं है' : 'No partner added yet'}
          </h3>
          <p className="text-xs text-[var(--sk-muted)] mt-1 max-w-sm mx-auto">
            {isHi
              ? "ऊपर '+ साझीदार जोड़ें' बटन दबाकर अधिया (50-50) या तिहाई बटाईदार का खाता शुरू करें।"
              : 'Add partner to track 50-50 crop expenses, harvest sales and net settlement balance.'}
          </p>
          <button
            type="button"
            onClick={() => setShowAddPartnerModal(true)}
            className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
          >
            {isHi ? '+ पहला साझीदार जोड़ें' : '+ Add First Partner'}
          </button>
        </div>
      )}

      {/* SELECTED PARTNER HERO SETTLEMENT CARD */}
      {activePartner && (
        <div className="space-y-4">
          <div
            className={`p-4 sm:p-5 rounded-2xl border shadow-sm transition-all ${
              settlement.settlementStatus === 'partner_owes_me'
                ? 'bg-emerald-50/50 dark:bg-gradient-to-br dark:from-emerald-950/40 dark:via-[var(--sk-card)] dark:to-slate-900 border-emerald-500/40'
                : settlement.settlementStatus === 'i_owe_partner'
                ? 'bg-red-50/50 dark:bg-gradient-to-br dark:from-red-950/40 dark:via-[var(--sk-card)] dark:to-slate-900 border-red-500/40'
                : 'bg-[var(--sk-card)] border-[var(--sk-border)]'
            }`}
          >
            {/* Top Partner Details Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--sk-border)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--sk-text)]">
                    {activePartner.name}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                    {getRelationshipLabel(activePartner.relationship, lang)} ({activePartner.sharePercent}%)
                  </span>
                </div>
                <div className="text-xs text-[var(--sk-muted)] mt-1 flex flex-wrap items-center gap-2">
                  {activePartner.khetName && (
                    <span>खेत: <b className="text-[var(--sk-text)]">{activePartner.khetName}</b></span>
                  )}
                  {activePartner.crop && (
                    <span>फसल: <b className="text-[var(--sk-text)]">{activePartner.crop}</b></span>
                  )}
                  {activePartner.phone && (
                    <span>फोन: <b className="text-[var(--sk-text)]">{activePartner.phone}</b></span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowCashEntryModal(true)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowRightLeft size={14} />
                  <span>{isHi ? 'नकद पेशगी / लेनदेन' : 'Record Cash'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExplainerModal(true)}
                  className="px-3 py-2 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card)] hover:bg-[var(--sk-card2)] text-[var(--sk-text)] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  title="हिसाब का गणित समझें"
                >
                  <HelpCircle size={14} className="text-emerald-500" />
                  <span>{isHi ? 'हिसाब का गणित' : 'Logic'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(true)}
                  className="px-3 py-2 rounded-xl border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="WhatsApp शेयर"
                >
                  <Share2 size={14} className="text-emerald-500" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={printStatement}
                  className="px-3 py-2 rounded-xl border border-purple-500/40 text-purple-700 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  title="PDF पर्चा प्रिंट करें"
                >
                  <Printer size={14} />
                  <span className="hidden sm:inline">प्रिंट</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerToDelete(activePartner)}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                  title="Delete Partner"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* BIG BALANCE SETTLEMENT STATUS BOX */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Box 1: What Partner owes me */}
              <div className="p-3.5 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)]">
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-between">
                  <span>{isHi ? 'साझीदार से आपको मिलना:' : 'Partner Owes You:'}</span>
                  <span className="text-[10px] text-[var(--sk-muted)] font-mono">
                    ({settlement.partnerSharePercent}% खर्च + पेशगी)
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  ₹{settlement.partnerOwesMeTotal.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-[var(--sk-muted)] mt-1 space-y-0.5 font-mono">
                  <div>{isHi ? 'खर्च हिस्सा:' : 'Cost Share:'} ₹{Math.round(settlement.myExpensePaid * (settlement.costSharePercent / 100)).toLocaleString('en-IN')}</div>
                  {settlement.directCashGave > 0 && <div>{isHi ? 'नकद पेशगी:' : 'Cash Advance:'} ₹{settlement.directCashGave.toLocaleString('en-IN')}</div>}
                </div>
              </div>

              {/* Box 2: What I owe partner */}
              <div className="p-3.5 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)]">
                <div className="text-[11px] text-red-600 dark:text-red-400 font-semibold flex items-center justify-between">
                  <span>{isHi ? 'साझीदार को आपको देना:' : 'You Owe Partner:'}</span>
                  <span className="text-[10px] text-[var(--sk-muted)] font-mono">
                    ({settlement.partnerSharePercent}% {isHi ? 'बिक्री हिस्सा' : 'Sales share'})
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-red-600 dark:text-red-400 mt-1">
                  ₹{settlement.iOwePartnerTotal.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-[var(--sk-muted)] mt-1 space-y-0.5 font-mono">
                  <div>{isHi ? 'बिक्री हिस्सा:' : 'Sales Share:'} ₹{settlement.partnerSalesShare.toLocaleString('en-IN')}</div>
                  {settlement.partnerExpensePaid > 0 && (
                    <div>{isHi ? 'साझीदार का खर्च:' : 'Partner Cost:'} ₹{Math.round(settlement.partnerExpensePaid * (settlement.myCostSharePercent / 100)).toLocaleString('en-IN')}</div>
                  )}
                </div>
              </div>

              {/* Box 3: Final NET SETTLEMENT */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  settlement.settlementStatus === 'partner_owes_me'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-300'
                    : settlement.settlementStatus === 'i_owe_partner'
                    ? 'bg-red-500/15 border-red-500/50 text-red-800 dark:text-red-300'
                    : 'bg-[var(--sk-card)] border-[var(--sk-border)] text-[var(--sk-text)]'
                }`}
              >
                <div>
                  <div className="text-[11px] font-bold flex items-center justify-between">
                    <span>
                      {settlement.settlementStatus === 'partner_owes_me'
                        ? isHi ? 'अंतिम फैसला: साझीदार से लेना' : 'Net Receivable from Partner:'
                        : settlement.settlementStatus === 'i_owe_partner'
                        ? isHi ? 'अंतिम फैसला: साझीदार को देना' : 'Net Payable to Partner:'
                        : isHi ? 'अंतिम फैसला: हिसाब चुकता' : 'Settled (Zero Due):'}
                    </span>
                    <span className="text-[10px] font-mono opacity-80">
                      {isHi ? 'शुद्ध अंतर' : 'Net'}
                    </span>
                  </div>
                  <div
                    className={`text-xl sm:text-2xl font-bold font-mono mt-0.5 ${
                      settlement.settlementStatus === 'partner_owes_me'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : settlement.settlementStatus === 'i_owe_partner'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-[var(--sk-text)]'
                    }`}
                  >
                    ₹{Math.abs(settlement.netBalance).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-[10px] font-semibold opacity-90 mt-1">
                  {settlement.settlementStatus === 'partner_owes_me' && (
                    <span>{isHi ? `साझीदार से ₹${settlement.netBalance.toLocaleString('en-IN')} वसूल करना है।` : `Collect ₹${settlement.netBalance.toLocaleString('en-IN')} from partner.`}</span>
                  )}
                  {settlement.settlementStatus === 'i_owe_partner' && (
                    <span>{isHi ? `साझीदार को ₹${Math.abs(settlement.netBalance).toLocaleString('en-IN')} भुगतान करना है।` : `Pay ₹${Math.abs(settlement.netBalance).toLocaleString('en-IN')} to partner.`}</span>
                  )}
                  {settlement.settlementStatus === 'settled' && (
                    <span>{isHi ? 'दोनों पक्षों का खाता पूरी तरह संतुलित है।' : 'Account is fully balanced (Zero due).'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4 PILLARS DETAILED BREAKDOWN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. Total Expenses */}
            <div className="p-3.5 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] space-y-1">
              <div className="text-[11px] text-[var(--sk-muted)] font-medium flex items-center justify-between">
                <span>{isHi ? '1. कुल खेती खर्च' : '1. Total Farm Expenses'}</span>
                <TrendingDown size={14} className="text-red-500" />
              </div>
              <div className="text-base font-bold font-mono text-red-500">
                {fmt(settlement.totalExpense)}
              </div>
              <div className="text-[10px] text-[var(--sk-muted)] border-t border-[var(--sk-border)] pt-1.5 space-y-0.5 font-mono">
                <div>{isHi ? 'आपने दिया:' : 'You paid:'} {fmt(settlement.myExpensePaid)}</div>
                <div>{isHi ? 'साझीदार ने दिया:' : 'Partner paid:'} {fmt(settlement.partnerExpensePaid)}</div>
                <div className="text-amber-500 font-semibold">
                  {isHi ? `साझीदार का हिस्सा (${settlement.costSharePercent}%):` : `Partner share (${settlement.costSharePercent}%):`} {fmt(settlement.partnerCostShare)}
                </div>
              </div>
            </div>

            {/* 2. Total Sales */}
            <div className="p-3.5 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] space-y-1">
              <div className="text-[11px] text-[var(--sk-muted)] font-medium flex items-center justify-between">
                <span>{isHi ? '2. कुल फसल बिक्री' : '2. Total Crop Sales'}</span>
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {fmt(settlement.totalSales)}
              </div>
              <div className="text-[10px] text-[var(--sk-muted)] border-t border-[var(--sk-border)] pt-1.5 space-y-0.5 font-mono">
                <div>{isHi ? 'आपके पास आई:' : 'Collected by you:'} {fmt(settlement.mySalesReceived)}</div>
                {settlement.partnerSalesReceived > 0 && <div>{isHi ? 'साझीदार को मिली:' : 'Collected by partner:'} {fmt(settlement.partnerSalesReceived)}</div>}
                <div className="text-blue-500 font-semibold">
                  {isHi ? `साझीदार का हिस्सा (${settlement.partnerSharePercent}%):` : `Partner share (${settlement.partnerSharePercent}%):`} {fmt(settlement.partnerSalesShare)}
                </div>
              </div>
            </div>

            {/* 3. Harvest Yield / Grain Division */}
            <div className="p-3.5 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] space-y-1">
              <div className="text-[11px] text-[var(--sk-muted)] font-medium flex items-center justify-between">
                <span>{isHi ? '3. कुल उपज (अनाज बंटवारा)' : '3. Total Harvest (Yield)'}</span>
                <Warehouse size={14} className="text-cyan-500" />
              </div>
              <div className="text-base font-bold font-mono text-cyan-600 dark:text-cyan-400">
                {settlement.totalYieldQuintal} {isHi ? 'क्विंटल' : 'Quintal'}
              </div>
              <div className="text-[10px] text-[var(--sk-muted)] border-t border-[var(--sk-border)] pt-1.5 space-y-0.5 font-mono">
                <div>{isHi ? 'आपका हिस्सा:' : 'Your share:'} {settlement.myYieldShareQuintal} Qtl</div>
                <div className="text-cyan-600 dark:text-cyan-300 font-semibold">
                  {isHi ? 'साझीदार हिस्सा:' : 'Partner share:'} {settlement.partnerYieldShareQuintal} Qtl
                </div>
              </div>
            </div>

            {/* 4. Direct Cash Advances */}
            <div className="p-3.5 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] space-y-1">
              <div className="text-[11px] text-[var(--sk-muted)] font-medium flex items-center justify-between">
                <span>{isHi ? '4. नकद पेशगी (Advance)' : '4. Cash Advances'}</span>
                <ArrowRightLeft size={14} className="text-amber-500" />
              </div>
              <div className="text-base font-bold font-mono text-amber-500">
                {fmt(settlement.directCashGave)}
              </div>
              <div className="text-[10px] text-[var(--sk-muted)] border-t border-[var(--sk-border)] pt-1.5 space-y-0.5 font-mono">
                <div>{isHi ? 'आपने पेशगी दी:' : 'You advanced:'} {fmt(settlement.directCashGave)}</div>
                <div>{isHi ? 'साझीदार ने लौटाया:' : 'Partner returned:'} {fmt(settlement.directCashReceived)}</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {isHi ? 'नेट पेशगी बाकी:' : 'Net advance balance:'} {fmt(settlement.netCashAdvanceBalance)}
                </div>
              </div>
            </div>
          </div>

          {/* DUAL SUB-TABS: FARM RECORDS VS CASH LEDGER */}
          <div className="space-y-3">
            <div className="flex rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] p-1 w-full gap-1 shadow-sm">
              <button
                type="button"
                onClick={() => setPartnerViewTab('records')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  partnerViewTab === 'records'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card)]'
                }`}
              >
                <FileText size={14} />
                <span>
                  {isHi
                    ? `खेत खर्च व बिक्री रिकॉर्ड (${settlement.relevantRecords.length})`
                    : `Farm Records (${settlement.relevantRecords.length})`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPartnerViewTab('cash')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  partnerViewTab === 'cash'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card)]'
                }`}
              >
                <ArrowRightLeft size={14} />
                <span>
                  {isHi
                    ? `नकद पेशगी व लेनदेन (${partnerCash.filter((c) => c.partnerId === activePartner.id).length})`
                    : `Cash Advances (${partnerCash.filter((c) => c.partnerId === activePartner.id).length})`}
                </span>
              </button>
            </div>

            {/* TAB A: LINKED FARM RECORDS */}
            {partnerViewTab === 'records' && (
              <FormCard>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[var(--sk-border)] pb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-emerald-500" />
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-[var(--sk-text)]">
                        {isHi
                          ? `साझेदारी के जुड़े खेत रिकॉर्ड (${activePartner.name})`
                          : `Farm Records for ${activePartner.name}`}
                      </h3>
                      <p className="text-[11px] text-[var(--sk-muted)]">
                        {isHi
                          ? 'इस साझीदार के खाते से जुड़े खाद-बीज खर्च, पैदावार व बिक्री'
                          : 'Expenses, yields, and sales accounted for in this Batai partnership'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {onAddRecordForPartner && (
                      <>
                        <button
                          type="button"
                          onClick={() => onAddRecordForPartner(activePartner, 'Expense')}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
                        >
                          <Plus size={13} />
                          <span>{isHi ? '+ खर्च जोड़ें' : '+ Cost'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onAddRecordForPartner(activePartner, 'Sale')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
                        >
                          <TrendingUp size={13} />
                          <span>{isHi ? '+ फसल बिक्री' : '+ Sale'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onAddRecordForPartner(activePartner, 'Yield')}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
                        >
                          <Warehouse size={13} />
                          <span>{isHi ? '+ पैदावार' : '+ Yield'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 divide-y divide-[var(--sk-border)] text-xs">
                  {settlement.relevantRecords.map((r) => {
                    const amt = getRecordAmount(r);
                    const isExp = r.type === 'Expense';
                    const isSale = r.type === 'Sale';
                    const isYield = r.type === 'Yield';

                    let partnerShareCalc = 0;
                    if (isExp) {
                      partnerShareCalc = Math.round(amt * (settlement.costSharePercent / 100));
                    } else if (isSale) {
                      partnerShareCalc = Math.round(amt * (settlement.partnerSharePercent / 100));
                    }

                    return (
                      <div
                        key={r.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[var(--sk-card2)]/60 px-2 rounded-lg transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                isExp
                                  ? 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/25'
                                  : isSale
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                                  : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/25'
                              }`}
                            >
                              {isExp
                                ? r.expenseCategory || 'लागत खर्च'
                                : isSale
                                ? 'फसल बिक्री'
                                : 'उपज / पैदावार'}
                            </span>
                            <span className="text-[var(--sk-muted)] font-mono text-[11px]">
                              📅 {formatDate(r.date)}
                            </span>
                            {r.field && (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                                🌱 {r.field}
                              </span>
                            )}
                            <span className="text-[11px] text-[var(--sk-muted)] font-mono">
                              🌾 {cropLabel(lang, r.crop)}
                            </span>
                          </div>

                          <div className="text-[11px] text-[var(--sk-muted)] mt-1">
                            {r.note && <span>{r.note} </span>}
                            {r.quantity ? (
                              <span>
                                ({r.quantity} {r.unit || 'Quintal'} {r.price ? `@ ₹${r.price}` : ''})
                              </span>
                            ) : null}
                          </div>

                          {/* Settlement Allocation Explain */}
                          <div className="mt-1 text-[11px] font-mono">
                            {isExp && (
                              <span className="text-amber-600 dark:text-amber-400">
                                {r.paidBy === 'partner'
                                  ? isHi
                                    ? `साझीदार ने ₹${amt.toLocaleString('en-IN')} चुकाए (मालिक को ₹${(amt - partnerShareCalc).toLocaleString('en-IN')} देने हैं)`
                                    : `Partner paid ₹${amt} (Owner owes ₹${amt - partnerShareCalc})`
                                  : r.paidBy === 'shared'
                                  ? isHi
                                    ? 'मौके पर 50-50 साझा भुगतान हुआ'
                                    : 'Shared 50-50 on spot'
                                  : isHi
                                  ? `आपने ₹${amt.toLocaleString('en-IN')} चुकाए (साझीदार से ₹${partnerShareCalc.toLocaleString('en-IN')} लेने हैं)`
                                  : `Owner paid ₹${amt} (Partner owes ₹${partnerShareCalc})`}
                              </span>
                            )}
                            {isSale && (
                              <span className="text-blue-600 dark:text-blue-400">
                                {r.saleReceivedBy === 'partner'
                                  ? isHi
                                    ? `साझीदार को पूरी ₹${amt.toLocaleString('en-IN')} बिक्री मिली (मालिक को ₹${(amt - partnerShareCalc).toLocaleString('en-IN')} देने हैं)`
                                    : `Partner collected ₹${amt} (Owner share ₹${amt - partnerShareCalc})`
                                  : r.saleReceivedBy === 'shared'
                                  ? isHi
                                    ? 'बिक्री का पैसा मौके पर आधा-आधा बांट लिया'
                                    : 'Split on spot'
                                  : isHi
                                  ? `आपको ₹${amt.toLocaleString('en-IN')} बिक्री मिली (साझीदार को ₹${partnerShareCalc.toLocaleString('en-IN')} देने हैं)`
                                  : `Owner collected ₹${amt} (Partner share ₹${partnerShareCalc})`}
                              </span>
                            )}
                            {isYield && (
                              <span className="text-cyan-600 dark:text-cyan-400">
                                {isHi
                                  ? `कुल ${r.quantity} ${r.unit || 'क्विंटल'} में से साझीदार हिस्सा: ${Math.round(normalizeToQuintals(Number(r.quantity || 0), r.unit) * (settlement.partnerSharePercent / 100) * 100) / 100} क्विंटल`
                                  : `Partner entitled to ${Math.round(normalizeToQuintals(Number(r.quantity || 0), r.unit) * (settlement.partnerSharePercent / 100) * 100) / 100} Qtl`}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {isYield ? (
                            <div className="font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400">
                              {r.quantity} {r.unit || 'Qtl'}
                            </div>
                          ) : (
                            <div
                              className={`font-mono font-bold text-sm ${
                                isSale ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                              }`}
                            >
                              {isSale ? '+' : '-'} ₹{amt.toLocaleString('en-IN')}
                            </div>
                          )}
                          {!isYield && (
                            <div className="text-[10px] text-[var(--sk-muted)] font-mono mt-0.5">
                              {isHi ? 'साझीदार हिस्सा:' : 'Partner share:'} ₹{partnerShareCalc.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {settlement.relevantRecords.length === 0 && (
                    <div className="py-8 text-center text-xs text-[var(--sk-dim)] space-y-2">
                      <p>
                        {isHi
                          ? `खेत "${activePartner.khetName || 'साझा खेत'}" या साझीदार "${activePartner.name}" से जुड़ी कोई प्रविष्टि अभी दर्ज नहीं है।`
                          : `No farm records found linked to partner "${activePartner.name}".`}
                      </p>
                      {onAddRecordForPartner && (
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onAddRecordForPartner(activePartner, 'Expense')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                          >
                            {isHi ? '+ पहला खर्च जोड़ें' : '+ Add Expense'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </FormCard>
            )}

            {/* TAB B: CASH ADVANCE LEDGER */}
            {partnerViewTab === 'cash' && (
              <FormCard>
                <div className="flex items-center justify-between border-b border-[var(--sk-border)] pb-3">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft size={16} className="text-emerald-500" />
                    <h3 className="font-bold text-xs sm:text-sm text-[var(--sk-text)]">
                      {isHi ? 'नकद पेशगी व लेनदेन विवरण (Cash Advance Ledger)' : 'Cash Ledger'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCashEntryModal(true)}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>{isHi ? 'नया नकद जोड़ें' : 'Add Cash'}</span>
                  </button>
                </div>

                {/* Cash Transactions List */}
                <div className="mt-3 divide-y divide-[var(--sk-border)] text-xs">
                  {partnerCash
                    .filter((c) => c.partnerId === activePartner.id)
                    .map((entry) => {
                      const isGave = entry.type === 'gave_to_partner';
                      return (
                        <div
                          key={entry.id}
                          className="py-2.5 flex items-center justify-between gap-3 hover:bg-[var(--sk-card2)]/60 px-2 rounded-lg transition"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isGave
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                                    : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25'
                                }`}
                              >
                                {isGave
                                  ? isHi ? 'साझीदार को नकद दिया (Advance)' : 'You Gave to Partner'
                                  : isHi ? 'साझीदार से नकद मिला (Received)' : 'Received from Partner'}
                              </span>
                              <span className="text-[var(--sk-muted)] font-mono text-[11px]">
                                📅 {formatDate(entry.date)}
                              </span>
                              {entry.mode && (
                                <span className="text-[10px] text-[var(--sk-faint)]">
                                  ({entry.mode === 'cash' ? 'नकद' : 'ऑनलाइन'})
                                </span>
                              )}
                            </div>
                            {entry.note && (
                              <p className="text-[11px] text-[var(--sk-muted)] mt-1 truncate">
                                {entry.note}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div
                              className={`font-mono font-bold text-sm ${
                                isGave ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {isGave ? '+' : '-'} ₹{entry.amount.toLocaleString('en-IN')}
                            </div>
                            <button
                              type="button"
                              onClick={() => setCashToDelete(entry)}
                              className="p-1 rounded text-red-500 hover:bg-red-500/10 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {partnerCash.filter((c) => c.partnerId === activePartner.id).length === 0 && (
                    <div className="py-6 text-center text-xs text-[var(--sk-dim)]">
                      {isHi ? 'कोई नकद पेशगी या लेनदेन दर्ज नहीं है।' : 'No cash entries recorded.'}
                    </div>
                  )}
                </div>
              </FormCard>
            )}
          </div>
        </div>
      )}

      {/* ADD PARTNER MODAL */}
      {showAddPartnerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAddPartnerModal(false);
          }}
        >
          <form
            onSubmit={handleSavePartner}
            className="w-full max-w-md rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--sk-border)] pb-3">
              <h2 className="text-base font-bold text-[var(--sk-text)] flex items-center gap-2">
                <Users size={18} className="text-emerald-500" />
                <span>{isHi ? 'नया साझीदार / बटाईदार जोड़ें' : 'Add Partner'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddPartnerModal(false)}
                className="text-[var(--sk-muted)] hover:text-[var(--sk-text)] p-1 rounded-lg"
              >
                <X size={17} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--sk-muted)] mb-1 font-semibold">
                  {isHi ? 'साझीदार का नाम:' : 'Partner Name:'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isHi ? 'उदा. रमेश पटेल' : 'e.g. Ramesh Patel'}
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs sm:text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Partnership Type Preset Buttons */}
              <div>
                <label className="block text-[var(--sk-muted)] mb-1.5 font-semibold">
                  {isHi ? 'साझेदारी का प्रकार (समझौता):' : 'Partnership Agreement:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRelationshipSelect('batai_50_50')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      newPartner.relationship === 'batai_50_50'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-[var(--sk-border)] bg-[var(--sk-card2)] text-[var(--sk-text)] hover:bg-[var(--sk-card3)]'
                    }`}
                  >
                    <div className="text-xs font-bold">अधिया (50-50)</div>
                    <div className="text-[10px] text-[var(--sk-muted)]">आधा-आधा खर्च व उपज</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRelationshipSelect('batai_third')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      newPartner.relationship === 'batai_third'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-[var(--sk-border)] bg-[var(--sk-card2)] text-[var(--sk-text)] hover:bg-[var(--sk-card3)]'
                    }`}
                  >
                    <div className="text-xs font-bold">तिहाई (1/3rd)</div>
                    <div className="text-[10px] text-[var(--sk-muted)]">33.33% साझीदार हिस्सा</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRelationshipSelect('batai_quarter')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      newPartner.relationship === 'batai_quarter'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-[var(--sk-border)] bg-[var(--sk-card2)] text-[var(--sk-text)] hover:bg-[var(--sk-card3)]'
                    }`}
                  >
                    <div className="text-xs font-bold">चौथाई (1/4th)</div>
                    <div className="text-[10px] text-[var(--sk-muted)]">25% साझीदार हिस्सा</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRelationshipSelect('batai_custom')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      newPartner.relationship === 'batai_custom'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-[var(--sk-border)] bg-[var(--sk-card2)] text-[var(--sk-text)] hover:bg-[var(--sk-card3)]'
                    }`}
                  >
                    <div className="text-xs font-bold">कस्टम %</div>
                    <div className="text-[10px] text-[var(--sk-muted)]">अपनी मर्जी से % तय करें</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--sk-muted)] mb-1 font-semibold">
                    {isHi ? 'हिस्सेदारी % (Share):' : 'Share %:'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max="100"
                      value={newPartner.sharePercent}
                      onChange={(e) => setNewPartner({ ...newPartner, sharePercent: e.target.value })}
                      className="w-full h-10 px-3 pr-7 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-2.5 text-[var(--sk-muted)]">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--sk-muted)] mb-1 font-semibold">
                    {isHi ? 'मोबाइल नंबर:' : 'Phone:'}
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={newPartner.phone}
                    onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs sm:text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--sk-muted)] mb-1 font-semibold">
                    {isHi ? 'संबंधित खेत (चक):' : 'Field (Plot):'}
                  </label>
                  {khets.length > 0 ? (
                    <select
                      value={newPartner.khetId || (newPartner.khetName ? '__custom__' : '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setNewPartner({ ...newPartner, khetId: '', khetName: '' });
                        } else {
                          const found = khets.find((k) => k.id === val);
                          if (found) {
                            setNewPartner({
                              ...newPartner,
                              khetId: found.id,
                              khetName: found.name,
                              crop: found.crop || newPartner.crop,
                            });
                          } else {
                            setNewPartner({ ...newPartner, khetId: '', khetName: '' });
                          }
                        }
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs sm:text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500"
                    >
                      <option value="">{isHi ? '-- खेत चुनें --' : '-- Select Field --'}</option>
                      {khets.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name} ({k.totalArea || k.area} {k.areaUnit})
                        </option>
                      ))}
                      <option value="__custom__">{isHi ? '✏️ अन्य / नया खेत नाम लिखें' : '✏️ Custom Field Name'}</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder={isHi ? 'बड़ा चक (उत्तर खेत)' : 'North Field'}
                      value={newPartner.khetName}
                      onChange={(e) => setNewPartner({ ...newPartner, khetName: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs sm:text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500"
                    />
                  )}
                  {khets.length > 0 && !newPartner.khetId && (
                    <input
                      type="text"
                      placeholder={isHi ? 'खेत का नाम लिखें' : 'Enter field name'}
                      value={newPartner.khetName}
                      onChange={(e) => setNewPartner({ ...newPartner, khetName: e.target.value, khetId: '' })}
                      className="w-full h-9 px-3 mt-1.5 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs text-[var(--sk-text)] outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-[var(--sk-muted)] mb-1 font-semibold">
                    {isHi ? 'फसल:' : 'Crop:'}
                  </label>
                  <input
                    type="text"
                    placeholder={isHi ? 'गेहूं' : 'Wheat'}
                    value={newPartner.crop}
                    onChange={(e) => setNewPartner({ ...newPartner, crop: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs sm:text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--sk-muted)] mb-1 font-semibold">
                  {isHi ? 'टिप्पणी / समझौता विवरण:' : 'Notes:'}
                </label>
                <input
                  type="text"
                  placeholder={isHi ? 'उदा. 50-50 बीज, खाद व उपज शेयर' : '50-50 crop and input share'}
                  value={newPartner.notes}
                  onChange={(e) => setNewPartner({ ...newPartner, notes: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs sm:text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-[var(--sk-border)]">
              <button
                type="button"
                onClick={() => setShowAddPartnerModal(false)}
                className="flex-1 h-10 rounded-xl border border-[var(--sk-border)] text-xs font-semibold text-[var(--sk-muted)] hover:text-[var(--sk-text)] transition cursor-pointer"
              >
                {isHi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs shadow transition cursor-pointer"
              >
                {isHi ? 'साझीदार जोड़ें' : 'Save Partner'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD CASH ENTRY MODAL */}
      {showCashEntryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowCashEntryModal(false);
          }}
        >
          <form
            onSubmit={handleSaveCashEntry}
            className="w-full max-w-md rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--sk-border)] pb-3">
              <h2 className="text-base font-bold text-[var(--sk-text)] flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-emerald-500" />
                <span>{isHi ? 'नकद लेनदेन व पेशगी दर्ज करें' : 'Record Cash Advance'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowCashEntryModal(false)}
                className="text-[var(--sk-muted)] hover:text-[var(--sk-text)] p-1 rounded-lg"
              >
                <X size={17} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--sk-muted)] mb-1 font-semibold">
                  {isHi ? 'लेनदेन प्रकार:' : 'Transaction Type:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCash({ ...newCash, type: 'gave_to_partner' })}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition cursor-pointer ${
                      newCash.type === 'gave_to_partner'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500'
                        : 'bg-[var(--sk-card2)] border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card3)]'
                    }`}
                  >
                    {isHi ? 'साझीदार को दिया (Advance)' : 'You Gave to Partner'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCash({ ...newCash, type: 'received_from_partner' })}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition cursor-pointer ${
                      newCash.type === 'received_from_partner'
                        ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500'
                        : 'bg-[var(--sk-card2)] border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card3)]'
                    }`}
                  >
                    {isHi ? 'साझीदार से लिया (Repaid)' : 'Received from Partner'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[var(--sk-muted)] mb-1 font-semibold">
                  {isHi ? 'रकम (₹):' : 'Amount (₹):'} *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="उदा. 5000"
                  value={newCash.amount}
                  onChange={(e) => setNewCash({ ...newCash, amount: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-emerald-600 dark:text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--sk-muted)] mb-1 font-semibold">
                    {isHi ? 'तारीख:' : 'Date:'}
                  </label>
                  <input
                    type="date"
                    value={newCash.date}
                    onChange={(e) => setNewCash({ ...newCash, date: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs text-[var(--sk-text)] outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[var(--sk-muted)] mb-1 font-semibold">
                    {isHi ? 'माध्यम (Mode):' : 'Payment Mode:'}
                  </label>
                  <select
                    value={newCash.mode}
                    onChange={(e) => setNewCash({ ...newCash, mode: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs text-[var(--sk-text)] outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="cash">{isHi ? 'नकद (Cash)' : 'Cash'}</option>
                    <option value="online">{isHi ? 'UPI / फोनपे' : 'Online / UPI'}</option>
                    <option value="bank">{isHi ? 'बैंक ट्रांसफर' : 'Bank Transfer'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[var(--sk-muted)] mb-1 font-semibold">
                  {isHi ? 'विवरण (टिप्पणी):' : 'Note / Purpose:'}
                </label>
                <input
                  type="text"
                  placeholder={isHi ? 'उदा. डीजल या खाद हेतु पेशगी' : 'Advance for diesel or inputs'}
                  value={newCash.note}
                  onChange={(e) => setNewCash({ ...newCash, note: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs text-[var(--sk-text)] outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-[var(--sk-border)]">
              <button
                type="button"
                onClick={() => setShowCashEntryModal(false)}
                className="flex-1 h-10 rounded-xl border border-[var(--sk-border)] text-xs font-semibold text-[var(--sk-muted)] hover:text-[var(--sk-text)] transition cursor-pointer"
              >
                {isHi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs shadow transition cursor-pointer"
              >
                {isHi ? 'दर्ज करें' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP-BY-STEP EXPLAINER MODAL */}
      <BataiSettlementExplainer
        isOpen={showExplainerModal}
        onClose={() => setShowExplainerModal(false)}
        lang={lang}
        settlement={settlement}
      />

      {/* WHATSAPP SHARE MODAL */}
      {activePartner && (
        <WhatsAppShareModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          lang={lang}
          recipientName={activePartner.name}
          defaultPhone={activePartner.phone || ''}
          fullMessage={generatePartnerWhatsAppSummary({
            partnerName: activePartner.name,
            relationshipName: getRelationshipLabel(activePartner.relationship, 'hi'),
            khetName: activePartner.khetName,
            cropName: activePartner.crop,
            sharePercent: activePartner.sharePercent,
            totalExpense: settlement.totalExpense,
            partnerCostShare: settlement.partnerCostShare,
            myExpensePaid: settlement.myExpensePaid,
            partnerExpensePaid: settlement.partnerExpensePaid,
            totalSales: settlement.totalSales,
            partnerSalesShare: settlement.partnerSalesShare,
            totalYieldQuintal: settlement.totalYieldQuintal,
            partnerYieldShareQuintal: settlement.partnerYieldShareQuintal,
            directCashGave: settlement.directCashGave,
            directCashReceived: settlement.directCashReceived,
            netBalance: settlement.netBalance,
          })}
          shortMessage={`🌾 *${activePartner.name} जी का बटाई हिसाब:* कुल बिक्री ₹${settlement.totalSales.toLocaleString('en-IN')}, आपका ${activePartner.sharePercent}% बिक्री हिस्सा ₹${settlement.partnerSalesShare.toLocaleString('en-IN')}, कुल खर्च ₹${settlement.totalExpense.toLocaleString('en-IN')} में आपका खर्च हिस्सा ₹${settlement.partnerCostShare.toLocaleString('en-IN')}, नकद पेशगी ₹${settlement.directCashGave.toLocaleString('en-IN')}।\n👉 *अंतिम फैसला:* ${
            settlement.netBalance > 0
              ? `साझीदार से ₹${settlement.netBalance.toLocaleString('en-IN')} लेने हैं`
              : settlement.netBalance < 0
              ? `साझीदार को ₹${Math.abs(settlement.netBalance).toLocaleString('en-IN')} देने हैं`
              : 'हिसाब चुकता (₹0)'
          }`}
        />
      )}
    </div>
  );
}