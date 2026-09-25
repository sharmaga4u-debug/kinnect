import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { realtime } from '../services/realtime';
import { storage } from '../services/storage';
import {
  userIdForPhone, loadOrCreateIdentity, clearIdentity, newGroupKey, publicKeyFingerprint,
} from '../services/crypto';
import { canReadContacts, contactsPermission, readPhoneContacts, requestContactsPermission } from '../services/contacts';
import { flushFeedback } from '../services/feedback';
import { normalizePhone, splitPhone, formatPhone } from '../utils/phone';
import { TOPICS } from '../data/topics';

const ACCOUNT_KEY = 'kinnect_account_v2';
const PREFS_KEY = 'kinnect_prefs';

const AVATAR_PALETTE = [
  ['#DBEAFE', '#1E40AF'], ['#FCE7F3', '#9D174D'], ['#DCFCE7', '#166534'],
  ['#FEF3C7', '#92400E'], ['#EDE9FE', '#5B21B6'], ['#CFFAFE', '#155E75'],
];

function paletteFor(id = '') {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export const groupChatKey = (groupId) => `g:${groupId}`;

// Name to show for a person: what *you* saved them as, else the name they chose, else their number
export function displayName(person) {
  if (!person) return 'Unknown';
  return person.contactName || person.profile?.name || formatPhone(person.phone) || 'Kinnect user';
}

// Shape used by avatars, call screens and profile sheets
export function personView(person) {
  const [avatarBg, avatarColor] = paletteFor(person.id);
  return {
    id: person.id,
    name: displayName(person),
    emoji: person.profile?.avatar || '🙂',
    photo: person.profile?.photo || '',
    about: person.profile?.about || '',
    timezone: person.profile?.tz || '',
    phone: person.phone || '',
    registered: !!person.registered,
    avatarBg, avatarColor,
  };
}

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}

function newMessageId() {
  return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function localHourIn(tz) {
  if (!tz) return null;
  try { return Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(new Date())); }
  catch { return null; }
}

// "9:40 PM" in someone else's time zone
export function localTimeIn(tz) {
  try { return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: tz }); }
  catch { return ''; }
}

// True when their clock differs from ours by at least an hour
export function differentTimeZone(tz) {
  if (!tz) return false;
  const mine = localHourIn(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const theirs = localHourIn(tz);
  return theirs !== null && mine !== theirs;
}

// "London" from "Europe/London"
export function tzCity(tz) {
  return (tz || '').split('/').pop().replace(/_/g, ' ');
}

function clockTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ──────────────────────────────────────────
   Context Setup
────────────────────────────────────────── */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUserState] = useState(() => loadJson(ACCOUNT_KEY, null));
  const [locked, setLocked] = useState(() => !!loadJson(ACCOUNT_KEY, null)?.pinHash);

  const prefs = loadJson(PREFS_KEY, {});
  const [fontScale, setFontScaleState] = useState(prefs.fontScale || 'normal'); // 'normal' | 'large' | 'xlarge'
  const [selectedLanguage, setSelectedLanguageState] = useState(prefs.language || 'en');

  const [activeTab, setActiveTab] = useState('chats');
  const [people, setPeople] = useState({});          // id → person
  const [phoneContacts, setPhoneContacts] = useState([]); // everyone in the phone book, for invites
  const [contactsStatus, setContactsStatus] = useState(canReadContacts ? 'unknown' : 'unavailable');
  const [groups, setGroups] = useState({});          // id → group
  const [messagesByChat, setMessagesByChat] = useState({});
  const [unreadByChat, setUnreadByChat] = useState({});
  const [activeChatId, setActiveChatIdState] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [peerId, setPeerId] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [lateCall, setLateCall] = useState(null);   // call waiting for "they may be asleep" confirmation
  const [lastCall, setLastCall] = useState(null);   // finished call, for the quick "how was it?" prompt
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const openFeedback = useCallback(() => setFeedbackOpen(true), []);
  const [topics] = useState(TOPICS);

  // Refs so realtime listeners always see current values without re-subscribing
  const userRef = useRef(user);
  const peopleRef = useRef(people);
  const groupsRef = useRef(groups);
  const activeChatRef = useRef(activeChatId);
  const seenIdsRef = useRef({}); // chatKey → Set of message ids already stored
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { peopleRef.current = people; }, [people]);
  useEffect(() => { groupsRef.current = groups; }, [groups]);
  useEffect(() => { activeChatRef.current = activeChatId; }, [activeChatId]);
  // Never reopen straight into a conversation after the lock screen
  useEffect(() => { if (locked) setActiveChatIdState(null); }, [locked]);

  /* ── Preferences ──────────────────────────────────────────── */
  const savePrefs = (patch) => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ ...loadJson(PREFS_KEY, {}), ...patch })); } catch (_) {}
  };
  const setFontScale = useCallback((v) => { setFontScaleState(v); savePrefs({ fontScale: v }); }, []);
  const setSelectedLanguage = useCallback((v) => { setSelectedLanguageState(v); savePrefs({ language: v }); }, []);

  useEffect(() => {
    document.body.classList.remove('font-large', 'font-xlarge');
    if (fontScale === 'large') document.body.classList.add('font-large');
    if (fontScale === 'xlarge') document.body.classList.add('font-xlarge');
  }, [fontScale]);

  /* ── Account ──────────────────────────────────────────────── */
  const persistUser = useCallback((u) => {
    setUserState(u);
    try {
      if (u) localStorage.setItem(ACCOUNT_KEY, JSON.stringify(u));
      else localStorage.removeItem(ACCOUNT_KEY);
    } catch (_) {}
  }, []);

  const createAccount = useCallback(async ({ phone, name, avatar, photo }) => {
    await loadOrCreateIdentity();
    const account = {
      id: await userIdForPhone(phone),
      phone,
      name: name.trim(),
      avatar: avatar || '🙂',
      photo: photo || '',
      about: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      createdAt: Date.now(),
    };
    persistUser(account);
    setLocked(false);
    return account;
  }, [persistUser]);

  const updateProfile = useCallback((patch) => {
    const updated = { ...userRef.current, ...patch };
    persistUser(updated);
    realtime.currentUser = updated;
    realtime.publishProfile(updated);
  }, [persistUser]);

  // Remove the account and everything stored on this phone
  const deleteAccount = useCallback(async () => {
    const me = userRef.current;
    if (me) realtime.clearProfile(me.id);
    await new Promise(r => setTimeout(r, 400)); // let the broker receive the removal
    realtime.disconnect();
    await storage.clearAll();
    clearIdentity();
    ['kinnect_device_id', PREFS_KEY].forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
    setLocked(false);
    persistUser(null);
  }, [persistUser]);

  /* ── App lock (optional) ──────────────────────────────────── */
  const enableLock = useCallback((pinHash) => updateProfile({ pinHash }), [updateProfile]);
  const disableLock = useCallback(() => updateProfile({ pinHash: null }), [updateProfile]);
  const lockApp = useCallback(() => { if (userRef.current?.pinHash) setLocked(true); }, []);
  const unlockApp = useCallback(() => setLocked(false), []);

  // Re-lock when the app has been in the background for a while
  useEffect(() => {
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt > 30000 && userRef.current?.pinHash) {
        setLocked(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  /* ── People ───────────────────────────────────────────────── */

  // Merge changes into a person and save them (only people worth remembering are saved)
  const upsertPerson = useCallback((id, patch) => {
    if (!id || id === userRef.current?.id) return;
    setPeople(prev => {
      const current = prev[id] || { id, kind: 'person' };
      const next = { ...current, ...(typeof patch === 'function' ? patch(current) : patch) };
      if (next.registered || next.source !== 'contacts') storage.saveMember(next);
      return { ...prev, [id]: next };
    });
  }, []);

  // Add a system note (e.g. "security code changed") to a chat
  const addSystemNote = useCallback((chatKey, text, ts = Date.now()) => {
    const me = userRef.current;
    const note = { id: newMessageId(), chatKey, senderId: 'system', senderName: '', text, type: 'system', time: clockTime(ts), timestamp: ts, isMe: false, status: 'system' };
    (seenIdsRef.current[chatKey] ||= new Set()).add(note.id);
    setMessagesByChat(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), note].sort((a, b) => a.timestamp - b.timestamp) }));
    if (me) storage.saveMessage(`${me.id}-${chatKey}`, note);
  }, []);

  // A directory profile arrived (someone is on Kinnect) or changed
  const applyProfile = useCallback((profile) => {
    const known = peopleRef.current[profile.id];
    const oldKey = known?.profile?.pub;
    if (oldKey && profile.pub && publicKeyFingerprint(oldKey) !== publicKeyFingerprint(profile.pub) && messagesByChatRef.current[profile.id]?.length) {
      addSystemNote(profile.id, `🔐 ${displayName(known)}'s security key changed. They may have reinstalled Kinnect.`);
    }
    upsertPerson(profile.id, { registered: true, profile });
  }, [upsertPerson, addSystemNote]);

  // Read the phone book and look up which contacts are on Kinnect
  const syncPhoneContacts = useCallback(async () => {
    const me = userRef.current;
    if (!me || !canReadContacts) return;
    const status = await contactsPermission();
    setContactsStatus(status);
    if (status !== 'granted' && status !== 'limited') return 0;

    const { cc } = splitPhone(me.phone);
    let raw = [];
    try {
      raw = await readPhoneContacts();
    } catch (e) {
      console.warn('[Contacts] could not read contacts:', e?.message || e);
      return 0;
    }
    const byId = new Map();
    for (const c of raw) {
      for (const number of c.phones) {
        const phone = normalizePhone(number, cc || '91');
        if (!phone || phone === me.phone) continue;
        const id = await userIdForPhone(phone);
        if (!byId.has(id)) byId.set(id, { id, name: c.name || formatPhone(phone), phone });
      }
    }
    const list = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
    setPhoneContacts(list);

    // Keep saved names in sync with the phone book, then follow everyone's directory record
    setPeople(prev => {
      const next = { ...prev };
      for (const c of list) {
        const current = next[c.id] || { id: c.id, kind: 'person', source: 'contacts' };
        next[c.id] = { ...current, contactName: c.name, phone: c.phone };
        if (next[c.id].registered || next[c.id].source !== 'contacts') storage.saveMember(next[c.id]);
      }
      return next;
    });
    realtime.watchUsers(list.map(c => c.id));
    return list.length;
  }, []);

  // Ask for contacts permission (from any "Allow" button) and load them if granted
  const askForContacts = useCallback(async () => {
    const status = await requestContactsPermission();
    setContactsStatus(status);
    if (status !== 'granted' && status !== 'limited') return { status };
    const count = await syncPhoneContacts();
    return { status: 'granted', count };
  }, [syncPhoneContacts]);

  // Add someone by typing their number
  const addByNumber = useCallback(async (rawNumber, name = '') => {
    const me = userRef.current;
    const { cc } = splitPhone(me.phone);
    const phone = normalizePhone(rawNumber, cc || '91');
    if (!phone) return { error: 'Please enter a valid mobile number.' };
    if (phone === me.phone) return { error: 'That is your own number.' };
    const id = await userIdForPhone(phone);
    upsertPerson(id, (p) => ({ phone, contactName: name.trim() || p.contactName || '', source: p.source === 'contacts' ? 'contacts' : 'manual' }));
    realtime.watchUsers([id]);
    const profile = await realtime.waitForProfile(id, 6000);
    if (profile) applyProfile(profile);
    return { id, phone, registered: !!profile };
  }, [upsertPerson, applyProfile]);

  /* ── Messages ─────────────────────────────────────────────── */
  const messagesByChatRef = useRef(messagesByChat);
  useEffect(() => { messagesByChatRef.current = messagesByChat; }, [messagesByChat]);

  const storeMessage = useCallback((chatKey, msg, { countUnread = true } = {}) => {
    const me = userRef.current;
    if (!me) return false;
    const seen = (seenIdsRef.current[chatKey] ||= new Set());
    if (seen.has(msg.id)) return false;
    seen.add(msg.id);
    setMessagesByChat(prev => {
      const list = prev[chatKey] || [];
      const next = [...list, msg];
      if (list.length && list[list.length - 1].timestamp > msg.timestamp) next.sort((a, b) => a.timestamp - b.timestamp);
      return { ...prev, [chatKey]: next };
    });
    storage.saveMessage(`${me.id}-${chatKey}`, msg);
    if (countUnread && !msg.isMe && activeChatRef.current !== chatKey) {
      setUnreadByChat(prev => ({ ...prev, [chatKey]: (prev[chatKey] || 0) + 1 }));
    }
    return true;
  }, []);

  const setMessageStatus = useCallback((chatKey, ids, status) => {
    const me = userRef.current;
    const idSet = new Set(ids);
    setMessagesByChat(prev => {
      const list = prev[chatKey];
      if (!list) return prev;
      let changed = false;
      const next = list.map(m => {
        if (!idSet.has(m.id) || m.status === status || (m.status === 'delivered' && status === 'sent')) return m;
        changed = true;
        const updated = { ...m, status };
        if (me) storage.saveMessage(`${me.id}-${chatKey}`, updated);
        return updated;
      });
      return changed ? { ...prev, [chatKey]: next } : prev;
    });
  }, []);

  // Encrypt and send one stored message
  const deliver = useCallback(async (chatKey, msg) => {
    const me = userRef.current;
    const body = { t: 'msg', id: msg.id, text: msg.text, type: msg.type, name: me.name, avatar: me.avatar };
    if (msg.type === 'audio') Object.assign(body, { audio: msg.audio, duration: msg.duration });
    try {
      if (chatKey.startsWith('g:')) {
        await realtime.sendGroup(chatKey.slice(2), body);
      } else {
        await realtime.sendDirect(chatKey, body);
      }
      setMessageStatus(chatKey, [msg.id], 'sent');
    } catch (e) {
      setMessageStatus(chatKey, [msg.id], e.message === 'NO_KEY' ? 'failed' : 'pending');
    }
  }, [setMessageStatus]);

  // `extra` carries voice-message data: { audio: dataUrl, duration: seconds }
  const sendMessage = useCallback((chatKey, text, type = 'text', extra = {}) => {
    const me = userRef.current;
    if (!me || !chatKey) return;
    if (type === 'text' && !text?.trim()) return;
    if (type === 'audio' && !extra.audio) return;
    const ts = Date.now();
    const msg = { id: newMessageId(), chatKey, senderId: me.id, senderName: me.name, text: (text || '').trim(), type, time: clockTime(ts), timestamp: ts, isMe: true, status: 'pending', ...extra };
    storeMessage(chatKey, msg);
    deliver(chatKey, msg);
  }, [storeMessage, deliver]);

  // Retry anything that couldn't be sent (e.g. we were offline)
  const retryPending = useCallback(() => {
    for (const [chatKey, list] of Object.entries(messagesByChatRef.current)) {
      list.filter(m => m.isMe && m.status === 'pending').forEach(m => deliver(chatKey, m));
    }
  }, [deliver]);

  /* ── Groups ───────────────────────────────────────────────── */
  const saveGroup = useCallback((group) => {
    storage.saveMember({ ...group, kind: 'group' });
    setGroups(prev => ({ ...prev, [group.id]: group }));
    realtime.watchGroup(group);
  }, []);

  const createGroup = useCallback(async (name, memberIds) => {
    const me = userRef.current;
    const members = [
      { id: me.id, name: me.name },
      ...memberIds.map(id => ({ id, name: displayName(peopleRef.current[id]) })),
    ];
    const group = {
      id: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: name.trim(),
      avatar: '👥',
      key: newGroupKey(),
      members,
      createdBy: me.id,
      createdAt: Date.now(),
    };
    saveGroup(group);
    await Promise.all(memberIds.map(id => realtime.sendDirect(id, { t: 'group_invite', group }).catch(() => {})));
    addSystemNote(groupChatKey(group.id), `You created “${group.name}”`);
    return group;
  }, [saveGroup, addSystemNote]);

  const addGroupMembers = useCallback(async (groupId, memberIds) => {
    const group = groupsRef.current[groupId];
    if (!group) return;
    const added = memberIds
      .filter(id => !group.members.some(m => m.id === id))
      .map(id => ({ id, name: displayName(peopleRef.current[id]) }));
    if (!added.length) return;
    const updated = { ...group, members: [...group.members, ...added] };
    saveGroup(updated);
    await Promise.all(added.map(m => realtime.sendDirect(m.id, { t: 'group_invite', group: updated }).catch(() => {})));
    realtime.sendGroup(groupId, { t: 'group_update', members: updated.members, name: updated.name }).catch(() => {});
    addSystemNote(groupChatKey(groupId), `You added ${added.map(m => m.name).join(', ')}`);
  }, [saveGroup, addSystemNote]);

  const leaveGroup = useCallback((groupId) => {
    const me = userRef.current;
    const group = groupsRef.current[groupId];
    if (!group) return;
    const remaining = group.members.filter(m => m.id !== me.id);
    realtime.sendGroup(groupId, { t: 'group_update', members: remaining, name: group.name, left: me.name }).catch(() => {});
    realtime.unwatchGroup(groupId);
    storage.deleteMember(groupId);
    setGroups(prev => { const next = { ...prev }; delete next[groupId]; return next; });
    setActiveChatIdState(null);
  }, []);

  /* ── Load saved data when the account changes ─────────────── */
  useEffect(() => {
    setPeople({});
    setGroups({});
    setPhoneContacts([]);
    setMessagesByChat({});
    setUnreadByChat({});
    setActiveChatIdState(null);
    seenIdsRef.current = {};
    if (!user) return;

    let cancelled = false;
    (async () => {
      const saved = await storage.getMembers();
      const grouped = await storage.getMessagesByPrefix(`${user.id}-`);
      if (cancelled) return;

      const savedPeople = {};
      const savedGroups = {};
      for (const r of saved) {
        if (r.kind === 'group') savedGroups[r.id] = r;
        else if (r.id !== user.id) savedPeople[r.id] = r;
      }
      setPeople(prev => ({ ...savedPeople, ...prev }));
      setGroups(prev => ({ ...savedGroups, ...prev }));

      const loaded = {};
      const prefix = `${user.id}-`;
      for (const [scope, msgs] of Object.entries(grouped)) {
        const chatKey = scope.slice(prefix.length);
        const seen = (seenIdsRef.current[chatKey] ||= new Set());
        loaded[chatKey] = msgs.map(({ scope: _s, ...m }) => m).filter(m => !seen.has(m.id));
        loaded[chatKey].forEach(m => seen.add(m.id));
      }
      setMessagesByChat(prev => {
        const merged = { ...prev };
        for (const [k, msgs] of Object.entries(loaded)) {
          merged[k] = [...msgs, ...(prev[k] || [])].sort((a, b) => a.timestamp - b.timestamp);
        }
        return merged;
      });

      // Known public keys let us send (and queue) messages even before we reconnect
      Object.values(savedPeople).forEach(p => { if (p.profile) realtime.profiles.set(p.id, p.profile); });
      Object.values(savedGroups).forEach(g => realtime.watchGroup(g));
      realtime.watchUsers(Object.keys(savedPeople));
      syncPhoneContacts();
    })();
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Realtime connection ──────────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    realtime.init(userRef.current);

    const unsubs = [
      realtime.on('connection_status', ({ connected }) => {
        setRealtimeConnected(connected);
        if (connected) setTimeout(retryPending, 1500);
      }),
      realtime.on('peer_ready', ({ peerId }) => setPeerId(peerId)),
      realtime.on('profile', applyProfile),
      realtime.on('profile_removed', ({ id }) => {
        if (peopleRef.current[id]) upsertPerson(id, { registered: false });
      }),

      realtime.on('direct', ({ from, pub, body }) => {
        const known = peopleRef.current[from];
        // Someone new messaged us: remember them and follow their profile
        if (!known) {
          upsertPerson(from, { source: 'chat', profile: { id: from, name: body.name || 'Kinnect user', avatar: body.avatar || '🙂', pub } });
          realtime.watchUsers([from]);
        } else if (known.profile?.pub && publicKeyFingerprint(known.profile.pub) !== publicKeyFingerprint(pub) && messagesByChatRef.current[from]?.length) {
          addSystemNote(from, `🔐 ${displayName(known)}'s security key changed. They may have reinstalled Kinnect.`);
          upsertPerson(from, p => ({ profile: { ...p.profile, pub } }));
        }

        if (body.t === 'msg') {
          const ts = body.ts || Date.now();
          const stored = storeMessage(from, {
            id: body.id, chatKey: from, senderId: from, senderName: body.name || displayName(known),
            text: body.text || '', type: body.type || 'text', time: clockTime(ts), timestamp: ts, isMe: false, status: 'received',
            ...(body.type === 'audio' ? { audio: body.audio, duration: body.duration } : {}),
          });
          if (stored || body.id) realtime.sendDirect(from, { t: 'rcpt', ids: [body.id] }, { waitMs: 3000 }).catch(() => {});
        } else if (body.t === 'rcpt') {
          setMessageStatus(from, body.ids || [], 'delivered');
        } else if (body.t === 'group_invite' && body.group?.id && body.group.key) {
          const isNew = !groupsRef.current[body.group.id];
          saveGroup(body.group);
          // Stamp the note with the invite's time so it sorts before the group's first message
          if (isNew) addSystemNote(groupChatKey(body.group.id), `${body.group.members.find(m => m.id === from)?.name || 'Someone'} added you to “${body.group.name}”`, (body.ts || Date.now()) - 1);
        }
      }),

      realtime.on('group', ({ groupId, from, body }) => {
        const chatKey = groupChatKey(groupId);
        if (body.t === 'msg') {
          const ts = body.ts || Date.now();
          storeMessage(chatKey, {
            id: body.id, chatKey, senderId: from, senderName: body.name || displayName(peopleRef.current[from]),
            text: body.text || '', type: body.type || 'text', time: clockTime(ts), timestamp: ts, isMe: false, status: 'received',
            ...(body.type === 'audio' ? { audio: body.audio, duration: body.duration } : {}),
          });
        } else if (body.t === 'group_update' && groupsRef.current[groupId]) {
          saveGroup({ ...groupsRef.current[groupId], members: body.members, name: body.name });
          if (body.left) addSystemNote(chatKey, `${body.left} left the group`);
        }
      }),

      realtime.on('incoming_call', (callData) => {
        const known = peopleRef.current[callData.caller.id];
        setIncomingCall({ ...callData, caller: { ...callData.caller, name: known ? displayName(known) : callData.caller.name, photo: known?.profile?.photo } });
      }),
      realtime.on('call_ended', () => {
        noteCallFinished();
        setActiveCall(null);
        setIncomingCall(null);
        setRemoteStream(null);
      }),
    ];

    flushFeedback(); // send any feedback that was waiting
    return () => unsubs.forEach(unsub => unsub());
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh the phone book when coming back to the app (new contacts saved meanwhile)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') syncPhoneContacts(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [syncPhoneContacts]);

  /* ── Chat list ────────────────────────────────────────────── */
  const chatList = useMemo(() => {
    const rows = [];
    for (const [key, msgs] of Object.entries(messagesByChat)) {
      if (!msgs.length) continue;
      const last = msgs[msgs.length - 1];
      if (key.startsWith('g:')) {
        const g = groups[key.slice(2)];
        if (!g) continue;
        rows.push({ key, kind: 'group', view: { id: g.id, name: g.name, emoji: g.avatar || '👥', avatarBg: '#FEF3C7', avatarColor: '#92400E' }, group: g, last, unread: unreadByChat[key] || 0 });
      } else {
        const p = people[key] || { id: key };
        rows.push({ key, kind: 'person', view: personView(p), person: p, last, unread: unreadByChat[key] || 0 });
      }
    }
    // Groups you were just added to show up even before the first message
    for (const g of Object.values(groups)) {
      const key = groupChatKey(g.id);
      if (!rows.some(r => r.key === key)) {
        rows.push({ key, kind: 'group', view: { id: g.id, name: g.name, emoji: g.avatar || '👥', avatarBg: '#FEF3C7', avatarColor: '#92400E' }, group: g, last: null, unread: 0 });
      }
    }
    return rows.sort((a, b) => (b.last?.timestamp || b.group?.createdAt || 0) - (a.last?.timestamp || a.group?.createdAt || 0));
  }, [messagesByChat, unreadByChat, people, groups]);

  // Registered people you know (phone contacts or added by number), by name
  const kinnectContacts = useMemo(() => (
    Object.values(people)
      .filter(p => p.registered && (p.source === 'contacts' || p.source === 'manual' || p.contactName))
      .map(personView)
      .sort((a, b) => a.name.localeCompare(b.name))
  ), [people]);

  // Open (or close with null) a conversation; opening marks it read
  const setActiveChatId = useCallback((chatKey) => {
    setActiveChatIdState(chatKey);
    if (chatKey) setUnreadByChat(prev => (prev[chatKey] ? { ...prev, [chatKey]: 0 } : prev));
  }, []);

  const openChat = useCallback((chatKey) => {
    setActiveTab('chats');
    setActiveChatId(chatKey);
  }, [setActiveChatId]);

  /* ── Calls ────────────────────────────────────────────────── */
  const startCall = useCallback((contact, type, activity = null) => {
    setLateCall(null);
    setActiveCall({ contact, type, activity, startTime: Date.now() });
    realtime.initiateCall({ targetContact: contact, callType: type });
  }, []);

  // Check the time where they are first; late at night, ask before ringing
  const requestCall = useCallback((contact, type, activity = null) => {
    const hour = localHourIn(contact.timezone);
    if (hour !== null && (hour >= 22 || hour < 6)) setLateCall({ contact, type, activity, hour });
    else startCall(contact, type, activity);
  }, [startCall]);

  const activeCallRef = useRef(activeCall);
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  const noteCallFinished = useCallback(() => {
    const call = activeCallRef.current;
    if (!call) return;
    const seconds = Math.round((Date.now() - call.startTime) / 1000);
    if (seconds >= 20 && !loadJson(PREFS_KEY, {}).noCallPrompt) setLastCall({ name: call.contact?.name, seconds, type: call.type });
  }, []);

  const answerIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    const known = peopleRef.current[incomingCall.caller?.id];
    const view = known ? personView(known) : {};
    setActiveCall({
      contact: {
        ...view,
        id: incomingCall.caller?.id,
        name: incomingCall.caller?.name || view.name || 'Kinnect user',
        emoji: incomingCall.caller?.avatar || view.emoji || '🙂',
        peerId: incomingCall.caller?.peerId,
      },
      type: incomingCall.callType || 'video',
      startTime: Date.now(),
      isIncoming: true,
      callData: incomingCall,
    });
    realtime.respondToCall({ callData: incomingCall, accepted: true });
    setIncomingCall(null);
  }, [incomingCall]);

  const declineIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    realtime.respondToCall({ callData: incomingCall, accepted: false });
    setIncomingCall(null);
  }, [incomingCall]);

  const endCall = useCallback(() => {
    noteCallFinished();
    if (activeCall) realtime.endCall({ callData: activeCall.callData || activeCall });
    setActiveCall(null);
    setRemoteStream(null);
  }, [activeCall]);

  const totalUnreadChats = Object.values(unreadByChat).reduce((sum, n) => sum + (n || 0), 0);

  return (
    <AppContext.Provider value={{
      user, createAccount, updateProfile, deleteAccount,
      locked, lockApp, unlockApp, enableLock, disableLock,
      realtimeConnected, peerId,
      activeTab, setActiveTab,
      people, phoneContacts, kinnectContacts, contactsStatus, syncPhoneContacts, askForContacts, addByNumber,
      groups, createGroup, addGroupMembers, leaveGroup,
      messagesByChat, chatList, activeChatId, setActiveChatId, openChat, sendMessage, totalUnreadChats,
      topics,
      activeCall, incomingCall, startCall, requestCall, answerIncomingCall, declineIncomingCall, endCall,
      lateCall, setLateCall, lastCall, setLastCall,
      feedbackOpen, openFeedback, closeFeedback: () => setFeedbackOpen(false),
      setPrefs: savePrefs,
      remoteStream, setRemoteStream,
      fontScale, setFontScale,
      selectedLanguage, setSelectedLanguage,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
export default AppContext;
