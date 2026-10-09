"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Sprout } from "lucide-react";

import type { FarmRecord, Lang } from "../../lib/types";
import { FARM_STRINGS } from "../../lib/farmI18n";
import { FarmForm } from "./FarmForm";
import { Khet } from "./FarmSection";

interface KhetDetailProps {
  lang: Lang;
  khet: Khet;
  records: FarmRecord[];
  setRecords: React.Dispatch<React.SetStateAction<FarmRecord[]>>;
  onBack: () => void;
  onDeleteKhet: () => void;
}

export function KhetDetail({
  lang,
  khet,
  records,
  setRecords,
  onBack,
  onDeleteKhet,
}: KhetDetailProps) {
  const farmT = FARM_STRINGS[lang];
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FarmRecord | null>(null);

  const khetRecords = useMemo(() => {
    return records.filter(
      (record) =>
        (record.field || "").trim().toLowerCase() ===
        khet.name.trim().toLowerCase()
    );
  }, [records, khet.name]);

  const getExpenseAmount = (record: FarmRecord) => {
    if (record.type !== "Expense") return 0;
    const quantity = Number(record.quantity || 0);
    const price = Number(record.price || 0);
    const calculated = quantity * price;
    return calculated > 0 ? calculated : Number(record.amount || 0);
  };

  const getSaleAmount = (record: FarmRecord) => {
    if (record.type !== "Sale") return 0;
    const quantity = Number(record.quantity || 0);
    const price = Number(record.price || 0);
    const calculated = quantity * price;
    return calculated > 0 ? calculated : Number(record.amount || 0);
  };

  const totalExpense = useMemo(() => {
    return khetRecords
      .filter((record) => record.type === "Expense")
      .reduce((sum, record) => sum + getExpenseAmount(record), 0);
  }, [khetRecords]);

  const totalIncome = useMemo(() => {
    return khetRecords
      .filter((record) => record.type === "Sale")
      .reduce((sum, record) => sum + getSaleAmount(record), 0);
  }, [khetRecords]);

  const profit = totalIncome - totalExpense;

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
      field: khet.name,
      crop: khet.crop,
      area: khet.area,
      areaUnit: khet.areaUnit,
    };

    setRecords((current) => {
      const exists = current.some((item) => item.id === fixedRecord.id);
      if (exists) {
        return current.map((item) =>
          item.id === fixedRecord.id ? fixedRecord : item
        );
      }
      return [fixedRecord, ...current];
    });

    setEditingRecord(null);
    setShowForm(false);
  };

  if (showForm) {
    return (
      <div className="w-full max-w-[900px] mx-auto px-3 sm:px-5 pb-8">
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--sk-text)] hover:text-green-400 cursor-pointer"
        >
          <ArrowLeft size={18} />
          {lang === "hi" ? "खेत पर वापस" : "Back to Field"}
        </button>

        <FarmForm
          lang={lang}
          farmT={farmT}
          editingRecord={editingRecord}
          fixedKhet={khet}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1000px] mx-auto px-3 sm:px-5 lg:px-6 pb-10">
      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--sk-text)] hover:text-green-400 transition cursor-pointer"
        >
          <ArrowLeft size={20} />
          <span className="text-lg">{khet.name}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEditingRecord(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition cursor-pointer"
        >
          <Plus size={16} />
          {lang === "hi" ? "लेन-देन जोड़ें" : "Add Entry"}
        </button>
      </div>

      {/* KHET INFO CARD */}
      <div className="mb-4 rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-500/15 border border-green-500/25">
            <Sprout size={22} className="text-green-400" />
          </div>
          <div>
            <div className="text-base font-bold text-[var(--sk-text)]">{khet.name}</div>
            <div className="text-xs text-[var(--sk-muted)] mt-0.5">
              🌾 {khet.crop} • 📐 {khet.area} {khet.areaUnit}
              {khet.sowingDate && ` • 🌱 रोपण: ${khet.sowingDate}`}
            </div>
          </div>
        </div>
      </div>

      {/* KPI STATS */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-3">
          <div className="text-[11px] text-[var(--sk-dim)]">{lang === "hi" ? "कुल आय" : "Total Income"}</div>
          <div className="mt-1 text-base sm:text-lg font-bold font-mono text-green-400">
            ₹{totalIncome.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-3">
          <div className="text-[11px] text-[var(--sk-dim)]">{lang === "hi" ? "कुल खर्च" : "Total Expense"}</div>
          <div className="mt-1 text-base sm:text-lg font-bold font-mono text-red-400">
            ₹{totalExpense.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-3">
          <div className="text-[11px] text-[var(--sk-dim)]">{lang === "hi" ? "लाभ / हानि" : "Net Profit"}</div>
          <div className={`mt-1 text-base sm:text-lg font-bold font-mono ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
            ₹{profit.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* TRANSACTIONS */}
      <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--sk-border)] px-4 py-3 bg-[var(--sk-card2)]">
          <div className="font-bold text-sm text-[var(--sk-text)]">
            {lang === "hi" ? "खेत के लेन-देन" : "Field Transactions"}
          </div>
          <div className="text-xs text-[var(--sk-dim)] font-mono">
            {khetRecords.length} {lang === "hi" ? "रिकॉर्ड" : "entries"}
          </div>
        </div>

        {khetRecords.length === 0 ? (
          <div className="py-12 text-center">
            <Sprout size={32} className="mx-auto mb-2 text-[var(--sk-dim)] opacity-60" />
            <div className="text-sm font-semibold text-[var(--sk-muted)]">
              {lang === "hi" ? "इस खेत में अभी कोई लेन-देन नहीं है" : "No transactions yet"}
            </div>
            <p className="text-xs text-[var(--sk-dim)] mt-1">
              {lang === "hi" ? "बीज, खाद, मजदूरी या बिक्री जोड़ने के लिए ऊपर बटन दबाएं।" : "Tap Add Entry above to add seed, fertilizer or sales."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {khetRecords.map((record) => {
              const amount =
                record.type === "Expense"
                  ? getExpenseAmount(record)
                  : record.type === "Sale"
                  ? getSaleAmount(record)
                  : 0;

              const isIncome = record.type === "Sale";

              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-[var(--sk-text)]">
                      {record.type === "Expense"
                        ? record.expenseCategory || "खर्च"
                        : record.type === "Sale"
                        ? "फसल बिक्री"
                        : "उत्पादन"}
                    </div>

                    <div className="mt-0.5 text-xs text-[var(--sk-muted)] truncate">
                      {record.date} {record.note ? `• ${record.note}` : ""}
                    </div>

                    {record.quantity ? (
                      <div className="mt-0.5 text-[11px] text-[var(--sk-faint)]">
                        {record.quantity} {record.unit}
                        {record.price ? ` × ₹${Number(record.price).toLocaleString("en-IN")}` : ""}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {amount > 0 ? (
                        <div className={`font-bold font-mono text-sm ${isIncome ? "text-green-400" : "text-red-400"}`}>
                          {isIncome ? "+" : "-"}₹{amount.toLocaleString("en-IN")}
                        </div>
                      ) : (
                        <div className="text-xs text-yellow-400 font-bold">
                          {record.quantity} {record.unit}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(record)}
                        className="rounded-lg px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                      >
                        {lang === "hi" ? "बदलें" : "Edit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(record.id)}
                        className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 cursor-pointer"
                      >
                        {lang === "hi" ? "हटाएं" : "Del"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DELETE KHET ACTION */}
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onDeleteKhet}
          className="text-xs font-semibold text-red-400 hover:underline cursor-pointer"
        >
          ⚠️ {lang === "hi" ? "यह खेत (Khet) हटाएं" : "Delete this field"}
        </button>
      </div>
    </div>
  );
}
