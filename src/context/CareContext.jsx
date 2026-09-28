import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useApp, displayName, groupChatKey } from './AppContext';
import { realtime } from '../services/realtime';
import { scheduleRepeating, scheduleOnce, cancelByKey, notifyNow } from '../services/notify';
import { myTimeZone, nextDaily, partsIn, parseHHMM, weeklyInMyZone, fmtTime, WEEKDAYS } from '../utils/tz';

/**
 * Family care features, all on-device and shared only as encrypted messages:
 *  - daily "I'm OK" check-in (+ caregivers see it and get a daily nudge)
 *  - medicine reminders with a taken log that caregivers can see
 *  - SOS with location
 *  - scheduled family calls, family calendar, family tree relations, blocking
 * Everything is stored in localStorage `kinnect_care` (included in backups).
 */
const CARE_KEY = 'kinnect_care';
const DEFAULT = {
  checkIn: { enabled: false, time: '10:00', watchers: [] },
  lastOk: 0,
  medicines: [],
  medLog: {},
  sosContacts: [],
  favorites: [],
  blocked: [],
  watching: {},
  schedules: [],
  events: [],
  relations: {},
  simpleMode: false,
  translate: {},
};

function loadCare() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(CARE_KEY) || '{}') }; }
  catch { return { ...DEFAULT }; }
}

export const todayKey = (tz = myTimeZone()) => { const p = partsIn(tz, Date.now()); return `${p.y}-${p.m}-${p.d}`; };

const CareContext = createContext(null);

export function CareProvider({ children }) {
  const { user, people, groups, sendMessage } = useApp();
  const [care, setCare] = useState(loadCare);
  const [sosAlert, setSosAlert] = useState(null);
  const careRef = useRef(care);
  careRef.current = care;

  const update = useCallback((patch) => {
    setCare(prev => {
      const next = { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) };
      try { localStorage.setItem(CARE_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  }, []);

  // Reload when the account changes (e.g. after restoring a backup)
  useEffect(() => { setCare(loadCare()); }, [user?.id]);

  const nameOf = useCallback((id) => (people[id] ? displayName(people[id]) : 'Family member'), [people]);
  const send = (ids, body) => ids.forEach(id => realtime.sendDirect(id, body, { waitMs: 6000 }).catch(() => {}));

  /* ── Daily check-in ─────────────────────────────────────── */
  const setCheckIn = useCallback(async (checkIn) => {
    update({ checkIn });
    await cancelByKey('checkin');
    await cancelByKey('checkin-late');
    if (checkIn.enabled) {
      const { hour, minute } = parseHHMM(checkIn.time);
      await scheduleRepeating({ key: 'checkin', title: '🌞 Good morning!', body: "Tap to tell your family you're OK", hour, minute, extra: { screen: 'family' } });
      const late = (hour * 60 + minute + 60) % 1440;
      await scheduleRepeating({ key: 'checkin-late', title: '💛 Your family is waiting', body: "You haven't said I'm OK today. Tap here.", hour: Math.floor(late / 60), minute: late % 60, extra: { screen: 'family' } });
    }
    send(checkIn.watchers, { t: 'care_setup', enabled: checkIn.enabled, time: checkIn.time, tz: myTimeZone(), name: user?.name });
  }, [update, user?.name]);

  const sayImOk = useCallback(() => {
    const ts = Date.now();
    update({ lastOk: ts });
    send(careRef.current.checkIn.watchers, { t: 'care_ok', at: ts, name: user?.name });
  }, [update, user?.name]);

  const okToday = care.lastOk && partsIn(myTimeZone(), care.lastOk).d === partsIn(myTimeZone(), Date.now()).d
    && Date.now() - care.lastOk < 86400000;

  // Caregiver side: a daily nudge 2 hours after their check-in time, in my time zone
  const scheduleWatchNudge = useCallback(async (elderId, w) => {
    await cancelByKey(`watch:${elderId}`);
    if (!w?.enabled) return;
    const { hour, minute } = parseHHMM(w.time);
    const at = nextDaily(w.tz || myTimeZone(), (hour + 2) % 24, minute);
    const local = partsIn(myTimeZone(), at);
    await scheduleRepeating({
      key: `watch:${elderId}`, title: `💛 Daily check-in: ${w.name}`, body: `Tap to see if ${w.name} said I'm OK today`,
      hour: local.hour, minute: local.minute, extra: { screen: 'family' }, channel: 'alerts',
    });
  }, []);

  /* ── Medicines ───────────────────────────────────────────── */
  const scheduleMedicine = async (med) => {
    await cancelByKey(`med:${med.id}`);
    for (const t of med.times) {
      const { hour, minute } = parseHHMM(t);
      await scheduleRepeating({ key: `med:${med.id}:${t}`, title: `💊 Time for ${med.name}`, body: med.dose ? `${med.dose} · tap when taken` : 'Tap when taken', hour, minute, extra: { screen: 'family', med: med.id, time: t } });
    }
  };

  const saveMedicine = useCallback(async (med) => {
    const m = { ...med, id: med.id || 'med' + Date.now().toString(36) };
    update(prev => ({ medicines: [...prev.medicines.filter(x => x.id !== m.id), m] }));
    await scheduleMedicine(m);
  }, [update]);

  const removeMedicine = useCallback(async (id) => {
    const med = careRef.current.medicines.find(m => m.id === id);
    update(prev => ({ medicines: prev.medicines.filter(m => m.id !== id) }));
    for (const t of med?.times || []) await cancelByKey(`med:${id}:${t}`);
  }, [update]);

  const markTaken = useCallback((medId, time) => {
    const day = todayKey();
    const at = Date.now();
    update(prev => ({ medLog: { ...prev.medLog, [day]: { ...(prev.medLog[day] || {}), [`${medId}@${time}`]: at } } }));
    const med = careRef.current.medicines.find(m => m.id === medId);
    if (med?.share !== false) send(careRef.current.checkIn.watchers, { t: 'care_med', name: user?.name, med: med?.name, time, at });
  }, [update, user?.name]);

  /* ── SOS ─────────────────────────────────────────────────── */
  const getLocation = async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Geolocation } = await import('@capacitor/geolocation');
        const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        return { lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) };
      }
      return await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }),
          () => resolve(null), { enableHighAccuracy: true, timeout: 10000 });
      });
    } catch {
      return null;
    }
  };

  const sosRecipients = () => {
    const c = careRef.current;
    const list = [...new Set([...(c.sosContacts || []), ...(c.checkIn.watchers || [])])];
    return list.length ? list : (c.favorites || []);
  };

  // Returns the first contact to call, or null if nobody is set up
  const sendSOS = useCallback(async () => {
    const recipients = sosRecipients();
    if (!recipients.length) return { error: 'NO_CONTACTS' };
    const loc = await getLocation();
    const map = loc ? `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=17/${loc.lat}/${loc.lng}` : '';
    const text = `🆘 SOS — I need help!${map ? `\n📍 My location: ${map}` : '\n(Location not available)'}`;
    for (const id of recipients) sendMessage(id, text);
    send(recipients, { t: 'care_sos', name: user?.name, loc, at: Date.now() });
    return { first: recipients[0], loc };
  }, [sendMessage, user?.name]);

  /* ── Scheduled family calls ──────────────────────────────── */
  const scheduleCallReminder = async (s) => {
    await cancelByKey(`sched:${s.id}`);
    // Reminder 10 minutes before, in my own time zone
    const { hour, minute } = parseHHMM(s.time);
    const total = hour * 60 + minute - 10;
    const dayShift = total < 0 ? -1 : 0;
    const t = (total + 1440) % 1440;
    const local = weeklyInMyZone(s.tz, (s.weekday + 7 + dayShift) % 7, Math.floor(t / 60), t % 60);
    await scheduleRepeating({
      key: `sched:${s.id}`, title: `📅 ${s.title} in 10 minutes`, body: 'Tap to get ready for the family call',
      hour: local.hour, minute: local.minute, days: [local.weekday], extra: { chatKey: s.chatKey },
    });
  };

  const membersOf = (chatKey) => (chatKey.startsWith('g:') ? (groups[chatKey.slice(2)]?.members || []).map(m => m.id) : [chatKey]);

  const createSchedule = useCallback(async ({ title, chatKey, weekday, time }) => {
    const s = { id: 's' + Date.now().toString(36), title, chatKey, weekday, time, tz: myTimeZone(), by: user.id, byName: user.name };
    update(prev => ({ schedules: [...prev.schedules, s] }));
    await scheduleCallReminder(s);
    // Everyone gets it, with the chat key from *their* point of view
    for (const id of membersOf(chatKey)) {
      if (id === user.id) continue;
      realtime.sendDirect(id, { t: 'sched', schedule: { ...s, chatKey: chatKey.startsWith('g:') ? chatKey : user.id } }, { waitMs: 6000 }).catch(() => {});
    }
    const { hour, minute } = parseHHMM(time);
    sendMessage(chatKey, `📅 I scheduled "${title}" every ${WEEKDAYS[weekday]} at ${fmtTime(hour, minute)} (my time). Kinnect will remind you in your own time zone.`);
    return s;
  }, [update, user, groups, sendMessage]);

  const removeSchedule = useCallback(async (id) => {
    update(prev => ({ schedules: prev.schedules.filter(s => s.id !== id) }));
    await cancelByKey(`sched:${id}`);
  }, [update]);

  /* ── Family calendar ─────────────────────────────────────── */
  const saveEvent = useCallback(async (ev) => {
    const e = { ...ev, id: ev.id || 'e' + Date.now().toString(36) };
    update(prev => ({ events: [...prev.events.filter(x => x.id !== e.id), e] }));
    const [, m, d] = e.date.split('-').map(Number);
    // Reminder at 9 AM on the day, every year
    const year = new Date().getFullYear();
    let at = new Date(year, m - 1, d, 9, 0).getTime();
    if (at < Date.now()) at = new Date(year + 1, m - 1, d, 9, 0).getTime();
    await scheduleOnce({ key: `event:${e.id}`, title: `${e.kind === 'birthday' ? '🎂' : e.kind === 'anniversary' ? '💐' : '📅'} ${e.title}`, body: 'Today! Send your wishes or call them.', at });
    if (e.shareWith) {
      for (const id of membersOf(e.shareWith)) if (id !== user.id) realtime.sendDirect(id, { t: 'event', event: { ...e, shareWith: undefined, from: user.name } }, { waitMs: 6000 }).catch(() => {});
    }
    return e;
  }, [update, user, groups]);

  const removeEvent = useCallback(async (id) => {
    update(prev => ({ events: prev.events.filter(e => e.id !== id) }));
    await cancelByKey(`event:${id}`);
  }, [update]);

  /* ── Relations, favourites, blocking, simple mode ───────── */
  const setRelation = useCallback((id, relation) => update(prev => ({ relations: { ...prev.relations, [id]: relation } })), [update]);
  const toggleFavorite = useCallback((id) => update(prev => ({ favorites: prev.favorites.includes(id) ? prev.favorites.filter(x => x !== id) : [...prev.favorites, id].slice(0, 6) })), [update]);
  const toggleBlock = useCallback((id) => update(prev => ({ blocked: prev.blocked.includes(id) ? prev.blocked.filter(x => x !== id) : [...prev.blocked, id] })), [update]);
  const setSimpleMode = useCallback((on) => update({ simpleMode: on }), [update]);
  const setSosContacts = useCallback((ids) => update({ sosContacts: ids }), [update]);
  const setTranslate = useCallback((chatKey, on) => update(prev => ({ translate: { ...prev.translate, [chatKey]: on } })), [update]);

  /* ── Incoming care messages ──────────────────────────────── */
  useEffect(() => {
    if (!user) return undefined;
    return realtime.on('direct', ({ from, body }) => {
      if (careRef.current.blocked.includes(from)) return;
      const name = body.name || nameOf(from);
      switch (body.t) {
        case 'care_setup': {
          const w = { ...(careRef.current.watching[from] || {}), name, enabled: body.enabled, time: body.time, tz: body.tz };
          update(prev => ({ watching: { ...prev.watching, [from]: w } }));
          scheduleWatchNudge(from, w);
          break;
        }
        case 'care_ok':
          update(prev => ({ watching: { ...prev.watching, [from]: { ...(prev.watching[from] || { name }), lastOk: body.at } } }));
          break;
        case 'care_med':
          update(prev => {
            const w = prev.watching[from] || { name };
            const meds = [{ med: body.med, time: body.time, at: body.at }, ...(w.meds || [])].slice(0, 30);
            return { watching: { ...prev.watching, [from]: { ...w, meds } } };
          });
          break;
        case 'care_sos':
          setSosAlert({ from, name, loc: body.loc, at: body.at });
          notifyNow({ key: `sos:${from}:${body.at}`, title: `🆘 ${name} needs help!`, body: 'Tap to open Kinnect and call them now', extra: { chatKey: from }, channel: 'alerts' });
          break;
        case 'sched': {
          const s = body.schedule;
          if (!s?.id) break;
          update(prev => ({ schedules: [...prev.schedules.filter(x => x.id !== s.id), s] }));
          scheduleCallReminder(s);
          break;
        }
        case 'event': {
          const e = body.event;
          if (!e?.id) break;
          update(prev => ({ events: [...prev.events.filter(x => x.id !== e.id), e] }));
          break;
        }
        default:
      }
    });
  }, [user?.id, nameOf]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CareContext.Provider value={{
      care, update,
      setCheckIn, sayImOk, okToday,
      saveMedicine, removeMedicine, markTaken,
      sendSOS, sosAlert, setSosAlert, setSosContacts,
      createSchedule, removeSchedule,
      saveEvent, removeEvent,
      setRelation, toggleFavorite, toggleBlock, setSimpleMode, setTranslate,
      groupChatKey,
    }}>
      {children}
    </CareContext.Provider>
  );
}

export const useCare = () => useContext(CareContext);
