import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Send, Mic, Phone, Video, ChevronLeft, Check, CheckCheck, Clock, AlertCircle,
  Sparkles, UserPlus, Users, Share2, Search, MessageSquarePlus, Lock, LogOut, MessageCircle,
  Play, Pause, Trash2, Volume2, MessageSquareHeart, Reply, Copy, Image as ImageIcon,
} from 'lucide-react';
import { useApp, personView, displayName, groupChatKey, localTimeIn, differentTimeZone, tzCity, messagePreview } from '../context/AppContext';
import { resizePhoto } from '../utils/image';
import { LANGUAGES } from '../utils/languageConfig';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { speak, stopSpeaking, canSpeak } from '../utils/speech';
import { useBackButton } from '../hooks/useBackButton';
import { canReadContacts, openAppSettings } from '../services/contacts';
import { publicKeyFingerprint } from '../services/crypto';
import { inviteMessage, whatsappLink, smsLink, shareText, externalTarget } from '../utils/invite';
import { formatPhone, splitPhone } from '../utils/phone';
import NativeKeyboard from './NativeKeyboard';
import Avatar from './Avatar';
import Sheet from './Sheet';

/* ── helpers ──────────────────────────────────────────────── */

function dayLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
}

function listTime(ts) {
  if (!ts) return '';
  const label = dayLabel(ts);
  return label === 'Today' ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : label;
}

function securityCode(pub) {
  const fp = publicKeyFingerprint(pub).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 24);
  return fp.match(/.{1,4}/g)?.join(' ') || '';
}

function fmtDuration(sec = 0) {
  return `${Math.floor(sec / 60)}:${String(Math.round(sec) % 60).padStart(2, '0')}`;
}

/* Voice message bubble content */
function AudioMessage({ src, duration, mine }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 190, padding: '2px 0' }}>
      <button
        onClick={() => { const a = audioRef.current; if (!a) return; if (a.paused) a.play(); else a.pause(); }}
        aria-label={playing ? 'Pause voice message' : 'Play voice message'}
        style={{ width: 42, height: 42, minWidth: 42, borderRadius: '50%', border: 'none', cursor: 'pointer', background: mine ? '#0E7490' : '#16A34A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {playing ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ height: 5, borderRadius: 99, background: 'rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: mine ? '#0E7490' : '#16A34A' }} />
        </div>
        <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>🎙️ {fmtDuration(duration)}</p>
      </div>
      <audio
        ref={audioRef} src={src} preload="metadata"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onTimeUpdate={e => setProgress(duration ? Math.min(1, e.currentTarget.currentTime / duration) : 0)}
      />
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === 'pending') return <Clock size={12} />;
  if (status === 'failed') return <AlertCircle size={13} color="#DC2626" />;
  if (status === 'delivered') return <CheckCheck size={14} color="#0E7490" />;
  if (status === 'sent') return <Check size={14} />;
  return null;
}

function rowPreview(row, myId) {
  if (!row.last) return row.kind === 'group' ? `${row.group.members.length} members` : '';
  const m = row.last;
  if (m.type === 'system') return m.text;
  const prefix = m.isMe ? 'You: ' : (row.kind === 'group' ? `${(m.senderName || '').split(' ')[0]}: ` : '');
  return prefix + messagePreview(m);
}

/* ═══════════════════════════════════════════════════════════════
   Chat list
═══════════════════════════════════════════════════════════════ */
export default function ChatsPage() {
  const {
    user, chatList, kinnectContacts, contactsStatus, syncPhoneContacts,
    activeChatId, setActiveChatId,
  } = useApp();
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);

  const q = query.trim().toLowerCase();
  const rows = chatList.filter(r => !q || r.view.name.toLowerCase().includes(q));
  const chatted = new Set(chatList.map(r => r.key));
  const others = kinnectContacts.filter(c => !chatted.has(c.id) && (!q || c.name.toLowerCase().includes(q)));
  const needsContacts = canReadContacts && contactsStatus !== 'granted' && contactsStatus !== 'limited';

  return (
    <div className="page" style={{ paddingTop: 12, paddingBottom: 150 }}>
      <label className="search-box">
        <Search size={18} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search chats and people" />
      </label>

      {needsContacts && <ContactsAccess style={{ marginTop: 12 }} />}

      {rows.length > 0 && (
        <>
          <p className="section-label">Chats</p>
          <div className="list-card">
            {rows.map(row => (
              <button key={row.key} className="list-row" onClick={() => setActiveChatId(row.key)}>
                <Avatar person={row.view} size={52} />
                <div className="row-main">
                  <p className="row-title">
                    {row.view.name}
                    {row.kind === 'person' && differentTimeZone(row.view.timezone) && (
                      <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--c-primary)', marginLeft: 6 }}>🕒 {localTimeIn(row.view.timezone)}</span>
                    )}
                  </p>
                  <p className="row-sub" style={{ fontWeight: row.unread ? 700 : 500, color: row.unread ? 'var(--c-text-soft)' : undefined }}>
                    {row.last?.isMe && <span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 3 }}><StatusIcon status={row.last.status} /></span>}
                    {rowPreview(row, user.id)}
                  </p>
                </div>
                <div className="row-meta">
                  <span className="row-time" style={{ color: row.unread ? 'var(--c-emerald)' : undefined }}>{listTime(row.last?.timestamp)}</span>
                  {row.unread > 0 ? <span className="unread-badge">{row.unread}</span> : <span style={{ height: 20 }} />}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {others.length > 0 && (
        <>
          <p className="section-label">On Kinnect · {others.length}</p>
          <div className="list-card">
            {others.map(c => (
              <button key={c.id} className="list-row" onClick={() => setActiveChatId(c.id)}>
                <Avatar person={c} size={46} />
                <div className="row-main">
                  <p className="row-title">{c.name}</p>
                  <p className="row-sub">{c.about || 'Tap to say hello 👋'}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {rows.length === 0 && others.length === 0 && (
        <div className="empty-state" style={{ marginTop: 30 }}>
          <div className="icon">{q ? '🔍' : '💬'}</div>
          <h3>{q ? 'No matches' : 'No chats yet'}</h3>
          <p>{q ? 'Try a different name.' : 'Start a chat with someone you know, or invite them to Kinnect.'}</p>
          {!q && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowNew(true)}>
              <MessageSquarePlus size={18} /> Start a chat
            </button>
          )}
        </div>
      )}

      <FeedbackCard />

      <button className="fab" onClick={() => setShowNew(true)} aria-label="New chat">
        <MessageSquarePlus size={26} />
      </button>

      {showNew && (
        <NewChatSheet
          onClose={() => setShowNew(false)}
          onOpen={(key) => { setShowNew(false); setTimeout(() => setActiveChatId(key), 50); }}
        />
      )}

      {activeChatId && createPortal(
        <Conversation key={activeChatId} chatKey={activeChatId} onBack={() => setActiveChatId(null)} />,
        document.body
      )}
    </div>
  );
}

/* Testing phase: keep the feedback form one tap away */
function FeedbackCard() {
  const { openFeedback } = useApp();
  return (
    <div className="notice" style={{ marginTop: 22, background: '#FDF2F8', borderColor: '#FBCFE8', color: '#9D174D', alignItems: 'center' }}>
      <MessageSquareHeart size={26} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}><strong>You are trying an early Kinnect.</strong> Tell us what you like and what to fix.</span>
      <button className="btn btn-sm" style={{ background: '#DB2777', color: '#fff' }} onClick={openFeedback}>Feedback</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   New chat / group / add by number / invite
═══════════════════════════════════════════════════════════════ */
function NewChatSheet({ onClose, onOpen }) {
  const { user, kinnectContacts, phoneContacts, people, addByNumber, createGroup, contactsStatus, syncPhoneContacts } = useApp();
  const [mode, setMode] = useState('main'); // main | number | group | invite
  const [query, setQuery] = useState('');
  const [inviteTarget, setInviteTarget] = useState(null);

  // number mode
  const { cc } = splitPhone(user.phone);
  const [number, setNumber] = useState('');
  const [numberName, setNumberName] = useState('');
  const [numberResult, setNumberResult] = useState(null);
  const [busy, setBusy] = useState(false);

  // group mode
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState([]);

  const q = query.trim().toLowerCase();
  const onKinnect = kinnectContacts.filter(c => !q || c.name.toLowerCase().includes(q));
  const notOnKinnect = phoneContacts
    .filter(c => !people[c.id]?.registered)
    .filter(c => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q.replace(/\D/g, '') || '§'));

  async function findNumber() {
    setBusy(true);
    setNumberResult(null);
    const r = await addByNumber(number.trim().startsWith('+') ? number : `+${cc}${number.replace(/\D/g, '').replace(/^0+/, '')}`, numberName);
    setBusy(false);
    if (r.error) setNumberResult({ error: r.error });
    else if (r.registered) onOpen(r.id);
    else setNumberResult(r);
  }

  if (mode === 'invite' && inviteTarget) {
    return (
      <Sheet title={`Invite ${inviteTarget.name.split(' ')[0]}`} onClose={onClose} onBack={() => setMode(numberResult ? 'number' : 'main')}>
        <InviteActions name={inviteTarget.name} phone={inviteTarget.phone} />
      </Sheet>
    );
  }

  if (mode === 'number') {
    return (
      <Sheet title="Chat with a number" onClose={onClose} onBack={() => setMode('main')}>
        <label className="field-label">Mobile number</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="input" style={{ width: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>+{cc}</div>
          <input className="input" type="tel" inputMode="tel" autoFocus value={number} onChange={e => { setNumber(e.target.value); setNumberResult(null); }} placeholder="98765 43210" />
        </div>
        <label className="field-label" style={{ marginTop: 14 }}>Name (optional)</label>
        <input className="input" value={numberName} onChange={e => setNumberName(e.target.value)} placeholder="How you know them" />

        {numberResult?.error && <p style={{ color: 'var(--c-red)', fontSize: '0.88rem', marginTop: 12 }}>{numberResult.error}</p>}
        {numberResult && !numberResult.error && (
          <div className="notice" style={{ marginTop: 16, flexDirection: 'column', gap: 10 }}>
            <span><strong>{formatPhone(numberResult.phone)}</strong> isn't on Kinnect yet. Invite them and you'll be able to chat once they join.</span>
            <button className="btn btn-primary btn-sm" onClick={() => { setInviteTarget({ name: numberName || formatPhone(numberResult.phone), phone: numberResult.phone }); setMode('invite'); }}>
              <Share2 size={16} /> Invite
            </button>
          </div>
        )}

        <button className="btn btn-primary btn-full" style={{ marginTop: 18 }} disabled={busy || number.replace(/\D/g, '').length < 6} onClick={findNumber}>
          {busy ? 'Looking…' : 'Find on Kinnect'}
        </button>
      </Sheet>
    );
  }

  if (mode === 'group') {
    const ready = groupName.trim() && selected.length > 0;
    return (
      <Sheet
        title="New group"
        onClose={onClose}
        onBack={() => setMode('main')}
        full
        footer={
          <button className="btn btn-primary btn-full" disabled={!ready || busy} style={{ opacity: ready ? 1 : 0.5 }}
            onClick={async () => { setBusy(true); const g = await createGroup(groupName, selected); onOpen(groupChatKey(g.id)); }}>
            {busy ? 'Creating…' : `Create group${selected.length ? ` · ${selected.length + 1} people` : ''}`}
          </button>
        }
      >
        <label className="field-label">Group name</label>
        <input className="input" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Sharma Family, Book Club" maxLength={40} autoFocus />
        <p className="section-label">Add people · {selected.length} selected</p>
        {kinnectContacts.length === 0 ? (
          <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem' }}>None of your contacts are on Kinnect yet. Invite them first.</p>
        ) : (
          <PeoplePicker people={kinnectContacts} selected={selected} onChange={setSelected} />
        )}
      </Sheet>
    );
  }

  return (
    <Sheet title="New chat" onClose={onClose} full>
      <div className="list-card" style={{ border: 'none' }}>
        {[
          [Users, 'New group', () => setMode('group')],
          [UserPlus, 'Chat with a number', () => setMode('number')],
          [Share2, 'Invite a friend to Kinnect', () => shareText(inviteMessage(user.name))],
        ].map(([Icon, label, action]) => (
          <button key={label} className="list-row" onClick={action}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--c-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} />
            </div>
            <span className="row-title">{label}</span>
          </button>
        ))}
      </div>

      <label className="search-box" style={{ marginTop: 12 }}>
        <Search size={18} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or number" />
      </label>

      {canReadContacts && contactsStatus !== 'granted' && contactsStatus !== 'limited' && (
        <ContactsAccess style={{ marginTop: 12 }} />
      )}

      <p className="section-label">On Kinnect · {onKinnect.length}</p>
      {onKinnect.length === 0 && <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem', padding: '0 4px' }}>No one yet. Invite people below, or chat with a number.</p>}
      {onKinnect.map(c => (
        <button key={c.id} className="list-row" onClick={() => onOpen(c.id)}>
          <Avatar person={c} size={44} />
          <div className="row-main">
            <p className="row-title">{c.name}</p>
            {c.about && <p className="row-sub">{c.about}</p>}
          </div>
        </button>
      ))}

      {notOnKinnect.length > 0 && (
        <>
          <p className="section-label">Invite to Kinnect</p>
          {notOnKinnect.slice(0, 200).map(c => (
            <div key={c.id} className="list-row" style={{ cursor: 'default' }}>
              <Avatar person={{ id: c.id, emoji: c.name.slice(0, 1).toUpperCase() || '🙂' }} size={44} />
              <div className="row-main">
                <p className="row-title">{c.name}</p>
                <p className="row-sub">{formatPhone(c.phone)}</p>
              </div>
              <button className="pill-btn" onClick={() => { setInviteTarget(c); setMode('invite'); }}>Invite</button>
            </div>
          ))}
        </>
      )}
    </Sheet>
  );
}

/* "Allow contacts" prompt. If Android won't show the dialog (it was refused before),
   explain how to turn it on and offer a shortcut to Kinnect's settings page. */
export function ContactsAccess({ style }) {
  const { askForContacts, syncPhoneContacts } = useApp();
  const [state, setState] = useState('idle'); // idle | asking | denied
  const waitingForSettings = useRef(false);

  // Coming back from the settings page → check again
  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState !== 'visible' || !waitingForSettings.current) return;
      waitingForSettings.current = false;
      await syncPhoneContacts();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [syncPhoneContacts]);

  if (state === 'denied') {
    return (
      <div className="notice" style={{ flexDirection: 'column', gap: 10, background: '#FFF7ED', borderColor: '#FED7AA', color: '#9A3412', ...style }}>
        <span><strong>Contacts access is off.</strong> To turn it on: tap <strong>Open settings</strong> → <strong>Permissions</strong> → <strong>Contacts</strong> → <strong>Allow</strong>, then come back.</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => { waitingForSettings.current = true; openAppSettings(); }}>Open settings</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setState('idle')}>Not now</button>
        </div>
      </div>
    );
  }

  return (
    <div className="notice" style={{ alignItems: 'center', ...style }}>
      <span style={{ fontSize: '1.5rem' }}>📇</span>
      <span style={{ flex: 1 }}>See which of your contacts are on Kinnect.</span>
      <button className="btn btn-primary btn-sm" disabled={state === 'asking'} onClick={async () => {
        setState('asking');
        const r = await askForContacts();
        setState(r.status === 'granted' ? 'idle' : 'denied');
      }}>
        {state === 'asking' ? 'Checking…' : 'Allow'}
      </button>
    </div>
  );
}

function PeoplePicker({ people, selected, onChange }) {
  return people.map(c => {
    const on = selected.includes(c.id);
    return (
      <button key={c.id} className="list-row" onClick={() => onChange(on ? selected.filter(id => id !== c.id) : [...selected, c.id])}>
        <Avatar person={c} size={44} />
        <span className="row-main row-title">{c.name}</span>
        <span style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${on ? 'var(--c-emerald)' : 'var(--c-border)'}`,
          background: on ? 'var(--c-emerald)' : 'transparent', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{on && <Check size={16} />}</span>
      </button>
    );
  });
}

export function InviteActions({ name, phone }) {
  const { user } = useApp();
  const [note, setNote] = useState('');
  const text = inviteMessage(user.name);
  return (
    <div>
      <p style={{ color: 'var(--c-text-soft)', lineHeight: 1.5, marginBottom: 14 }}>
        Send {name.split(' ')[0]} a link to get Kinnect. Once they register with {formatPhone(phone)}, they'll appear in your chats.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <a className="btn btn-green" href={whatsappLink(phone, text)} target={externalTarget} rel="noreferrer" style={{ textDecoration: 'none' }}>
          <MessageCircle size={18} /> WhatsApp
        </a>
        <a className="btn btn-ghost" href={smsLink(phone, text)} style={{ textDecoration: 'none' }}>✉️ SMS</a>
      </div>
      <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={async () => { if ((await shareText(text)) === 'copied') setNote('Invite copied'); }}>
        <Share2 size={18} /> Share another way
      </button>
      {note && <p style={{ textAlign: 'center', color: 'var(--c-emerald)', marginTop: 8, fontSize: '0.86rem' }}>{note}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Conversation
═══════════════════════════════════════════════════════════════ */
function lastSeenText(ts) {
  if (!ts) return '';
  const ago = Date.now() - ts;
  if (ago < 90000) return 'online';
  const d = new Date(ts);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const day = dayLabel(ts);
  return `last seen ${day === 'Today' ? 'today' : day === 'Yesterday' ? 'yesterday' : day} at ${time}`;
}

const QUICK_REACTIONS = ['❤️', '😂', '👍', '🙏', '😮', '😢'];

/* Photo inside a bubble; tap to view full screen */
function ImageMessage({ m, onOpen }) {
  const ratio = m.imgW && m.imgH ? m.imgH / m.imgW : 0.75;
  return (
    <button onClick={(e) => { e.stopPropagation(); onOpen(m.image); }} aria-label="Open photo"
      style={{ display: 'block', padding: 0, border: 'none', background: '#E2E8F0', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', width: 230, maxWidth: '100%', aspectRatio: `1 / ${Math.min(1.6, Math.max(0.5, ratio))}`, marginBottom: m.text ? 4 : 0 }}>
      <img src={m.image} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </button>
  );
}

function ImageViewer({ src, onClose }) {
  const close = useBackButton(onClose);
  return createPortal(
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={src} alt="Photo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      <button className="icon-btn" onClick={close} aria-label="Close photo" style={{ position: 'absolute', top: 'calc(12px + env(safe-area-inset-top, 0px))', right: 12, color: '#fff', background: 'rgba(255,255,255,0.15)' }}>✕</button>
    </div>,
    document.body
  );
}

/* Reply, react, copy, read aloud, delete */
function MessageActions({ m, onClose, onReply, onReact, onDelete, onRead }) {
  const [copied, setCopied] = useState(false);
  return (
    <Sheet title="Message" onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, padding: '4px 0 12px' }}>
        {QUICK_REACTIONS.map(e => (
          <button key={e} onClick={() => { onReact(e); onClose(); }} aria-label={`React ${e}`}
            style={{ width: 50, height: 50, borderRadius: '50%', border: 'none', background: 'var(--c-surface)', fontSize: '1.6rem', cursor: 'pointer' }}>{e}</button>
        ))}
      </div>
      <button className="setting-row" onClick={() => { onReply(); onClose(); }}><Reply size={21} /> <span className="label">Reply</span></button>
      {m.text && (
        <button className="setting-row" onClick={async () => { try { await navigator.clipboard.writeText(m.text); setCopied(true); setTimeout(onClose, 500); } catch (_) {} }}>
          <Copy size={21} /> <span className="label">{copied ? 'Copied ✓' : 'Copy text'}</span>
        </button>
      )}
      {!m.isMe && m.text && canSpeak && (
        <button className="setting-row" onClick={() => { onRead(); onClose(); }}><Volume2 size={21} /> <span className="label">Read aloud</span></button>
      )}
      {m.isMe && (
        <button className="setting-row" style={{ color: 'var(--c-red)' }} onClick={() => { if (window.confirm('Delete this message for everyone?')) { onDelete(); onClose(); } }}>
          <Trash2 size={21} /> <span className="label">Delete for everyone</span>
        </button>
      )}
    </Sheet>
  );
}

function Conversation({ chatKey, onBack }) {
  const {
    user, people, groups, messagesByChat, sendMessage, requestCall, startGroupCall,
    selectedLanguage, setSelectedLanguage,
    reactToMessage, deleteMessage, sendTyping, typingByChat, presence, shareLastSeen,
  } = useApp();
  const close = useBackButton(onBack);
  const isGroup = chatKey.startsWith('g:');
  const group = isGroup ? groups[chatKey.slice(2)] : null;
  const person = isGroup ? null : (people[chatKey] || { id: chatKey });
  const view = isGroup
    ? { id: group?.id, name: group?.name || 'Group', emoji: group?.avatar || '👥', avatarBg: '#FEF3C7' }
    : personView(person);
  const messages = messagesByChat[chatKey] || [];

  const langConfig = LANGUAGES[selectedLanguage] || LANGUAGES.en;
  const [text, setText] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [selected, setSelected] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [, tick] = useState(0);
  const endRef = useRef(null);
  const firstScroll = useRef(true);
  const fileRef = useRef(null);

  const [readingId, setReadingId] = useState(null);
  const recorder = useVoiceRecorder(({ audio, duration }) => {
    sendMessage(chatKey, '', 'audio', { audio, duration, ...(replyTo ? { replyTo } : {}) });
    setReplyTo(null);
  });

  useEffect(() => () => { stopSpeaking(); }, []);
  // Re-render every few seconds so "typing…" and "online" expire on time
  useEffect(() => { const t = setInterval(() => tick(n => n + 1), 3000); return () => clearInterval(t); }, []);

  async function readAloud(m) {
    if (readingId === m.id) { stopSpeaking(); setReadingId(null); return; }
    setReadingId(m.id);
    await speak(m.text, langConfig.speechCode);
    setReadingId(id => (id === m.id ? null : id));
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: firstScroll.current ? 'auto' : 'smooth' });
    firstScroll.current = false;
  }, [messages.length]);

  function send(value = text) {
    if (!value.trim()) return;
    sendMessage(chatKey, value, 'text', replyTo ? { replyTo } : {});
    setText('');
    setReplyTo(null);
    setShowPrompts(false);
  }

  async function sendPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { dataUrl, width, height } = await resizePhoto(file);
      sendMessage(chatKey, text.trim(), 'image', { image: dataUrl, imgW: width, imgH: height, ...(replyTo ? { replyTo } : {}) });
      setText('');
      setReplyTo(null);
      setPhotoError('');
    } catch {
      setPhotoError('Could not send that photo. Please try another one.');
    }
  }

  function startReply(m) {
    setReplyTo({ id: m.id, name: m.isMe ? 'You' : (m.senderName || view.name), text: messagePreview(m).slice(0, 120) });
  }

  const canCall = !isGroup && person?.registered;
  const theirTz = person?.profile?.tz;
  const typing = typingByChat[chatKey];
  const status = typing && typing.until > Date.now()
    ? (isGroup ? `${(typing.name || '').split(' ')[0]} is typing…` : 'typing…')
    : isGroup
      ? (group?.members || []).map(m => (m.id === user.id ? 'You' : m.name.split(' ')[0])).join(', ')
      : person?.registered === false && person?.phone ? 'Not on Kinnect'
      : [shareLastSeen ? lastSeenText(presence[chatKey]) : '', differentTimeZone(theirTz) ? `🕒 ${localTimeIn(theirTz)} ${tzCity(theirTz)}` : '']
        .filter(Boolean).join(' · ') || '🔒 End-to-end encrypted';

  let lastDay = null;

  return (
    <div className="chat-screen animate-fadeIn">
      <div className="chat-header">
        <button className="icon-btn" onClick={close} aria-label="Back to chats"><ChevronLeft size={28} /></button>
        <button onClick={() => setShowInfo(true)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
          <Avatar person={view} size={42} />
          <div style={{ minWidth: 0 }}>
            <p className="row-title">{view.name}</p>
            <p className="row-sub" style={{ fontSize: '0.78rem', color: status.startsWith('typing') || status.endsWith('typing…') || status.startsWith('online') ? 'var(--c-emerald)' : undefined }}>{status}</p>
          </div>
        </button>
        {canCall && (
          <>
            <button className="icon-btn" onClick={() => requestCall(view, 'video')} aria-label="Video call"><Video size={23} color="var(--c-primary)" /></button>
            <button className="icon-btn" onClick={() => requestCall(view, 'audio')} aria-label="Voice call"><Phone size={21} color="var(--c-primary)" /></button>
          </>
        )}
        {isGroup && group && group.members.length <= 4 && (
          <>
            <button className="icon-btn" onClick={() => startGroupCall(group, 'video')} aria-label="Group video call"><Video size={23} color="var(--c-primary)" /></button>
            <button className="icon-btn" onClick={() => startGroupCall(group, 'audio')} aria-label="Group voice call"><Phone size={21} color="var(--c-primary)" /></button>
          </>
        )}
      </div>

      <div className="chat-messages">
        <div className="system-note" style={{ background: '#E0F2FE', color: '#075985' }}>
          <Lock size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> Messages are end-to-end encrypted. Tap a message to reply or react.
        </div>

        {messages.map(m => {
          const day = dayLabel(m.timestamp);
          const showDay = day !== lastDay;
          lastDay = day;
          const reactions = Object.values(m.reactions || {});
          const counts = reactions.reduce((acc, e) => ({ ...acc, [e]: (acc[e] || 0) + 1 }), {});
          return (
            <React.Fragment key={m.id}>
              {showDay && <div className="day-chip">{day}</div>}
              {m.type === 'system' ? (
                <div className="system-note">{m.text}</div>
              ) : (
                <div className={`bubble-row ${m.isMe ? 'me' : 'them'}`}>
                  <div className={`bubble ${m.isMe ? 'me' : 'them'}`} onClick={() => !m.deleted && setSelected(m)} style={{ cursor: m.deleted ? 'default' : 'pointer' }}>
                    {isGroup && !m.isMe && <p className="sender">{m.senderName}</p>}
                    {m.deleted ? (
                      <span className="text" style={{ fontStyle: 'italic', color: '#64748B' }}>🚫 This message was deleted</span>
                    ) : (
                      <>
                        {m.replyTo && (
                          <div className="reply-quote">
                            <strong>{m.replyTo.name}</strong>
                            <span>{m.replyTo.text}</span>
                          </div>
                        )}
                        {m.type === 'image' && <ImageMessage m={m} onOpen={setViewing} />}
                        {(m.type === 'audio' || m.type === 'story') && (
                          <>
                            {m.type === 'story' && <p style={{ fontWeight: 700, marginBottom: 4 }}>📖 {m.title}</p>}
                            <AudioMessage src={m.audio} duration={m.duration} mine={m.isMe} />
                          </>
                        )}
                        {m.text && m.type !== 'audio' && <span className="text">{m.text}</span>}
                      </>
                    )}
                    <span className="meta">
                      {!m.isMe && m.type === 'text' && !m.deleted && canSpeak && (
                        <button onClick={(e) => { e.stopPropagation(); readAloud(m); }} aria-label="Read aloud" style={{ background: 'none', border: 'none', padding: '0 4px 0 0', cursor: 'pointer', color: readingId === m.id ? 'var(--c-primary)' : '#94A3B8', display: 'inline-flex' }}>
                          <Volume2 size={15} />
                        </button>
                      )}
                      {m.time}
                      {m.isMe && <StatusIcon status={m.status} />}
                    </span>
                  </div>
                  {reactions.length > 0 && (
                    <div className="reaction-pill">
                      {Object.entries(counts).map(([e, n]) => <span key={e}>{e}{n > 1 ? n : ''}</span>)}
                    </div>
                  )}
                  {m.isMe && m.status === 'failed' && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--c-red)', marginTop: 2 }}>Not delivered: {view.name.split(' ')[0]} isn't on Kinnect</span>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
        <div ref={endRef} />
      </div>

      {person && person.registered === false && person.phone ? (
        <div style={{ padding: '14px 16px calc(14px + env(safe-area-inset-bottom, 0px))', background: 'var(--c-card)', borderTop: '1px solid var(--c-border)' }}>
          <InviteActions name={view.name} phone={person.phone} />
        </div>
      ) : (
        <>
          {(recorder.error || photoError) && (
            <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '8px 14px', fontSize: '0.85rem' }}>{recorder.error || photoError}</div>
          )}
          {replyTo && (
            <div className="reply-bar">
              <Reply size={18} color="var(--c-primary)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: 'var(--c-primary)', fontSize: '0.84rem' }}>Replying to {replyTo.name}</p>
                <p className="row-sub">{replyTo.text}</p>
              </div>
              <button className="icon-btn" onClick={() => setReplyTo(null)} aria-label="Cancel reply">✕</button>
            </div>
          )}
          {showPrompts && !recorder.recording && (
            <div style={{ padding: '8px 10px', background: 'var(--c-card)', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {(langConfig.quickPrompts || []).map((p, i) => (
                <button key={i} className="quick-reply-pill" onClick={() => send(p)}>{p}</button>
              ))}
            </div>
          )}
          {recorder.recording ? (
            /* Recording a voice message: big, simple buttons */
            <div className="chat-composer" style={{ alignItems: 'center' }}>
              <button className="icon-btn" onClick={recorder.cancel} aria-label="Cancel recording" style={{ color: 'var(--c-red)' }}><Trash2 size={22} /></button>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: 'var(--c-text)' }}>
                <span className="rec-dot" />
                Recording {fmtDuration(recorder.seconds)}
                <span style={{ fontWeight: 500, color: 'var(--c-muted)', fontSize: '0.8rem' }}>max 1 min</span>
              </div>
              <button className="send-btn" onClick={recorder.send} aria-label="Send voice message" style={{ width: 52, height: 52 }}><Send size={21} /></button>
            </div>
          ) : (
            <div className="chat-composer">
              <button className="icon-btn" onClick={() => setShowPrompts(v => !v)} aria-label="Quick messages" style={{ color: showPrompts ? 'var(--c-saffron)' : undefined }}>
                <Sparkles size={21} />
              </button>
              <button className="icon-btn" onClick={() => fileRef.current?.click()} aria-label="Send a photo">
                <ImageIcon size={22} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={sendPhoto} style={{ display: 'none' }} />
              {selectedLanguage !== 'en' && (
                <button className="icon-btn" onClick={() => setShowKeyboard(v => !v)} aria-label={`${langConfig.nativeName} keyboard`} style={{ fontSize: '1.05rem' }}>
                  {langConfig.flag || '⌨️'}
                </button>
              )}
              <textarea
                className="composer-input"
                rows={1}
                value={text}
                onChange={e => { setText(e.target.value); if (e.target.value) sendTyping(chatKey); }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Message"
              />
              {text.trim() || !recorder.supported ? (
                <button className="send-btn" onClick={() => send()} disabled={!text.trim()} aria-label="Send"><Send size={19} /></button>
              ) : (
                <button className="send-btn" onClick={recorder.start} aria-label="Record voice message"><Mic size={21} /></button>
              )}
            </div>
          )}
          {showKeyboard && (
            <NativeKeyboard
              languageCode={selectedLanguage}
              onKeyPress={(ch) => setText(prev => prev + ch)}
              onBackspace={() => setText(prev => prev.slice(0, -1))}
              onSpace={() => setText(prev => prev + ' ')}
              onClear={() => setText('')}
              onClose={() => setShowKeyboard(false)}
              onChangeLanguage={setSelectedLanguage}
            />
          )}
        </>
      )}

      {selected && (
        <MessageActions
          m={selected}
          onClose={() => setSelected(null)}
          onReply={() => startReply(selected)}
          onReact={(e) => reactToMessage(chatKey, selected.id, e)}
          onDelete={() => deleteMessage(chatKey, selected.id)}
          onRead={() => readAloud(selected)}
        />
      )}
      {viewing && <ImageViewer src={viewing} onClose={() => setViewing(null)} />}

      {showInfo && (isGroup
        ? <GroupInfoSheet group={group} onClose={() => setShowInfo(false)} onLeft={onBack} />
        : <ContactInfoSheet person={person} onClose={() => setShowInfo(false)} />)}
    </div>
  );
}

/* ── Contact info ─────────────────────────────────────────── */
function ContactInfoSheet({ person, onClose }) {
  const { requestCall } = useApp();
  const view = personView(person);
  const code = securityCode(person.profile?.pub);

  return (
    <Sheet title="Contact info" onClose={onClose}>
      <div style={{ textAlign: 'center' }}>
        <Avatar person={view} size={96} style={{ margin: '4px auto 10px' }} />
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{view.name}</h3>
        {person.contactName && person.profile?.name && person.profile.name !== person.contactName && (
          <p style={{ color: 'var(--c-muted)', fontSize: '0.88rem' }}>~{person.profile.name}</p>
        )}
        {person.phone && <p style={{ color: 'var(--c-muted)', marginTop: 2 }}>{formatPhone(person.phone)}</p>}
        {view.about && <p style={{ marginTop: 8, color: 'var(--c-text-soft)' }}>{view.about}</p>}
      </div>

      {person.registered && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
          <button className="btn btn-ghost" onClick={() => { onClose(); requestCall(view, 'audio'); }}><Phone size={18} /> Call</button>
          <button className="btn btn-ghost" onClick={() => { onClose(); requestCall(view, 'video'); }}><Video size={18} /> Video</button>
        </div>
      )}

      {person.profile?.tz && (
        <div className="setting-row" style={{ cursor: 'default', marginTop: 14 }}>
          <Clock size={20} color="var(--c-primary)" />
          <span className="label">Their local time<span className="hint">{person.profile.tz.replace(/_/g, ' ')}</span></span>
          <strong>{localTimeIn(person.profile.tz)}</strong>
        </div>
      )}
      {code && (
        <div className="setting-row" style={{ cursor: 'default' }}>
          <Lock size={20} color="var(--c-emerald)" />
          <span className="label">
            Encrypted
            <span className="hint">Security code: <span style={{ fontFamily: 'monospace' }}>{code}</span>. Compare it on both phones to be sure you're talking to the right person.</span>
          </span>
        </div>
      )}
    </Sheet>
  );
}

/* ── Group info ───────────────────────────────────────────── */
function GroupInfoSheet({ group, onClose, onLeft }) {
  const { user, people, kinnectContacts, addGroupMembers, leaveGroup } = useApp();
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState([]);
  if (!group) return null;

  const candidates = kinnectContacts.filter(c => !group.members.some(m => m.id === c.id));

  if (adding) {
    return (
      <Sheet title="Add people" onClose={onClose} onBack={() => setAdding(false)} full
        footer={<button className="btn btn-primary btn-full" disabled={!selected.length} onClick={async () => { await addGroupMembers(group.id, selected); setAdding(false); setSelected([]); }}>Add {selected.length || ''}</button>}>
        {candidates.length ? <PeoplePicker people={candidates} selected={selected} onChange={setSelected} />
          : <p style={{ color: 'var(--c-muted)' }}>Everyone you know on Kinnect is already in this group.</p>}
      </Sheet>
    );
  }

  return (
    <Sheet title="Group info" onClose={onClose}>
      <div style={{ textAlign: 'center' }}>
        <Avatar person={{ id: group.id, emoji: group.avatar || '👥', avatarBg: '#FEF3C7' }} size={88} style={{ margin: '4px auto 10px' }} />
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{group.name}</h3>
        <p style={{ color: 'var(--c-muted)' }}>{group.members.length} members</p>
      </div>
      <p className="section-label">Members</p>
      <button className="list-row" onClick={() => setAdding(true)}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--c-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserPlus size={20} /></div>
        <span className="row-title">Add people</span>
      </button>
      {group.members.map(m => {
        const p = people[m.id];
        const v = m.id === user.id ? { ...user, emoji: user.avatar } : (p ? personView(p) : { id: m.id, name: m.name, emoji: '🙂' });
        return (
          <div key={m.id} className="list-row" style={{ cursor: 'default' }}>
            <Avatar person={v} size={44} />
            <span className="row-main row-title">{m.id === user.id ? 'You' : (p ? displayName(p) : m.name)}</span>
            {m.id === group.createdBy && <span className="badge badge-teal">Admin</span>}
          </div>
        );
      })}
      <button className="setting-row" style={{ color: 'var(--c-red)', marginTop: 10 }}
        onClick={() => { if (window.confirm(`Leave “${group.name}”?`)) { leaveGroup(group.id); onClose(); onLeft(); } }}>
        <LogOut size={20} /> <span className="label">Leave group</span>
      </button>
    </Sheet>
  );
}
