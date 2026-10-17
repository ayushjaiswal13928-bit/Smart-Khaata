export function shareViaWhatsApp(message: string, phone?: string): void {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const encoded = encodeURIComponent(message);
  let url = '';
  if (cleanPhone && cleanPhone.length >= 10) {
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encoded}`;
  }
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export interface PartnerWhatsAppSummaryData {
  partnerName: string;
  relationshipName?: string;
  khetName?: string;
  cropName?: string;
  sharePercent: number;
  totalExpense: number;
  partnerCostShare: number;
  myExpensePaid: number;
  partnerExpensePaid: number;
  totalSales: number;
  partnerSalesShare: number;
  totalYieldQuintal?: number;
  partnerYieldShareQuintal?: number;
  directCashGave: number;
  directCashReceived: number;
  netBalance: number;
}

export function generatePartnerWhatsAppSummary(data: PartnerWhatsAppSummaryData): string {
  const dateStr = new Date().toLocaleDateString('hi-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const isReceivable = data.netBalance > 0;
  const isPayable = data.netBalance < 0;
  const absBal = Math.abs(data.netBalance);

  let settlementText = '';
  if (isReceivable) {
    settlementText = `🟢 *अंतिम फैसला:* साझीदार (${data.partnerName}) से *₹${absBal.toLocaleString('en-IN')} लेने हैं*।`;
  } else if (isPayable) {
    settlementText = `🔴 *अंतिम फैसला:* साझीदार (${data.partnerName}) को *₹${absBal.toLocaleString('en-IN')} देने हैं*।`;
  } else {
    settlementText = `⚪ *अंतिम फैसला:* हिसाब पूरा चुकता है (*₹0 बकाया*)।`;
  }

  return `🌾 *स्मार्ट खाता - बटाई व साझीदार हिसाब पर्चा* 🌾
━━━━━━━━━━━━━━━━━━━━
👤 *साझीदार:* ${data.partnerName}
🤝 *समझौता:* ${data.relationshipName || 'अधिया'} (${data.sharePercent}% हिस्सा)
${data.khetName ? `🌱 *खेत:* ${data.khetName}\n` : ''}${data.cropName ? `🌾 *फसल:* ${data.cropName}\n` : ''}📅 *दिनांक:* ${dateStr}
━━━━━━━━━━━━━━━━━━━━
📊 *1. खेती लागत खर्च (Inputs Cost):*
• कुल खेती खर्च: ₹${data.totalExpense.toLocaleString('en-IN')}
• साझीदार का ${data.sharePercent}% खर्च हिस्सा: ₹${data.partnerCostShare.toLocaleString('en-IN')}
  - आपने चुकाया: ₹${data.myExpensePaid.toLocaleString('en-IN')}
  - साझीदार ने चुकाया: ₹${data.partnerExpensePaid.toLocaleString('en-IN')}

💰 *2. फसल बिक्री (Harvest Sales):*
• कुल बिक्री रकम: ₹${data.totalSales.toLocaleString('en-IN')}
• साझीदार का ${data.sharePercent}% बिक्री हिस्सा: ₹${data.partnerSalesShare.toLocaleString('en-IN')}
${data.totalYieldQuintal ? `⚖️ कुल उपज: ${data.totalYieldQuintal} क्विंटल (साझीदार हिस्सा: ${data.partnerYieldShareQuintal} Qtl)\n` : ''}
💵 *3. नकद पेशगी व लेनदेन (Cash Advance):*
• साझीदार को नकद पेशगी दी: ₹${data.directCashGave.toLocaleString('en-IN')}
• साझीदार से नकद प्राप्त हुआ: ₹${data.directCashReceived.toLocaleString('en-IN')}

━━━━━━━━━━━━━━━━━━━━
${settlementText}
━━━━━━━━━━━━━━━━━━━━
_डिजिटल कृषि बहीखाता (स्मार्ट खाता) द्वारा प्रमाणित_`;
}

export function generateRecordWhatsAppMessage(record: {
  crop: string;
  field?: string;
  type: string;
  amount: number;
  quantity?: number;
  unit?: string;
  price?: number;
  date: string;
  note?: string;
  buyerName?: string;
  worker?: string;
  remainingAmount?: number;
}): string {
  const typeLabel =
    record.type === 'Expense' ? '💸 लागत खर्च' : record.type === 'Sale' ? '💰 फसल बिक्री' : '🌾 पैदावार';

  return `🌾 *स्मार्ट खाता - बहीखाता प्रविष्टि*
━━━━━━━━━━━━━━━━━━━━
📌 *प्रकार:* ${typeLabel}
🌱 *फसल:* ${record.crop} ${record.field ? `(${record.field})` : ''}
📅 *दिनांक:* ${record.date}
${record.quantity ? `⚖️ *मात्रा:* ${record.quantity} ${record.unit || ''}${record.price ? ` @ ₹${record.price}` : ''}\n` : ''}💵 *रकम:* ₹${record.amount.toLocaleString('en-IN')}
${record.buyerName ? `🏪 *खरीदार/मंडी:* ${record.buyerName}\n` : ''}${record.worker ? `👤 *व्यक्ति/श्रमिक:* ${record.worker}\n` : ''}${record.remainingAmount && record.remainingAmount > 0 ? `⚠️ *बाकी रकम:* ₹${record.remainingAmount.toLocaleString('en-IN')}\n` : ''}${record.note ? `📝 *टिप्पणी:* ${record.note}\n` : ''}━━━━━━━━━━━━━━━━━━━━`;
}
