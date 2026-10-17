export interface ParsedVoiceResult {
  type?: 'Expense' | 'Sale' | 'Yield';
  crop?: string;
  expenseCategory?: string;
  amount?: number;
  quantity?: number;
  unit?: string;
  note?: string;
}

const CROP_SYNONYMS: Record<string, string> = {
  गेहूं: 'Wheat',
  गहू: 'Wheat',
  सोयाबीन: 'Soybean',
  चना: 'Gram',
  सरसों: 'Mustard',
  राई: 'Mustard',
  धान: 'Rice',
  चावल: 'Rice',
  कपास: 'Cotton',
  रुई: 'Cotton',
  मक्का: 'Maize',
  लहसुन: 'Garlic',
  मूंगफली: 'Groundnut',
  प्याज: 'Onion',
  कांदा: 'Onion',
  आलू: 'Potato',
  बटाटा: 'Potato',
  टमाटर: 'Tomato',
  गन्ना: 'Sugarcane',
  बाजरा: 'Bajra',
  ज्वार: 'Jowar',
  मटर: 'Peas',
};

const EXPENSE_SYNONYMS: Record<string, string> = {
  बीज: 'बीज',
  सीड: 'बीज',
  खाद: 'खाद',
  यूरिया: 'खाद',
  डीएपी: 'खाद',
  फर्टिलाइजर: 'खाद',
  कीटनाशक: 'कीटनाशक',
  दवाई: 'कीटनाशक',
  स्प्रे: 'कीटनाशक',
  डीजल: 'डीजल/ट्रैक्टर',
  ट्रैक्टर: 'डीजल/ट्रैक्टर',
  जुताई: 'डीजल/ट्रैक्टर',
  हकाई: 'डीजल/ट्रैक्टर',
  मजदूरी: 'मजदूरी',
  लेबर: 'मजदूरी',
  निंदाई: 'मजदूरी',
  सिंचाई: 'सिंचाई',
  पानी: 'सिंचाई',
  बिजली: 'बिजली',
  ढुलाई: 'ढुलाई',
  भाड़ा: 'ढुलाई',
};

export function parseVoiceInput(transcript: string): ParsedVoiceResult {
  const text = transcript.toLowerCase();
  const res: ParsedVoiceResult = {};

  // Detect Type
  if (text.includes('बेचा') || text.includes('बिक्री') || text.includes('सेल') || text.includes('मंडी') || text.includes('भाव')) {
    res.type = 'Sale';
  } else if (text.includes('उपज') || text.includes('पैदावार') || text.includes('कटाई') || text.includes('हार्वेस्ट')) {
    res.type = 'Yield';
  } else {
    res.type = 'Expense';
  }

  // Detect Crop
  for (const [key, crop] of Object.entries(CROP_SYNONYMS)) {
    if (text.includes(key)) {
      res.crop = crop;
      break;
    }
  }

  // Detect Expense Category
  for (const [key, cat] of Object.entries(EXPENSE_SYNONYMS)) {
    if (text.includes(key)) {
      res.expenseCategory = cat;
      break;
    }
  }

  // Detect Quantity & Unit
  if (text.includes('क्विंटल') || text.includes('कंटल')) {
    res.unit = 'Quintal';
  } else if (text.includes('किलो') || text.includes('केजी')) {
    res.unit = 'Kg';
  } else if (text.includes('बोरी') || text.includes('कट्टा')) {
    res.unit = 'बोरी (Bags)';
  } else if (text.includes('घंटे') || text.includes('घंटा')) {
    res.unit = 'घंटे (Hours)';
  }

  // Extract Numbers
  const numbers = text.match(/\d+(\.\d+)?/g);
  if (numbers && numbers.length > 0) {
    const nums = numbers.map(Number);
    if (nums.length === 1) {
      if (nums[0] > 100) {
        res.amount = nums[0];
      } else {
        res.quantity = nums[0];
      }
    } else if (nums.length >= 2) {
      res.quantity = Math.min(...nums);
      res.amount = Math.max(...nums);
    }
  }

  res.note = transcript.trim();
  return res;
}
