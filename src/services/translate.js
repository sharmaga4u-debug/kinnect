import { Capacitor } from '@capacitor/core';

/**
 * On-device translation (Google ML Kit). Free, works offline after a one-time language
 * download (~30 MB each), and text never leaves the phone, so chats stay end-to-end encrypted.
 * Only available in the Android app; in the browser translation is unavailable.
 */
export const translationAvailable = Capacitor.isNativePlatform();

// Languages ML Kit supports that Kinnect also offers
export const TRANSLATABLE = new Set(['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu']);

const cache = new Map();

export function canTranslate(from, to) {
  return translationAvailable && from && to && from !== to && TRANSLATABLE.has(from) && TRANSLATABLE.has(to);
}

export async function translateText(text, from, to) {
  if (!canTranslate(from, to) || !text?.trim()) return null;
  const key = `${from}>${to}:${text}`;
  if (cache.has(key)) return cache.get(key);
  const job = (async () => {
    const { Translation } = await import('@capacitor-mlkit/translation');
    const { text: out } = await Translation.translate({ text, sourceLanguage: from, targetLanguage: to });
    return out;
  })().catch((e) => { cache.delete(key); console.warn('[Translate]', e?.message || e); return null; });
  cache.set(key, job);
  return job;
}
