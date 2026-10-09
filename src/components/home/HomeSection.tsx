"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus, X, Save, Pencil, Trash2, ShoppingBag } from "lucide-react";

import type { HomeExpense, Lang } from "../../lib/types";
import { STRINGS } from "../../lib/i18n";
import { fmt } from "../../lib/utils";

import {
  InputGroup,
  KpiBox,
  btnPrimary,
  btnSecondary,
  inputCls,
  selectCls,
} from "../common/UI";

interface HomeSectionProps {
  records: HomeExpense[];
  setRecords: React.Dispatch<React.SetStateAction<HomeExpense[]>>;
  lang: Lang;
}

interface HomeForm {
  date: string;
  category: string;
  note: string;
  amount: string;
}

export function HomeSection({ records, setRecords, lang }: HomeSectionProps) {
  const t = STRINGS[lang];
  const isHi = lang === "hi";

  const getToday = () => new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<HomeForm>({
    date: getToday(),
    category: "grocery",
    note: "",
    amount: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categoryLabels = useMemo(
    () => ({
      grocery: t.groceryCat,
      bills: t.billsCat,
      medical: t.medicalCat,
      transport: t.transportCat,
      education: t.educationCat,
      other: t.otherCat,
    }),
    [t]
  );

  const categories = Object.keys(categoryLabels);

  const categoryIcons: Record<string, string> = {
    grocery: "🥦",
    bills: "⚡",
    medical: "💊",
    transport: "🚗",
    education: "📚",
    other: "📦",
  };

  const resetForm = useCallback(() => {
    setForm({
      date: getToday(),
      category: "grocery",
      note: "",
      amount: "",
    });
    setEditingId(null);
    setIsModalOpen(false);
  }, []);

  const openAddModal = useCallback(() => {
    setForm({
      date: getToday(),
      category: "grocery",
      note: "",
      amount: "",
    });
    setEditingId(null);
    setIsModalOpen(true);
  }, []);

  const startEdit = useCallback((record: HomeExpense) => {
    setEditingId(record.id);
    setForm({
      date: record.date,
      category: record.category,
      note: record.note || "",
      amount: String(record.amount),
    });
    setIsModalOpen(true);
  }, []);

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const amount = Number(form.amount);

      if (!form.date || !form.category || Number.isNaN(amount) || amount <= 0) {
        return;
      }

      if (editingId) {
        setRecords((current) =>
          current.map((record) =>
            record.id === editingId
              ? {
                  ...record,
                  date: form.date,
                  category: form.category,
                  note: form.note,
                  amount,
                }
              : record
          )
        );
      } else {
        setRecords((current) => [
          {
            id: `h${Date.now()}`,
            date: form.date,
            category: form.category,
            note: form.note,
            amount,
          },
          ...current,
        ]);
      }

      resetForm();
    },
    [form, editingId, resetForm, setRecords]
  );

  const onDelete = useCallback(
    (id: string) => {
      setRecords((current) => current.filter((record) => record.id !== id));
    },
    [setRecords]
  );

  const totalExpense = useMemo(
    () => records.reduce((sum, record) => sum + Number(record.amount || 0), 0),
    [records]
  );

  const groceryTotal = useMemo(
    () =>
      records
        .filter((record) => record.category === "grocery")
        .reduce((sum, record) => sum + Number(record.amount || 0), 0),
    [records]
  );

  const billsTotal = useMemo(
    () =>
      records
        .filter((record) => record.category === "bills")
        .reduce((sum, record) => sum + Number(record.amount || 0), 0),
    [records]
  );

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-5 lg:px-6 pb-12">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--sk-text)] flex items-center gap-2">
            <ShoppingBag className="text-green-500" size={24} />
            {t.homeTitle}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--sk-muted)] mt-0.5">
            {isHi ? "घरेलू दैनिक खर्च (राशन, बिजली, दवाइयां) का हिसाब" : "Household grocery, utilities and personal expenses"}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className={`${btnPrimary} shrink-0 px-4 py-2.5 rounded-xl cursor-pointer`}
        >
          <Plus size={16} />
          {isHi ? "खर्च जोड़ें" : "Add Expense"}
        </button>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <KpiBox label={isHi ? "कुल घर खर्च" : "Total Expense"} value={fmt(totalExpense)} />
        <KpiBox label={isHi ? "कुल प्रविष्टियां" : "Entries"} value={String(records.length)} />
        <KpiBox label="🥦 किराना (Grocery)" value={fmt(groceryTotal)} />
        <KpiBox label="⚡ बिल (Utilities)" value={fmt(billsTotal)} />
      </div>

      {/* LIST */}
      <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--sk-border)] px-4 py-3 bg-[var(--sk-card2)]">
          <div className="text-sm font-bold text-[var(--sk-text)]">
            {isHi ? "हाल के घरेलू खर्च" : "Recent Household Expenses"}
          </div>
          <span className="text-xs text-[var(--sk-dim)] font-mono">{records.length} items</span>
        </div>

        {records.length > 0 ? (
          <div className="divide-y divide-white/5">
            {records.map((record) => {
              const icon = categoryIcons[record.category] || "📦";
              const category =
                categoryLabels[record.category as keyof typeof categoryLabels] ||
                record.category;

              return (
                <div
                  key={record.id}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition"
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
                    {icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[var(--sk-text)]">{category}</div>
                    <div className="text-xs text-[var(--sk-muted)] mt-0.5 truncate">
                      {record.note || "—"} • {record.date ? record.date.split("-").reverse().join("-") : "—"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-sm font-bold font-mono text-red-400 whitespace-nowrap">
                      {fmt(record.amount)}
                    </div>

                    <button
                      type="button"
                      onClick={() => startEdit(record)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--sk-muted)] hover:text-white hover:bg-white/5 cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(record.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--sk-muted)] hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center">
            <div className="text-4xl mb-2">🧾</div>
            <p className="text-sm font-semibold text-[var(--sk-muted)]">
              {isHi ? "अभी कोई खर्च दर्ज नहीं है" : "No expenses yet"}
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className={`${btnPrimary} mt-4 px-4 py-2 cursor-pointer`}
            >
              <Plus size={15} />
              {isHi ? "पहला खर्च जोड़ें" : "Add First Expense"}
            </button>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) resetForm();
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--sk-border)]">
              <h3 className="text-base font-bold text-[var(--sk-text)]">
                {editingId
                  ? isHi
                    ? "खर्च संपादित करें"
                    : "Edit Expense"
                  : isHi
                  ? "नया घरेलू खर्च जोड़ें"
                  : "Add Household Expense"}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--sk-muted)] hover:bg-white/5 cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-5 space-y-3.5">
              <InputGroup label={t.date}>
                <input
                  type="date"
                  className={inputCls}
                  value={form.date}
                  onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))}
                  required
                />
              </InputGroup>

              <InputGroup label={t.category}>
                <select
                  className={selectCls}
                  value={form.category}
                  onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}
                >
                  {categories.map((key) => (
                    <option key={key} value={key}>
                      {categoryIcons[key]} {categoryLabels[key as keyof typeof categoryLabels]}
                    </option>
                  ))}
                </select>
              </InputGroup>

              <InputGroup label={t.amount}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls}
                  placeholder="₹ 0"
                  value={form.amount}
                  onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))}
                  required
                  autoFocus
                />
              </InputGroup>

              <InputGroup label={t.note}>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={isHi ? "सब्जी, दूध, राशन आदि..." : "Vegetables, milk, ration..."}
                  value={form.note}
                  onChange={(e) => setForm((c) => ({ ...c, note: e.target.value }))}
                />
              </InputGroup>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className={`${btnSecondary} flex-1 justify-center cursor-pointer`}
                >
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className={`${btnPrimary} flex-1 justify-center cursor-pointer`}
                >
                  {editingId ? <Save size={15} /> : <Plus size={15} />}
                  {editingId ? (isHi ? "अपडेट करें" : "Update") : (isHi ? "सेव करें" : "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
