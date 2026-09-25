import React, { useRef, useState } from 'react';
import { Camera, ChevronLeft, Lock, Users, Phone, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COUNTRY_CODES, normalizePhone, formatPhone } from '../utils/phone';
import { resizeImageToDataUrl } from '../utils/image';
import { canReadContacts, requestContactsPermission } from '../services/contacts';
import { cryptoAvailable } from '../services/crypto';
import Avatar from './Avatar';

const AVATARS = ['🙂', '😊', '👵', '👴', '👩', '👨', '👧', '👦', '🧑', '👩‍🦳', '👨‍🦳', '🧕', '🙏', '🌸', '🌟', '🦚'];

const wrap = {
  minHeight: '100dvh', display: 'flex', flexDirection: 'column',
  background: 'linear-gradient(180deg, #ECFEFF 0%, #FAF8F5 45%)',
  padding: 'calc(16px + env(safe-area-inset-top, 0px)) 22px calc(24px + env(safe-area-inset-bottom, 0px))',
};
const inner = { width: '100%', maxWidth: 420, margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' };
const h1 = { fontSize: '1.6rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.5px', lineHeight: 1.25 };
const lead = { fontSize: '0.98rem', color: 'var(--c-muted)', marginTop: 8, lineHeight: 1.5 };

function Back({ onClick }) {
  return (
    <button className="icon-btn" onClick={onClick} aria-label="Back" style={{ marginLeft: -10, marginBottom: 8 }}>
      <ChevronLeft size={26} />
    </button>
  );
}

export default function Onboarding() {
  const { createAccount, fontScale, setFontScale } = useApp();
  const fileRef = useRef(null);
  const [step, setStep] = useState('welcome'); // welcome | phone | profile | textsize | contacts
  const [cc, setCc] = useState('91');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🙂');
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Accept numbers typed with or without the country code
  const phone = number.trim().startsWith('+')
    ? normalizePhone(number)
    : normalizePhone(`+${cc}${number.replace(/\D/g, '').replace(/^0+/, '')}`);
  const phoneValid = number.replace(/\D/g, '').length >= 7 && !!phone;

  async function finish() {
    setBusy(true);
    try {
      await createAccount({ phone, name, avatar, photo });
    } catch (e) {
      setError('Something went wrong setting up encryption on this device. Please try again.');
      setBusy(false);
    }
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { setPhoto(await resizeImageToDataUrl(file)); } catch { setError('Could not use that photo, please try another one.'); }
  }

  if (!cryptoAvailable) {
    return (
      <div style={wrap}><div style={inner}>
        <div className="empty-state" style={{ marginTop: '20vh' }}>
          <div className="icon">🔒</div>
          <h3>Secure connection needed</h3>
          <p>Kinnect encrypts every message, which needs a secure (https) page. Please open the app from its official link.</p>
        </div>
      </div></div>
    );
  }

  /* ── Welcome ── */
  if (step === 'welcome') {
    return (
      <div style={wrap}><div style={inner}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            width: 84, height: 84, borderRadius: 28, marginBottom: 22,
            background: 'linear-gradient(135deg,#0E7490,#15803D)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem',
            boxShadow: '0 12px 32px rgba(14,116,144,0.3)',
          }}>🌿</div>
          <h1 style={{ ...h1, fontSize: '2.1rem' }}>Welcome to Kinnect</h1>
          <p style={lead}>Stay close to the people who matter, in your own language.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 30 }}>
            {[
              [Lock, 'Private by design', 'Messages and calls are end-to-end encrypted.'],
              [Users, 'Find people you know', 'Contacts who use Kinnect show up automatically.'],
              [Phone, 'Free voice & video calls', 'Talk to anyone, anywhere in the world.'],
            ].map(([Icon, title, text]) => (
              <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 42, height: 42, minWidth: 42, borderRadius: 14, background: '#CFFAFE', color: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--c-text)' }}>{title}</p>
                  <p style={{ fontSize: '0.88rem', color: 'var(--c-muted)', lineHeight: 1.45 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep('phone')}>Get started</button>
      </div></div>
    );
  }

  /* ── Phone number ── */
  if (step === 'phone') {
    return (
      <div style={wrap}><div style={inner}>
        <Back onClick={() => setStep('welcome')} />
        <h1 style={h1}>Your mobile number</h1>
        <p style={lead}>People who have your number saved will find you on Kinnect.</p>

        <div style={{ marginTop: 26 }}>
          <label className="field-label">Country</label>
          <select className="input" value={cc} onChange={e => setCc(e.target.value)} style={{ minHeight: 52, fontWeight: 600 }}>
            {COUNTRY_CODES.map(c => <option key={c.cc} value={c.cc}>{c.label}</option>)}
          </select>

          <label className="field-label" style={{ marginTop: 16 }}>Mobile number</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="input" style={{ width: 76, minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>+{cc}</div>
            <input
              className="input" type="tel" inputMode="tel" autoFocus
              value={number} onChange={e => setNumber(e.target.value)}
              placeholder="98765 43210" style={{ minHeight: 52, fontSize: '1.1rem', fontWeight: 600, letterSpacing: 0.5 }}
            />
          </div>
        </div>

        <div className="notice" style={{ marginTop: 20 }}>
          <ShieldCheck size={20} style={{ flexShrink: 0 }} />
          <span>Your number is never shown publicly. Kinnect only publishes a scrambled code made from it, so people who already know your number can find you.</span>
        </div>

        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-full btn-lg" disabled={!phoneValid} style={{ opacity: phoneValid ? 1 : 0.5 }} onClick={() => setStep('profile')}>
          Continue
        </button>
      </div></div>
    );
  }

  /* ── Name & photo ── */
  if (step === 'profile') {
    const ready = name.trim().length > 0;
    return (
      <div style={wrap}><div style={inner}>
        <Back onClick={() => setStep('phone')} />
        <h1 style={h1}>Set up your profile</h1>
        <p style={lead}>Add your name and a photo so people recognise you.</p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 24 }}>
          <button onClick={() => fileRef.current?.click()} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} aria-label="Add a photo">
            <Avatar person={{ emoji: avatar, photo, name }} size={108} style={{ border: '3px solid #fff', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }} />
            <span style={{ position: 'absolute', right: 0, bottom: 2, width: 36, height: 36, borderRadius: '50%', background: 'var(--c-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff' }}>
              <Camera size={16} />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          <button className="pill-btn" style={{ marginTop: 12 }} onClick={() => fileRef.current?.click()}>
            📷 {photo ? 'Change photo' : 'Add photo'}
          </button>
          {photo && (
            <button onClick={() => setPhoto('')} style={{ background: 'none', border: 'none', color: 'var(--c-muted)', fontSize: '0.82rem', textDecoration: 'underline', marginTop: 6, cursor: 'pointer' }}>
              Use an avatar instead
            </button>
          )}
        </div>

        {!photo && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, marginTop: 16 }}>
            {AVATARS.map(a => (
              <button key={a} onClick={() => setAvatar(a)} aria-label={`Avatar ${a}`} style={{
                aspectRatio: '1', borderRadius: 12, fontSize: '1.4rem', cursor: 'pointer',
                border: `2px solid ${avatar === a ? 'var(--c-primary)' : 'transparent'}`,
                background: avatar === a ? '#CFFAFE' : 'var(--c-surface)',
              }}>{a}</button>
            ))}
          </div>
        )}

        <label className="field-label" style={{ marginTop: 22 }}>Your name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Savita Sharma" maxLength={40} style={{ minHeight: 52, fontSize: '1.05rem' }} />
        <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginTop: 6 }}>Registering {formatPhone(phone)}</p>

        {error && <p style={{ color: 'var(--c-red)', fontSize: '0.86rem', marginTop: 10 }}>{error}</p>}
        <div style={{ flex: 1, minHeight: 20 }} />
        <button
          className="btn btn-primary btn-full btn-lg" disabled={!ready || busy} style={{ opacity: ready ? 1 : 0.5 }}
          onClick={() => setStep('textsize')}
        >
          {busy ? 'Setting up…' : 'Continue'}
        </button>
      </div></div>
    );
  }

  /* ── Comfortable text size ── */
  if (step === 'textsize') {
    const options = [
      ['normal', 'Standard', 1],
      ['large', 'Large', 1.14],
      ['xlarge', 'Extra large', 1.36],
    ];
    return (
      <div style={wrap}><div style={inner}>
        <Back onClick={() => setStep('profile')} />
        <h1 style={h1}>Choose your text size</h1>
        <p style={lead}>Pick what is easiest to read. You can change it any time in Settings.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
          {options.map(([value, label, scale]) => (
            <button key={value} onClick={() => setFontScale(value)} style={{
              textAlign: 'left', padding: '16px 18px', borderRadius: 18, cursor: 'pointer',
              border: `2px solid ${fontScale === value ? 'var(--c-primary)' : 'var(--c-border)'}`,
              background: fontScale === value ? '#ECFEFF' : 'var(--c-card)',
            }}>
              <span style={{ display: 'block', fontSize: `${1.05 * scale}rem`, fontWeight: 800, color: 'var(--c-text)' }}>{label}</span>
              <span style={{ display: 'block', fontSize: `${0.95 * scale}rem`, color: 'var(--c-muted)', marginTop: 2 }}>Namaste! How are you today?</span>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minHeight: 20 }} />
        <button className="btn btn-primary btn-full btn-lg" disabled={busy} onClick={() => (canReadContacts ? setStep('contacts') : finish())}>
          {busy ? 'Setting up…' : 'Continue'}
        </button>
      </div></div>
    );
  }

  /* ── Contacts permission (Android app) ── */
  return (
    <div style={wrap}><div style={inner}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem' }}>📇</div>
        <h1 style={{ ...h1, marginTop: 10 }}>Find people you know</h1>
        <p style={{ ...lead, maxWidth: 340 }}>
          Allow access to your contacts and Kinnect will show which of them are already here, using the names you saved.
        </p>
        <div className="notice" style={{ marginTop: 22, textAlign: 'left' }}>
          <Lock size={18} style={{ flexShrink: 0 }} />
          <span>Your contacts are checked on this phone and are never uploaded.</span>
        </div>
      </div>
      {error && <p style={{ color: 'var(--c-red)', fontSize: '0.86rem', marginBottom: 10 }}>{error}</p>}
      <button className="btn btn-primary btn-full btn-lg" disabled={busy} onClick={async () => { setBusy(true); await requestContactsPermission(); finish(); }}>
        {busy ? 'Setting up…' : 'Allow contacts'}
      </button>
      <button onClick={finish} disabled={busy} style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--c-muted)', fontWeight: 600, padding: 10, cursor: 'pointer' }}>
        Not now
      </button>
    </div></div>
  );
}
