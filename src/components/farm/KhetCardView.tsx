'use client';

import React from 'react';
import {
  Sprout,
  Plus,
  Eye,
  TrendingDown,
  TrendingUp,
  Warehouse,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { FarmRecord, Khet, KhetCrop, Lang } from '../../lib/types';
import { cropLabel } from '../../lib/farmI18n';
import { calculateCropFinancials, calculateKhetFinancials } from '../../lib/farmAccounting';
import { LandUnitSettings, formatDualArea } from '../../lib/landMeasurement';

interface KhetCardViewProps {
  khet: Khet;
  khetCrops: KhetCrop[];
  records: FarmRecord[];
  lang: Lang;
  landSettings: LandUnitSettings;
  onOpenKhetDetail: (khetId: string, filterCropName?: string) => void;
  onAddCrop: (khet: Khet) => void;
  onAddExpenseForCrop: (khet: Khet, crop: KhetCrop) => void;
  onAddHarvestForCrop: (khet: Khet, crop: KhetCrop) => void;
  onAddSaleForCrop: (khet: Khet, crop: KhetCrop) => void;
}

export function KhetCardView({
  khet,
  khetCrops,
  records,
  lang,
  landSettings,
  onOpenKhetDetail,
  onAddCrop,
  onAddExpenseForCrop,
  onAddHarvestForCrop,
  onAddSaleForCrop,
}: KhetCardViewProps) {
  const isHi = lang === 'hi';

  const cropsInKhet = khetCrops.filter((c) => c.khetId === khet.id);

  const displayCrops: KhetCrop[] =
    cropsInKhet.length > 0
      ? cropsInKhet
      : [
          {
            id: `crop-${khet.id}-default`,
            khetId: khet.id,
            cropName: khet.crop || 'Wheat',
            cropNameHi: cropLabel(lang, khet.crop || 'Wheat'),
            season: khet.season || 'Rabi 2026',
            sowingDate: khet.sowingDate || new Date().toISOString().slice(0, 10),
            allocatedArea: khet.totalArea || khet.area || 1,
            areaUnit: khet.areaUnit || 'बीघा',
            status: 'growing',
          },
        ];

  const khetFinancials = calculateKhetFinancials(records, khet, displayCrops);
  const dualArea = formatDualArea(khet.totalArea || khet.area, khet.areaUnit, landSettings, lang);

  const getStatusBadge = (status: KhetCrop['status']) => {
    switch (status) {
      case 'sown':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            {isHi ? '🌱 बोई गई' : 'Sown'}
          </span>
        );
      case 'harvested':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            {isHi ? '✅ कटाई पूर्ण' : 'Harvested'}
          </span>
        );
      case 'growing':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            {isHi ? '🌾 तैयार हो रही' : 'Growing'}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-4 sm:p-5 shadow-sm space-y-4 transition hover:border-emerald-500/40">
      {/* 1. KHET MASTER HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--sk-border)] pb-3.5">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
            <Sprout size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[var(--sk-text)] flex items-center gap-2">
                {khet.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30">
                {dualArea.label}
              </span>
            </div>
            <div className="text-xs text-[var(--sk-muted)] mt-1 flex flex-wrap items-center gap-2">
              {khet.soilType && <span>🟤 {khet.soilType}</span>}
              {khet.irrigationSource && <span>💧 {khet.irrigationSource}</span>}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {displayCrops.length} {isHi ? 'फसलें दर्ज' : 'Crops recorded'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onAddCrop(khet)}
            className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Plus size={15} />
            <span>{isHi ? ' फसल जोड़ें' : ' Add Crop'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenKhetDetail(khet.id)}
            className="px-3.5 py-2 rounded-xl bg-[var(--sk-card2)] hover:bg-[var(--sk-card3)] border border-[var(--sk-border)] text-[var(--sk-text)] text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <span>{isHi ? 'खाता विवरण' : 'Ledger'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 2. KHET FINANCIAL SUMMARY STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-[var(--sk-card2)] p-2.5 sm:p-3 rounded-xl border border-[var(--sk-border)] text-xs">
        <div>
          <span className="text-[10px] text-[var(--sk-muted)] font-medium">{isHi ? 'कुल खर्च (लागत)' : 'Total Cost'}</span>
          <div className="text-sm font-bold font-mono text-red-500 mt-0.5">
            ₹{khetFinancials.totalExpense.toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-[var(--sk-muted)] font-medium">{isHi ? 'कुल बिक्री' : 'Total Sales'}</span>
          <div className="text-sm font-bold font-mono text-[var(--sk-text)] mt-0.5">
            ₹{khetFinancials.totalSales.toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-[var(--sk-muted)] font-medium">{isHi ? 'प्राप्त नकद' : 'Received'}</span>
          <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            ₹{khetFinancials.paymentReceived.toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-[var(--sk-muted)] font-medium">{isHi ? 'बकाया उधारी' : 'Pending Due'}</span>
          <div className={`text-sm font-bold font-mono mt-0.5 ${khetFinancials.pendingDue > 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-[var(--sk-muted)]'}`}>
            ₹{khetFinancials.pendingDue.toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-[var(--sk-muted)] font-bold">{isHi ? 'शुद्ध लाभ' : 'Net Profit'}</span>
          <div
            className={`text-sm font-bold font-mono mt-0.5 ${
              khetFinancials.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            }`}
          >
            {khetFinancials.netProfit >= 0 ? '+' : ''}₹{khetFinancials.netProfit.toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-[var(--sk-muted)] font-medium">{isHi ? 'उपज / बचा स्टॉक' : 'Yield / Stock'}</span>
          <div className="text-xs font-bold font-mono text-[var(--sk-text)] mt-0.5 truncate">
            {khetFinancials.totalHarvestYieldQuintal} Qtl /{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{khetFinancials.totalRemainingStockQuintal} Qtl</span>
          </div>
        </div>
      </div>

      {/* 3. CROPS INSIDE THIS KHET */}
      <div>
        <div className="text-xs font-bold text-[var(--sk-text)] mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers size={14} className="text-emerald-500" />
            <span>{isHi ? 'इस खेत की फसलें (Crops in this Field):' : 'Crops planted in this field:'}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {displayCrops.map((crop) => {
            const fin = calculateCropFinancials(records, crop, khet);
            return (
              <div
                key={crop.id}
                className="p-3.5 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold">
                      🌾
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--sk-text)]">
                        {cropLabel(lang, crop.cropName)}
                      </h4>
                      <div className="text-[11px] text-[var(--sk-muted)] flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {crop.allocatedArea} {crop.areaUnit || khet.areaUnit}
                        </span>
                        <span>•</span>
                        <span>{crop.season}</span>
                      </div>
                    </div>
                  </div>
                  <div>{getStatusBadge(crop.status)}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[var(--sk-card2)] p-2 rounded-lg text-center text-xs border border-[var(--sk-border)]">
                  <div>
                    <span className="text-[10px] text-[var(--sk-muted)] block">{isHi ? 'लागत' : 'Cost'}</span>
                    <span className="font-mono font-bold text-red-500 mt-0.5 block">
                      ₹{fin.totalExpense.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--sk-muted)] block">{isHi ? 'बिक्री' : 'Sale'}</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">
                      ₹{fin.totalSales.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--sk-muted)] block font-semibold">{isHi ? 'मुनाफा' : 'Profit'}</span>
                    <span
                      className={`font-mono font-bold mt-0.5 block ${
                        fin.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                      }`}
                    >
                      {fin.netProfit >= 0 ? '+' : ''}₹{fin.netProfit.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-[var(--sk-border)]">
                  <button
                    type="button"
                    onClick={() => onOpenKhetDetail(khet.id, crop.cropName)}
                    className="py-2 px-1 rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card2)] hover:bg-[var(--sk-card3)] text-[var(--sk-text)] text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <Eye size={14} className="text-emerald-500" />
                    <span>{isHi ? 'विवरण' : 'View'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddExpenseForCrop(khet, crop)}
                    className="py-2 px-1 rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card2)] hover:bg-[var(--sk-card3)] text-[var(--sk-text)] text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <TrendingDown size={14} className="text-red-500" />
                    <span>{isHi ? '+ खर्च' : '+ Cost'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddHarvestForCrop(khet, crop)}
                    className="py-2 px-1 rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card2)] hover:bg-[var(--sk-card3)] text-[var(--sk-text)] text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <Warehouse size={14} className="text-cyan-500" />
                    <span>{isHi ? '+ कटाई' : '+ Yield'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddSaleForCrop(khet, crop)}
                    className="py-2 px-1 rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card2)] hover:bg-[var(--sk-card3)] text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <TrendingUp size={14} className="text-emerald-500" />
                    <span>{isHi ? '+ बिक्री' : '+ Sale'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
