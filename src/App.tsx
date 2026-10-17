/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Wheat,
  Building2,
  ShoppingBag,
  Settings,
  Languages,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle2,
  LayoutDashboard,
} from 'lucide-react';
import { FarmRecord, Lang, Partner, PartnerCashEntry, RentRecord, HomeExpense } from './lib/types';
import { FarmSection } from './components/farm/FarmSection';
import { RentSection } from './components/rent/RentSection';
import { HomeSection } from './components/home/HomeSection';
import { DashboardSection } from './components/home/DashboardSection';
import { SettingsSection } from './components/settings/SettingsSection';
import { PinLockScreen } from './components/security/PinLockScreen';
import {
  DEFAULT_RECORDS,
  RECORDS_STORAGE_KEY,
  PARTNERS_STORAGE_KEY,
  PARTNER_CASH_STORAGE_KEY,
} from './lib/storageMigration';
import { getSecuritySettings } from './lib/profileAndSecurity';
import { AppLogo } from './components/common/AppLogo';
import { PWAInstallButton } from './components/common/PWAInstallButton';

const RENT_STORAGE_KEY = 'sk-rent-records';
const HOME_STORAGE_KEY = 'sk-home-expenses';
const APP_NAME_STORAGE_KEY = 'sk-app-name';

const DEFAULT_RENT_RECORDS: RentRecord[] = [
  {
    id: 'rent-1',
    date: '2026-10-01',
    tenant: 'राहुल शर्मा',
    month: 'Oct 2026',
    whatsapp: '9826112233',
    amount: 6500,
    prevReading: 1250,
    currentReading: 1305,
    ratePerUnit: 8,
    units: 55,
    lightBill: 440,
    total: 6940,
    paidAmount: 6940,
    remainingAmount: 0,
    status: 'Received',
    note: 'कमरा नंबर 2 (प्रथम तल)',
  },
  {
    id: 'rent-2',
    date: '2026-10-05',
    tenant: 'विक्रम वर्मा (दुकानदार)',
    month: 'Oct 2026',
    whatsapp: '9425098765',
    amount: 12000,
    prevReading: 3400,
    currentReading: 3515,
    ratePerUnit: 9,
    units: 115,
    lightBill: 1035,
    total: 13035,
    paidAmount: 0,
    remainingAmount: 13035,
    status: 'Pending',
    note: 'दुकान नंबर 1 (रोड फ्रंट)',
  },
];

const DEFAULT_HOME_EXPENSES: HomeExpense[] = [
  {
    id: 'home-1',
    date: '2026-10-10',
    category: 'grocery',
    note: 'महीने का राशन, तेल व मसाले',
    amount: 4500,
  },
  {
    id: 'home-2',
    date: '2026-10-12',
    category: 'bills',
    note: 'घर का बिजली बिल भुगतान',
    amount: 1650,
  },
  {
    id: 'home-3',
    date: '2026-10-14',
    category: 'medical',
    note: 'माताजी की बीपी व शुगर की दवाई',
    amount: 850,
  },
];

export default function App() {
  const [lang, setLang] = useState<Lang>('hi');
  const isHi = lang === 'hi';
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sk-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });
  const [activeNav, setActiveNav] = useState<
    'dashboard' | 'farm' | 'rent' | 'home' | 'settings'
  >('dashboard');
  const [appName, setAppName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(APP_NAME_STORAGE_KEY) || (isHi ? 'स्मार्ट खाता' : 'Smart Khata');
    }
    return (isHi ? 'स्मार्ट खाता' : 'Smart Khata');
  });

  const displayAppName = React.useMemo(() => {
    const trimmed = (appName || '').trim();
    if (!isHi) {
      if (trimmed === 'स्मार्ट खाता' || trimmed === 'स्मार्ट खाता ' || trimmed === 'स्मार्ट खात' || !trimmed) {
        return 'Smart Khata';
      }
      if (trimmed === 'कृषि मुनीम') return 'Krishi Muneem';
      if (trimmed === 'खेत खाता') return 'Khet Khata';
      if (trimmed === 'बटाई साथी') return 'Batai Sathi';
      if (trimmed === 'धन-धान्य बहीखाता') return 'Dhan Dhanya';
      if (trimmed === 'किसान खतौनी') return 'Kisan Khatauni';
    } else {
      if (trimmed === 'Smart Khata' || trimmed === 'Smart Khaata' || !trimmed) {
        return 'स्मार्ट खाता';
      }
      if (trimmed === 'Krishi Muneem') return 'कृषि मुनीम';
      if (trimmed === 'Khet Khata') return 'खेत खाता';
      if (trimmed === 'Batai Sathi') return 'बटाई साथी';
      if (trimmed === 'Dhan Dhanya') return 'धन-धान्य बहीखाता';
      if (trimmed === 'Kisan Khatauni') return 'किसान खतौनी';
    }
    return appName;
  }, [appName, isHi]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(APP_NAME_STORAGE_KEY, appName);
    }
  }, [appName]);

  // Security Lock
  const [security, setSecurity] = useState(() => getSecuritySettings());
  const [isUnlocked, setIsUnlocked] = useState(() => !getSecuritySettings().isLockEnabled);

  // Farm Records
  const [records, setRecords] = useState<FarmRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch { }
      }
    }
    return [];
  });

  // Partners
  const [partners, setPartners] = useState<Partner[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PARTNERS_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { }
      }
    }
    return [];
  });

  // Partner cash entries
  const [partnerCash, setPartnerCash] = useState<PartnerCashEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PARTNER_CASH_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { }
      }
    }
    return [];
  });

  // Rent Records
  const [rentRecords, setRentRecords] = useState<RentRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RENT_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch { }
      }
    }
    return [];
  });

  // Home Expenses
  const [homeExpenses, setHomeExpenses] = useState<HomeExpense[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(HOME_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch { }
      }
    }
    return [];
  });

  // LocalStorage Sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
    }
  }, [records]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(partners));
    }
  }, [partners]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PARTNER_CASH_STORAGE_KEY, JSON.stringify(partnerCash));
    }
  }, [partnerCash]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(RENT_STORAGE_KEY, JSON.stringify(rentRecords));
    }
  }, [rentRecords]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(homeExpenses));
    }
  }, [homeExpenses]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sk-theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('light-theme');
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.classList.remove('light-theme');
        document.documentElement.removeAttribute('data-theme');
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === 'hi' ? 'en' : 'hi';
      setAppName((curr) => {
        const trimmed = (curr || '').trim();
        if (next === 'en' && (trimmed === 'स्मार्ट खाता' || trimmed === 'स्मार्ट खाता ' || trimmed === 'स्मार्ट खात' || !trimmed)) {
          return 'Smart Khata';
        }
        if (next === 'hi' && (trimmed === 'Smart Khata' || trimmed === 'Smart Khaata' || !trimmed)) {
          return 'स्मार्ट खाता';
        }
        return curr;
      });
      return next;
    });
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#060e0a] text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col selection:bg-emerald-500/30 transition-colors duration-150`}>
      {/* PIN LOCK SCREEN OVERLAY IF ENABLED */}
      {!isUnlocked && security.isLockEnabled && (
        <PinLockScreen
          correctPin={security.pin}
          lang={lang}
          onUnlocked={() => setIsUnlocked(true)}
        />
      )}

      {/* Top Header */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${theme === 'dark'
        ? 'bg-[#08140e]/95 border-[#1a3525]'
        : 'bg-white/95 border-slate-200 shadow-xs'
        }`}>
        <div className="max-w-[1200px] mx-auto px-3 sm:px-5 lg:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <AppLogo size="md" appName={displayAppName} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`font-extrabold text-base sm:text-lg tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {displayAppName}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-semibold border border-emerald-500/30">
                  {isHi ? 'pro' : 'pro'}
                </span>
              </div>
              <p className={`text-[10px] sm:text-[11px] -mt-0.5 hidden xs:block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {isHi ? 'खेत, बटाईदार, मकान किराया व घर खर्च' : 'Farm, Batai, Rental & Home Expenses'}
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <PWAInstallButton lang={lang} variant="header" />

            <button
              type="button"
              onClick={toggleTheme}
              className={`h-8 w-8 rounded-lg border transition cursor-pointer flex items-center justify-center active:scale-95 shadow-sm ${theme === 'dark'
                ? 'border-[#1e3c2c] bg-[#0c1a13] hover:bg-[#12271c] text-white'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              title={theme === 'dark' ? 'लाइट थीम चालू करें (Light Theme)' : 'डार्क थीम चालू करें (Dark Theme)'}
            >
              {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-700" />}
            </button>

            <button
              type="button"
              onClick={toggleLang}
              className={`h-8 px-2.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm ${theme === 'dark'
                ? 'border-[#1e3c2c] bg-[#0c1a13] hover:bg-[#12271c] text-emerald-300'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-emerald-700'
                }`}
              title="भाषा बदलें"
            >
              <Languages size={14} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
              <span>{lang === 'hi' ? 'English' : 'हिन्दी'}</span>
            </button>
          </div>
        </div>



        {/* 4 MAIN MODULE TABS NAVIGATION */}
        <div
          className={`hidden sm:block border-t transition-colors ${theme === 'dark'
            ? 'border-[#1a3525] bg-[#07130e]'
            : 'border-slate-200 bg-slate-100/90'
            }`}
        >
          <div className="max-w-[1200px] mx-auto px-2 sm:px-5 lg:px-6 flex items-center justify-around sm:justify-start overflow-x-auto no-scrollbar gap-1 py-2 sm:py-1">
            <button
              type="button"
              onClick={() => setActiveNav('dashboard')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer ${activeNav === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : theme === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-[#0c1a13]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
            >
              <LayoutDashboard size={20} className="sm:w-[15px] sm:h-[15px]" />
              <span>{isHi ? 'डैशबोर्ड' : 'Dashboard'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveNav('farm')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer ${activeNav === 'farm'
                ? 'bg-emerald-600 text-white shadow-sm'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-[#0c1a13]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
            >
              <Wheat size={20} className="sm:w-[15px] sm:h-[15px]" />
              <span>{isHi ? 'खेत व बटाई' : 'Farm & Batai'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('rent')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer ${activeNav === 'rent'
                ? 'bg-blue-600 text-white shadow-sm'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-[#0c1a13]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
            >
              <Building2 size={20} className="sm:w-[15px] sm:h-[15px]" />
              <span>{isHi ? 'किराया' : 'Rental'}</span>
              <span className="text-[10px]">{rentRecords.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('home')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer ${activeNav === 'home'
                ? 'bg-green-600 text-white shadow-sm'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-[#0c1a13]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
            >
              <ShoppingBag size={20} className="sm:w-[15px] sm:h-[15px]" />
              <span>{isHi ? 'घरेलू खर्च' : 'Home'}</span>
              <span className="text-[10px]">{homeExpenses.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('settings')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer ${activeNav === 'settings'
                ? 'bg-slate-700 text-white shadow-sm'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-[#0c1a13]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
            >
              <Settings size={20} className="sm:w-[15px] sm:h-[15px]" />
              <span>{isHi ? 'सेटिंग्स' : 'Settings'}</span>
            </button>

          </div>
        </div>


      </header>


      
      {/* MOBILE NAVIGATION */}
      <div
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-[100] border-t ${
          theme === 'dark'
            ? 'bg-[#07130e] border-[#1a3525] text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <nav
          aria-label={isHi ? 'मुख्य नेविगेशन' : 'Main navigation'}
          className="grid grid-cols-5 gap-1 px-2 pt-2 pb-1"
        >
          {[
            {
              id: 'dashboard',
              label: isHi ? 'डैशबोर्ड' : 'Dashboard',
              icon: LayoutDashboard,
              activeColor: 'bg-emerald-600 text-white',
            },
            {
              id: 'farm',
              label: isHi ? 'खेत' : 'Farm',
              icon: Wheat,
              activeColor: 'bg-emerald-600 text-white',
            },
            {
              id: 'rent',
              label: isHi ? 'किराया' : 'Rent',
              icon: Building2,
              activeColor: 'bg-blue-600 text-white',
            },
            {
              id: 'home',
              label: isHi ? 'घरेलू खर्च' : 'Home',
              icon: ShoppingBag,
              activeColor: 'bg-violet-600 text-white',
            },
            {
              id: 'settings',
              label: isHi ? 'सेटिंग्स' : 'Settings',
              icon: Settings,
              activeColor: 'bg-slate-700 text-white',
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setActiveNav(
                    item.id as
                      | 'dashboard'
                      | 'farm'
                      | 'rent'
                      | 'home'
                      | 'settings'
                  )
                }
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-w-0 min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1.5 transition-colors ${
                  isActive
                    ? `${item.activeColor} shadow-sm`
                    : theme === 'dark'
                      ? 'text-slate-400 active:bg-[#12271c]'
                      : 'text-slate-600 active:bg-slate-100'
                }`}
              >
                <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} />
                <span className="w-full truncate text-center text-[10px] font-semibold leading-tight sm:text-xs">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>



      {/* Main Content Render */}
      <main className="flex-1 py-4 pb-24 sm:pb-6 sm:py-6">
        {activeNav === 'dashboard' && (
          <DashboardSection
            records={records}
            rentRecords={rentRecords}
            homeExpenses={homeExpenses}
            lang={lang}
            onNavigate={setActiveNav}
          />
        )}
        {activeNav === 'farm' && (
          <FarmSection
            records={records}
            setRecords={setRecords}
            lang={lang}
            partners={partners}
            setPartners={setPartners}
            partnerCash={partnerCash}
            setPartnerCash={setPartnerCash}
          />
        )}

        {activeNav === 'rent' && (
          <RentSection
            records={rentRecords}
            setRecords={setRentRecords}
            lang={lang}
          />
        )}

        {activeNav === 'home' && (
          <HomeSection
            records={homeExpenses}
            setRecords={setHomeExpenses}
            lang={lang}
          />
        )}

        {activeNav === 'settings' && (
          <SettingsSection
            lang={lang}
            toggleLang={toggleLang}
            theme={theme}
            toggleTheme={toggleTheme}
            appName={displayAppName}
            setAppName={setAppName}
            farmRecords={records}
            setFarmRecords={setRecords}
            rentRecords={rentRecords}
            setRentRecords={setRentRecords}
            homeExpenses={homeExpenses}
            setHomeExpenses={setHomeExpenses}
          />
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-4 text-center text-xs transition-colors ${theme === 'dark'
        ? 'border-[#1a3525] bg-[#07130e] text-slate-400'
        : 'border-slate-200 bg-white text-slate-600'
        }`}>
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>🌾 स्मार्ट खाता - भारतीय किसानों के लिए डिजिटल कृषि, बटाई, किराया व घरेलू बहीखाता</span>
          <span className="font-mono text-[11px] opacity-80">100% सुरक्षित • ऑफलाइन डेटा • प्रमाणित हिसाब</span>
        </div>
      </footer>
    </div>
  );
}
