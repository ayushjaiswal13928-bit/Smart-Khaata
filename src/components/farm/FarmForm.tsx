"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Wheat, X } from "lucide-react";

import type { FarmRecord, Lang } from "../../lib/types";
import { cropLabel, unitLabel } from "../../lib/farmI18n";
import { Khet } from "./FarmSection";

interface FarmFormProps {
  lang: Lang;
  farmT: any;
  editingRecord: FarmRecord | null;
  fixedKhet?: Khet | null;
  onSave: (record: FarmRecord) => void;
  onCancel: () => void;
}

type TransactionType = FarmRecord["type"];

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
] as const;

const UNIT_OPTIONS = ["Kg", "Quintal", "Ton"] as const;

const createEmptyForm = () => ({
  date: new Date().toISOString().slice(0, 10),
  crop: "Wheat",
  season: "Rabi",
  field: "",
  area: "",
  areaUnit: "बीघा",
  type: "Expense" as TransactionType,
  expenseCategory: "बीज",
  quantity: "",
  unit: "Quintal",
  price: "",
  worker: "",
  machine: "",
  note: "",
  amount: "",
});

export function FarmForm({
  lang,
  farmT,
  editingRecord,
  onSave,
  onCancel,
  fixedKhet,
}: FarmFormProps) {
  const [form, setForm] = useState(createEmptyForm);
  const isHindi = lang === "hi";

  useEffect(() => {
    if (editingRecord) {
      setForm({
        date: editingRecord.date || "",
        crop: editingRecord.crop || "Wheat",
        season: editingRecord.season || "Rabi",
        field: editingRecord.field || "",
        area: editingRecord.area !== undefined ? String(editingRecord.area) : "",
        areaUnit: editingRecord.areaUnit || "बीघा",
        type: editingRecord.type || "Expense",
        expenseCategory: editingRecord.expenseCategory || "बीज",
        quantity: editingRecord.quantity !== undefined ? String(editingRecord.quantity) : "",
        unit: editingRecord.unit || "Quintal",
        price: editingRecord.price !== undefined ? String(editingRecord.price) : "",
        worker: editingRecord.worker || "",
        machine: editingRecord.machine || "",
        note: editingRecord.note || "",
        amount: editingRecord.amount !== undefined ? String(editingRecord.amount) : "",
      });
      return;
    }

    if (fixedKhet) {
      setForm({
        ...createEmptyForm(),
        crop: fixedKhet.crop || "Wheat",
        field: fixedKhet.name || "",
        area: fixedKhet.area !== undefined ? String(fixedKhet.area) : "",
        areaUnit: fixedKhet.areaUnit || "बीघा",
      });
      return;
    }

    setForm(createEmptyForm());
  }, [editingRecord, fixedKhet]);

  const saleTotal = useMemo(() => {
    if (form.type !== "Sale") return 0;
    return Number(form.quantity || 0) * Number(form.price || 0);
  }, [form.type, form.quantity, form.price]);

  const expenseTotal = useMemo(() => {
    if (form.type !== "Expense") return 0;
    return Number(form.quantity || 0) * Number(form.price || 0);
  }, [form.type, form.quantity, form.price]);

  const inputClass = `
    h-10 w-full rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] px-3 text-sm text-[var(--sk-text)] outline-none transition focus:border-green-500/70 focus:ring-2 focus:ring-green-500/10
  `;

  const labelClass = `
    mb-1 block text-xs font-semibold text-[var(--sk-muted)]
  `;

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const quantity = Number(form.quantity || 0);
    const price = Number(form.price || 0);
    let amount = 0;

    if (form.type === "Expense") {
      amount = quantity * price > 0 ? quantity * price : Number(form.amount || 0);
    } else if (form.type === "Sale") {
      amount = quantity * price > 0 ? quantity * price : Number(form.amount || 0);
    }

    const record: FarmRecord = {
      id: editingRecord?.id || `farm-${Date.now()}`,
      date: form.date,
      type: form.type,
      crop: form.crop,
      expenseCategory: form.type === "Expense" ? form.expenseCategory : "",
      amount,
      quantity,
      unit: form.unit,
      price: form.type === "Sale" || form.type === "Expense" ? price : 0,
      note: form.note,
      field: form.field,
      area: form.area === "" ? undefined : Number(form.area),
      areaUnit: form.areaUnit,
      worker: form.worker,
      machine: form.machine,
      season: form.season,
    };

    onSave(record);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] shadow-2xl"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[var(--sk-border)] px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[var(--sk-text)]">
              {editingRecord
                ? isHindi
                  ? "खेती रिकॉर्ड अपडेट करें"
                  : "Update Farm Record"
                : isHindi
                  ? "नया खेती रिकॉर्ड जोड़ें"
                  : "Add Farm Record"}
            </h2>
            <p className="text-xs text-[var(--sk-muted)] mt-0.5">
              {fixedKhet ? `${fixedKhet.name} (${fixedKhet.crop})` : isHindi ? "खर्च, बिक्री या उत्पादन दर्ज करें" : "Track expense, sale or yield"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sk-muted)] hover:bg-white/5 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                {isHindi ? "तारीख" : "Date"} *
              </label>
              <div className="relative">
                <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sk-dim)] pointer-events-none" />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  required
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                {isHindi ? "प्रकार" : "Type"} *
              </label>
              <select
                value={form.type}
                onChange={(e) => updateField("type", e.target.value as TransactionType)}
                required
                className={inputClass}
              >
                <option value="Expense">{isHindi ? "खर्च (Expense)" : "Expense"}</option>
                <option value="Sale">{isHindi ? "बिक्री (Sale)" : "Sale"}</option>
                <option value="Yield">{isHindi ? "उत्पादन (Yield)" : "Yield"}</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              {isHindi ? "फसल" : "Crop"} *
            </label>
            <div className="relative">
              <Wheat size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 pointer-events-none" />
              <select
                value={form.crop}
                onChange={(e) => updateField("crop", e.target.value)}
                required
                className={`${inputClass} pl-9`}
              >
                {CROP_OPTIONS.map((crop) => (
                  <option key={crop} value={crop}>
                    {cropLabel(lang, crop)} ({crop})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.type === "Expense" && (
            <>
              <div>
                <label className={labelClass}>
                  {isHindi ? "खर्च की श्रेणी" : "Expense Category"} *
                </label>
                <select
                  value={form.expenseCategory}
                  onChange={(e) => updateField("expenseCategory", e.target.value)}
                  className={inputClass}
                >
                  <option value="बीज">{isHindi ? "बीज (Seeds)" : "Seeds"}</option>
                  <option value="खाद">{isHindi ? "खाद (Fertilizer)" : "Fertilizer"}</option>
                  <option value="दवाई">{isHindi ? "कीटनाशक / दवाई (Pesticide)" : "Pesticide"}</option>
                  <option value="सिंचाई">{isHindi ? "सिंचाई (Irrigation)" : "Irrigation"}</option>
                  <option value="मजदूरी">{isHindi ? "मजदूरी (Labor)" : "Labor"}</option>
                  <option value="डीजल">{isHindi ? "डीजल / ट्रैक्टर (Diesel/Tractor)" : "Diesel/Tractor"}</option>
                  <option value="मशीन">{isHindi ? "मशीन / औजार (Machinery)" : "Machinery"}</option>
                  <option value="अन्य">{isHindi ? "अन्य (Other)" : "Other"}</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className={labelClass}>{isHindi ? "मात्रा" : "Quantity"} *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.quantity}
                    onChange={(e) => updateField("quantity", e.target.value)}
                    required
                    placeholder="10"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{isHindi ? "इकाई" : "Unit"}</label>
                  <select
                    value={form.unit}
                    onChange={(e) => updateField("unit", e.target.value)}
                    className={inputClass}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{unitLabel(lang, u)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{isHindi ? "दर (₹)" : "Rate (₹)"} *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    required
                    placeholder="50"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs">
                <span className="text-[var(--sk-muted)]">{isHindi ? "कुल खर्च:" : "Total Expense:"}</span>
                <span className="text-sm font-bold font-mono text-red-400">
                  ₹{expenseTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </>
          )}

          {form.type === "Sale" && (
            <>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className={labelClass}>{isHindi ? "मात्रा" : "Quantity"} *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.quantity}
                    onChange={(e) => updateField("quantity", e.target.value)}
                    required
                    placeholder="25"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{isHindi ? "इकाई" : "Unit"}</label>
                  <select
                    value={form.unit}
                    onChange={(e) => updateField("unit", e.target.value)}
                    className={inputClass}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{unitLabel(lang, u)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{isHindi ? "भाव प्रति यूनिट" : "Price/Unit"} *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    required
                    placeholder="2200"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs">
                <span className="text-[var(--sk-muted)]">{isHindi ? "कुल बिक्री:" : "Total Sale:"}</span>
                <span className="text-sm font-bold font-mono text-green-400">
                  ₹{saleTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </>
          )}

          {form.type === "Yield" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{isHindi ? "कुल उत्पादन मात्रा" : "Yield Quantity"} *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.quantity}
                  onChange={(e) => updateField("quantity", e.target.value)}
                  required
                  placeholder="50"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{isHindi ? "इकाई" : "Unit"}</label>
                <select
                  value={form.unit}
                  onChange={(e) => updateField("unit", e.target.value)}
                  className={inputClass}
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>{unitLabel(lang, u)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>{isHindi ? "नोट / विवरण" : "Note / Remarks"}</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => updateField("note", e.target.value)}
              placeholder={isHindi ? "जैसे उत्तम क्वालिटी, दुकान का नाम..." : "e.g. mandi bill number..."}
              className={inputClass}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex gap-2.5 border-t border-[var(--sk-border)] bg-[var(--sk-card2)] px-5 py-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-[var(--sk-border)] text-xs font-semibold text-[var(--sk-muted)] hover:text-white transition cursor-pointer"
          >
            {isHindi ? "रद्द करें" : "Cancel"}
          </button>
          <button
            type="submit"
            className="flex-1 h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            {editingRecord ? (isHindi ? "अपडेट करें" : "Update") : (isHindi ? "सेव करें" : "Save")}
          </button>
        </div>
      </form>
    </div>
  );
}
