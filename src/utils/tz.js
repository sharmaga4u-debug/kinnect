// Time-zone helpers built on Intl (no libraries, works offline)

export const myTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

// Minutes that `tz` is ahead of UTC at the given moment
export function tzOffsetMinutes(tz, date = new Date()) {
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(date).map(p => [p.type, p.value]));
    const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    return Math.round((asUtc - date.getTime()) / 60000);
  } catch {
    return 0;
  }
}

// The instant when it is year-month-day hour:minute in `tz`
export function zonedToEpoch(tz, y, m, d, hour, minute) {
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  const first = guess - tzOffsetMinutes(tz, new Date(guess)) * 60000;
  return guess - tzOffsetMinutes(tz, new Date(first)) * 60000; // second pass settles DST edges
}

// Parts of an instant as seen in `tz`: { weekday (0=Sun), hour, minute, y, m, d }
export function partsIn(tz, epoch) {
  const f = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date(epoch)).map(p => [p.type, p.value]));
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(f.weekday);
  return { weekday, hour: +f.hour, minute: +f.minute, y: +f.year, m: +f.month, d: +f.day };
}

// Next instant (after now) that is `weekday hh:mm` in `tz`
export function nextWeekly(tz, weekday, hour, minute, now = Date.now()) {
  const today = partsIn(tz, now);
  for (let add = 0; add <= 7; add++) {
    const probe = partsIn(tz, now + add * 86400000);
    if (probe.weekday !== weekday) continue;
    const at = zonedToEpoch(tz, probe.y, probe.m, probe.d, hour, minute);
    if (at > now) return at;
  }
  return zonedToEpoch(tz, today.y, today.m, today.d, hour, minute) + 7 * 86400000;
}

// Next instant (after now) that is hh:mm in `tz` (daily)
export function nextDaily(tz, hour, minute, now = Date.now()) {
  const p = partsIn(tz, now);
  let at = zonedToEpoch(tz, p.y, p.m, p.d, hour, minute);
  if (at <= now) at += 86400000;
  return at;
}

// Weekly time in another zone → the same moment in my zone { weekday, hour, minute }
export function weeklyInMyZone(tz, weekday, hour, minute) {
  const at = nextWeekly(tz, weekday, hour, minute);
  return partsIn(myTimeZone(), at);
}

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function fmtTime(hour, minute) {
  const d = new Date(2000, 0, 1, hour, minute);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function parseHHMM(s) {
  const [h, m] = String(s || '0:0').split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

/* Hours (in my zone) when every given time zone is between 8 AM and 9 PM */
export function goodHoursForAll(zones) {
  const mine = myTimeZone();
  const base = Date.now();
  const out = [];
  const start = partsIn(mine, base);
  const midnight = zonedToEpoch(mine, start.y, start.m, start.d, 0, 0);
  for (let h = 0; h < 24; h++) {
    const at = midnight + h * 3600000;
    const ok = zones.every(z => { const hr = partsIn(z || mine, at).hour; return hr >= 8 && hr <= 21; });
    out.push({ hour: h, ok, at });
  }
  return out;
}
