import { Capacitor } from '@capacitor/core';

// Current position from the phone's GPS (or the browser), or null if unavailable/denied
export async function getLocation() {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Geolocation } = await import('@capacitor/geolocation');
      const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      return { lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy), at: Date.now() };
    }
    return await new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy), at: Date.now() }),
        () => resolve(null), { enableHighAccuracy: true, timeout: 10000 });
    });
  } catch {
    return null;
  }
}

export const mapLink = (loc) => `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=17/${loc.lat}/${loc.lng}`;

/* Live location: send a fresh position every 30 s until the time is up (while Kinnect is open) */
const active = new Map(); // msgId → timer

export function startLiveShare(msgId, until, onUpdate) {
  stopLiveShare(msgId);
  const tick = async () => {
    if (Date.now() >= until) { stopLiveShare(msgId); return; }
    const loc = await getLocation();
    if (loc) onUpdate(loc);
  };
  active.set(msgId, setInterval(tick, 30000));
}

export function stopLiveShare(msgId) {
  clearInterval(active.get(msgId));
  active.delete(msgId);
}

export const isSharing = (msgId) => active.has(msgId);
