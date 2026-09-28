import { Capacitor } from '@capacitor/core';

/**
 * Phone notifications, all created on the device (free, no server):
 *  - instant ones for messages/calls that arrive while Kinnect is in the background
 *  - repeating reminders (medicine, daily check-in, scheduled family calls)
 * Tapping a notification calls the handler registered with onNotificationTap(extra).
 * In a browser it falls back to the Web Notification API where available.
 */
const native = Capacitor.isNativePlatform();
let plugin = null;
let tapHandler = null;

async function ln() {
  if (!plugin) plugin = (await import('@capacitor/local-notifications')).LocalNotifications;
  return plugin;
}

// Notification ids must be 32-bit ints; derive a stable one from a string key
export function notificationId(key) {
  let h = 7;
  for (let i = 0; i < key.length; i++) h = (Math.imul(h, 31) + key.charCodeAt(i)) | 0;
  return Math.abs(h) % 2000000000 + 1;
}

export async function ensureNotificationPermission() {
  try {
    if (native) {
      const p = await ln();
      let { display } = await p.checkPermissions();
      if (display !== 'granted') ({ display } = await p.requestPermissions());
      return display === 'granted';
    }
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'default') await Notification.requestPermission();
    return Notification.permission === 'granted';
  } catch {
    return false;
  }
}

export async function initNotifications(onTap) {
  tapHandler = onTap;
  if (!native) return;
  try {
    const p = await ln();
    await p.addListener('localNotificationActionPerformed', ({ notification }) => tapHandler?.(notification.extra || {}));
    await p.createChannel?.({ id: 'messages', name: 'Messages', importance: 4, vibration: true });
    await p.createChannel?.({ id: 'reminders', name: 'Reminders', importance: 5, vibration: true });
    await p.createChannel?.({ id: 'alerts', name: 'Family alerts', importance: 5, vibration: true });
  } catch (e) {
    console.warn('[Notify] init failed', e);
  }
}

export async function notifyNow({ key, title, body, extra = {}, channel = 'messages' }) {
  try {
    if (native) {
      const p = await ln();
      await p.schedule({ notifications: [{ id: notificationId(key || String(Date.now())), title, body, extra, channelId: channel }] });
      return;
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const n = new Notification(title, { body, tag: key });
      n.onclick = () => { window.focus(); tapHandler?.(extra); };
    }
  } catch (e) {
    console.warn('[Notify] notify failed', e);
  }
}

/**
 * Repeating reminder. `days` = [] for every day, or JS weekdays (0 = Sunday) for specific days.
 * Returns the notification ids created (one per weekday), for cancelling later.
 */
export async function scheduleRepeating({ key, title, body, hour, minute, days = [], extra = {}, channel = 'reminders' }) {
  if (!native) return [];
  try {
    const p = await ln();
    const list = (days.length ? days : [null]).map(d => ({
      id: notificationId(`${key}:${d ?? 'daily'}`),
      title, body, extra, channelId: channel,
      schedule: {
        on: d === null ? { hour, minute } : { weekday: d + 1, hour, minute }, // plugin weekday: 1 = Sunday
        repeats: true,
        allowWhileIdle: true,
      },
    }));
    await p.schedule({ notifications: list });
    return list.map(n => n.id);
  } catch (e) {
    console.warn('[Notify] schedule failed', e);
    return [];
  }
}

export async function scheduleOnce({ key, title, body, at, extra = {}, channel = 'reminders' }) {
  if (!native || at <= Date.now()) return null;
  try {
    const p = await ln();
    const id = notificationId(key);
    await p.schedule({ notifications: [{ id, title, body, extra, channelId: channel, schedule: { at: new Date(at), allowWhileIdle: true } }] });
    return id;
  } catch {
    return null;
  }
}

export async function cancelNotifications(ids) {
  if (!native || !ids?.length) return;
  try { await (await ln()).cancel({ notifications: ids.map(id => ({ id })) }); } catch (_) {}
}

// Cancel every repeating/once notification created for `key` (daily + all weekdays)
export async function cancelByKey(key) {
  const ids = [notificationId(key), notificationId(`${key}:daily`), ...[0, 1, 2, 3, 4, 5, 6].map(d => notificationId(`${key}:${d}`))];
  await cancelNotifications(ids);
}
