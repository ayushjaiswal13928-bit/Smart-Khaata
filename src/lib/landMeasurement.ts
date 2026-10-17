import { Lang } from './types';

export interface RegionalLandPreset {
  id: string;
  nameHi: string;
  nameEn: string;
  descriptionHi: string;
  descriptionEn: string;
  bighaPerAcre: number;
  biswaPerBigha: number;
}

export interface LandUnitSettings {
  presetId: string;
  bighaPerAcre: number;
  biswaPerBigha: number;
  regionNameHi: string;
  regionNameEn: string;
  isCustom: boolean;
}

export const REGION_PRESETS: RegionalLandPreset[] = [
  {
    id: 'mp_standard',
    nameHi: 'मध्य प्रदेश व राजस्थान (मानक बीघा)',
    nameEn: 'Madhya Pradesh & Rajasthan (Standard)',
    descriptionHi: '1 एकड़ = 2.5 बीघा (1 बीघा = 20 बिस्वा)',
    descriptionEn: '1 Acre = 2.5 Bigha (1 Bigha = 20 Biswa)',
    bighaPerAcre: 2.5,
    biswaPerBigha: 20,
  },
  {
    id: 'west_up_haryana',
    nameHi: 'पश्चिमी उत्तर प्रदेश व हरियाणा (कच्चा बीघा)',
    nameEn: 'Western UP & Haryana (Kaccha Bigha)',
    descriptionHi: '1 एकड़ = 5 कच्चा बीघा',
    descriptionEn: '1 Acre = 5 Kaccha Bigha',
    bighaPerAcre: 5.0,
    biswaPerBigha: 20,
  },
  {
    id: 'east_up_bihar',
    nameHi: 'पूर्वी उत्तर प्रदेश व बिहार (पक्का बीघा)',
    nameEn: 'Eastern UP & Bihar (Pucca Bigha)',
    descriptionHi: '1 एकड़ = 1.6 पक्का बीघा (1 बीघा = 20 कट्ठा)',
    descriptionEn: '1 Acre = 1.6 Pucca Bigha (1 Bigha = 20 Kattha)',
    bighaPerAcre: 1.6,
    biswaPerBigha: 20,
  },
  {
    id: 'punjab_killa',
    nameHi: 'पंजाब (किल्ला / घुमाओं)',
    nameEn: 'Punjab (Killa / Ghumaon)',
    descriptionHi: '1 एकड़ = 1 किल्ला / 4 बीघा',
    descriptionEn: '1 Acre = 1 Killa / 4 Bigha',
    bighaPerAcre: 4.0,
    biswaPerBigha: 20,
  },
  {
    id: 'gujarat_vigha',
    nameHi: 'गुजरात (विघा)',
    nameEn: 'Gujarat (Vigha)',
    descriptionHi: '1 एकड़ = 2.5 विघा (16 गुंठा = 1 विघा)',
    descriptionEn: '1 Acre = 2.5 Vigha',
    bighaPerAcre: 2.5,
    biswaPerBigha: 20,
  },
];

export const DEFAULT_LAND_SETTINGS: LandUnitSettings = {
  presetId: 'mp_standard',
  bighaPerAcre: 2.5,
  biswaPerBigha: 20,
  regionNameHi: 'मध्य प्रदेश व राजस्थान (1 एकड़ = 2.5 बीघा)',
  regionNameEn: 'MP & Rajasthan (1 Acre = 2.5 Bigha)',
  isCustom: false,
};

export const LAND_SETTINGS_STORAGE_KEY = 'kisan-sathi-land-settings';
export const LAND_SETTINGS_CHANGED_EVENT = 'kisan-sathi-land-settings-changed';

export function getLandSettings(): LandUnitSettings {
  if (typeof window === 'undefined') return DEFAULT_LAND_SETTINGS;
  try {
    const raw = localStorage.getItem(LAND_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_LAND_SETTINGS;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.bighaPerAcre === 'number' && parsed.bighaPerAcre > 0) {
      return parsed;
    }
  } catch {}
  return DEFAULT_LAND_SETTINGS;
}

export function saveLandSettings(settings: LandUnitSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAND_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(LAND_SETTINGS_CHANGED_EVENT, { detail: settings }));
  } catch {}
}

export function formatDualArea(
  area: number,
  unit: string,
  settings: LandUnitSettings,
  lang: Lang
): { primary: string; secondary: string; label: string } {
  const isHi = lang === 'hi';
  const ratio = settings.bighaPerAcre || 2.5;
  const num = Number(area) || 0;

  if (unit === 'बीघा') {
    const acreVal = (num / ratio).toFixed(2);
    return {
      primary: `${num} बीघा`,
      secondary: `≈ ${acreVal} एकड़`,
      label: `${num} बीघा (≈ ${acreVal} एकड़)`,
    };
  }

  if (unit === 'एकड़') {
    const bighaVal = (num * ratio).toFixed(2);
    return {
      primary: `${num} एकड़`,
      secondary: `≈ ${bighaVal} बीघा`,
      label: `${num} एकड़ (≈ ${bighaVal} बीघा)`,
    };
  }

  if (unit === 'हेक्टेयर') {
    const acreVal = (num * 2.471).toFixed(2);
    const bighaVal = (num * 2.471 * ratio).toFixed(2);
    return {
      primary: `${num} हेक्टेयर`,
      secondary: `≈ ${acreVal} एकड़ (${bighaVal} बीघा)`,
      label: `${num} हेक्टेयर (≈ ${acreVal} एकड़)`,
    };
  }

  return {
    primary: `${num} ${unit}`,
    secondary: '',
    label: `${num} ${unit}`,
  };
}

export function calculatePerLandMetrics(
  totalExpense: number,
  totalSales: number,
  realizedProfit: number,
  totalYieldKg: number,
  area: number,
  areaUnit: string,
  settings: LandUnitSettings
) {
  const ratio = settings.bighaPerAcre || 2.5;
  const areaNum = Number(area) || 1;

  let bighaArea = areaNum;
  let acreArea = areaNum / ratio;

  if (areaUnit === 'एकड़') {
    acreArea = areaNum;
    bighaArea = areaNum * ratio;
  } else if (areaUnit === 'हेक्टेयर') {
    acreArea = areaNum * 2.47105;
    bighaArea = acreArea * ratio;
  }

  bighaArea = Math.max(0.1, bighaArea);
  acreArea = Math.max(0.04, acreArea);

  return {
    costPerBigha: Math.round(totalExpense / bighaArea),
    costPerAcre: Math.round(totalExpense / acreArea),
    salesPerBigha: Math.round(totalSales / bighaArea),
    salesPerAcre: Math.round(totalSales / acreArea),
    realizedProfitPerBigha: Math.round(realizedProfit / bighaArea),
    realizedProfitPerAcre: Math.round(realizedProfit / acreArea),
    yieldKgPerBigha: Math.round(totalYieldKg / bighaArea),
    yieldKgPerAcre: Math.round(totalYieldKg / acreArea),
  };
}
