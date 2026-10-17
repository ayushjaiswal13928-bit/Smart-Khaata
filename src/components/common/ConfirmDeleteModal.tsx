'use client';

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  itemDetails?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'प्रविष्टि हटाएं?',
  message = 'क्या आप वाकई इसे हटाना चाहते हैं? यह डेटा हमेशा के लिए हटा दिया जाएगा।',
  itemName,
  itemDetails,
  confirmText = 'हाँ, हटाएं',
  cancelText = 'रद्द करें',
  isDanger = true,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with icon and close button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--sk-text)] leading-tight">
                {title}
              </h3>
              {itemName && (
                <p className="text-xs font-semibold text-red-500 mt-0.5 truncate">
                  {itemName}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card2)] transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs sm:text-sm text-[var(--sk-muted)] leading-relaxed">
          {message}
        </p>

        {/* Item Details Box (if provided) */}
        {itemDetails && (
          <div className="p-3 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-xs space-y-1">
            {itemDetails}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-[var(--sk-border)]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] hover:bg-[var(--sk-card3)] text-[var(--sk-text)] text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 h-11 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
              isDanger
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            <Trash2 size={16} />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
