import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Send, Mic, MicOff, Phone, Video, ChevronLeft, Check, CheckCheck, Clock, AlertCircle,
  Sparkles, UserPlus, Users, Share2, Search, MessageSquarePlus, Lock, LogOut, MessageCircle,
} from 'lucide-react';
import { useApp, personView, displayName, groupChatKey } from '../context/AppContext';
import { LANGUAGES } from '../utils/languageConfig';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useBackButton } from '../hooks/useBackButton';
import { canReadContacts, openAppSettings } from '../services/contacts';
import { publicKeyFingerprint } from '../services/crypto';
import { inviteMessage, whatsappLink, smsLink, shareText } from '../utils/invite';
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

function localTimeIn(tz) {
  try { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: tz }); }
  catch { return ''; }
}

function securityCode(pub) {
  const fp = publicKeyFingerprint(pub).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 24);
  return fp.match(/.{1,4}/g)?.join(' ') || '';
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
  return prefix + m.text;
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
                  <p className="row-title">{row.view.name}</p>
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
        <a className="btn btn-green" href={whatsappLink(phone, text)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
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
function Conversation({ chatKey, onBack }) {
  const {
    user, people, groups, messagesByChat, sendMessage, startCall,
    selectedLanguage, setSelectedLanguage,
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
  const endRef = useRef(null);
  const firstScroll = useRef(true);

  const { isListening, startListening, stopListening, isSupported } = useSpeechToText(langConfig.speechCode, (finalText) => {
    setText(prev => (prev ? prev + ' ' : '') + finalText);
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: firstScroll.current ? 'auto' : 'smooth' });
    firstScroll.current = false;
  }, [messages.length]);

  function send(value = text) {
    if (!value.trim()) return;
    sendMessage(chatKey, value);
    setText('');
    setShowPrompts(false);
  }

  const canCall = !isGroup && person?.registered;
  const subtitle = isGroup
    ? (group?.members || []).map(m => (m.id === user.id ? 'You' : m.name.split(' ')[0])).join(', ')
    : (person?.registered === false && person?.phone ? 'Not on Kinnect' : '🔒 End-to-end encrypted');

  let lastDay = null;

  return (
    <div className="chat-screen animate-fadeIn">
      <div className="chat-header">
        <button className="icon-btn" onClick={close} aria-label="Back to chats"><ChevronLeft size={28} /></button>
        <button onClick={() => setShowInfo(true)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
          <Avatar person={view} size={42} />
          <div style={{ minWidth: 0 }}>
            <p className="row-title">{view.name}</p>
            <p className="row-sub" style={{ fontSize: '0.76rem' }}>{subtitle}</p>
          </div>
        </button>
        {canCall && (
          <>
            <button className="icon-btn" onClick={() => startCall(view, 'video')} aria-label="Video call"><Video size={22} color="var(--c-primary)" /></button>
            <button className="icon-btn" onClick={() => startCall(view, 'audio')} aria-label="Voice call"><Phone size={20} color="var(--c-primary)" /></button>
          </>
        )}
      </div>

      <div className="chat-messages">
        <div className="system-note" style={{ background: '#E0F2FE', color: '#075985' }}>
          <Lock size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> Messages are end-to-end encrypted. Only people in this chat can read them.
        </div>

        {messages.map(m => {
          const day = dayLabel(m.timestamp);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <React.Fragment key={m.id}>
              {showDay && <div className="day-chip">{day}</div>}
              {m.type === 'system' ? (
                <div className="system-note">{m.text}</div>
              ) : (
                <div className={`bubble-row ${m.isMe ? 'me' : 'them'}`}>
                  <div className={`bubble ${m.isMe ? 'me' : 'them'}`}>
                    {isGroup && !m.isMe && <p className="sender">{m.senderName}</p>}
                    <span className="text">{m.text}</span>
                    <span className="meta">
                      {m.time}
                      {m.isMe && <StatusIcon status={m.status} />}
                    </span>
                  </div>
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
          {isListening && (
            <div style={{ background: '#DCFCE7', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem', color: '#166534', fontWeight: 700 }}>
              <span>🎙️ Listening in {langConfig.nativeName}…</span>
              <button className="pill-btn" onClick={stopListening} style={{ padding: '4px 12px' }}>Done</button>
            </div>
          )}
          {showPrompts && (
            <div style={{ padding: '8px 10px', background: 'var(--c-card)', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {(langConfig.quickPrompts || []).map((p, i) => (
                <button key={i} className="quick-reply-pill" onClick={() => send(p)}>{p}</button>
              ))}
            </div>
          )}
          <div className="chat-composer">
            <button className="icon-btn" onClick={() => setShowPrompts(v => !v)} aria-label="Quick messages" style={{ color: showPrompts ? 'var(--c-saffron)' : undefined }}>
              <Sparkles size={21} />
            </button>
            {selectedLanguage !== 'en' && (
              <button className="icon-btn" onClick={() => setShowKeyboard(v => !v)} aria-label={`${langConfig.nativeName} keyboard`} style={{ fontSize: '1.05rem' }}>
                {langConfig.flag || '⌨️'}
              </button>
            )}
            <textarea
              className="composer-input"
              rows={1}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={isListening ? 'Listening…' : 'Message'}
            />
            {text.trim() || !isSupported ? (
              <button className="send-btn" onClick={() => send()} disabled={!text.trim()} aria-label="Send"><Send size={19} /></button>
            ) : (
              <button className="send-btn" onClick={() => (isListening ? stopListening() : startListening())} aria-label="Voice typing" style={{ background: isListening ? '#16A34A' : undefined }}>
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}
          </div>
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

      {showInfo && (isGroup
        ? <GroupInfoSheet group={group} onClose={() => setShowInfo(false)} onLeft={onBack} />
        : <ContactInfoSheet person={person} onClose={() => setShowInfo(false)} />)}
    </div>
  );
}

/* ── Contact info ─────────────────────────────────────────── */
function ContactInfoSheet({ person, onClose }) {
  const { startCall } = useApp();
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
          <button className="btn btn-ghost" onClick={() => { onClose(); startCall(view, 'audio'); }}><Phone size={18} /> Call</button>
          <button className="btn btn-ghost" onClick={() => { onClose(); startCall(view, 'video'); }}><Video size={18} /> Video</button>
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
