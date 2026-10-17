import { FarmerProfile, SecuritySettings } from './types';

export const PROFILE_STORAGE_KEY = 'sk-farmer-profile';
export const SECURITY_STORAGE_KEY = 'sk-security-settings';
export const BACKUP_TIMESTAMP_KEY = 'sk-last-backup-timestamp';

export const DEFAULT_FARMER_PROFILE: FarmerProfile = {
  name: 'रामेश्वर पाटीदार',
  phone: '9826011223',
  village: 'कनार्दिया',
  tehsil: 'सांवेर',
  district: 'इन्दौर',
  state: 'मध्य प्रदेश',
};

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  pin: '1234',
  isLockEnabled: false,
};

export function getFarmerProfile(): FarmerProfile {
  if (typeof window === 'undefined') return DEFAULT_FARMER_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.name === 'string') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading profile:', e);
  }
  return DEFAULT_FARMER_PROFILE;
}

export function saveFarmerProfile(profile: FarmerProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile:', e);
  }
}

export function getSecuritySettings(): SecuritySettings {
  if (typeof window === 'undefined') return DEFAULT_SECURITY_SETTINGS;
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.pin === 'string') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading security settings:', e);
  }
  return DEFAULT_SECURITY_SETTINGS;
}

export function saveSecuritySettings(settings: SecuritySettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving security settings:', e);
  }
}

export function getLastBackupTimestamp(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BACKUP_TIMESTAMP_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

export function recordBackupTimestamp(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BACKUP_TIMESTAMP_KEY, String(Date.now()));
  } catch {}
}

export type { FarmerProfile, SecuritySettings };
