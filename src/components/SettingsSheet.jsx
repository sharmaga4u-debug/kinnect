import React, { useRef, useState } from 'react';
import { Camera, Lock, Languages, Type, Share2, MessageSquareHeart, Trash2, ShieldCheck, Contact, Pencil, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../utils/languageConfig';
import { resizeImageToDataUrl } from '../utils/image';
import { formatPhone } from '../utils/phone';
import { inviteMessage, shareText } from '../utils/invite';
import { canReadContacts, requestContactsPermission } from '../services/contacts';
import { checkPin } from '../utils/pin';
import { APP_VERSION } from '../services/feedback';
import Avatar from './Avatar';
import Sheet from './Sheet';
import { CreatePin, PinPad, LOCK_BG } from './LockScreen';

export default function SettingsSheet({ onClose, onFeedback }) {
  const {
    user, updateProfile, deleteAccount, enableLock, disableLock,
    selectedLanguage, setSelectedLanguage, fontScale, setFontScale,
    contactsStatus, syncPhoneContacts, kinnectContacts,
  } = useApp();
  const fileRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [about, setAbout] = useState(user.about || '');
  const [pinMode, setPinMode] = useState(null); // 'create' | 'confirm-off'
  const [note, setNote] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { updateProfile({ photo: await resizeImageToDataUrl(file) }); }
    catch { setNote('Could not use that photo, please try another one.'); }
  }

  // Full-screen PIN pad for turning the lock on or off
  if (pinMode) {
    return (
      <div style={{ ...LOCK_BG, zIndex: 300 }}>
        {pinMode === 'create' ? (
          <CreatePin
            person={{ ...user, emoji: user.avatar }}
            userId={user.id}
            title="Choose a 4-digit PIN"
            onDone={(pinHash) => { enableLock(pinHash); setPinMode(null); }}
            footer={<button onClick={() => setPinMode(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', textDecoration: 'underline', cursor: 'pointer' }}>Cancel</button>}
          />
        ) : (
          <PinPad
            person={{ ...user, emoji: user.avatar }}
            title="Enter your PIN"
            subtitle="to turn off app lock"
            onComplete={async (pin) => {
              const ok = await checkPin(user, pin);
              if (ok) { disableLock(); setPinMode(null); }
              return ok;
            }}
            footer={<button onClick={() => setPinMode(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', textDecoration: 'underline', cursor: 'pointer' }}>Cancel</button>}
          />
        )}
      </div>
    );
  }

  if (showPrivacy) {
    return (
      <Sheet title="Privacy & security" onClose={onClose} onBack={() => setShowPrivacy(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, color: 'var(--c-text-soft)', lineHeight: 1.55, fontSize: '0.94rem' }}>
          <p><strong>🔒 End-to-end encryption.</strong> Your phone creates its own secret key when you register. Messages, group chats and call set-up are encrypted on your phone and can only be opened on the phones you're talking to. The server that relays them only sees scrambled data.</p>
          <p><strong>📇 Contacts stay on your phone.</strong> Kinnect turns each number into a one-way code on your phone to check who's registered. Your address book is never uploaded.</p>
          <p><strong>📞 Calls</strong> go directly between phones where possible and are encrypted by WebRTC.</p>
          <p><strong>👤 What others can see:</strong> your name, photo and time zone, and only to people who already have your number.</p>
          <p><strong>🔢 Security codes.</strong> Open a contact's info to see your shared security code. If it matches on both phones, no one is in the middle.</p>
          <p style={{ fontSize: '0.84rem', color: 'var(--c-muted)' }}>Kinnect is in early testing. Numbers aren't verified by SMS yet, so check the security code before sharing anything sensitive.</p>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title="Settings" onClose={onClose}>
      {/* Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 14 }}>
        <button onClick={() => fileRef.current?.click()} style={{ position: 'relative', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }} aria-label="Change photo">
          <Avatar person={{ ...user, emoji: user.avatar }} size={72} />
          <span style={{ position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: '50%', background: 'var(--c-primary)', border: '2px solid #fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={14} />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        {editing ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input className="input" value={name} onChange={e => setName(e.target.value)} maxLength={40} style={{ minHeight: 42 }} placeholder="Your name" />
            <input className="input" value={about} onChange={e => setAbout(e.target.value)} maxLength={80} style={{ minHeight: 42 }} placeholder="About (e.g. Living in Pune)" />
            <button className="btn btn-primary btn-sm" disabled={!name.trim()} onClick={() => { updateProfile({ name: name.trim(), about: about.trim() }); setEditing(false); }}>Save</button>
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="row-title" style={{ fontSize: '1.15rem' }}>{user.name}</p>
            <p className="row-sub">{formatPhone(user.phone)}</p>
            {user.about && <p className="row-sub">{user.about}</p>}
          </div>
        )}
        {!editing && <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Edit profile"><Pencil size={18} /></button>}
      </div>
      {user.photo && !editing && (
        <button onClick={() => updateProfile({ photo: '' })} style={{ background: 'none', border: 'none', color: 'var(--c-muted)', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer', marginBottom: 8 }}>
          Remove photo
        </button>
      )}

      {/* App lock */}
      <label className="setting-row">
        <Lock size={21} color="var(--c-text-soft)" />
        <span className="label">App lock<span className="hint">Ask for a PIN when Kinnect opens</span></span>
        <span className="switch">
          <input type="checkbox" checked={!!user.pinHash} onChange={() => setPinMode(user.pinHash ? 'confirm-off' : 'create')} />
          <span />
        </span>
      </label>

      {/* Contacts */}
      {canReadContacts && (
        <button className="setting-row" onClick={async () => {
          if (contactsStatus !== 'granted') await requestContactsPermission();
          await syncPhoneContacts();
          setNote('Contacts refreshed');
        }}>
          <Contact size={21} color="var(--c-primary)" />
          <span className="label">
            {contactsStatus === 'granted' ? 'Refresh contacts' : 'Allow contacts'}
            <span className="hint">{contactsStatus === 'granted' ? `${kinnectContacts.length} of your contacts are on Kinnect` : 'Find people you know'}</span>
          </span>
          <ChevronRight size={18} color="var(--c-muted)" />
        </button>
      )}

      {/* Language */}
      <div className="setting-row" style={{ cursor: 'default' }}>
        <Languages size={21} color="var(--c-primary)" />
        <span className="label">Language<span className="hint">For voice typing & quick messages</span></span>
        <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)}
          style={{ fontSize: '0.9rem', fontWeight: 700, borderRadius: 10, padding: '6px 8px', border: '1.5px solid var(--c-border)', background: 'var(--c-card)', color: 'var(--c-text)', maxWidth: 130 }}>
          {Object.values(LANGUAGES).map(l => <option key={l.code} value={l.code}>{l.nativeName}</option>)}
        </select>
      </div>

      {/* Text size */}
      <div className="setting-row" style={{ cursor: 'default', flexWrap: 'wrap' }}>
        <Type size={21} color="var(--c-saffron)" />
        <span className="label">Text size</span>
        <div className="segmented" style={{ minWidth: 170 }}>
          {[['normal', 'A', '0.85rem'], ['large', 'A', '1rem'], ['xlarge', 'A', '1.2rem']].map(([v, l, size]) => (
            <button key={v} className={fontScale === v ? 'active' : ''} onClick={() => setFontScale(v)} style={{ fontSize: size }} aria-label={`Text size ${v}`}>{l}</button>
          ))}
        </div>
      </div>

      <button className="setting-row" onClick={() => shareText(inviteMessage(user.name))}>
        <Share2 size={21} color="var(--c-emerald)" />
        <span className="label">Invite friends</span>
        <ChevronRight size={18} color="var(--c-muted)" />
      </button>
      <button className="setting-row" onClick={onFeedback}>
        <MessageSquareHeart size={21} color="#DB2777" />
        <span className="label">Send feedback</span>
        <ChevronRight size={18} color="var(--c-muted)" />
      </button>
      <button className="setting-row" onClick={() => setShowPrivacy(true)}>
        <ShieldCheck size={21} color="var(--c-emerald)" />
        <span className="label">Privacy & security</span>
        <ChevronRight size={18} color="var(--c-muted)" />
      </button>
      <button className="setting-row" style={{ color: 'var(--c-red)' }} onClick={() => {
        if (window.confirm('Delete your Kinnect account from this phone?\n\nYour chats on this phone will be erased and people will no longer find you until you register again.')) {
          deleteAccount();
        }
      }}>
        <Trash2 size={21} />
        <span className="label">Delete account</span>
      </button>

      {note && <p style={{ textAlign: 'center', color: 'var(--c-emerald)', fontSize: '0.86rem', marginTop: 8 }}>{note}</p>}
      <p style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: '0.76rem', marginTop: 14 }}>Kinnect {APP_VERSION} · beta</p>
    </Sheet>
  );
}
