import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Closing the top-most screen or sheet with the Android back button (or Esc on a computer).
 *
 * Open layers form a stack; back closes only the top one. On Android the hardware back
 * button is handled directly through Capacitor. With no layer open, back minimises the app
 * like other Android apps do.
 *
 * (Browser history isn't used: pushing and popping history entries while sheets swap can
 * step past the app's first page, which on Android closes the app.)
 */
const layers = []; // [{ token, onBack }]
let installed = false;

function closeTop() {
  const top = layers[layers.length - 1];
  if (top) { top.onBack.current(); return true; }
  return false;
}

async function install() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTop(); });
  if (Capacitor.isNativePlatform()) {
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', () => { if (!closeTop()) App.minimizeApp(); });
  }
}

export function useBackButton(onBack) {
  const token = useRef(Math.random().toString(36).slice(2));
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    install();
    const entry = { token: token.current, onBack: onBackRef };
    layers.push(entry);
    return () => {
      const i = layers.indexOf(entry);
      if (i !== -1) layers.splice(i, 1);
    };
  }, []);

  // Close via a button: same as pressing back
  return () => onBackRef.current();
}
