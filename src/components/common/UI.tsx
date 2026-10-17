import React from 'react';

export const selectCls =
  'w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs sm:text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500 cursor-pointer';

export const inputCls =
  'w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-xs sm:text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500';

export const btnPrimary =
  'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer';

export const btnSecondary =
  'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card2)] font-semibold text-xs sm:text-sm transition cursor-pointer';

export function FormCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-4 sm:p-5 shadow-sm transition-colors ${className}`}
    >
      {children}
    </div>
  );
}

export function InputGroup({
  label,
  children,
  error,
  help,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  help?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-[var(--sk-text)]">{label}</label>
      {children}
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
      {help && <p className="text-[10px] text-[var(--sk-muted)]">{help}</p>}
    </div>
  );
}

export function KpiBox({
  label,
  value,
  sublabel,
  color,
}: {
  label: string;
  value: string;
  sublabel?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-3 shadow-sm transition-colors">
      <div className="text-[11px] text-[var(--sk-muted)] font-medium truncate">{label}</div>
      <div className={`mt-1 text-base sm:text-lg font-bold font-mono ${color || 'text-[var(--sk-text)]'}`}>
        {value}
      </div>
      {sublabel && <div className="text-[10px] text-[var(--sk-faint)] mt-0.5 truncate">{sublabel}</div>}
    </div>
  );
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  actions,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        {icon}
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--sk-text)]">{title}</h2>
          {subtitle && <p className="text-xs text-[var(--sk-muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: 'Pending' | 'Received' | 'Partial' | string }) {
  if (status === 'Received') {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
        ✓ जमा (Paid)
      </span>
    );
  }
  if (status === 'Partial') {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
        आंशिक (Partial)
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">
      बाकी (Pending)
    </span>
  );
}
