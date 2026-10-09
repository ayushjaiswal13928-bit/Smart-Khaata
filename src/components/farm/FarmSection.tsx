"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  MoreVertical,
  Plus,
  Sprout,
  Wheat,
  X,
  ListFilter,
  BarChart3,
  Layers,
} from "lucide-react";

import type { FarmRecord, Lang } from "../../lib/types";
import { FARM_STRINGS, cropLabel } from "../../lib/farmI18n";
import { KhetDetail } from "./KhetDetail";
import { FarmTable } from "./FarmTable";
import { FarmSummary } from "./FarmSummary";
import { FarmForm } from "./FarmForm";

export interface Khet {
  id: string;
  name: string;
  crop: string;
  area: number;
  areaUnit: string;
  sowingDate: string;
  expectedHarvestDate: string;
}

interface FarmSectionProps {
  records: FarmRecord[];
  setRecords: React.Dispatch<React.SetStateAction<FarmRecord[]>>;
  lang: Lang;
}

const KHET_STORAGE_KEY = "smart-khaata-khets-v1";

const CROP_OPTIONS = [
  "Wheat",
  "Rice",
  "Soybean",
  "Cotton",
  "Mustard",
  "Groundnut",
  "Gram",
  "Garlic",
  "Maize",
  "Other",
];

const AREA_UNITS = ["बीघा", "एकड़", "हेक्टेयर"];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function readKhets(): Khet[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(KHET_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export function FarmSection({ records, setRecords, lang }: FarmSectionProps) {
  const farmT = FARM_STRINGS[lang];
  const isHi = lang === "hi";

  const [activeTab, setActiveTab] = useState<"khets" | "records" | "summary">("khets");
  const [khets, setKhets] = useState<Khet[]>([]);
  const [selectedKhetId, setSelectedKhetId] = useState<string | null>(null);
  const [showAddKhet, setShowAddKhet] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Standalone record form modal for All Records tab
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FarmRecord | null>(null);

  // Filters for Table
  const [cropSearch, setCropSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | FarmRecord["type"]>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "month" | "year">("all");
  const [selectedSummaryCrop, setSelectedSummaryCrop] = useState("Wheat");

  const [newKhet, setNewKhet] = useState({
    name: "",
    crop: "Wheat",
    area: "3",
    areaUnit: "बीघा",
    sowingDate: getToday(),
    expectedHarvestDate: "",
  });

  // Load Khets
  useEffect(() => {
    const savedKhets = readKhets();
    const oldFields = Array.from(
      new Set(
        records
          .map((r) => r.field?.trim())
          .filter((f): f is string => Boolean(f))
      )
    );

    const existingNames = new Set(savedKhets.map((k) => k.name.trim().toLowerCase()));
    const migrated: Khet[] = [...savedKhets];

    oldFields.forEach((field) => {
      if (existingNames.has(field.toLowerCase())) return;
      const firstRecord = records.find((r) => r.field?.trim() === field);
      migrated.push({
        id: `khet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: field,
        crop: firstRecord?.crop || "Wheat",
        area: Number(firstRecord?.area || 0),
        areaUnit: firstRecord?.areaUnit || "बीघा",
        sowingDate: firstRecord?.date || getToday(),
        expectedHarvestDate: "",
      });
    });

    // Provide a default sample Khet if completely empty
    if (migrated.length === 0) {
      migrated.push({
        id: "khet-sample-1",
        name: "खेत 1 (बड़ा खेत)",
        crop: "Wheat",
        area: 4,
        areaUnit: "बीघा",
        sowingDate: getToday(),
        expectedHarvestDate: "",
      });
    }

    setKhets(migrated);
    localStorage.setItem(KHET_STORAGE_KEY, JSON.stringify(migrated));
  }, [records]);

  // Persist Khets
  useEffect(() => {
    if (typeof window === "undefined" || khets.length === 0) return;
    localStorage.setItem(KHET_STORAGE_KEY, JSON.stringify(khets));
  }, [khets]);

  const getExpenseAmount = useCallback((record: FarmRecord) => {
    if (record.type !== "Expense") return 0;
    const quantity = Number(record.quantity || 0);
    const price = Number(record.price || 0);
    const calculated = quantity * price;
    return calculated > 0 ? calculated : Number(record.amount || 0);
  }, []);

  const getSaleAmount = useCallback((record: FarmRecord) => {
    if (record.type !== "Sale") return 0;
    const quantity = Number(record.quantity || 0);
    const price = Number(record.price || 0);
    const calculated = quantity * price;
    return calculated > 0 ? calculated : Number(record.amount || 0);
  }, []);

  const getKhetRecords = useCallback(
    (khet: Khet) => {
      return records.filter(
        (r) => r.field?.trim().toLowerCase() === khet.name.trim().toLowerCase()
      );
    },
    [records]
  );

  const addKhet = () => {
    const name = newKhet.name.trim();
    if (!name) {
      alert(isHi ? "खेत का नाम लिखें।" : "Please enter field name.");
      return;
    }

    const created: Khet = {
      id: `khet-${Date.now()}`,
      name,
      crop: newKhet.crop,
      area: Number(newKhet.area || 0),
      areaUnit: newKhet.areaUnit,
      sowingDate: newKhet.sowingDate,
      expectedHarvestDate: newKhet.expectedHarvestDate,
    };

    setKhets((cur) => [created, ...cur]);
    setNewKhet({
      name: "",
      crop: "Wheat",
      area: "3",
      areaUnit: "बीघा",
      sowingDate: getToday(),
      expectedHarvestDate: "",
    });
    setShowAddKhet(false);
    setSelectedKhetId(created.id);
  };

  const deleteKhet = (khet: Khet) => {
    setKhets((cur) => cur.filter((k) => k.id !== khet.id));
    setOpenMenuId(null);
    setSelectedKhetId(null);
  };

  // Totals
  const allTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let yieldKg = 0;

    records.forEach((r) => {
      if (r.type === "Expense") expense += getExpenseAmount(r);
      if (r.type === "Sale") income += getSaleAmount(r);
      if (r.type === "Yield") {
        const qty = Number(r.quantity || 0);
        if (r.unit === "Quintal") yieldKg += qty * 100;
        else if (r.unit === "Ton") yieldKg += qty * 1000;
        else yieldKg += qty;
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
      yieldKg,
    };
  }, [records, getExpenseAmount, getSaleAmount]);

  // Filtered records for table
  const filteredRecords = useMemo(() => {
    const today = getToday();
    const thisMonth = today.slice(0, 7);
    const thisYear = today.slice(0, 4);

    return records.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (cropSearch.trim() && !r.crop.toLowerCase().includes(cropSearch.toLowerCase())) {
        return false;
      }
      if (dateFilter === "today" && r.date !== today) return false;
      if (dateFilter === "month" && !r.date.startsWith(thisMonth)) return false;
      if (dateFilter === "year" && !r.date.startsWith(thisYear)) return false;
      return true;
    });
  }, [records, typeFilter, cropSearch, dateFilter]);

  // Pie Data for Summary
  const pieData = useMemo(() => {
    const cats: Record<string, number> = {};
    records.forEach((r) => {
      if (r.type === "Expense") {
        const cat = r.expenseCategory || "अन्य";
        cats[cat] = (cats[cat] || 0) + getExpenseAmount(r);
      }
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [records, getExpenseAmount]);

  // Crop Stats for Summary
  const cropStats = useMemo(() => {
    const cropRecs = records.filter((r) => r.crop === selectedSummaryCrop);
    let exp = 0;
    let sl = 0;
    let yld = 0;
    cropRecs.forEach((r) => {
      if (r.type === "Expense") exp += getExpenseAmount(r);
      if (r.type === "Sale") sl += getSaleAmount(r);
      if (r.type === "Yield") yld += Number(r.quantity || 0);
    });
    return {
      expense: exp,
      sale: sl,
      yieldQty: yld,
      profit: sl - exp,
      yieldUnit: "Quintal",
    };
  }, [records, selectedSummaryCrop, getExpenseAmount, getSaleAmount]);

  // Monthly Chart Data
  const chartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const curYear = new Date().getFullYear();
    return months.map((m, idx) => {
      const monthPrefix = `${curYear}-${String(idx + 1).padStart(2, "0")}`;
      const sales = records
        .filter((r) => r.type === "Sale" && r.date.startsWith(monthPrefix))
        .reduce((sum, r) => sum + getSaleAmount(r), 0);
      const exps = records
        .filter((r) => r.type === "Expense" && r.date.startsWith(monthPrefix))
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
        onBack={() => setSelectedKhetId(null)}
        onDeleteKhet={() => deleteKhet(selectedKhet)}
      />
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-5 lg:px-6 pb-12">
      {/* SECTION HEADER */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--sk-text)] flex items-center gap-2">
            <Wheat className="text-green-500" size={24} />
            {isHi ? "खेती व फसल प्रबंधन" : "Farm & Crop Manager"}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--sk-muted)] mt-0.5">
            {isHi ? "खेत (Khet), बीज, खाद, बिक्री और उपज का पूरा लेखा-जोखा" : "Khets, seeds, fertilizers, sales & yield tracking"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setOpenMenuId(null);
            setShowAddKhet(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md active:scale-95 transition cursor-pointer"
        >
          <Plus size={17} />
          {isHi ? "नया खेत जोड़ें" : "Add Field (Khet)"}
        </button>
      </div>

      {/* TOP KPI CARDS */}
      <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-3.5 shadow-sm">
          <p className="text-[11px] text-[var(--sk-dim)]">{isHi ? "कुल बिक्री" : "Total Sales"}</p>
          <p className="mt-1 text-lg sm:text-xl font-bold font-mono text-green-400">{money(allTotals.income)}</p>
        </div>

        <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-3.5 shadow-sm">
          <p className="text-[11px] text-[var(--sk-dim)]">{isHi ? "कुल खर्च" : "Total Expense"}</p>
          <p className="mt-1 text-lg sm:text-xl font-bold font-mono text-red-400">{money(allTotals.expense)}</p>
        </div>

        <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-3.5 shadow-sm">
          <p className="text-[11px] text-[var(--sk-dim)]">{isHi ? "खेती शुद्ध मुनाफा" : "Net Profit"}</p>
          <p className={`mt-1 text-lg sm:text-xl font-bold font-mono ${allTotals.balance >= 0 ? "text-green-400" : "text-red-400"}`}>
            {money(allTotals.balance)}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-3.5 shadow-sm">
          <p className="text-[11px] text-[var(--sk-dim)]">{isHi ? "कुल खेत (Khets)" : "Total Fields"}</p>
          <p className="mt-1 text-lg sm:text-xl font-bold font-mono text-cyan-400">{khets.length}</p>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="mb-5 flex rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] p-1 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("khets")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === "khets" ? "bg-green-500 text-white shadow" : "text-[var(--sk-muted)] hover:text-white"
          }`}
        >
          <Layers size={14} />
          {isHi ? "खेत (Khets)" : "Fields"}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("records")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === "records" ? "bg-green-500 text-white shadow" : "text-[var(--sk-muted)] hover:text-white"
          }`}
        >
          <ListFilter size={14} />
          {isHi ? "सभी रिकॉर्ड" : "All Records"}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === "summary" ? "bg-green-500 text-white shadow" : "text-[var(--sk-muted)] hover:text-white"
          }`}
        >
          <BarChart3 size={14} />
          {isHi ? "एनालिटिक्स" : "Analytics"}
        </button>
      </div>

      {/* TAB 1: KHET LIST */}
      {activeTab === "khets" && (
        <div className="space-y-4">
          {khets.length === 0 ? (
            <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-10 text-center shadow-sm">
              <Sprout className="mx-auto mb-3 h-10 w-10 text-green-500 opacity-60" />
              <h2 className="text-base font-bold text-[var(--sk-text)]">
                {isHi ? "अभी कोई खेत नहीं जोड़ा गया है" : "No field added yet"}
              </h2>
              <p className="text-xs text-[var(--sk-muted)] mt-1">
                {isHi ? "ऊपर 'नया खेत जोड़ें' बटन दबाकर पहला खेत दर्ज करें।" : "Tap Add Field above to create your first Khet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {khets.map((khet) => {
                const khetRecords = getKhetRecords(khet);
                const income = khetRecords.reduce((sum, r) => sum + getSaleAmount(r), 0);
                const expense = khetRecords.reduce((sum, r) => sum + getExpenseAmount(r), 0);
                const khetProfit = income - expense;

                return (
                  <div
                    key={khet.id}
                    onClick={() => setSelectedKhetId(khet.id)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-5 shadow-sm hover:border-green-500/40 hover:shadow-lg transition-all"
                  >
                    {/* Top strip */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🌾</span>
                          <h3 className="truncate text-base sm:text-lg font-bold text-[var(--sk-text)] group-hover:text-green-400 transition">
                            {khet.name}
                          </h3>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--sk-muted)]">
                          <span className="rounded-md bg-green-500/10 px-2 py-0.5 font-semibold text-green-400">
                            {cropLabel(lang, khet.crop)}
                          </span>
                          <span>•</span>
                          <span>{khet.area} {khet.areaUnit}</span>
                          {khet.sowingDate && (
                            <>
                              <span>•</span>
                              <span>🌱 {khet.sowingDate}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-xs text-green-400 font-semibold group-hover:translate-x-0.5 transition flex items-center">
                          {isHi ? "खाता देखें" : "View"} <ChevronRight size={15} />
                        </span>
                      </div>
                    </div>

                    <div className="my-3.5 h-px bg-white/5" />

                    {/* Stats summary */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-[var(--sk-dim)]">{isHi ? "बिक्री" : "Sales"}</div>
                        <div className="font-bold font-mono text-green-400 mt-0.5">{money(income)}</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-[var(--sk-dim)]">{isHi ? "खर्च" : "Expense"}</div>
                        <div className="font-bold font-mono text-red-400 mt-0.5">{money(expense)}</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-[var(--sk-dim)]">{isHi ? "मुनाफा" : "Profit"}</div>
                        <div className={`font-bold font-mono mt-0.5 ${khetProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {money(khetProfit)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL RECORDS TABLE */}
      {activeTab === "records" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--sk-muted)]">
              {isHi ? "सभी खेतों के कुल लेन-देन:" : "All field transactions:"} {filteredRecords.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setShowRecordForm(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition cursor-pointer"
            >
              <Plus size={14} />
              {isHi ? "नया रिकॉर्ड जोड़ें" : "New Entry"}
            </button>
          </div>

          <FarmTable
            filteredRecords={filteredRecords}
            lang={lang}
            cropSearch={cropSearch}
            setCropSearch={setCropSearch}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            onEdit={(record) => {
              setEditingRecord(record);
              setShowRecordForm(true);
            }}
            onDelete={(id) => {
              setRecords((cur) => cur.filter((r) => r.id !== id));
            }}
          />
        </div>
      )}

      {/* TAB 3: ANALYTICS & SUMMARY */}
      {activeTab === "summary" && (
        <FarmSummary
          lang={lang}
          totalExpense={allTotals.expense}
          totalSales={allTotals.income}
          totalYield={allTotals.yieldKg}
          profit={allTotals.balance}
          pieData={pieData}
          chartData={chartData}
          pieColors={["#ef4444", "#f97316", "#eab308", "#10b981", "#06b6d4", "#6366f1", "#a855f7"]}
          selectedCrop={selectedSummaryCrop}
          setSelectedCrop={setSelectedSummaryCrop}
          crops={CROP_OPTIONS.map((c) => c)}
          cropStats={cropStats}
        />
      )}

      {/* RECORD FORM MODAL */}
      {showRecordForm && (
        <FarmForm
          lang={lang}
          farmT={farmT}
          editingRecord={editingRecord}
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
          }}
          onCancel={() => {
            setShowRecordForm(false);
            setEditingRecord(null);
          }}
        />
      )}

      {/* ADD KHET MODAL */}
      {showAddKhet && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAddKhet(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--sk-border)] pb-3">
              <h2 className="text-base font-bold text-[var(--sk-text)] flex items-center gap-2">
                🌾 {isHi ? "नया खेत (Khet) जोड़ें" : "Add New Field (Khet)"}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddKhet(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--sk-muted)] hover:bg-white/5 cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                  {isHi ? "खेत का नाम" : "Field Name"} *
                </label>
                <input
                  type="text"
                  value={newKhet.name}
                  onChange={(e) => setNewKhet((c) => ({ ...c, name: e.target.value }))}
                  placeholder={isHi ? "जैसे: बड़ा खेत, नलकूप वाला खेत..." : "e.g. Field 1..."}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                  {isHi ? "बोई गई फसल" : "Crop"}
                </label>
                <select
                  value={newKhet.crop}
                  onChange={(e) => setNewKhet((c) => ({ ...c, crop: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none"
                >
                  {CROP_OPTIONS.map((crop) => (
                    <option key={crop} value={crop}>
                      {cropLabel(lang, crop)} ({crop})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi ? "रकबा (Area)" : "Area"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newKhet.area}
                    onChange={(e) => setNewKhet((c) => ({ ...c, area: e.target.value }))}
                    placeholder="3.5"
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi ? "इकाई" : "Unit"}
                  </label>
                  <select
                    value={newKhet.areaUnit}
                    onChange={(e) => setNewKhet((c) => ({ ...c, areaUnit: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none"
                  >
                    {AREA_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                  {isHi ? "बुवाई की तारीख (Sowing Date)" : "Sowing Date"}
                </label>
                <input
                  type="date"
                  value={newKhet.sowingDate}
                  onChange={(e) => setNewKhet((c) => ({ ...c, sowingDate: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-[var(--sk-border)]">
              <button
                type="button"
                onClick={() => setShowAddKhet(false)}
                className="flex-1 h-10 rounded-xl border border-[var(--sk-border)] text-xs font-semibold text-[var(--sk-muted)] hover:text-white transition cursor-pointer"
              >
                {isHi ? "रद्द करें" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={addKhet}
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold shadow-md hover:from-green-500 hover:to-emerald-500 transition cursor-pointer"
              >
                {isHi ? "खेत जोड़ें" : "Save Field"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
