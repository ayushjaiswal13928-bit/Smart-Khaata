"use client";

import type { Dispatch, SetStateAction } from "react";
import { fmt } from "../../lib/utils";
import { FormCard, InputGroup, KpiBox, selectCls } from "../common/UI";
import { Lang } from "../../lib/types";
import { FARM_STRINGS, unitLabel, cropLabel } from "../../lib/farmI18n";

interface FarmSummaryProps {
  lang: Lang;
  totalExpense: number;
  totalSales: number;
  totalYield: number;
  profit: number;
  pieData: {
    name: string;
    value: number;
  }[];
  cropStats: {
    expense: number;
    sale: number;
    yieldQty: number;
    profit: number;
    yieldUnit?: string;
  };
  selectedCrop: string;
  setSelectedCrop: Dispatch<SetStateAction<string>>;
  crops: string[];
  chartData: {
    month: string;
    farm: number;
  }[];
  pieColors: string[];
}

export function FarmSummary({
  lang,
  totalExpense,
  totalSales,
  totalYield,
  profit,
  pieData,
  chartData,
  pieColors,
  selectedCrop,
  setSelectedCrop,
  crops,
  cropStats,
}: FarmSummaryProps) {
  const farmT = FARM_STRINGS[lang];
  const isHi = lang === "hi";

  const expenseBarPct = Math.min(Math.max((totalExpense / 100000) * 100, 0), 100);
  const salesBarPct = Math.min(Math.max((totalSales / 100000) * 100, 0), 100);

  const totalPie = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4">
      {/* KPIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiBox
          label={farmT.totalExpense}
          value={fmt(totalExpense)}
          bar
          barPct={expenseBarPct}
        />
        <KpiBox
          label={farmT.totalSales}
          value={fmt(totalSales)}
          bar
          barPct={salesBarPct}
        />
        <KpiBox
          label={farmT.profit}
          value={fmt(profit)}
          green={profit >= 0}
        />
        <KpiBox
          label={farmT.totalYield}
          value={`${totalYield.toFixed(1)} Kg`}
        />
      </div>

      {/* CROP AND EXPENSE BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* EXPENSE CATEGORIES */}
        <FormCard>
          <div className="text-xs font-bold text-[var(--sk-text)] mb-3">
            {isHi ? "खर्च का विवरण (श्रेणी अनुसार)" : "Expense by Category"}
          </div>

          {pieData.length > 0 ? (
            <div className="space-y-2.5">
              {pieData.map((item, idx) => {
                const pct = totalPie > 0 ? Math.round((item.value / totalPie) * 100) : 0;
                const color = pieColors[idx % pieColors.length];
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[var(--sk-muted)]">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                        {item.name}
                      </span>
                      <span className="font-mono font-semibold text-[var(--sk-text)]">
                        {fmt(item.value)} <span className="text-[10px] text-[var(--sk-faint)]">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[var(--sk-dim)]">
              {isHi ? "अभी कोई खर्च दर्ज नहीं है" : "No expense data"}
            </div>
          )}
        </FormCard>

        {/* CROP STATS */}
        <FormCard>
          <div className="text-xs font-bold text-[var(--sk-text)] mb-3">
            {isHi ? "फसल अनुसार लाभ-हानि" : "Crop Profit & Yield"}
          </div>

          <InputGroup label={farmT.crop}>
            <select
              className={selectCls}
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
            >
              {crops.map((c) => (
                <option key={c} value={c}>
                  {cropLabel(lang, c)} ({c})
                </option>
              ))}
            </select>
          </InputGroup>

          <div className="mt-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] p-3 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-[var(--sk-muted)]">💸 {farmT.expense}</span>
              <span className="font-mono font-semibold text-red-400">{fmt(cropStats.expense)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-[var(--sk-muted)]">🛒 {farmT.sale}</span>
              <span className="font-mono font-semibold text-green-400">{fmt(cropStats.sale)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-[var(--sk-muted)]">🌾 {farmT.yield}</span>
              <span className="font-mono font-semibold text-yellow-400">
                {cropStats.yieldQty} {unitLabel(lang, cropStats.yieldUnit || "Kg")}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 font-bold">
              <span>📈 {farmT.profit}</span>
              <span className={`font-mono text-sm ${cropStats.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {fmt(cropStats.profit)}
              </span>
            </div>
          </div>
        </FormCard>
      </div>

      {/* MONTHLY MINI CHART */}
      {chartData.length > 0 && (
        <FormCard>
          <div className="text-xs font-bold text-[var(--sk-text)] mb-2">
            {isHi ? "मासिक खेती बैलेंस" : "Monthly Farm Balance"}
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 items-end h-24 pt-4">
            {chartData.map((d) => {
              const max = Math.max(...chartData.map((x) => Math.abs(x.farm)), 1000);
              const heightPct = Math.min(100, Math.max(10, Math.round((Math.abs(d.farm) / max) * 80)));
              const isPositive = d.farm >= 0;
              return (
                <div key={d.month} className="flex flex-col items-center h-full justify-end group">
                  <div
                    className={`w-full max-w-[20px] rounded-t transition-all ${
                      isPositive ? "bg-green-500/80 group-hover:bg-green-400" : "bg-red-500/80 group-hover:bg-red-400"
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${d.month}: ${fmt(d.farm)}`}
                  />
                  <span className="text-[9px] text-[var(--sk-dim)] mt-1 truncate max-w-full">
                    {d.month}
                  </span>
                </div>
              );
            })}
          </div>
        </FormCard>
      )}
    </div>
  );
}
