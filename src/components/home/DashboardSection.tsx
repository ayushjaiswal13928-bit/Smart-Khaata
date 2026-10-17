import React, { useMemo } from 'react';
import {
  LayoutDashboard, Wheat, Building2, ShoppingBag, Wallet,
  TrendingUp, Clock3, ArrowUpRight, PlusCircle, Sprout,
} from 'lucide-react';
import type { FarmRecord, HomeExpense, Lang, RentRecord } from '../../lib/types';

interface DashboardSectionProps {
  records: FarmRecord[];
  rentRecords: RentRecord[];
  homeExpenses: HomeExpense[];
  lang: Lang;
  onNavigate: (section: 'farm' | 'rent' | 'home' | 'settings') => void;
}

const money = (value: number) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

export function DashboardSection({ records, rentRecords, homeExpenses, lang, onNavigate }: DashboardSectionProps) {
  const isHi = lang === 'hi';
  const summary = useMemo(() => {
    const farmExpense = records.filter(r => r.type === 'Expense').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const farmSales = records.filter(r => r.type === 'Sale').reduce((sum, r) => {
      const qty = Number(r.quantity) || 0;
      const price = Number(r.price) || 0;
      return sum + (qty > 0 && price > 0 ? qty * price : Number(r.amount) || 0);
    }, 0);
    const farmReceived = records.filter(r => r.type === 'Sale').reduce((sum, r) => {
      const qty = Number(r.quantity) || 0;
      const price = Number(r.price) || 0;
      const saleAmount = qty > 0 && price > 0 ? qty * price : Number(r.amount) || 0;
      return sum + (r.paidAmount !== undefined ? Math.max(0, Number(r.paidAmount) || 0) : saleAmount);
    }, 0);
    const farmDue = records.filter(r => r.type === 'Sale').reduce((sum, r) => {
      const qty = Number(r.quantity) || 0;
      const price = Number(r.price) || 0;
      const saleAmount = qty > 0 && price > 0 ? qty * price : Number(r.amount) || 0;
      const paid = r.paidAmount !== undefined ? Math.max(0, Number(r.paidAmount) || 0) : saleAmount;
      return sum + (r.remainingAmount !== undefined ? Math.max(0, Number(r.remainingAmount) || 0) : Math.max(0, saleAmount - paid));
    }, 0);
    const rentTotal = rentRecords.reduce((sum, r) => sum + (Number(r.total || r.amount) || 0), 0);
    const rentReceived = rentRecords.reduce((sum, r) => sum + (Number(r.paidAmount) || (r.status === 'Received' ? Number(r.total || r.amount) || 0 : 0)), 0);
    const rentDue = rentRecords.reduce((sum, r) => sum + (r.remainingAmount !== undefined ? Math.max(0, Number(r.remainingAmount) || 0) : Math.max(0, (Number(r.total || r.amount) || 0) - (Number(r.paidAmount) || (r.status === 'Received' ? Number(r.total || r.amount) || 0 : 0)))), 0);
    const householdExpense = homeExpenses.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    return { farmExpense, farmSales, farmReceived, farmDue, rentTotal, rentReceived, rentDue, householdExpense, netCash: farmReceived - farmExpense };
  }, [records, rentRecords, homeExpenses]);

  const cards = [
    { label: isHi ? 'खेती का कुल खर्च' : 'Farm expenses', value: money(summary.farmExpense), note: isHi ? 'खेत के दर्ज खर्च' : 'Recorded farm costs', icon: Wheat, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { label: isHi ? 'फसल की कुल बिक्री' : 'Total crop sales', value: money(summary.farmSales), note: isHi ? 'बिक्री की दर्ज रकम' : 'Recorded sale value', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: isHi ? 'फसल से प्राप्त भुगतान' : 'Farm payments received', value: money(summary.farmReceived), note: isHi ? 'बेची फसल का मिला पैसा' : 'Cash received for sales', icon: Wallet, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: isHi ? 'फसल का बकाया' : 'Farm payments due', value: money(summary.farmDue), note: isHi ? 'खरीदारों से बाकी' : 'Still due from buyers', icon: Clock3, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const shortcuts = [
    { label: isHi ? 'खेती का हिसाब' : 'Farm records', desc: isHi ? 'खर्च, पैदावार और बिक्री' : 'Costs, yield and sales', icon: Wheat, color: 'text-emerald-400', section: 'farm' as const },
    { label: isHi ? 'किराया हिसाब' : 'Rental records', desc: isHi ? 'किराया और बिजली बिल' : 'Rent and electricity bills', icon: Building2, color: 'text-blue-400', section: 'rent' as const },
    { label: isHi ? 'घरेलू खर्च' : 'Household expenses', desc: isHi ? 'राशन, बिल और अन्य खर्च' : 'Groceries, bills and more', icon: ShoppingBag, color: 'text-violet-400', section: 'home' as const },
  ];

  return (
    <section className="w-full max-w-[1200px] mx-auto px-3 sm:px-5 lg:px-6 pb-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center"><LayoutDashboard size={22} /></div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--sk-text)]">{isHi ? 'डैशबोर्ड' : 'Dashboard'}</h1>
              <p className="text-xs sm:text-sm text-[var(--sk-muted)]">{isHi ? 'आपके खेती, किराया और घरेलू खाते का सारांश' : 'A summary of your farm, rental and household accounts'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card)] px-3 py-2 text-xs text-[var(--sk-muted)]">
          {isHi ? 'सभी रकम रुपये में • आपके दर्ज रिकॉर्ड के आधार पर' : 'All amounts in INR • Based on saved entries'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map(({ label, value, note, icon: Icon, color, bg }) => (
          <article key={label} className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-4 shadow-sm min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-xs sm:text-sm text-[var(--sk-muted)]">{label}</p><p className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--sk-text)] break-words">{value}</p></div>
              <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${bg} ${color}`}><Icon size={20} /></div>
            </div>
            <p className="mt-3 text-xs text-[var(--sk-muted)]">{note}</p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <article className="lg:col-span-2 rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div><h2 className="font-bold text-[var(--sk-text)]">{isHi ? 'खाते का सारांश' : 'Account overview'}</h2><p className="text-xs text-[var(--sk-muted)] mt-1">{isHi ? 'अलग-अलग खाते की रकम एक जगह देखें' : 'View balances from each account in one place'}</p></div>
            <Sprout className="text-emerald-400" size={22} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--sk-card2)] p-3"><div className="flex items-center gap-3 min-w-0"><Wheat className="text-emerald-400 shrink-0" size={19}/><div><p className="text-sm font-semibold text-[var(--sk-text)]">{isHi ? 'खेती का नकद अंतर' : 'Farm cash difference'}</p><p className="text-xs text-[var(--sk-muted)]">{isHi ? 'प्राप्त भुगतान − खेती का खर्च' : 'Payments received − farm expenses'}</p></div></div><strong className="text-sm text-[var(--sk-text)] whitespace-nowrap">{money(summary.netCash)}</strong></div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--sk-card2)] p-3"><div className="flex items-center gap-3 min-w-0"><Building2 className="text-blue-400 shrink-0" size={19}/><div><p className="text-sm font-semibold text-[var(--sk-text)]">{isHi ? 'किराया प्राप्त' : 'Rent received'}</p><p className="text-xs text-[var(--sk-muted)]">{isHi ? `${rentRecords.length} दर्ज रिकॉर्ड` : `${rentRecords.length} recorded entries`}</p></div></div><strong className="text-sm text-[var(--sk-text)] whitespace-nowrap">{money(summary.rentReceived)}</strong></div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--sk-card2)] p-3"><div className="flex items-center gap-3 min-w-0"><Clock3 className="text-amber-400 shrink-0" size={19}/><div><p className="text-sm font-semibold text-[var(--sk-text)]">{isHi ? 'किराया बकाया' : 'Rent pending'}</p><p className="text-xs text-[var(--sk-muted)]">{isHi ? 'किरायेदारों से बाकी रकम' : 'Outstanding from tenants'}</p></div></div><strong className="text-sm text-[var(--sk-text)] whitespace-nowrap">{money(summary.rentDue)}</strong></div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--sk-card2)] p-3"><div className="flex items-center gap-3 min-w-0"><ShoppingBag className="text-violet-400 shrink-0" size={19}/><div><p className="text-sm font-semibold text-[var(--sk-text)]">{isHi ? 'घरेलू खर्च' : 'Household expenses'}</p><p className="text-xs text-[var(--sk-muted)]">{isHi ? `${homeExpenses.length} दर्ज रिकॉर्ड` : `${homeExpenses.length} recorded entries`}</p></div></div><strong className="text-sm text-[var(--sk-text)] whitespace-nowrap">{money(summary.householdExpense)}</strong></div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-[var(--sk-muted)]">{isHi ? 'ध्यान दें: खेती का नकद अंतर लाभ का अंतिम हिसाब नहीं है। इसमें बकाया बिक्री, स्टॉक, साझेदारी और अन्य समायोजन शामिल नहीं हैं।' : 'Note: Farm cash difference is not final profit. It excludes outstanding sales, stock, partnership and other adjustments.'}</p>
        </article>

        <article className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-4 sm:p-5">
          <h2 className="font-bold text-[var(--sk-text)]">{isHi ? 'जल्दी खोलें' : 'Quick access'}</h2>
          <p className="text-xs text-[var(--sk-muted)] mt-1 mb-4">{isHi ? 'जिस खाते में काम करना हो, चुनें' : 'Choose the section you want to use'}</p>
          <div className="space-y-2">
            {shortcuts.map(({ label, desc, icon: Icon, color, section }) => (
              <button key={section} type="button" onClick={() => onNavigate(section)} className="w-full flex items-center gap-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] hover:border-emerald-500/40 p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                <span className={`h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center ${color}`}><Icon size={20}/></span>
                <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-[var(--sk-text)]">{label}</span><span className="block text-xs text-[var(--sk-muted)] mt-0.5">{desc}</span></span>
                <ArrowUpRight size={16} className="text-[var(--sk-muted)] shrink-0" />
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-start gap-2"><PlusCircle className="text-emerald-400 shrink-0 mt-0.5" size={17}/><p className="text-xs leading-relaxed text-[var(--sk-muted)]">{isHi ? 'नया रिकॉर्ड जोड़ने के लिए संबंधित खाते में जाएँ। आपके पुराने रिकॉर्ड वहीं उपलब्ध रहेंगे।' : 'Open the relevant section to add a new entry. Existing records remain in their sections.'}</p></div>
        </article>
      </div>
    </section>
  );
}
