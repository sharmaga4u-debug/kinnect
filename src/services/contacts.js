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
  catch { return 'denied'; }
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
