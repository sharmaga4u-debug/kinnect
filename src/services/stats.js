// Local call log and activity counts (on this phone only) for streaks and the sticker book
const CALLS_KEY = 'kinnect_calls';
const STATS_KEY = 'kinnect_stats';

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

export function logCall({ withId, name, seconds, type }) {
  if (!withId || seconds < 20) return;
  save(CALLS_KEY, [{ withId, name, seconds, type, at: Date.now() }, ...load(CALLS_KEY, [])].slice(0, 300));
}

export const getCalls = () => load(CALLS_KEY, []);

export function bumpStat(name, by = 1) {
  const s = load(STATS_KEY, {});
  s[name] = (s[name] || 0) + by;
  save(STATS_KEY, s);
}
export const getStats = () => load(STATS_KEY, {});

// Week number counting from a fixed Monday, so consecutive weeks differ by 1
const weekIndex = (ts) => Math.floor((ts - Date.UTC(2024, 0, 1)) / (7 * 86400000));

// Consecutive weeks (ending this week or last week) with at least one real call with this person
export function streakWith(withId, calls = getCalls()) {
  const weeks = new Set(calls.filter(c => c.withId === withId && c.seconds >= 60).map(c => weekIndex(c.at)));
  let w = weekIndex(Date.now());
  if (!weeks.has(w)) w -= 1;
  let n = 0;
  while (weeks.has(w)) { n++; w--; }
  return n;
}

export function bestStreak(calls = getCalls()) {
  const ids = [...new Set(calls.map(c => c.withId))];
  return ids.reduce((best, id) => Math.max(best, streakWith(id, calls)), 0);
}

export const STICKERS = [
  { id: 'first-call', emoji: '📞', title: 'First call', how: 'Make your first call', test: (c) => c.calls.length >= 1 },
  { id: 'ten-calls', emoji: '☎️', title: 'Chatty family', how: 'Make 10 calls', test: (c) => c.calls.length >= 10 },
  { id: 'played', emoji: '🎮', title: 'Play pal', how: 'Play a game on a call', test: (c) => (c.stats.activities || 0) >= 1 },
  { id: 'story', emoji: '📖', title: 'Story lover', how: 'Listen to or record a story', test: (c) => c.stories >= 1 },
  { id: 'diyas', emoji: '🪔', title: 'Festival light', how: 'Light the diyas together', test: (c) => (c.stats.diyas || 0) >= 1 },
  { id: 'streak2', emoji: '🔥', title: '2-week streak', how: 'Call the same person 2 weeks in a row', test: (c) => c.best >= 2 },
  { id: 'streak4', emoji: '🌟', title: '4-week streak', how: '4 weeks in a row', test: (c) => c.best >= 4 },
  { id: 'streak8', emoji: '🏆', title: '8-week champion', how: '8 weeks in a row', test: (c) => c.best >= 8 },
];
