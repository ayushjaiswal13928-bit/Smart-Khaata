/**
 * Batai (बटाई / अधिया / तिहाई / साझेदारी) Settlement Engine
 * 
 * Accurately models Indian sharecropping and farming partnerships:
 * 1. Adhiya (अधिया 50-50): 50% expenses, 50% harvest produce/sales.
 * 2. Tihai (तिहाई 1/3rd or 2/3rd): 33.33% / 66.67% share with configurable cost sharing.
 * 3. Chauthai (चौथाई 1/4th): 25% / 75% share.
 * 4. Custom %: Any custom split agreed between land owner and partner.
 * 
 * Mathematically avoids double-counting bugs by separating:
 * - Gross Sales Realization & Collection (किसके हाथ में बिक्री का पैसा आया)
 * - Input Expenses Incurred & Paid (खाद, बीज, जुताई, कटाई किसने दी)
 * - Direct Cash Advances & Loans (हाथ-उधार या पेशगी)
 * - In-kind Grain/Produce Distribution (अनाज/क्विंटल का बंटवारा)
 */

import { FarmRecord, Partner, PartnerCashEntry } from './types';
import { getRecordAmount, normalizeToQuintals } from './farmAccounting';

export interface BataiSettlementResult {
  // 1. Overview & Percentages
  partnerSharePercent: number; // Partner's share of harvest/sales (%)
  mySharePercent: number; // Owner's share of harvest/sales (%)
  costSharePercent: number; // Partner's share of expenses (%)
  myCostSharePercent: number; // Owner's share of expenses (%)
  partnerName: string;
  relationshipNameHi: string;
  relationshipNameEn: string;

  // 2. Expenses (खेती लागत खर्च)
  totalExpense: number;
  myExpensePaid: number; // Owner paid out of pocket
  partnerExpensePaid: number; // Partner paid out of pocket
  sharedExpensePaid: number; // Paid 50-50 on the spot
  partnerCostShare: number; // Partner's theoretical share of total cost
  myCostShare: number; // Owner's theoretical share of total cost

  // 3. Sales & Mandi Realization (फसल बिक्री)
  totalSales: number;
  mySalesReceived: number; // Collected by owner
  partnerSalesReceived: number; // Collected by partner
  sharedSalesReceived: number; // Distributed on the spot
  partnerSalesShare: number; // Partner's entitled share of total harvest sales
  mySalesShare: number; // Owner's entitled share of total harvest sales

  // 4. Yield / Produce (उपज व अनाज बंटवारा)
  totalYieldQuintal: number;
  partnerYieldShareQuintal: number;
  myYieldShareQuintal: number;

  // 5. Direct Cash Entries (नकद पेशगी व लेनदेन)
  directCashGave: number; // Owner gave to partner (Advance/Kharcha)
  directCashReceived: number; // Partner gave to owner
  netCashAdvanceBalance: number; // directCashGave - directCashReceived

  // 6. Net Settlement Components (शुद्ध हिसाब के मुख्य घटक)
  partnerOwesMeTotal: number; // Total amount partner owes to owner
  iOwePartnerTotal: number; // Total amount owner owes to partner
  netBalance: number; // partnerOwesMeTotal - iOwePartnerTotal
  settlementStatus: 'partner_owes_me' | 'i_owe_partner' | 'settled';

  // 7. Overall Net Profitability (शुद्ध लाभ स्थिति)
  netFarmProfit: number; // totalSales - totalExpense
  partnerNetProfit: number; // partnerSalesShare - partnerCostShare
  myNetProfit: number; // mySalesShare - myCostShare

  // 8. Relevant Records belonging to this partner
  relevantRecords: FarmRecord[];

  // 9. Transparent Step-by-Step Breakdown for Farmer
  auditSteps: {
    titleHi: string;
    titleEn: string;
    amount: number;
    direction: 'credit_to_owner' | 'credit_to_partner';
    reasonHi: string;
    reasonEn: string;
  }[];
}

export function getRelationshipLabel(rel: Partner['relationship'], lang: 'hi' | 'en'): string {
  switch (rel) {
    case 'batai_50_50':
      return lang === 'hi' ? 'अधिया (50-50 आधा-आधा)' : 'Adhiya (50-50 Half Share)';
    case 'batai_third':
      return lang === 'hi' ? 'तिहाई (1/3rd हिस्सा)' : 'Tihai (1/3rd Share)';
    case 'batai_quarter':
      return lang === 'hi' ? 'चौथाई (1/4th हिस्सा)' : 'Chauthai (1/4th Share)';
    case 'batai_custom':
    default:
      return lang === 'hi' ? 'कस्टम साझेदारी' : 'Custom Partnership';
  }
}

export function calculateBataiSettlement(
  partner: Partner | null,
  farmRecords: FarmRecord[],
  partnerCash: PartnerCashEntry[]
): BataiSettlementResult {
  if (!partner) {
    return {
      partnerSharePercent: 50,
      mySharePercent: 50,
      costSharePercent: 50,
      myCostSharePercent: 50,
      partnerName: '',
      relationshipNameHi: 'अधिया (50-50)',
      relationshipNameEn: 'Adhiya (50-50)',
      totalExpense: 0,
      myExpensePaid: 0,
      partnerExpensePaid: 0,
      sharedExpensePaid: 0,
      partnerCostShare: 0,
      myCostShare: 0,
      totalSales: 0,
      mySalesReceived: 0,
      partnerSalesReceived: 0,
      sharedSalesReceived: 0,
      partnerSalesShare: 0,
      mySalesShare: 0,
      totalYieldQuintal: 0,
      partnerYieldShareQuintal: 0,
      myYieldShareQuintal: 0,
      directCashGave: 0,
      directCashReceived: 0,
      netCashAdvanceBalance: 0,
      partnerOwesMeTotal: 0,
      iOwePartnerTotal: 0,
      netBalance: 0,
      settlementStatus: 'settled',
      netFarmProfit: 0,
      partnerNetProfit: 0,
      myNetProfit: 0,
      relevantRecords: [],
      auditSteps: [],
    };
  }

  // 1. Determine Share Percentages
  const rawShare = Number(partner.sharePercent);
  const partnerSharePercent = Number.isFinite(rawShare) && rawShare > 0
    ? Math.min(100, rawShare)
    : 50;
  const mySharePercent = 100 - partnerSharePercent;

  // Determine Cost Share Percentage
  let costSharePercent = partnerSharePercent;
  if (partner.costShareType === 'owner_zero_cost') {
    costSharePercent = 100; // Partner bears 100% of operational inputs
  } else if (partner.costShareType === 'custom_cost' && partner.customCostSharePercent !== undefined) {
    costSharePercent = Math.min(100, Math.max(0, Number(partner.customCostSharePercent)));
  }
  const myCostSharePercent = 100 - costSharePercent;

  // 2. Filter records linked to this partner
  const relevantRecords = farmRecords.filter((r) => {
    // Explicit partner ID link has top priority
    if (r.partnerId) {
      return r.partnerId === partner.id;
    }

    // Match by khetId if both exist
    if (partner.khetId && r.khetId && partner.khetId === r.khetId) {
      if (partner.crop && partner.crop !== 'All' && r.crop) {
        return r.crop.trim().toLowerCase() === partner.crop.trim().toLowerCase();
      }
      return true;
    }

    // Fallback: Field name match (case-insensitive, trimmed)
    if (
      r.field &&
      partner.khetName &&
      (r.field.trim().toLowerCase() === partner.khetName.trim().toLowerCase() ||
        r.field.toLowerCase().includes(partner.khetName.toLowerCase()) ||
        partner.khetName.toLowerCase().includes(r.field.toLowerCase()))
    ) {
      // If crop is also specified on partner, match crop too
      if (partner.crop && partner.crop !== 'All' && r.crop) {
        return r.crop.trim().toLowerCase() === partner.crop.trim().toLowerCase();
      }
      return true;
    }

    return false;
  });

  // 3. Process Expenses
  let totalExpense = 0;
  let myExpensePaid = 0;
  let partnerExpensePaid = 0;
  let sharedExpensePaid = 0;

  // 4. Process Sales
  let totalSales = 0;
  let mySalesReceived = 0;
  let partnerSalesReceived = 0;
  let sharedSalesReceived = 0;

  // 5. Process Yield
  let totalYieldQuintal = 0;

  for (const record of relevantRecords) {
    const qty = Number(record.quantity || 0);
    const amount = getRecordAmount(record);

    if (record.type === 'Expense') {
      totalExpense += amount;
      if (record.paidBy === 'partner') {
        partnerExpensePaid += amount;
      } else if (record.paidBy === 'shared') {
        sharedExpensePaid += amount;
      } else {
        // Default is owner (me) paid
        myExpensePaid += amount;
      }
    } else if (record.type === 'Sale') {
      totalSales += amount;
      if (record.saleReceivedBy === 'partner') {
        partnerSalesReceived += amount;
      } else if (record.saleReceivedBy === 'shared') {
        sharedSalesReceived += amount;
      } else {
        // Default is owner (me) received Mandi payout
        mySalesReceived += amount;
      }
    } else if (record.type === 'Yield') {
      totalYieldQuintal += normalizeToQuintals(qty, record.unit);
    }
  }

  // Cost allocations
  const partnerCostShare = Math.round((totalExpense * (costSharePercent / 100)) * 100) / 100;
  const myCostShare = Math.round((totalExpense - partnerCostShare) * 100) / 100;

  // Sales allocations
  const partnerSalesShare = Math.round((totalSales * (partnerSharePercent / 100)) * 100) / 100;
  const mySalesShare = Math.round((totalSales - partnerSalesShare) * 100) / 100;

  // Yield allocations
  const partnerYieldShareQuintal = Math.round((totalYieldQuintal * (partnerSharePercent / 100)) * 100) / 100;
  const myYieldShareQuintal = Math.round((totalYieldQuintal - partnerYieldShareQuintal) * 100) / 100;

  // 6. Direct Cash Entries
  const partnerCashEntries = partnerCash.filter((c) => c.partnerId === partner.id);
  const directCashGave = partnerCashEntries
    .filter((c) => c.type === 'gave_to_partner')
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const directCashReceived = partnerCashEntries
    .filter((c) => c.type === 'received_from_partner')
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const netCashAdvanceBalance = directCashGave - directCashReceived;

  // 7. Calculate Exact Two-Way Settlement:
  // (A) What Partner Owes Owner (Me):
  // 1. Partner's share of expenses that I paid:
  const partnerExpenseOwedToMe = Math.round((myExpensePaid * (costSharePercent / 100)) * 100) / 100;
  // 2. Owner's share of crop sales that partner collected:
  const mySalesOwedByPartner = Math.round((partnerSalesReceived * (mySharePercent / 100)) * 100) / 100;
  // 3. Direct cash advance I gave to partner:
  const partnerOwesMeTotal = Math.round((partnerExpenseOwedToMe + mySalesOwedByPartner + directCashGave) * 100) / 100;

  // (B) What Owner (Me) Owes Partner:
  // 1. Owner's share of expenses that partner paid:
  const myExpenseOwedToPartner = Math.round((partnerExpensePaid * (myCostSharePercent / 100)) * 100) / 100;
  // 2. Partner's share of crop sales that I collected:
  const partnerSalesOwedByMe = Math.round((mySalesReceived * (partnerSharePercent / 100)) * 100) / 100;
  // 3. Direct cash partner gave to me:
  const iOwePartnerTotal = Math.round((myExpenseOwedToPartner + partnerSalesOwedByMe + directCashReceived) * 100) / 100;

  // (C) Net Balance:
  // Positive => Partner owes Owner (साझीदार से लेना बाकी)
  // Negative => Owner owes Partner (साझीदार को देना बाकी)
  const netBalance = Math.round((partnerOwesMeTotal - iOwePartnerTotal) * 100) / 100;

  let settlementStatus: 'partner_owes_me' | 'i_owe_partner' | 'settled' = 'settled';
  if (netBalance > 0.5) settlementStatus = 'partner_owes_me';
  else if (netBalance < -0.5) settlementStatus = 'i_owe_partner';

  // Overall Net Profits
  const netFarmProfit = Math.round((totalSales - totalExpense) * 100) / 100;
  const partnerNetProfit = Math.round((partnerSalesShare - partnerCostShare) * 100) / 100;
  const myNetProfit = Math.round((mySalesShare - myCostShare) * 100) / 100;

  // Audit trail explaining every rupee
  const auditSteps: BataiSettlementResult['auditSteps'] = [];

  if (partnerSalesOwedByMe > 0) {
    auditSteps.push({
      titleHi: `फसल बिक्री में साझीदार का ${partnerSharePercent}% हिस्सा`,
      titleEn: `Partner's ${partnerSharePercent}% share of sales collected by you`,
      amount: partnerSalesOwedByMe,
      direction: 'credit_to_partner',
      reasonHi: `आपने मंडी से कुल ₹${mySalesReceived.toLocaleString('en-IN')} की फसल बेची, जिसमें साझीदार का हक ₹${partnerSalesOwedByMe.toLocaleString('en-IN')} बनता है।`,
      reasonEn: `You collected ₹${mySalesReceived.toLocaleString('en-IN')} from Mandi; partner is entitled to ₹${partnerSalesOwedByMe.toLocaleString('en-IN')}.`,
    });
  }

  if (mySalesOwedByPartner > 0) {
    auditSteps.push({
      titleHi: `साझीदार द्वारा बेची फसल में आपका ${mySharePercent}% हिस्सा`,
      titleEn: `Your ${mySharePercent}% share of sales collected by partner`,
      amount: mySalesOwedByPartner,
      direction: 'credit_to_owner',
      reasonHi: `साझीदार ने ₹${partnerSalesReceived.toLocaleString('en-IN')} की फसल बेची, जिसमें आपका मालिकी हिस्सा ₹${mySalesOwedByPartner.toLocaleString('en-IN')} है।`,
      reasonEn: `Partner collected ₹${partnerSalesReceived.toLocaleString('en-IN')}; your share is ₹${mySalesOwedByPartner.toLocaleString('en-IN')}.`,
    });
  }

  if (partnerExpenseOwedToMe > 0) {
    auditSteps.push({
      titleHi: `आपके द्वारा चुकाए गए खर्च में साझीदार का ${costSharePercent}% हिस्सा`,
      titleEn: `Partner's ${costSharePercent}% share of expenses paid by you`,
      amount: partnerExpenseOwedToMe,
      direction: 'credit_to_owner',
      reasonHi: `आपने खाद, बीज, डीजल आदि में कुल ₹${myExpensePaid.toLocaleString('en-IN')} नकद चुकाए। साझीदार को अपने हिस्से के ₹${partnerExpenseOwedToMe.toLocaleString('en-IN')} आपको देने होंगे।`,
      reasonEn: `You paid ₹${myExpensePaid.toLocaleString('en-IN')} for inputs; partner owes you their ${costSharePercent}% share = ₹${partnerExpenseOwedToMe.toLocaleString('en-IN')}.`,
    });
  }

  if (myExpenseOwedToPartner > 0) {
    auditSteps.push({
      titleHi: `साझीदार द्वारा चुकाए गए खर्च में आपका ${myCostSharePercent}% हिस्सा`,
      titleEn: `Your ${myCostSharePercent}% share of expenses paid by partner`,
      amount: myExpenseOwedToPartner,
      direction: 'credit_to_partner',
      reasonHi: `साझीदार ने अपनी जेब से ₹${partnerExpensePaid.toLocaleString('en-IN')} का खर्च किया। आपको अपना हिस्सा ₹${myExpenseOwedToPartner.toLocaleString('en-IN')} साझीदार को देना होगा।`,
      reasonEn: `Partner paid ₹${partnerExpensePaid.toLocaleString('en-IN')} for inputs; you owe partner your ${myCostSharePercent}% share = ₹${myExpenseOwedToPartner.toLocaleString('en-IN')}.`,
    });
  }

  if (directCashGave > 0) {
    auditSteps.push({
      titleHi: 'साझीदार को दी गई नकद पेशगी / एडवांस',
      titleEn: 'Cash advance given to partner',
      amount: directCashGave,
      direction: 'credit_to_owner',
      reasonHi: `आपने साझीदार को समय-समय पर कुल ₹${directCashGave.toLocaleString('en-IN')} नकद पेशगी या घरेलू खर्च हेतु दिए थे।`,
      reasonEn: `You advanced ₹${directCashGave.toLocaleString('en-IN')} cash to partner for personal/crop expenses.`,
    });
  }

  if (directCashReceived > 0) {
    auditSteps.push({
      titleHi: 'साझीदार से प्राप्त नकद',
      titleEn: 'Cash received from partner',
      amount: directCashReceived,
      direction: 'credit_to_partner',
      reasonHi: `साझीदार ने आपको कुल ₹${directCashReceived.toLocaleString('en-IN')} नकद लौटाए थे।`,
      reasonEn: `Partner gave you ₹${directCashReceived.toLocaleString('en-IN')} cash.`,
    });
  }

  return {
    partnerSharePercent,
    mySharePercent,
    costSharePercent,
    myCostSharePercent,
    partnerName: partner.name,
    relationshipNameHi: getRelationshipLabel(partner.relationship, 'hi'),
    relationshipNameEn: getRelationshipLabel(partner.relationship, 'en'),
    totalExpense,
    myExpensePaid,
    partnerExpensePaid,
    sharedExpensePaid,
    partnerCostShare,
    myCostShare,
    totalSales,
    mySalesReceived,
    partnerSalesReceived,
    sharedSalesReceived,
    partnerSalesShare,
    mySalesShare,
    totalYieldQuintal,
    partnerYieldShareQuintal,
    myYieldShareQuintal,
    directCashGave,
    directCashReceived,
    netCashAdvanceBalance,
    partnerOwesMeTotal,
    iOwePartnerTotal,
    netBalance,
    settlementStatus,
    netFarmProfit,
    partnerNetProfit,
    myNetProfit,
    relevantRecords,
    auditSteps,
  };
}
