'use client';

import React, { useState } from 'react';
import { Lock, Delete, ShieldCheck, Wheat, Check } from 'lucide-react';
import { Lang } from '../../lib/types';
import { AppLogo } from '../common/AppLogo';

interface PinLockScreenProps {
  correctPin: string;
  lang: Lang;
  onUnlocked: () => void;
}

export function PinLockScreen({ correctPin, lang, onUnlocked }: PinLockScreenProps) {
  const isHi = lang === 'hi';
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError(false);

    if (next.length === 4) {
      if (next === correctPin) {
        onUnlocked();
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[var(--sk-bg)] flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs flex flex-col items-center space-y-6 animate-in fade-in">
        {/* App Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <AppLogo size="lg" />
          <div>
            <h2 className="text-xl font-bold text-[var(--sk-text)] tracking-tight">
              {isHi ? 'स्मार्ट खाता' : 'Smart Khata'}
            </h2>
            <p className="text-xs text-[var(--sk-muted)] mt-0.5">
              {isHi ? 'सुरक्षित डिजिटल बहीखाता' : 'Secure Digital Ledger'}
            </p>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--sk-text2)] font-semibold">
            <Lock size={14} className="text-emerald-500" />
            <span>{isHi ? '4-अंकीय सुरक्षा पिन दर्ज करें' : 'Enter 4-Digit Security PIN'}</span>
          </div>

          <div className="flex items-center justify-center gap-4 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    error
                      ? 'bg-red-500 scale-110'
                      : isFilled
                      ? 'bg-emerald-500 scale-110 shadow-sm shadow-emerald-500/50'
                      : 'border-2 border-[var(--sk-border)] bg-transparent'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <p className="text-xs text-red-500 font-semibold animate-shake">
              {isHi ? 'गलत पिन! पुनः प्रयास करें' : 'Incorrect PIN! Try again'}
            </p>
          )}
        </div>

        {/* Keypad (1 to 9, Clear, 0, Backspace) */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-[var(--sk-card)] border border-[var(--sk-border)] hover:bg-[var(--sk-card2)] active:scale-95 text-[var(--sk-text)] font-mono font-bold text-xl transition flex items-center justify-center cursor-pointer shadow-sm"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)] active:scale-95 text-xs font-semibold transition flex items-center justify-center cursor-pointer"
          >
            {isHi ? 'साफ़' : 'Clear'}
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-[var(--sk-card)] border border-[var(--sk-border)] hover:bg-[var(--sk-card2)] active:scale-95 text-[var(--sk-text)] font-mono font-bold text-xl transition flex items-center justify-center cursor-pointer shadow-sm"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-red-500 active:scale-95 transition flex items-center justify-center cursor-pointer"
            title="Backspace"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
