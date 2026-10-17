'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Users,
  Wheat,
  Scale,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Lang } from '../../lib/types';
import { BataiSettlementResult } from '../../lib/bataiLogic';
import { fmt } from '../../lib/utils';

interface BataiSettlementExplainerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  settlement: BataiSettlementResult;
}

export function BataiSettlementExplainer({
  isOpen,
  onClose,
  lang,
  settlement,
}: BataiSettlementExplainerProps) {
  const isHi = lang === 'hi';

  const [activeTab, setActiveTab] = useState<
    'audit' | 'rules' | 'example'
  >('audit');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--sk-border)] bg-gradient-to-r from-emerald-950/60 via-[var(--sk-card)] to-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>{isHi ? 'बटाई व साझीदार हिसाब का पूरा गणित' : 'Batai Calculation Logic & Rules'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  {settlement.partnerName}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isHi
                  ? 'अधिया (50-50) व तिहाई में बिना किसी विवाद के पाई-पाई का पक्का हिसाब'
                  : 'Transparent, dispute-free mathematical settlement formula'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card2)] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-[var(--sk-border)] bg-[var(--sk-card2)] p-1 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-2 rounded-lg text-center transition cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
            }`}
          >
            {isHi ? '📋 इस खाते का स्टेप-बाय-स्टेप हिसाब' : 'Step-by-Step Ledger'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-2 rounded-lg text-center transition cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
            }`}
          >
            {isHi ? '⚖️ अधिया व तिहाई के नियम' : 'Batai Rules (50-50 / 1/3)'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('example')}
            className={`flex-1 py-2 rounded-lg text-center transition cursor-pointer ${
              activeTab === 'example'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
            }`}
          >
            {isHi ? '💡 आसान उदाहरण से समझें' : 'Easy Example'}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: STEP-BY-STEP AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Verdict Card */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  settlement.settlementStatus === 'partner_owes_me'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                    : settlement.settlementStatus === 'i_owe_partner'
                    ? 'bg-red-500/10 border-red-500/40 text-red-800 dark:text-red-300'
                    : 'bg-[var(--sk-card2)] border-[var(--sk-border)] text-[var(--sk-text)]'
                }`}
              >
                <div>
                  <span className="text-[11px] font-semibold block text-[var(--sk-muted)]">
                    {isHi ? 'अंतिम शुद्ध फैसला (Net Settlement):' : 'Final Settlement Decision:'}
                  </span>
                  <div className="text-xl sm:text-2xl font-bold font-mono mt-0.5">
                    {settlement.settlementStatus === 'partner_owes_me' && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {isHi
                          ? `साझीदार से ₹${settlement.netBalance.toLocaleString('en-IN')} लेने हैं`
                          : `Partner owes you ₹${settlement.netBalance.toLocaleString('en-IN')}`}
                      </span>
                    )}
                    {settlement.settlementStatus === 'i_owe_partner' && (
                      <span className="text-red-600 dark:text-red-400">
                        {isHi
                          ? `साझीदार को ₹${Math.abs(settlement.netBalance).toLocaleString('en-IN')} देने हैं`
                          : `You owe partner ₹${Math.abs(settlement.netBalance).toLocaleString('en-IN')}`}
                      </span>
                    )}
                    {settlement.settlementStatus === 'settled' && (
                      <span className="text-[var(--sk-text)]">
                        {isHi ? 'हिसाब पूरा चुकता है (₹0 बकाया)' : 'All accounts settled (₹0 balance)'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono shrink-0">
                  <div className="text-[var(--sk-muted)]">
                    {isHi ? 'साझेदारी:' : 'Share:'} {settlement.partnerSharePercent}%
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {isHi ? 'कुल फसल बिक्री:' : 'Total Sales:'} ₹{settlement.totalSales.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* 2-Column Ledger: Owner Credits vs Partner Credits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Column 1: साझीदार से आपके हक में रकम */}
                <div className="p-3.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--sk-border)]">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <ArrowRight size={14} />
                      <span>{isHi ? 'साझीदार से आपको मिलना:' : 'You are Entitled to:'}</span>
                    </span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ₹{settlement.partnerOwesMeTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-[var(--sk-card)] border border-[var(--sk-border)]">
                      <div className="flex justify-between font-mono font-semibold text-[var(--sk-text)]">
                        <span>1. आपके खर्च में साझीदार हिस्सा:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          +₹{Math.round(settlement.myExpensePaid * (settlement.costSharePercent / 100)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--sk-muted)] mt-0.5">
                        आपने खाद-बीज में ₹{settlement.myExpensePaid.toLocaleString('en-IN')} लगाए, जिसका {settlement.costSharePercent}% साझीदार देगा।
                      </p>
                    </div>

                    {settlement.partnerSalesReceived > 0 && (
                      <div className="p-2 rounded-lg bg-[var(--sk-card)] border border-[var(--sk-border)]">
                        <div className="flex justify-between font-mono font-semibold text-[var(--sk-text)]">
                          <span>2. साझीदार की बिक्री में आपका हिस्सा:</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +₹{Math.round(settlement.partnerSalesReceived * (settlement.mySharePercent / 100)).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--sk-muted)] mt-0.5">
                          साझीदार ने ₹{settlement.partnerSalesReceived.toLocaleString('en-IN')} की फसल बेची।
                        </p>
                      </div>
                    )}

                    {settlement.directCashGave > 0 && (
                      <div className="p-2 rounded-lg bg-[var(--sk-card)] border border-[var(--sk-border)]">
                        <div className="flex justify-between font-mono font-semibold text-[var(--sk-text)]">
                          <span>3. आपने जो नकद पेशगी दी:</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +₹{settlement.directCashGave.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--sk-muted)] mt-0.5">
                          घरेलू खर्च या खाद-डीजल के लिए नकद उधार/पेशगी दी गई।
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: साझीदार के हक में रकम */}
                <div className="p-3.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--sk-border)]">
                    <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <ArrowRight size={14} />
                      <span>{isHi ? 'साझीदार को देना:' : 'Partner is Entitled to:'}</span>
                    </span>
                    <span className="font-bold font-mono text-red-600 dark:text-red-400">
                      ₹{settlement.iOwePartnerTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-[var(--sk-card)] border border-[var(--sk-border)]">
                      <div className="flex justify-between font-mono font-semibold text-[var(--sk-text)]">
                        <span>1. आपकी बिक्री में साझीदार हिस्सा:</span>
                        <span className="text-red-600 dark:text-red-400">
                          +₹{Math.round(settlement.mySalesReceived * (settlement.partnerSharePercent / 100)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--sk-muted)] mt-0.5">
                        आपने मंडी से ₹{settlement.mySalesReceived.toLocaleString('en-IN')} उठाए, जिसमें साझीदार का {settlement.partnerSharePercent}% हक है।
                      </p>
                    </div>

                    {settlement.partnerExpensePaid > 0 && (
                      <div className="p-2 rounded-lg bg-[var(--sk-card)] border border-[var(--sk-border)]">
                        <div className="flex justify-between font-mono font-semibold text-[var(--sk-text)]">
                          <span>2. साझीदार के खर्च में आपका हिस्सा:</span>
                          <span className="text-red-600 dark:text-red-400">
                            +₹{Math.round(settlement.partnerExpensePaid * (settlement.myCostSharePercent / 100)).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--sk-muted)] mt-0.5">
                          साझीदार ने अपनी जेब से ₹{settlement.partnerExpensePaid.toLocaleString('en-IN')} खर्च किए।
                        </p>
                      </div>
                    )}

                    {settlement.directCashReceived > 0 && (
                      <div className="p-2 rounded-lg bg-[var(--sk-card)] border border-[var(--sk-border)]">
                        <div className="flex justify-between font-mono font-semibold text-[var(--sk-text)]">
                          <span>3. साझीदार से प्राप्त नकद:</span>
                          <span className="text-red-600 dark:text-red-400">
                            +₹{settlement.directCashReceived.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--sk-muted)] mt-0.5">
                          साझीदार ने आपको पहले नकद लौटाया था।
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mathematical Proof */}
              <div className="p-3 rounded-xl bg-[var(--sk-card2)] border border-emerald-500/30 text-[var(--sk-text)] font-mono text-center">
                <span className="text-[11px] block text-[var(--sk-muted)]">
                  {isHi ? 'शुद्ध अंतर (नेट बैलेंस सूत्र):' : 'Net Settlement Formula:'}
                </span>
                <span className="text-sm font-bold text-[var(--sk-text)] mt-1 block">
                  ₹{settlement.partnerOwesMeTotal.toLocaleString('en-IN')} (लेना) - ₹{settlement.iOwePartnerTotal.toLocaleString('en-IN')} (देना) ={' '}
                  <span className={settlement.netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                    ₹{settlement.netBalance.toLocaleString('en-IN')}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: BATAI RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-3 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)]">
                <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 size={16} />
                  <span>1. अधिया (50-50 / आधा-आधा) का सही नियम:</span>
                </h4>
                <ul className="space-y-1.5 text-[11px] text-[var(--sk-text)] list-disc list-inside">
                  <li>
                    <b>खर्च का बंटवारा:</b> बीज, रासायनिक खाद (डीएपी/यूरिया), कीटनाशक स्प्रे, जुताई व हार्वेस्टर कटाई का खर्च 50-50 बंटता है।
                  </li>
                  <li>
                    <b>बिक्री व उपज का बंटवारा:</b> मंडी में बेची गई फसल की पूरी रकम या घर लाई गई बोरियों में दोनों का 50-50 हिस्सा होता है।
                  </li>
                  <li>
                    <b>नकद पेशगी (Advance):</b> यदि आपने फसल पकने से पहले साझीदार को ₹10,000 नकद दिए हैं, तो अंतिम निपटान में वह रकम आपके पक्ष में जुड़ेगी।
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)]">
                <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 size={16} />
                  <span>2. तिहाई (1/3rd या 2/3rd) का नियम:</span>
                </h4>
                <ul className="space-y-1.5 text-[11px] text-[var(--sk-text)] list-disc list-inside">
                  <li>
                    साझीदार का हिस्सा 33.33% (1/3) और मालिक का 66.67% (2/3) होता है।
                  </li>
                  <li>
                    खर्च समझौते अनुसार 1/3 या 50-50 या 100% साझीदार द्वारा वहन किया जाता है।
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-200">
                <h4 className="font-bold text-xs text-red-600 dark:text-red-300 mb-1 flex items-center gap-1.5">
                  <AlertTriangle size={15} />
                  <span>आम गलती (दोहरी कटौती / Double Deduction) से बचाव:</span>
                </h4>
                <p className="text-[11px]">
                  अक्सर किसान भाई कुल बिक्री में से पहले खर्च घटाकर मुनाफा निकालते हैं, और फिर अलग से साझीदार से खर्च भी मांग लेते हैं! इससे साझीदार पर खर्च दो बार चढ़ जाता है।
                  <b>स्मार्ट खाता ऐप</b> बिक्री और खर्च दोनों को अलग-अलग प्रमाणित पिलर्स पर गिनता है, जिससे 1 रुपये की भी गलती नहीं होती।
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: EASY EXAMPLE */}
          {activeTab === 'example' && (
            <div className="space-y-3 leading-relaxed">
              <div className="p-4 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] space-y-2">
                <h4 className="font-bold text-sm text-[var(--sk-text)] flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>सरल उदाहरण (50-50 अधिया साझेदारी):</span>
                </h4>
                <p className="text-[var(--sk-text)]">
                  मान लीजिए गेहूं की खेती में:
                </p>
                <div className="p-3 rounded-lg bg-[var(--sk-card)] border border-[var(--sk-border)] space-y-1 font-mono text-[11px] text-[var(--sk-text)]">
                  <div>• खाद व बीज खर्च = ₹10,000 (मालिक ने अपनी जेब से चुकाया)</div>
                  <div>• मंडी में गेहूं बिका = ₹40,000 (मालिक के खाते में पूरे ₹40,000 आए)</div>
                  <div>• मालिक ने साझीदार को पेशगी दी थी = ₹3,000</div>
                </div>

                <div className="pt-2">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">सही निपटान:</span>
                  <div className="space-y-1 text-[var(--sk-text)] text-[11px]">
                    <div>1. साझीदार का 50% बिक्री हिस्सा = <b>+₹20,000</b> (मालिक को देने हैं)</div>
                    <div>2. साझीदार का 50% खर्च हिस्सा = <b>-₹5,000</b> (मालिक को साझीदार से लेने हैं)</div>
                    <div>3. साझीदार को दी गई पेशगी = <b>-₹3,000</b> (मालिक को वापस लेनी है)</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold font-mono text-center text-xs">
                  👉 अंतिम फैसला: मालिक को साझीदार को ₹12,000 (20,000 - 5,000 - 3,000) नकद देने होंगे।
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--sk-border)] bg-[var(--sk-card2)] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
          >
            {isHi ? 'समझ आ गया' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}
