import { APP_URL } from '../utils/invite';

/**
 * Feedback goes to a Google Sheet through a Google Apps Script web app (see docs/feedback-sheet.md).
 * The script URL is read from config.json on GitHub Pages at runtime, so it can be set or changed
 * without shipping a new APK. Until it is set, feedback waits in a queue on the phone.
 */
const CONFIG_URL = `${APP_URL}config.json`;
const QUEUE_KEY = 'kinnect_feedback_queue';
const CONFIG_CACHE_KEY = 'kinnect_remote_config';

export const APP_VERSION = '1.2';

async function getConfig() {
  try {
    const res = await fetch(`${CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const cfg = await res.json();
      localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(cfg));
      return cfg;
    }
  } catch (_) {}
  try { return JSON.parse(localStorage.getItem(CONFIG_CACHE_KEY) || '{}'); } catch { return {}; }
}

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}

function saveQueue(queue) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch (_) {}
}

// Send everything waiting in the queue. Returns how many are still waiting.
export async function flushFeedback() {
  const queue = loadQueue();
  if (!queue.length) return 0;
  const { feedbackUrl } = await getConfig();
  if (!feedbackUrl) return queue.length;

  const remaining = [];
  for (const entry of queue) {
    try {
      // Apps Script doesn't send CORS headers; a no-cors text/plain POST still reaches doPost()
      await fetch(feedbackUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(entry),
      });
    } catch {
      remaining.push(entry);
    }
  }
  saveQueue(remaining);
  return remaining.length;
}

export async function submitFeedback(entry) {
  saveQueue([...loadQueue(), {
    id: 'fb-' + Date.now(),
    submittedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    platform: /android/i.test(navigator.userAgent) ? 'Android' : 'Web',
    ...entry,
  }]);
  const waiting = await flushFeedback();
  return waiting === 0 ? 'sent' : 'queued';
}
