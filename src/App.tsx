/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Wheat,
  Building2,
  Home,
  Bot,
  Camera,
  FileText,
  Languages,
  Sun,
  Moon,
  Plus,
  X,
  Sparkles,
  TrendingUp,
  Receipt,
  CheckCircle,
} from "lucide-react";

import { Lang, FarmRecord, HomeExpense, RentRecord } from "./lib/types";
import { STRINGS } from "./lib/i18n";
import { DashboardSection } from "./components/dashboard/DashboardSection";
import { FarmSection } from "./components/farm/FarmSection";
import { RentSection } from "./components/rent/RentSection";
import { HomeSection } from "./components/home/HomeSection";
import { AiChatbotSection } from "./components/chat/AiChatbotSection";
import { ImageScannerSection } from "./components/scanner/ImageScannerSection";
import { ReportsSection } from "./components/reports/ReportsSection";

const SAMPLE_FARM_RECORDS: FarmRecord[] = [
  {
    id: "f-1",
    date: "2026-10-02",
    type: "Expense",
    crop: "Wheat",
    expenseCategory: "बीज",
    amount: 3200,
    quantity: 80,
    unit: "Kg",
    price: 40,
    field: "खेत 1 (बड़ा खेत)",
    area: 4,
    areaUnit: "बीघा",
    note: "HD 2967 प्रमाणित उन्नत बीज",
  },
  {
    id: "f-2",
    date: "2026-10-04",
    type: "Expense",
    crop: "Wheat",
    expenseCategory: "खाद",
    amount: 5400,
    quantity: 4,
    unit: "Quintal",
    price: 1350,
    field: "खेत 1 (बड़ा खेत)",
    area: 4,
    areaUnit: "बीघा",
    note: "DAP खाद 2 बोरी व पोटाश",
  },
  {
    id: "f-3",
    date: "2026-10-06",
    type: "Sale",
    crop: "Soybean",
    amount: 88000,
    quantity: 20,
    unit: "Quintal",
    price: 4400,
    field: "खेत 2 (सड़क वाला)",
    area: 3,
    areaUnit: "बीघा",
    note: "कृषि उपज मंडी में नकद बिक्री",
  },
];

const SAMPLE_RENT_RECORDS: RentRecord[] = [
  {
    id: "r-1",
    date: "2026-10-01",
    tenant: "सुरेश वर्मा (दुकान 1)",
    month: "Oct 2026",
    whatsapp: "9876543210",
    amount: 7500,
    prevReading: 1240,
    currentReading: 1395,
    ratePerUnit: 8.5,
    units: 155,
    lightBill: 1317.5,
    total: 8817.5,
    paidAmount: 8817.5,
    remainingAmount: 0,
    status: "Received",
    note: "दुकान किराया + बिजली बिल",
  },
  {
    id: "r-2",
    date: "2026-10-01",
    tenant: "रोहित सिंह (कमरा 2)",
    month: "Oct 2026",
    whatsapp: "9823456789",
    amount: 5000,
    prevReading: 820,
    currentReading: 890,
    ratePerUnit: 8,
    units: 70,
    lightBill: 560,
    total: 5560,
    paidAmount: 0,
    remainingAmount: 5560,
    status: "Pending",
    note: "प्रथम तल कमरा",
  },
];

const SAMPLE_HOME_EXPENSES: HomeExpense[] = [
  {
    id: "h-1",
    date: "2026-10-08",
    category: "grocery",
    amount: 2450,
    note: "आटा, तेल, दाल व राशन का सामान",
  },
  {
    id: "h-2",
    date: "2026-10-07",
    category: "bills",
    amount: 1820,
    note: "घरेलू बिजली बिल भुगतान",
  },
  {
    id: "h-3",
    date: "2026-10-05",
    category: "transport",
    amount: 600,
    note: "बाइक पेट्रोल",
  },
];

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("sk-lang") as Lang) || "hi";
    }
    return "hi";
  });

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("sk-theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "farm" | "rent" | "home" | "ai" | "scan" | "reports"
  >("dashboard");

  // State with LocalStorage
  const [farmRecords, setFarmRecords] = useState<FarmRecord[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sk-farm-records");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return SAMPLE_FARM_RECORDS;
  });

  const [rentRecords, setRentRecords] = useState<RentRecord[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sk-rent-records");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return SAMPLE_RENT_RECORDS;
  });

  const [homeExpenses, setHomeExpenses] = useState<HomeExpense[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sk-home-expenses");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return SAMPLE_HOME_EXPENSES;
  });

  // Quick Add Modal
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState<"farm" | "rent" | "home">("farm");

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("sk-lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("sk-theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("sk-farm-records", JSON.stringify(farmRecords));
  }, [farmRecords]);

  useEffect(() => {
    localStorage.setItem("sk-rent-records", JSON.stringify(rentRecords));
  }, [rentRecords]);

  useEffect(() => {
    localStorage.setItem("sk-home-expenses", JSON.stringify(homeExpenses));
  }, [homeExpenses]);

  const toggleLang = () => {
    setLang((prev) => (prev === "hi" ? "en" : "hi"));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const t = STRINGS[lang];
  const isHi = lang === "hi";

  const navItems = [
    { id: "dashboard", label: isHi ? "डैशबोर्ड" : "Dashboard", icon: LayoutDashboard },
    { id: "farm", label: isHi ? "खेती (Khet)" : "Farm", icon: Wheat },
    { id: "rent", label: isHi ? "किराया" : "Rent", icon: Building2 },
    { id: "home", label: isHi ? "घर खर्च" : "Home Exp", icon: Home },
    { id: "ai", label: isHi ? "AI चैट" : "AI Advisor", icon: Bot, highlight: true },
    { id: "scan", label: isHi ? "स्कैनर" : "Scanner", icon: Camera },
    { id: "reports", label: isHi ? "रिपोर्ट्स" : "Reports", icon: FileText },
  ];

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      {/* TOP APP HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[var(--sk-bg)]/90 border-b border-[var(--sk-border)] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* BRAND LOGO */}
        <div
          onClick={() => setActiveTab("dashboard")}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-green-600/20 group-hover:scale-105 transition">
            <span className="font-extrabold text-sm tracking-tighter">SK</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight text-[var(--sk-text)]">
                {isHi ? "स्मार्ट खाता" : "Smart Khaata"}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-green-500/15 text-green-400 border border-green-500/25">
                Pro
              </span>
            </div>
            <p className="text-[10px] text-[var(--sk-dim)] hidden sm:block">
              {isHi ? "खेती, मकान किराया व घरेलू हिसाब" : "Farming, Rentals & Household Accounts"}
            </p>
          </div>
        </div>

        {/* DESKTOP NAV TABS */}
        <nav className="hidden md:flex items-center gap-1 bg-[var(--sk-card2)] p-1 rounded-2xl border border-[var(--sk-border)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  active
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-white/5"
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* RIGHT CONTROLS: QUICK ADD, LANG, THEME */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xs shadow-md hover:from-green-500 hover:to-emerald-500 transition cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">{isHi ? "नया जोड़ें" : "Quick Add"}</span>
          </button>

          <button
            type="button"
            onClick={toggleLang}
            className="px-2.5 py-1.5 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] hover:bg-white/5 text-xs font-semibold text-[var(--sk-text)] transition flex items-center gap-1 cursor-pointer"
            title={isHi ? "Switch to English" : "हिन्दी में बदलें"}
          >
            <Languages size={13} className="text-green-400" />
            <span>{isHi ? "EN" : "हिन्दी"}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] hover:bg-white/5 text-[var(--sk-muted)] hover:text-[var(--sk-text)] transition cursor-pointer"
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* MAIN VIEW CONTAINER */}
      <main className="flex-1 pt-4 pb-20 md:pb-8">
        {activeTab === "dashboard" && (
          <DashboardSection
            home={homeExpenses}
            rent={rentRecords}
            farm={farmRecords}
            lang={lang}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onOpenQuickAdd={() => setShowQuickAdd(true)}
          />
        )}

        {activeTab === "farm" && (
          <FarmSection
            records={farmRecords}
            setRecords={setFarmRecords}
            lang={lang}
          />
        )}

        {activeTab === "rent" && (
          <RentSection
            records={rentRecords}
            setRecords={setRentRecords}
            lang={lang}
          />
        )}

        {activeTab === "home" && (
          <HomeSection
            records={homeExpenses}
            setRecords={setHomeExpenses}
            lang={lang}
          />
        )}

        {activeTab === "ai" && (
          <AiChatbotSection
            lang={lang}
            onNavigateToScan={() => setActiveTab("scan")}
          />
        )}

        {activeTab === "scan" && (
          <ImageScannerSection
            lang={lang}
            onAddFarmRecord={(partial) => {
              const newRec: FarmRecord = {
                id: `f-${Date.now()}`,
                date: new Date().toISOString().slice(0, 10),
                type: partial.type || "Expense",
                crop: partial.crop || "Wheat",
                expenseCategory: partial.expenseCategory || "खाद",
                amount: partial.amount || 1500,
                note: partial.note || "Scanned expense",
              };
              setFarmRecords((prev) => [newRec, ...prev]);
              setActiveTab("farm");
            }}
            onAddHomeExpense={(partial) => {
              const newExp: HomeExpense = {
                id: `h-${Date.now()}`,
                date: new Date().toISOString().slice(0, 10),
                category: partial.category || "grocery",
                amount: partial.amount || 500,
                note: partial.note || "Scanned expense",
              };
              setHomeExpenses((prev) => [newExp, ...prev]);
              setActiveTab("home");
            }}
            onNavigateToChat={(query) => {
              setActiveTab("ai");
            }}
          />
        )}

        {activeTab === "reports" && (
          <ReportsSection
            home={homeExpenses}
            rent={rentRecords}
            farm={farmRecords}
            lang={lang}
          />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION DOCK */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--sk-card)]/95 backdrop-blur-lg border-t border-[var(--sk-border)] px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {[
          { id: "dashboard", label: isHi ? "डैशबोर्ड" : "Home", icon: LayoutDashboard },
          { id: "farm", label: isHi ? "खेती" : "Farm", icon: Wheat },
          { id: "rent", label: isHi ? "किराया" : "Rent", icon: Building2 },
          { id: "home", label: isHi ? "घर खर्च" : "Expenses", icon: Home },
          { id: "ai", label: isHi ? "AI चैट" : "AI", icon: Bot, highlight: true },
          { id: "scan", label: isHi ? "स्कैनर" : "Scan", icon: Camera },
          { id: "reports", label: isHi ? "रिपोर्ट" : "Reports", icon: FileText },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition cursor-pointer ${
                active
                  ? "text-green-400 font-bold scale-105"
                  : "text-[var(--sk-dim)] hover:text-white"
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  active ? "bg-green-500/15" : ""
                }`}
              >
                <Icon size={18} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[48px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* QUICK ADD ACTION MODAL */}
      {showQuickAdd && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowQuickAdd(false);
          }}
        >
          <div className="w-full max-w-sm rounded-3xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--sk-border)] pb-3">
              <div>
                <h3 className="font-bold text-base text-[var(--sk-text)] flex items-center gap-2">
                  <Sparkles size={17} className="text-green-400" />
                  {isHi ? "त्वरित नया रिकॉर्ड जोड़ें" : "Quick Add Entry"}
                </h3>
                <p className="text-xs text-[var(--sk-muted)] mt-0.5">
                  {isHi ? "आप किस खाते में जोड़ना चाहते हैं?" : "Which account do you want to add to?"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--sk-muted)] hover:bg-white/5 cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowQuickAdd(false);
                  setActiveTab("farm");
                }}
                className="w-full p-3.5 rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card2)] hover:border-green-500/50 hover:bg-green-500/10 flex items-center justify-between transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-green-400 text-xl">
                    🌾
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[var(--sk-text)] group-hover:text-green-400 transition">
                      {isHi ? "खेती (Khet) लेन-देन" : "Farm / Crop Entry"}
                    </div>
                    <div className="text-xs text-[var(--sk-muted)] mt-0.5">
                      {isHi ? "खाद, बीज, मजदूरी, पैदावार या बिक्री" : "Seeds, fertilizer, sales & yield"}
                    </div>
                  </div>
                </div>
                <Plus size={16} className="text-[var(--sk-dim)] group-hover:text-green-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowQuickAdd(false);
                  setActiveTab("rent");
                }}
                className="w-full p-3.5 rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card2)] hover:border-blue-500/50 hover:bg-blue-500/10 flex items-center justify-between transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 text-xl">
                    🏢
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[var(--sk-text)] group-hover:text-blue-400 transition">
                      {isHi ? "किराया व बिजली बिल" : "Tenant Rent & Light Bill"}
                    </div>
                    <div className="text-xs text-[var(--sk-muted)] mt-0.5">
                      {isHi ? "मीटर रीडिंग, कमरा किराया, WhatsApp रसीद" : "Meter units, room rent, WhatsApp receipt"}
                    </div>
                  </div>
                </div>
                <Plus size={16} className="text-[var(--sk-dim)] group-hover:text-blue-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowQuickAdd(false);
                  setActiveTab("home");
                }}
                className="w-full p-3.5 rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card2)] hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-between transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-red-400 text-xl">
                    🛒
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[var(--sk-text)] group-hover:text-red-400 transition">
                      {isHi ? "घरेलू दैनिक खर्च" : "Home Expense"}
                    </div>
                    <div className="text-xs text-[var(--sk-muted)] mt-0.5">
                      {isHi ? "राशन, सब्जी, दूध, घरेलू बिजली बिल" : "Groceries, vegetables, daily expenses"}
                    </div>
                  </div>
                </div>
                <Plus size={16} className="text-[var(--sk-dim)] group-hover:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
