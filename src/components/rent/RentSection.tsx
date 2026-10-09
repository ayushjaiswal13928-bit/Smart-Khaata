"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Edit3,
  MessageCircle,
  Plus,
  Trash2,
  X,
  IndianRupee,
  Zap,
} from "lucide-react";

import { Lang, RentRecord, RentStatus } from "../../lib/types";
import { STRINGS } from "../../lib/i18n";
import { fmt } from "../../lib/utils";
import { FormCard, SectionHeader, StatusBadge } from "../common/UI";

interface RentSectionProps {
  records: RentRecord[];
  setRecords: React.Dispatch<React.SetStateAction<RentRecord[]>>;
  lang: Lang;
}

interface RentForm {
  date: string;
  tenant: string;
  month: string;
  whatsapp: string;
  amount: string;
  prevReading: string;
  currentReading: string;
  ratePerUnit: string;
  status: RentStatus;
  note: string;
}

const EMPTY_FORM: RentForm = {
  date: new Date().toISOString().slice(0, 10),
  tenant: "",
  month: "",
  whatsapp: "",
  amount: "",
  prevReading: "0",
  currentReading: "0",
  ratePerUnit: "8",
  status: "Pending",
  note: "",
};

function getMonthName(date: string) {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short" });
}

function calculateRentValues(form: RentForm) {
  const amount = Math.max(0, Number(form.amount) || 0);
  const prevReading = Math.max(0, Number(form.prevReading) || 0);
  const currentReading = Math.max(0, Number(form.currentReading) || 0);
  const ratePerUnit = Math.max(0, Number(form.ratePerUnit) || 0);
  const units = Math.max(0, currentReading - prevReading);
  const lightBill = units * ratePerUnit;
  const total = amount + lightBill;

  return {
    amount,
    prevReading,
    currentReading,
    ratePerUnit,
    units,
    lightBill,
    total,
  };
}

export function RentSection({ records, setRecords, lang }: RentSectionProps) {
  const t = STRINGS[lang];
  const isHi = lang === "hi";

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RentForm>(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | RentStatus>("All");
  const [error, setError] = useState("");

  const calculated = useMemo(() => calculateRentValues(form), [form]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...records]
      .filter((record) => {
        if (statusFilter !== "All" && record.status !== statusFilter) return false;
        if (!query) return true;
        return (
          record.tenant.toLowerCase().includes(query) ||
          record.month.toLowerCase().includes(query) ||
          record.whatsapp.includes(query) ||
          record.note.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, search, statusFilter]);

  const summary = useMemo(() => {
    const total = records.reduce((sum, r) => sum + Number(r.total || 0), 0);
    const received = records
      .filter((r) => r.status === "Received")
      .reduce((sum, r) => sum + Number(r.total || 0), 0);
    const pending = records
      .filter((r) => r.status === "Pending")
      .reduce((sum, r) => sum + Number(r.total || 0), 0);
    const partial = records
      .filter((r) => r.status === "Partial")
      .reduce((sum, r) => sum + Number(r.total || 0), 0);

    return { total, received, pending, partial };
  }, [records]);

  const openAddForm = () => {
    setEditingId(null);
    const today = new Date().toISOString().slice(0, 10);
    setForm({
      ...EMPTY_FORM,
      date: today,
      month: getMonthName(today),
    });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (record: RentRecord) => {
    setEditingId(record.id);
    setForm({
      date: record.date,
      tenant: record.tenant,
      month: record.month,
      whatsapp: record.whatsapp,
      amount: String(record.amount),
      prevReading: String(record.prevReading),
      currentReading: String(record.currentReading),
      ratePerUnit: String(record.ratePerUnit),
      status: record.status,
      note: record.note,
    });
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const tenant = form.tenant.trim();
    if (!tenant) {
      setError(isHi ? "किरायेदार का नाम लिखें।" : "Enter tenant name.");
      return;
    }

    if (calculated.currentReading < calculated.prevReading) {
      setError(
        isHi
          ? "वर्तमान मीटर रीडिंग पिछली रीडिंग से कम नहीं हो सकती।"
          : "Current meter reading cannot be less than previous reading."
      );
      return;
    }

    const record: RentRecord = {
      id: editingId ?? `rent-${Date.now()}`,
      date: form.date,
      tenant,
      month: form.month.trim() || getMonthName(form.date),
      whatsapp: form.whatsapp.replace(/\D/g, "").slice(0, 15),
      amount: calculated.amount,
      prevReading: calculated.prevReading,
      currentReading: calculated.currentReading,
      ratePerUnit: calculated.ratePerUnit,
      units: calculated.units,
      lightBill: calculated.lightBill,
      total: calculated.total,
      paidAmount: form.status === "Received" ? calculated.total : 0,
      remainingAmount: form.status === "Received" ? 0 : calculated.total,
      status: form.status,
      note: form.note.trim(),
    };

    setRecords((current) => {
      if (!editingId) return [record, ...current];
      return current.map((item) => (item.id === editingId ? record : item));
    });

    closeForm();
  };

  const deleteRecord = (id: string) => {
    setRecords((current) => current.filter((item) => item.id !== id));
  };

  const markReceived = (id: string) => {
    setRecords((current) =>
      current.map((record) =>
        record.id === id
          ? {
              ...record,
              status: "Received",
              paidAmount: record.total,
              remainingAmount: 0,
            }
          : record
      )
    );
  };

  const sendWhatsApp = (record: RentRecord) => {
    const phone = record.whatsapp.replace(/\D/g, "");
    if (!phone) {
      return;
    }

    const message = isHi
      ? `नमस्ते ${record.tenant} जी,\n\nमहीना: ${record.month}\nकमरा किराया: ₹${record.amount}\nबिजली मीटर रीडिंग: ${record.prevReading} से ${record.currentReading} (${record.units} यूनिट × ₹${record.ratePerUnit}) = ₹${record.lightBill}\nकुल देय राशि: ₹${record.total}\n\nधन्यवाद - Smart Khaata`
      : `Hello ${record.tenant},\n\nMonth: ${record.month}\nRoom Rent: ₹${record.amount}\nElectricity Meter: ${record.prevReading} to ${record.currentReading} (${record.units} units × ₹${record.ratePerUnit}) = ₹${record.lightBill}\nTotal Due: ₹${record.total}\n\nThank you - Smart Khaata`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-5 lg:px-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--sk-text)] flex items-center gap-2">
            <Building2 className="text-blue-500" size={24} />
            {isHi ? "मकान / दुकान किराया प्रबंधन" : "Rental Property Manager"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--sk-muted)] mt-0.5">
            {isHi
              ? "किरायेदार, मीटर रीडिंग बिजली बिल, WhatsApp रिमाइंडर और रसीदें"
              : "Tenants, meter readings, light bills, WhatsApp reminders and receipts"}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md hover:from-blue-500 hover:to-indigo-500 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          {isHi ? "किराया जोड़ें" : "Add Rent Record"}
        </button>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <FormCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <IndianRupee size={19} className="text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-[var(--sk-muted)]">{isHi ? "कुल किराया बिल" : "Total Billed"}</div>
              <div className="font-bold text-base sm:text-lg font-mono text-[var(--sk-text)]">{fmt(summary.total)}</div>
            </div>
          </div>
        </FormCard>

        <FormCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 size={19} className="text-green-400" />
            </div>
            <div>
              <div className="text-xs text-[var(--sk-muted)]">{isHi ? "प्राप्त किराया" : "Received"}</div>
              <div className="font-bold text-base sm:text-lg font-mono text-green-400">{fmt(summary.received)}</div>
            </div>
          </div>
        </FormCard>

        <FormCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Clock3 size={19} className="text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-[var(--sk-muted)]">{isHi ? "बकाया (Pending)" : "Pending"}</div>
              <div className="font-bold text-base sm:text-lg font-mono text-amber-400">{fmt(summary.pending)}</div>
            </div>
          </div>
        </FormCard>

        <FormCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
              <Building2 size={19} className="text-purple-400" />
            </div>
            <div>
              <div className="text-xs text-[var(--sk-muted)]">{isHi ? "कुल किरायेदार" : "Tenants"}</div>
              <div className="font-bold text-base sm:text-lg font-mono text-purple-400">{records.length}</div>
            </div>
          </div>
        </FormCard>
      </div>

      {/* FILTER SEARCH */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isHi ? "किरायेदार का नाम खोजें..." : "Search tenant name..."}
          className="flex-1 bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-xl px-3 py-2 text-xs sm:text-sm text-[var(--sk-text)] outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-xl px-3 py-2 text-xs text-[var(--sk-text)] outline-none cursor-pointer"
        >
          <option value="All">{isHi ? "सभी स्थिति" : "All Status"}</option>
          <option value="Received">{isHi ? "जमा (Received)" : "Received"}</option>
          <option value="Pending">{isHi ? "बाकी (Pending)" : "Pending"}</option>
          <option value="Partial">{isHi ? "आंशिक (Partial)" : "Partial"}</option>
        </select>
      </div>

      {/* ADD / EDIT FORM MODAL */}
      {showForm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--sk-border)] pb-3 mb-4">
              <h3 className="font-bold text-base text-[var(--sk-text)] flex items-center gap-2">
                <Building2 size={18} className="text-blue-400" />
                {editingId
                  ? isHi
                    ? "किराया रिकॉर्ड संपादित करें"
                    : "Edit Rent Record"
                  : isHi
                  ? "नया किराया बिल जोड़ें"
                  : "Add New Rent Bill"}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--sk-muted)] hover:bg-white/5 cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--sk-muted)] mb-1">
                    {isHi ? "किरायेदार का नाम" : "Tenant Name"} *
                  </label>
                  <input
                    required
                    value={form.tenant}
                    onChange={(e) => setForm((p) => ({ ...p, tenant: e.target.value }))}
                    placeholder={isHi ? "जैसे: राहुल शर्मा" : "e.g. Rahul Sharma"}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs text-[var(--sk-text)] outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--sk-muted)] mb-1">
                    {isHi ? "तारीख" : "Date"} *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value, month: getMonthName(e.target.value) }))}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs text-[var(--sk-text)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--sk-muted)] mb-1">
                    {isHi ? "माह (Month)" : "Month"}
                  </label>
                  <input
                    value={form.month}
                    onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))}
                    placeholder="Oct 2026"
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs text-[var(--sk-text)] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--sk-muted)] mb-1">
                    WhatsApp (रिमाइंडर हेतु)
                  </label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
                    placeholder="9876543210"
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs text-[var(--sk-text)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--sk-muted)] mb-1">
                    {isHi ? "कमरा / दुकान किराया (₹)" : "Room/Shop Rent (₹)"} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    placeholder="6500"
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs text-[var(--sk-text)] outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--sk-muted)] mb-1">
                    {isHi ? "बिजली यूनिट दर (₹/यूनिट)" : "Rate/Unit (₹)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.ratePerUnit}
                    onChange={(e) => setForm((p) => ({ ...p, ratePerUnit: e.target.value }))}
                    placeholder="8"
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs text-[var(--sk-text)] outline-none font-mono"
                  />
                </div>
              </div>

              {/* METER READINGS */}
              <div className="rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] p-3 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Zap size={14} /> {isHi ? "बिजली मीटर रीडिंग (Electricity Meter)" : "Meter Reading"}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[var(--sk-dim)] mb-1">
                      {isHi ? "पिछली रीडिंग" : "Previous Reading"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.prevReading}
                      onChange={(e) => setForm((p) => ({ ...p, prevReading: e.target.value }))}
                      className="w-full h-9 px-2.5 rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card)] text-xs text-[var(--sk-text)] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[var(--sk-dim)] mb-1">
                      {isHi ? "वर्तमान रीडिंग" : "Current Reading"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.currentReading}
                      onChange={(e) => setForm((p) => ({ ...p, currentReading: e.target.value }))}
                      className="w-full h-9 px-2.5 rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card)] text-xs text-[var(--sk-text)] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                  <span className="text-[var(--sk-dim)]">
                    {isHi ? "उपभोग:" : "Used:"} <b className="text-blue-400">{calculated.units} यूनिट</b>
                  </span>
                  <span className="text-[var(--sk-dim)]">
                    {isHi ? "लाइट बिल:" : "Light Bill:"} <b className="text-amber-400">{fmt(calculated.lightBill)}</b>
                  </span>
                </div>
              </div>

              {/* TOTAL DUE BOX */}
              <div className="flex items-center justify-between rounded-xl bg-purple-500/10 border border-purple-500/20 px-3.5 py-2.5 text-xs">
                <span className="text-[var(--sk-muted)] font-semibold">{isHi ? "कुल देय राशि:" : "Total Bill Due:"}</span>
                <span className="font-bold font-mono text-base text-purple-400">{fmt(calculated.total)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--sk-muted)] mb-1">
                  {isHi ? "भुगतान स्थिति" : "Payment Status"}
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as RentStatus }))}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs text-[var(--sk-text)] outline-none cursor-pointer"
                >
                  <option value="Pending">{isHi ? "बाकी (Pending)" : "Pending"}</option>
                  <option value="Received">{isHi ? "जमा (Received)" : "Received"}</option>
                  <option value="Partial">{isHi ? "आंशिक (Partial)" : "Partial"}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--sk-muted)] mb-1">
                  {isHi ? "नोट / टिप्पणी" : "Note / Remarks"}
                </label>
                <input
                  value={form.note}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder={isHi ? "जैसे: कमरा नंबर 2..." : "e.g. Room #2..."}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs text-[var(--sk-text)] outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-[var(--sk-border)]">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 h-10 rounded-xl border border-[var(--sk-border)] text-xs font-semibold text-[var(--sk-muted)] hover:text-white transition cursor-pointer"
                >
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:from-blue-500 hover:to-indigo-500 transition cursor-pointer"
                >
                  {editingId ? (isHi ? "अपडेट करें" : "Update") : (isHi ? "सेव करें" : "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENT RECORDS LIST */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-12 text-center">
            <Building2 size={36} className="mx-auto mb-2 text-[var(--sk-dim)] opacity-50" />
            <h3 className="font-bold text-sm text-[var(--sk-text)]">
              {isHi ? "कोई किराया रिकॉर्ड नहीं मिला" : "No rent records found"}
            </h3>
            <p className="text-xs text-[var(--sk-muted)] mt-1">
              {isHi ? "ऊपर 'किराया जोड़ें' बटन दबाकर नया किरायेदार जोड़ें।" : "Tap Add Rent Record above to get started."}
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-4 shadow-sm hover:border-blue-500/30 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 font-bold">
                    {record.tenant.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm sm:text-base text-[var(--sk-text)]">{record.tenant}</div>
                    <div className="text-xs text-[var(--sk-muted)]">
                      {record.month} • {record.date} {record.note ? `• ${record.note}` : ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <StatusBadge status={record.status} />
                  {record.status !== "Received" && (
                    <button
                      type="button"
                      onClick={() => markReceived(record.id)}
                      className="px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title={isHi ? "जमा के रूप में दर्ज करें" : "Mark as Received"}
                    >
                      <CheckCircle2 size={13} /> {isHi ? "प्राप्त हुआ" : "Received"}
                    </button>
                  )}
                  {record.whatsapp && (
                    <button
                      type="button"
                      onClick={() => sendWhatsApp(record)}
                      className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 cursor-pointer"
                      title="Send WhatsApp Bill Slip"
                    >
                      <MessageCircle size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditForm(record)}
                    className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRecord(record.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* RENT BREAKDOWN CHIPS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-xs">
                <div className="rounded-xl bg-slate-900/60 p-2">
                  <div className="text-[10px] text-[var(--sk-dim)]">{isHi ? "कमरा किराया" : "Room Rent"}</div>
                  <div className="font-bold font-mono text-[var(--sk-text)] mt-0.5">{fmt(record.amount)}</div>
                </div>
                <div className="rounded-xl bg-slate-900/60 p-2">
                  <div className="text-[10px] text-[var(--sk-dim)]">{isHi ? "मीटर यूनिट" : "Units Used"}</div>
                  <div className="font-bold font-mono text-blue-400 mt-0.5">{record.units} kWh</div>
                </div>
                <div className="rounded-xl bg-slate-900/60 p-2">
                  <div className="text-[10px] text-[var(--sk-dim)]">{isHi ? "लाइट बिल" : "Light Bill"}</div>
                  <div className="font-bold font-mono text-amber-400 mt-0.5">{fmt(record.lightBill)}</div>
                </div>
                <div className="rounded-xl bg-slate-900/60 p-2 border border-purple-500/20">
                  <div className="text-[10px] text-[var(--sk-dim)]">{isHi ? "कुल देय राशि" : "Total Bill"}</div>
                  <div className="font-bold font-mono text-purple-400 mt-0.5">{fmt(record.total)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
