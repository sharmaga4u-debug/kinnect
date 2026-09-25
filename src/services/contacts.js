import { Capacitor } from '@capacitor/core';

// Phone contacts are only available in the Android app, not the web version
export const canReadContacts = Capacitor.isNativePlatform();

async function plugin() {
  const { Contacts } = await import('@capacitor-community/contacts');
  return Contacts;
}

export async function contactsPermission() {
  if (!canReadContacts) return 'unavailable';
  try { return (await (await plugin()).checkPermissions()).contacts; }
  catch { return 'unavailable'; }
}

export async function requestContactsPermission() {
  if (!canReadContacts) return 'unavailable';
  try { return (await (await plugin()).requestPermissions()).contacts; }
  catch (e) {
    console.warn('[Contacts] permission request failed:', e?.message || e);
    return 'denied';
  }
}

// Android won't show the permission dialog again after "Don't allow", so send people to app settings
export async function openAppSettings() {
  if (!canReadContacts) return;
  try {
    const { NativeSettings, AndroidSettings } = await import('capacitor-native-settings');
    await NativeSettings.openAndroid({ option: AndroidSettings.ApplicationDetails });
  } catch (e) {
    console.warn('[Contacts] could not open settings:', e?.message || e);
  }
}

// [{ name, phones: [raw number strings] }]
export async function readPhoneContacts() {
  if (!canReadContacts) return [];
  const { contacts } = await (await plugin()).getContacts({ projection: { name: true, phones: true } });
  return (contacts || [])
    .map(c => ({
      name: c.name?.display || [c.name?.given, c.name?.family].filter(Boolean).join(' ') || '',
      phones: (c.phones || []).map(p => p.number).filter(Boolean),
    }))
    .filter(c => c.phones.length);
}
