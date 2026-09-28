import { Capacitor } from '@capacitor/core';
import { storage } from './storage';

/**
 * Encrypted chat backup. Everything (account, encryption key, people, groups, messages)
 * is sealed with a password the user chooses (PBKDF2 → AES-256-GCM) and saved as a file
 * the user keeps wherever they like. Kinnect never uploads it anywhere.
 */
const subtle = globalThis.crypto?.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();
const KEYS = ['kinnect_account_v2', 'kinnect_identity_v2', 'kinnect_prefs', 'kinnect_care', 'kinnect_calls', 'kinnect_stats'];

function toB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromB64(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function passwordKey(password, salt) {
  const base = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function createBackup(password) {
  const local = {};
  for (const k of KEYS) { const v = localStorage.getItem(k); if (v) local[k] = v; }
  const data = { v: 1, createdAt: Date.now(), local, members: await storage.getMembers(), messages: await storage.getAllMessages() };
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, await passwordKey(password, salt), enc.encode(JSON.stringify(data)));
  return JSON.stringify({ kinnectBackup: 1, salt: toB64(salt), iv: toB64(iv), ct: toB64(ct) });
}

// Save the backup file: share sheet in the app (Drive, WhatsApp, Files…), download on the web
export async function saveBackupFile(content) {
  const name = `kinnect-backup-${new Date().toISOString().slice(0, 10)}.kinnect`;
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const { uri } = await Filesystem.writeFile({ path: name, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: 'Kinnect backup', files: [uri], dialogTitle: 'Save your backup' });
    return name;
  }
  const url = URL.createObjectURL(new Blob([content], { type: 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return name;
}

// Returns the decrypted backup, or throws 'WRONG_PASSWORD' / 'NOT_A_BACKUP'
export async function openBackup(content, password) {
  let wrapper;
  try { wrapper = JSON.parse(content); } catch { throw new Error('NOT_A_BACKUP'); }
  if (!wrapper?.kinnectBackup) throw new Error('NOT_A_BACKUP');
  try {
    const pt = await subtle.decrypt({ name: 'AES-GCM', iv: fromB64(wrapper.iv) }, await passwordKey(password, fromB64(wrapper.salt)), fromB64(wrapper.ct));
    return JSON.parse(dec.decode(pt));
  } catch {
    throw new Error('WRONG_PASSWORD');
  }
}

// Put everything back on this phone; the app reloads afterwards
export async function restoreBackup(data) {
  await storage.clearAll();
  for (const m of data.members || []) await storage.saveMember(m);
  await storage.putMessages(data.messages || []);
  for (const [k, v] of Object.entries(data.local || {})) localStorage.setItem(k, v);
}
