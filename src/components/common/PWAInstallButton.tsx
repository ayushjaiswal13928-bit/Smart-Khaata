import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Check, Sparkles, X, Share2, PlusSquare, Info } from 'lucide-react';
import { Lang } from '../../lib/types';

interface PWAInstallButtonProps {
  lang: Lang;
  variant?: 'banner' | 'button' | 'header';
  className?: string;
}

export function PWAInstallButton({ lang, variant = 'button', className = '' }: PWAInstallButtonProps) {
  const isHi = lang === 'hi';
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed or running as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show instructional guide modal instead of window.alert
      setShowGuideModal(true);
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch {
      setShowGuideModal(true);
    }
  };

  // If already running in standalone mode, display a subtle installed state or hide in header
  if (isInstalled) {
    if (variant === 'header') {
      return (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <Check size={13} className="text-emerald-500" />
          <span>{isHi ? 'इंस्टॉल है' : 'Installed'}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
        <Check size={16} />
        <span>{isHi ? 'स्मार्ट खाता ऐप सफलतापूर्वक फोन में इंस्टॉल है' : 'App installed on this device'}</span>
      </div>
    );
  }

  return (
    <>
      {/* 1. HEADER VARIANT */}
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`h-8 px-2.5 sm:px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0 animate-pulse hover:animate-none ${className}`}
          title={isHi ? 'ऐप फोन में इंस्टॉल करें' : 'Install App'}
        >
          <Download size={14} className="stroke-[2.5]" />
          <span className="font-bold">{isHi ? 'ऐप इंस्टॉल' : 'Install App'}</span>
        </button>
      )}

      {/* 2. BANNER VARIANT */}
      {variant === 'banner' && (
        <div className={`p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[var(--sk-card)] to-emerald-900/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${className}`}>
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
              <Smartphone size={20} />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[var(--sk-text)] flex items-center gap-1.5">
                <span>{isHi ? 'स्मार्ट खाता को मोबाइल ऐप की तरह चलाएं' : 'Install Smart Khaata App'}</span>
                <Sparkles size={13} className="text-amber-500 shrink-0" />
              </h4>
              <p className="text-[11px] text-[var(--sk-muted)] mt-0.5">
                {isHi
                  ? 'बिना इंटरनेट ऑफलाइन चलेगा, सीधे होम स्क्रीन से 1-क्लिक में खुलेगा।'
                  : 'Works offline without internet, opens with 1-click from your home screen.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <Download size={15} />
            <span>{isHi ? 'फोन में इंस्टॉल करें' : 'Install App'}</span>
          </button>
        </div>
      )}

      {/* 3. BUTTON VARIANT */}
      {variant === 'button' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition cursor-pointer active:scale-95 ${className}`}
        >
          <Download size={14} />
          <span>{isHi ? 'फोन में इंस्टॉल करें (PWA App)' : 'Install App on Phone'}</span>
        </button>
      )}

      {/* INSTRUCTIONAL MODAL (FOR IOS SAFARI OR MANUAL INSTALL) */}
      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div className="bg-[var(--sk-card)] border border-[var(--sk-border)] rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--sk-border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Smartphone size={18} />
                </div>
                <h3 className="font-bold text-sm text-[var(--sk-text)]">
                  {isHi ? 'ऐप इंस्टॉल करने का तरीका' : 'How to Install App'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card2)] transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-[var(--sk-text)]">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {isHi ? 'iPhone / iPad (Safari) के लिए:' : 'For iPhone / iPad (Safari):'}
                </p>
                <ol className="list-decimal list-inside space-y-2 text-[var(--sk-muted)]">
                  <li className="flex items-start gap-2">
                    <Share2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <span>
                      {isHi ? 'सफारी ब्राउज़र में नीचे दिए Share (शेयर) बटन पर टैप करें।' : 'Tap the Share button in Safari toolbar.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <PlusSquare size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      {isHi ? 'नीचे स्क्रॉल करके "Add to Home Screen" (होम स्क्रीन में जोड़ें) चुनें।' : 'Scroll down and select "Add to Home Screen".'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                    <span>
                      {isHi ? 'ऊपर दाईं तरफ "Add" पर टैप करें। ऐप आपके फोन में आ जाएगी!' : 'Tap "Add". The app is now on your home screen!'}
                    </span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[var(--sk-text)]">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {isHi ? 'Android / Chrome / Edge के लिए:' : 'For Android / Chrome / Edge:'}
                </p>
                <div className="space-y-2 text-[var(--sk-muted)]">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-500 shrink-0">1.</span>
                    <span>
                      {isHi ? 'ब्राउज़र के ऊपर दाईं ओर दिए तीन बिंदुओं (⋮) पर टैप करें।' : 'Tap the three dots menu (⋮) in your browser.'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-500 shrink-0">2.</span>
                    <span>
                      {isHi ? '"Install app" या "Add to Home screen" (होम स्क्रीन में जोड़ें) चुनें।' : 'Select "Install app" or "Add to Home screen".'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-500 shrink-0">3.</span>
                    <span>
                      {isHi ? '"Install" पर क्लिक करें। ऐप आपके फोन में 1 सेकंड में डाउनलोड हो जाएगी!' : 'Click "Install" to download and add to your device.'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Info size={14} className="shrink-0 mt-0.5 text-amber-500" />
              <span>
                {isHi
                  ? 'इंस्टॉल करने के बाद ऐप बिना इंटरनेट भी आपके सभी खेतों और खातों का हिसाब सुरक्षित रखेगी।'
                  : 'Once installed, the app works completely offline without internet.'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
            >
              {isHi ? 'ठीक है, समझ आ गया' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
