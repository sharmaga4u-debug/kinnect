import { Capacitor } from '@capacitor/core';

/**
 * Read text aloud. Android's in-app browser has no speechSynthesis, so the app uses the
 * phone's own text-to-speech engine there, and the browser's voice on the web.
 */
const native = Capacitor.isNativePlatform();
let current = null; // resolves when the current utterance ends

export async function speak(text, lang = 'en-IN') {
  await stopSpeaking();
  if (native) {
    const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
    current = TextToSpeech.speak({ text, lang, rate: 0.9, pitch: 1.0, volume: 1.0, category: 'playback' })
      .catch(async () => {
        // Voice for that language not installed → fall back to Indian English
        if (lang !== 'en-IN') return TextToSpeech.speak({ text, lang: 'en-IN', rate: 0.9 });
      });
    return current;
  }
  if (!window.speechSynthesis) return;
  current = new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9;
    u.onend = resolve;
    u.onerror = resolve;
    window.speechSynthesis.speak(u);
  });
  return current;
}

export async function stopSpeaking() {
  current = null;
  try {
    if (native) {
      const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
      await TextToSpeech.stop();
    } else {
      window.speechSynthesis?.cancel();
    }
  } catch (_) {}
}

export const canSpeak = native || (typeof window !== 'undefined' && !!window.speechSynthesis);
