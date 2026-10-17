'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';
import type { Lang } from '../../lib/types';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  onConfirmReset: (mode: 'sample' | 'clear') => void;
}

export function ResetDataModal({
  isOpen,
  onClose,
  lang,
  onConfirmReset,
}: ResetDataModalProps) {
  if (!isOpen) return null;

  const isHi = lang === 'hi';
  const [resetMode, setResetMode] = useState<'sample' | 'clear'>('sample');
  const [confirmText, setConfirmText] = useState('');
  const [confirmedCheck, setConfirmedCheck] = useState(false);

  const canProceed = confirmedCheck && (confirmText.trim().toUpperCase() === 'RESET' || confirmText.trim() === 'रीसेट');

  const handleExecute = () => {
    if (!canProceed) return;
    onConfirmReset(resetMode);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-red-500/40 bg-[var(--sk-card)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--sk-border)] bg-gradient-to-r from-red-950/20 via-[var(--sk-card)] to-slate-900/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center">
              <ShieldAlert size={16} />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[var(--sk-text)]">
              {isHi ? 'डेटा रीसेट व फ़ैक्टरी सेटिंग्स' : 'Reset & Restore Data'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card2)] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto text-xs flex-1">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-200">
              <AlertTriangle size={14} className="shrink-0 text-amber-500" />
              <span>{isHi ? 'सावधानी: यह क्रिया पूर्ववत नहीं की जा सकती' : 'Warning: Irreversible action'}</span>
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
              {isHi
                ? 'यदि आपने पहले बैकअप नहीं लिया है, तो रीसेट करने से पहले बैकअप डाउनलोड कर लें।'
                : 'Make sure you have downloaded a JSON backup before proceeding.'}
            </p>
          </div>

          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="block font-semibold text-[var(--sk-text)]">
              {isHi ? 'रीसेट का प्रकार चुनें:' : 'Select reset method:'}
            </label>

            <button
              type="button"
              onClick={() => setResetMode('sample')}
              className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                resetMode === 'sample'
                  ? 'border-emerald-500 bg-emerald-500/15 text-[var(--sk-text)]'
                  : 'border-[var(--sk-border)] bg-[var(--sk-card2)] text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
              }`}
            >
              <RefreshCw size={16} className={resetMode === 'sample' ? 'text-emerald-500 mt-0.5' : 'mt-0.5'} />
              <div>
                <div className="font-bold text-xs text-[var(--sk-text)]">
                  {isHi ? 'आदर्श नमूना डेटा लोड करें (Restore Sample Data)' : 'Restore Default Sample Data'}
                </div>
                <div className="text-[11px] text-[var(--sk-muted)] mt-0.5">
                  {isHi
                    ? 'खेती, किराया व घर खर्च के शुरुआती आदर्श रिकॉर्ड वापस आ जाएंगे।'
                    : 'Restores fresh demo transactions and field setups.'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setResetMode('clear')}
              className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                resetMode === 'clear'
                  ? 'border-red-500 bg-red-500/15 text-[var(--sk-text)]'
                  : 'border-[var(--sk-border)] bg-[var(--sk-card2)] text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
              }`}
            >
              <Trash2 size={16} className={resetMode === 'clear' ? 'text-red-500 mt-0.5' : 'mt-0.5'} />
              <div>
                <div className="font-bold text-xs text-red-600 dark:text-red-300">
                  {isHi ? 'पूर्ण साफ़ शुरुआत (Wipe All & Fresh Start)' : 'Complete Wipe & Empty Start'}
                </div>
                <div className="text-[11px] text-[var(--sk-muted)] mt-0.5">
                  {isHi
                    ? 'सभी पुराने रिकॉर्ड मिटाकर शून्य (0) से बिल्कुल नया खाता शुरू करें।'
                    : 'Deletes all records and starts with a completely empty ledger.'}
                </div>
              </div>
            </button>
          </div>

          {/* Confirmation Checkbox */}
          <div className="pt-2 border-t border-[var(--sk-border)] space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmedCheck}
                onChange={(e) => setConfirmedCheck(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-0 focus:outline-none cursor-pointer"
              />
              <span className="text-[11px] text-[var(--sk-text2)] font-medium">
                {isHi ? 'मैं समझता/समझती हूँ कि पुराना डेटा मिट जाएगा' : 'I confirm I want to reset my application data'}
              </span>
            </label>

            <div>
              <label className="block text-[11px] text-[var(--sk-muted)] mb-1">
                {isHi ? 'पुष्टि के लिए नीचे "RESET" या "रीसेट" टाइप करें:' : 'Type "RESET" below to confirm:'}
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full px-3 py-2 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-[var(--sk-text)] font-mono focus:outline-none focus:border-red-500 text-xs"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--sk-border)] text-slate-400 hover:text-white transition cursor-pointer"
            >
              {isHi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={!canProceed}
              onClick={handleExecute}
              className={`px-5 py-2 rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer ${
                canProceed
                  ? 'bg-red-600 hover:bg-red-500 text-white active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Trash2 size={14} />
              <span>{isHi ? 'रीसेट निष्पादित करें' : 'Confirm Reset'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
