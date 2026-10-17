'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  KeyRound,
  Download,
  Upload,
  RefreshCw,
  Compass,
  Languages,
  Moon,
  Sun,
  Smartphone,
  Check,
  Database,
} from 'lucide-react';
import type { Lang, FarmRecord, RentRecord, HomeExpense } from '../../lib/types';
import {
  getFarmerProfile,
  saveFarmerProfile,
  getSecuritySettings,
  saveSecuritySettings,
  getLastBackupTimestamp,
  recordBackupTimestamp,
  FarmerProfile,
  SecuritySettings,
} from '../../lib/profileAndSecurity';
import { downloadPhysicalBackup } from '../../lib/storageMigration';
import { EditProfileModal } from './EditProfileModal';
import { ChangePinModal } from './ChangePinModal';
import { ResetDataModal } from './ResetDataModal';
import { LandSettingsModal } from '../farm/LandSettingsModal';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { AppLogo } from '../common/AppLogo';

interface SettingsSectionProps {
  lang: Lang;
  toggleLang: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  appName?: string;
  setAppName?: (name: string) => void;
  farmRecords: FarmRecord[];
  setFarmRecords: React.Dispatch<React.SetStateAction<FarmRecord[]>>;
  rentRecords: RentRecord[];
  setRentRecords: React.Dispatch<React.SetStateAction<RentRecord[]>>;
  homeExpenses: HomeExpense[];
  setHomeExpenses: React.Dispatch<React.SetStateAction<HomeExpense[]>>;
}

export function SettingsSection({
  lang,
  toggleLang,
  theme,
  toggleTheme,
  appName = 'स्मार्ट खाता',
  setAppName,
  setFarmRecords,
  setRentRecords,
  setHomeExpenses,
}: SettingsSectionProps) {
  const isHi = lang === 'hi';

  const [profile, setProfile] = useState<FarmerProfile>(() => getFarmerProfile());
  const [security, setSecurity] = useState<SecuritySettings>(() => getSecuritySettings());
  const [lastBackup, setLastBackup] = useState<number | null>(() => getLastBackupTimestamp());

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [showResetData, setShowResetData] = useState(false);
  const [showLandModal, setShowLandModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = (updated: FarmerProfile) => {
    setProfile(updated);
    saveFarmerProfile(updated);
    showToast(isHi ? 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!' : 'Profile updated successfully!');
  };

  const handleSavePin = (newPin: string) => {
    const updated: SecuritySettings = {
      ...security,
      pin: newPin,
      isLockEnabled: true,
    };
    setSecurity(updated);
    saveSecuritySettings(updated);
    showToast(isHi ? 'सुरक्षा पिन सफलतापूर्वक सेट हो गया!' : 'Security PIN updated successfully!');
  };

  const handleTogglePinLock = () => {
    const updated: SecuritySettings = {
      ...security,
      isLockEnabled: !security.isLockEnabled,
    };
    setSecurity(updated);
    saveSecuritySettings(updated);
    showToast(
      updated.isLockEnabled
        ? isHi
          ? 'पिन सुरक्षा चालू कर दी गई है'
          : 'PIN protection enabled'
        : isHi
        ? 'पिन सुरक्षा बंद कर दी गई है'
        : 'PIN protection disabled'
    );
  };

  const handleBackupDownload = () => {
    downloadPhysicalBackup();
    recordBackupTimestamp();
    setLastBackup(Date.now());
    showToast(isHi ? 'बैकअप फ़ाइल डाउनलोड हो गई!' : 'Backup file downloaded successfully!');
  };

  const handleRestoreBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        const parseIfString = (val: any) => {
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return val; }
          }
          return val;
        };

        const records = parseIfString(data.records);
        if (Array.isArray(records)) {
          setFarmRecords(records);
          localStorage.setItem('kisan-sathi-records', JSON.stringify(records));
        }

        const khets = parseIfString(data.khets);
        if (Array.isArray(khets)) {
          localStorage.setItem('kisan-sathi-khets', JSON.stringify(khets));
        }

        const crops = parseIfString(data.crops);
        if (Array.isArray(crops)) {
          localStorage.setItem('kisan-sathi-khet-crops', JSON.stringify(crops));
        }

        const partners = parseIfString(data.partners);
        if (Array.isArray(partners)) {
          localStorage.setItem('sk-partners', JSON.stringify(partners));
        }

        const partnerCash = parseIfString(data.partnerCash);
        if (Array.isArray(partnerCash)) {
          localStorage.setItem('sk-partner-cash', JSON.stringify(partnerCash));
        }

        const rentRecords = parseIfString(data.rentRecords);
        if (Array.isArray(rentRecords)) {
          setRentRecords(rentRecords);
          localStorage.setItem('sk-rent-records', JSON.stringify(rentRecords));
        }

        const homeExpenses = parseIfString(data.homeExpenses);
        if (Array.isArray(homeExpenses)) {
          setHomeExpenses(homeExpenses);
          localStorage.setItem('sk-home-expenses', JSON.stringify(homeExpenses));
        }

        const stocks = parseIfString(data.stocks);
        if (Array.isArray(stocks)) {
          localStorage.setItem('kisan-sathi-stocks', JSON.stringify(stocks));
        }

        const farmerProfile = parseIfString(data.farmerProfile);
        if (farmerProfile && typeof farmerProfile === 'object') {
          setProfile(farmerProfile);
          saveFarmerProfile(farmerProfile);
        }

        const landSettings = parseIfString(data.landSettings);
        if (landSettings && typeof landSettings === 'object') {
          localStorage.setItem('sk-land-settings', JSON.stringify(landSettings));
        }

        if (data.appName && typeof data.appName === 'string' && setAppName) {
          setAppName(data.appName);
          localStorage.setItem('sk-app-name', data.appName);
        }

        showToast(isHi ? 'डेटा सफलतापूर्वक पुनर्स्थापित (Restore) हो गया!' : 'Data restored successfully!');
      } catch (err) {
        alert(isHi ? 'अमान्य बैकअप फ़ाइल!' : 'Invalid backup JSON file!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmReset = (mode: 'sample' | 'clear') => {
    if (mode === 'clear') {
      setFarmRecords([]);
      setRentRecords([]);
      setHomeExpenses([]);
      localStorage.removeItem('kisan-sathi-records');
      localStorage.removeItem('sk-rent-records');
      localStorage.removeItem('sk-home-expenses');
      localStorage.removeItem('kisan-sathi-khets');
      localStorage.removeItem('kisan-sathi-stocks');
      showToast(isHi ? 'सभी रिकॉर्ड साफ़ कर दिए गए!' : 'All records cleared!');
    } else {
      localStorage.removeItem('kisan-sathi-records');
      localStorage.removeItem('sk-rent-records');
      localStorage.removeItem('sk-home-expenses');
      localStorage.removeItem('kisan-sathi-khets');
      window.location.reload();
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-5 lg:px-6 pb-24 sm:pb-16 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--sk-text)] flex items-center gap-2">
            <Settings className="text-slate-400" />
            <span>{isHi ? 'ऐप सेटिंग्स व सुरक्षा' : 'Settings & Security'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--sk-muted)] mt-0.5">
            {isHi
              ? 'किसान प्रोफ़ाइल, सुरक्षा पिन, जमीन का पैमाना और डेटा बैकअप'
              : 'Farmer profile, PIN security, acreage settings & data backup'}
          </p>
        </div>
      </div>

      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. FARMER PROFILE CARD */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
              {profile.name ? profile.name.charAt(0) : 'ख'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-[var(--sk-text)]">
                  {profile.name || (isHi ? 'किसान मित्र' : 'Farmer')}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30">
                  {isHi ? 'खाता स्वामी' : 'Account Owner'}
                </span>
              </div>
              <p className="text-xs text-[var(--sk-muted)] mt-0.5">
                📞 {profile.phone || '98260XXXXX'} • 📍 {profile.village}, {profile.tehsil}, {profile.district}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEditProfile(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto"
          >
            {isHi ? 'प्रोफ़ाइल बदलें' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* 2. APP LOGO & BRANDING NAMES CARD */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--sk-border)] pb-4">
          <div className="flex items-center gap-3">
            <AppLogo size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-[var(--sk-text)]">
                  {appName}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                  {isHi ? 'आधिकारिक नया लोगो व ब्रांड' : 'New Official Logo & Brand'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isHi
                  ? 'सुनहरे गेहूं की बाली, हरा अंकुर और उगता सूरज — समृद्धि और पारदर्शी हिसाब का प्रतीक'
                  : 'Golden wheat sheaves, green sprout & rising sun — symbol of prosperity & ledger accuracy'}
              </p>
            </div>
          </div>
        </div>

        {/* Name Suggestions / Selection */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-slate-200">
            {isHi ? 'ऐप का पसंदीदा नाम चुनें (Click to Select Name):' : 'Choose Brand Name:'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              {
                id: 'स्मार्ट खाता',
                en: 'Smart Khata',
                tag: isHi ? 'लोकप्रिय व भरोसेमंद' : 'Popular & Trusted',
                icon: '🌾',
                desc: isHi ? 'किसानों का सच्चा डिजिटल साथी' : 'Farmers true digital companion',
              },
              {
                id: 'कृषि मुनीम',
                en: 'Krishi Muneem',
                tag: isHi ? 'पारंपरिक व डिजिटल' : 'Traditional & Digital',
                icon: '📜',
                desc: isHi ? 'पाई-पाई का सटीक बहीखाता' : 'Accurate penny-to-penny ledger',
              },
              {
                id: 'खेत खाता',
                en: 'Khet Khata',
                tag: isHi ? 'खेतवार हिसाब' : 'Field-by-Field',
                icon: '🚜',
                desc: isHi ? 'प्रत्येक चक व रकबे का अलग हिसाब' : 'Separate ledger for each plot',
              },
              {
                id: 'बटाई साथी',
                en: 'Batai Sathi',
                tag: isHi ? 'साझेदारी विशेषज्ञ' : 'Batai Expert',
                icon: '🤝',
                desc: isHi ? '50-50 अधिया व तिहाई का पक्का खाता' : '50-50 Adhiya & Tihai partnerships',
              },
              {
                id: 'धन-धान्य बहीखाता',
                en: 'Dhan Dhanya',
                tag: isHi ? 'बरकत व समृद्धि' : 'Prosperity & Yield',
                icon: '💰',
                desc: isHi ? 'फसल पैदावार, बिक्री व मुनाफा' : 'Harvest volume, sales & net profit',
              },
              {
                id: 'किसान खतौनी',
                en: 'Kisan Khatauni',
                tag: isHi ? 'सरकारी जैसा पक्का' : 'Official & Certified',
                icon: '🏛️',
                desc: isHi ? 'प्रमाणित पर्चा व कानूनी स्पष्टता' : 'Certified statement & clarity',
              },
            ].map((item) => {
              const displayName = isHi ? item.id : item.en;
              const isSelected = appName === item.id || appName === item.en;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    const chosen = isHi ? item.id : item.en;
                    if (setAppName) setAppName(chosen);
                    showToast(isHi ? `नाम बदलकर "${chosen}" कर दिया गया!` : `Name updated to "${chosen}"!`);
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm'
                      : 'bg-[var(--sk-card2)] border-[var(--sk-border)] text-[var(--sk-text)] hover:bg-[var(--sk-card3)]'
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-[var(--sk-text)]">{displayName}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-black/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-[var(--sk-border)]">
                        {item.tag}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--sk-muted)] mt-0.5 truncate">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Name input */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="text"
              placeholder={isHi ? 'या अपनी मर्जी से कोई भी नया नाम लिखें...' : 'Or enter custom brand name...'}
              value={appName}
              onChange={(e) => {
                if (setAppName) setAppName(e.target.value);
              }}
              className="flex-1 h-9 px-3 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-xs text-[var(--sk-text)] outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
              ✓ {isHi ? 'तुरंत लागू' : 'Live updated'}
            </span>
          </div>
        </div>
      </div>

      {/* 3-COLUMN / 2-COLUMN SETTINGS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* APP PREFERENCES */}
        <div className="p-4 sm:p-5 rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[var(--sk-text)] flex items-center gap-2">
            <Smartphone size={16} className="text-emerald-500" />
            <span>{isHi ? 'भाषा व रूप-रंग' : 'Language & Display'}</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)]">
              <div>
                <div className="font-semibold text-xs text-[var(--sk-text)]">
                  {isHi ? 'ऐप की भाषा (Language)' : 'App Language'}
                </div>
                <div className="text-[11px] text-[var(--sk-muted)]">
                  {isHi ? 'वर्तमान: हिन्दी' : 'Current: English'}
                </div>
              </div>
              <button
                type="button"
                onClick={toggleLang}
                className="px-3 py-1.5 rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card)] hover:bg-[var(--sk-card3)] text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Languages size={14} />
                <span>{isHi ? 'Switch to English' : 'हिन्दी करें'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)]">
              <div>
                <div className="font-semibold text-xs text-[var(--sk-text)]">
                  {isHi ? 'थीम (Theme)' : 'Theme Mode'}
                </div>
                <div className="text-[11px] text-[var(--sk-muted)]">
                  {theme === 'dark' ? (isHi ? 'डार्क मोड' : 'Dark Mode') : (isHi ? 'लाइट मोड' : 'Light Mode')}
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card)] hover:bg-[var(--sk-card3)] text-xs font-semibold text-[var(--sk-text)] transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-blue-500" />}
                <span>{theme === 'dark' ? (isHi ? 'लाइट थीम' : 'Light') : (isHi ? 'डार्क थीम' : 'Dark')}</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)]">
              <div>
                <div className="font-semibold text-xs text-[var(--sk-text)]">
                  {isHi ? 'जमीन पैमाना सेटिंग्स' : 'Land Measurement Units'}
                </div>
                <div className="text-[11px] text-[var(--sk-muted)]">
                  {isHi ? 'बीघा, बिस्वा व एकड़ अनुपात' : 'Bigha, Biswa & Acre presets'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLandModal(true)}
                className="px-3 py-1.5 rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card)] hover:bg-[var(--sk-card3)] text-xs font-semibold text-amber-600 dark:text-amber-400 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Compass size={14} />
                <span>{isHi ? 'पैमाना बदलें' : 'Configure'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECURITY & PIN */}
        <div className="p-4 sm:p-5 rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[var(--sk-text)] flex items-center gap-2">
            <Shield size={16} className="text-blue-500" />
            <span>{isHi ? 'सुरक्षा व 4-अंकीय पिन' : 'App Security & PIN Lock'}</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)]">
              <div>
                <div className="font-semibold text-xs text-[var(--sk-text)]">
                  {isHi ? 'पिन लॉक सुरक्षा' : 'PIN Lock Status'}
                </div>
                <div className="text-[11px] text-[var(--sk-muted)]">
                  {security.isLockEnabled
                    ? isHi
                      ? 'सुरक्षा सक्रिय (Protected)'
                      : 'Active protection'
                    : isHi
                    ? 'सुरक्षा बंद (Disabled)'
                    : 'Disabled'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleTogglePinLock}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm ${
                  security.isLockEnabled
                    ? 'bg-blue-600 text-white'
                    : 'bg-[var(--sk-card)] border border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
                }`}
              >
                {security.isLockEnabled ? (isHi ? 'चालू' : 'Enabled') : (isHi ? 'बंद' : 'Disabled')}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)]">
              <div>
                <div className="font-semibold text-xs text-[var(--sk-text)]">
                  {isHi ? 'सुरक्षा पिन बदलें' : 'Change Security PIN'}
                </div>
                <div className="text-[11px] text-[var(--sk-muted)]">
                  {isHi ? '4-अंकीय गुप्त कोड' : '4-digit secret passcode'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePin(true)}
                className="px-3 py-1.5 rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card)] hover:bg-[var(--sk-card3)] text-xs font-semibold text-blue-600 dark:text-blue-400 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <KeyRound size={14} />
                <span>{isHi ? 'पिन बदलें' : 'Change PIN'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-[11px] text-[var(--sk-muted)]">
              💡 {isHi
                ? 'पिन सुरक्षा चालू करने पर आपके लेन-देन और फोन किसी अन्य के हाथ में होने पर भी सुरक्षित रहते हैं।'
                : 'PIN lock ensures your accounts and tenant details stay private if someone else uses your device.'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. DATA BACKUP & RESTORE */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-[var(--sk-text)] flex items-center gap-2">
          <Database size={16} className="text-purple-500" />
          <span>{isHi ? 'डेटा बैकअप, रिस्टोर व रीसेट' : 'Data Backup, Restore & Reset'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Download Backup */}
          <div className="p-3.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] flex flex-col justify-between space-y-2">
            <div>
              <div className="font-bold text-xs text-[var(--sk-text)] flex items-center gap-1.5">
                <Download size={14} className="text-emerald-500" />
                <span>{isHi ? 'फोन में बैकअप लें' : 'Download Backup'}</span>
              </div>
              <p className="text-[10px] text-[var(--sk-muted)] mt-1">
                {lastBackup
                  ? isHi
                    ? `अंतिम बैकअप: ${new Date(lastBackup).toLocaleDateString('hi-IN')}`
                    : `Last backup: ${new Date(lastBackup).toLocaleDateString()}`
                  : isHi
                  ? 'अभी तक कोई बैकअप नहीं लिया'
                  : 'No backup downloaded yet'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleBackupDownload}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              <Download size={13} />
              <span>{isHi ? 'JSON बैकअप डाउनलोड' : 'Download JSON'}</span>
            </button>
          </div>

          {/* Restore Backup */}
          <div className="p-3.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] flex flex-col justify-between space-y-2">
            <div>
              <div className="font-bold text-xs text-[var(--sk-text)] flex items-center gap-1.5">
                <Upload size={14} className="text-blue-500" />
                <span>{isHi ? 'बैकअप रिस्टोर करें' : 'Restore Backup'}</span>
              </div>
              <p className="text-[10px] text-[var(--sk-muted)] mt-1">
                {isHi
                  ? 'पहले से ली गई बैकअप फ़ाइल चुनकर डेटा लोड करें'
                  : 'Load accounts from a previous JSON backup'}
              </p>
            </div>
            <label className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow text-center">
              <Upload size={13} />
              <span>{isHi ? 'फ़ाइल चुनें (Restore)' : 'Select Backup File'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreBackupFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Factory Reset */}
          <div className="p-3.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] flex flex-col justify-between space-y-2">
            <div>
              <div className="font-bold text-xs text-red-300 flex items-center gap-1.5">
                <RefreshCw size={14} className="text-red-400" />
                <span>{isHi ? 'डेटा रीसेट करें' : 'Reset / Restore'}</span>
              </div>
              <p className="text-[10px] text-[var(--sk-muted)] mt-1">
                {isHi
                  ? 'नमूना डेटा पुनः लोड करें या शून्य से नई शुरुआत करें'
                  : 'Restore demo dataset or wipe clean'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResetData(true)}
              className="w-full py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>{isHi ? 'रीसेट विकल्प' : 'Reset Options'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PWA INSTALL CARD FOR MOBILE */}
      <div className="p-4 rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] shadow-sm">
        <PWAInstallButton lang={lang} variant="banner" />
      </div>

      {/* MODALS */}
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        lang={lang}
        profile={profile}
        onSave={handleSaveProfile}
      />

      <ChangePinModal
        isOpen={showChangePin}
        onClose={() => setShowChangePin(false)}
        lang={lang}
        currentPin={security.pin}
        onSavePin={handleSavePin}
      />

      <ResetDataModal
        isOpen={showResetData}
        onClose={() => setShowResetData(false)}
        lang={lang}
        onConfirmReset={handleConfirmReset}
      />

      <LandSettingsModal
        isOpen={showLandModal}
        onClose={() => setShowLandModal(false)}
        lang={lang}
      />
    </div>
  );
}
