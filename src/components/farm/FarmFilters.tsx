"use client";

import type { Dispatch, SetStateAction } from "react";
import { Download, Search } from "lucide-react";

import { FarmRecord, Lang } from "../../lib/types";
import { FarmTranslation } from "../../lib/farmI18n";

interface FarmFiltersProps {
  lang: Lang;
  farmT: FarmTranslation;
  cropSearch: string;
  setCropSearch: Dispatch<SetStateAction<string>>;
  typeFilter: "all" | FarmRecord["type"];
  setTypeFilter: Dispatch<SetStateAction<"all" | FarmRecord["type"]>>;
  dateFilter: "all" | "today" | "month" | "year";
  setDateFilter: Dispatch<SetStateAction<"all" | "today" | "month" | "year">>;
  filteredRecords: FarmRecord[];
}

export function FarmFilters({
  lang,
  farmT,
  cropSearch,
  setCropSearch,
  typeFilter,
  setTypeFilter,
  dateFilter,
  setDateFilter,
  filteredRecords,
}: FarmFiltersProps) {
  const escapeCSV = (value: unknown) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const getSaleAmount = (record: FarmRecord) => {
    if (record.type !== "Sale") return 0;
    const quantity = Number(record.quantity || 0);
    const price = Number(record.price || 0);
    const calculatedAmount = quantity * price;
    if (calculatedAmount > 0) return calculatedAmount;
    return Number(record.amount || 0);
  };

  const getAmount = (record: FarmRecord) => {
    if (record.type === "Sale") return getSaleAmount(record);
    if (record.type === "Expense") {
      const quantity = Number(record.quantity || 0);
      const price = Number(record.price || 0);
      const calculatedAmount = quantity * price;
      if (calculatedAmount > 0) return calculatedAmount;
      return Number(record.amount || 0);
    }
    return 0;
  };

  const getDetails = (record: FarmRecord) => {
    if (record.type === "Expense") {
      return record.expenseCategory || record.note || "";
    }
    if (record.type === "Yield") {
      return `${record.quantity || 0} ${record.unit || ""}`.trim();
    }
    if (record.type === "Sale") {
      return `${record.quantity || 0} ${record.unit || ""} × ₹${Number(record.price || 0).toLocaleString("en-IN")}`;
    }
    return record.note || "";
  };

  const typeText = (type: FarmRecord["type"]) => {
    if (type === "Expense") return farmT.expense;
    if (type === "Yield") return farmT.yield;
    return farmT.sale;
  };

  const exportCSV = () => {
    if (filteredRecords.length === 0) {
      return;
    }

    const headers =
      lang === "hi"
        ? [
            "तारीख",
            "फसल",
            "सीजन",
            "खेत",
            "क्षेत्रफल",
            "क्षेत्रफल यूनिट",
            "टाइप",
            "विवरण",
            "मात्रा",
            "मात्रा यूनिट",
            "रेट",
            "राशि",
            "मजदूर",
            "मशीन",
            "नोट",
          ]
        : [
            "Date",
            "Crop",
            "Season",
            "Field",
            "Area",
            "Area Unit",
            "Type",
            "Details",
            "Quantity",
            "Quantity Unit",
            "Rate",
            "Amount",
            "Worker",
            "Machine",
            "Note",
          ];

    const rows = filteredRecords.map((record) => [
      record.date,
      record.crop,
      record.season || "",
      record.field || "",
      record.area ?? "",
      record.areaUnit || "",
      typeText(record.type),
      getDetails(record),
      record.quantity ?? "",
      record.unit || "",
      record.type === "Sale" || record.type === "Expense" ? Number(record.price || 0) : "",
      getAmount(record),
      record.worker || "",
      record.machine || "",
      record.note || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => escapeCSV(value)).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `farm-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const allTypes = lang === "hi" ? "सभी प्रकार" : "All Types";
  const allDates = lang === "hi" ? "सभी तारीख" : "All Dates";
  const today = lang === "hi" ? "आज" : "Today";
  const thisMonth = lang === "hi" ? "इस महीने" : "This Month";
  const thisYear = lang === "hi" ? "इस साल" : "This Year";
  const searchPlaceholder = lang === "hi" ? "फसल खोजें..." : "Search Crop...";

  return (
    <div className="mb-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] gap-2 items-center">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sk-dim)] pointer-events-none"
          />
          <input
            type="text"
            value={cropSearch}
            onChange={(e) => setCropSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] pl-9 pr-3 text-xs text-[var(--sk-text)] outline-none transition focus:border-green-500/50"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "all" | FarmRecord["type"])}
          className="h-9 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] px-3 text-xs text-[var(--sk-text)] outline-none focus:border-green-500/50 cursor-pointer"
        >
          <option value="all">{allTypes}</option>
          <option value="Expense">{farmT.expense}</option>
          <option value="Yield">{farmT.yield}</option>
          <option value="Sale">{farmT.sale}</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as "all" | "today" | "month" | "year")}
          className="h-9 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] px-3 text-xs text-[var(--sk-text)] outline-none focus:border-green-500/50 cursor-pointer"
        >
          <option value="all">{allDates}</option>
          <option value="today">{today}</option>
          <option value="month">{thisMonth}</option>
          <option value="year">{thisYear}</option>
        </select>

        <button
          type="button"
          onClick={exportCSV}
          className="h-9 px-3 rounded-xl border border-green-500/40 text-green-400 bg-green-500/10 hover:bg-green-500/20 transition flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <Download size={13} />
          CSV Export
        </button>
      </div>
    </div>
  );
}
