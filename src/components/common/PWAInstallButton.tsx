import React, { useState } from 'react';
import { Download, Smartphone, Check, X, Share } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Lang } from '../../lib/types';

interface PWAInstallButtonProps {
  lang: Lang;
  variant?: 'header' | 'banner' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  lang,
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const isHi = lang === 'hi';

  // If already installed and running as standalone app, suppress prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer animate-pulse-subtle"
          title={isHi ? 'ऐप को अपने फोन में इंस्टॉल करें' : 'Install Smart Khaata App'}
        >
          <Download size={14} />
          <span className="hidden sm:inline">
            {isHi ? 'ऐप इंस्टॉल करें' : 'Install App'}
          </span>
          <span className="sm:hidden">{isHi ? 'इंस्टॉल' : 'Install'}</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className="relative overflow-hidden rounded-2xl border border-green-500/30 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-green-950/70 p-3.5 sm:p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/icon-192.png"
              alt="Smart Khaata"
              className="w-11 h-11 rounded-2xl shadow-md border border-green-500/30 shrink-0"
            />
            <div>
              <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                {isHi ? 'स्मार्ट खाता ऐप इंस्टॉल करें' : 'Install Smart Khaata App'}
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-green-500/20 text-green-300 font-semibold border border-green-500/30">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {isHi
                  ? 'होम स्क्रीन पर जोड़ें — बिना इंटरनेट भी हिसाब देखें और ऐप जैसा चलाएं!'
                  : 'Add to Home Screen for one-tap access & offline storage.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Download size={14} />
              {isHi ? 'अभी इंस्टॉल करें' : 'Install Now'}
            </button>
          </div>
        </div>
      )}

      {/* Guide Modal for iOS Safari and other browsers without native beforeinstallprompt */}
      {showGuide && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowGuide(false);
          }}
        >
          <div className="w-full max-w-sm rounded-3xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--sk-border)] pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icon-192.png"
                  alt="Smart Khaata"
                  className="w-9 h-9 rounded-xl shadow border border-green-500/30"
                />
                <div>
                  <h3 className="font-bold text-sm text-[var(--sk-text)]">
                    {isHi ? 'ऐप इंस्टॉल करने का तरीका' : 'How to Install App'}
                  </h3>
                  <p className="text-[10px] text-[var(--sk-muted)]">
                    Smart Khaata PWA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--sk-muted)] hover:bg-white/5 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-[var(--sk-text2)] leading-relaxed">
                <p className="text-slate-300">
                  {isHi
                    ? 'iPhone / iPad (Safari) पर ऐप को होम स्क्रीन पर जोड़ने के लिए:'
                    : 'To install on iPhone or iPad using Safari:'}
                </p>

                <div className="space-y-2 rounded-2xl bg-[var(--sk-card2)] p-3 border border-[var(--sk-border)]">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <span>
                      {isHi
                        ? 'सफारी के नीचे '
                        : 'Tap the '}
                      <strong className="text-white inline-flex items-center gap-1 font-semibold">
                        <Share size={12} className="text-blue-400" /> {isHi ? 'शेयर (Share)' : 'Share'}
                      </strong>
                      {isHi ? ' बटन पर टैप करें।' : ' button in Safari toolbar.'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <span>
                      {isHi
                        ? 'सूची में नीचे स्क्रॉल करके '
                        : 'Scroll down and tap '}
                      <strong className="text-white">
                        {isHi ? '"होम स्क्रीन में जोड़ें" (Add to Home Screen)' : '"Add to Home Screen"'}
                      </strong>
                      {isHi ? ' चुनें।' : '.'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <span>
                      {isHi
                        ? 'ऊपर दाईं ओर '
                        : 'Tap '}
                      <strong className="text-green-400">
                        {isHi ? '"जोड़ें" (Add)' : '"Add"'}
                      </strong>
                      {isHi
                        ? ' पर टैप करें। ऐप आपके फोन पर आ जाएगा!'
                        : ' in top right. The app icon will appear on your home screen!'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[var(--sk-text2)] leading-relaxed">
                <p className="text-slate-300">
                  {isHi
                    ? 'Android या Chrome ब्राउज़र पर इंस्टॉल करने के लिए:'
                    : 'To install on Android or Chrome:'}
                </p>

                <div className="space-y-2 rounded-2xl bg-[var(--sk-card2)] p-3 border border-[var(--sk-border)]">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <span>
                      {isHi
                        ? 'ब्राउज़र के ऊपर तीन डॉट्स (⋮) मेनू पर टैप करें।'
                        : 'Tap the three dots (⋮) menu in browser top right.'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <span>
                      <strong className="text-white">
                        {isHi ? '"ऐप इंस्टॉल करें" या "होम स्क्रीन में जोड़ें"' : '"Install app" or "Add to Home screen"'}
                      </strong>
                      {isHi ? ' चुनें।' : '.'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <span>
                      {isHi
                        ? 'कन्फर्म करें — ऐप फोन की होम स्क्रीन पर असली ऐप जैसा खुल जाएगा!'
                        : 'Confirm installation to access directly from your phone app drawer!'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[var(--sk-card2)] hover:bg-white/5 border border-[var(--sk-border)] font-semibold text-xs text-white transition cursor-pointer"
            >
              {isHi ? 'समझ गया (बंद करें)' : 'Got it (Close)'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
