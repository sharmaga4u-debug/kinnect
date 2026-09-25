import React, { useState } from 'react';
import { Delete } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { checkPin, hashPin } from '../utils/pin';
import Avatar from './Avatar';

const PIN_LENGTH = 4;

export const LOCK_BG = {
  position: 'fixed', inset: 0, zIndex: 9000,
  background: 'linear-gradient(160deg,#0f172a 0%,#134e4a 55%,#1e3a5f 100%)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: '24px 20px', overflowY: 'auto',
};

/* Big-button number pad. `onComplete(pin)` resolves to true when accepted, false to show an error. */
export function PinPad({ person, title, subtitle, onComplete, footer }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function press(digit) {
    if (busy || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setError('');
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setBusy(true);
      const ok = await onComplete(next);
      setBusy(false);
      if (!ok) {
        setError('Wrong PIN, please try again');
        setTimeout(() => setPin(''), 350);
      }
    }
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div style={{ width: '100%', maxWidth: 340, textAlign: 'center', color: '#fff' }}>
      {person && <Avatar person={person} size={84} style={{ margin: '0 auto 14px', border: '3px solid rgba(255,255,255,0.25)' }} />}
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: 6 }}>{subtitle}</p>}

      {/* PIN dots */}
      <div className={error ? 'animate-shake' : ''} style={{ display: 'flex', justifyContent: 'center', gap: 18, margin: '26px 0 10px' }}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span key={i} style={{
            width: 18, height: 18, borderRadius: '50%',
            background: i < pin.length ? '#22C55E' : 'transparent',
            border: `2px solid ${i < pin.length ? '#22C55E' : 'rgba(255,255,255,0.5)'}`,
            transition: 'all 0.15s',
          }} />
        ))}
      </div>
      <p style={{ minHeight: 22, color: '#FCA5A5', fontSize: '0.88rem', fontWeight: 600 }}>{error}</p>

      {/* Keypad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 8 }}>
        {keys.map((k, i) => k === '' ? <span key={i} /> : (
          <button
            key={i}
            onClick={() => k === 'del' ? setPin(p => p.slice(0, -1)) : press(k)}
            aria-label={k === 'del' ? 'Delete' : k}
            style={{
              height: 68, borderRadius: 20,
              background: k === 'del' ? 'transparent' : 'rgba(255,255,255,0.1)',
              border: k === 'del' ? 'none' : '1px solid rgba(255,255,255,0.15)',
              color: '#fff', fontSize: '1.7rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {k === 'del' ? <Delete size={28} /> : k}
          </button>
        ))}
      </div>

      {footer && <div style={{ marginTop: 22 }}>{footer}</div>}
    </div>
  );
}

/* Choose a new PIN (entered twice). Calls onDone(pinHash). */
export function CreatePin({ person, userId, title = 'Create your app lock PIN', onDone, footer }) {
  const [first, setFirst] = useState(null);
  const [round, setRound] = useState(0); // remounts the pad between steps

  return (
    <PinPad
      key={round}
      person={person}
      title={first ? 'Enter the same PIN again' : title}
      subtitle={first ? 'To make sure you remember it' : 'Only you will be able to open your chats'}
      footer={footer}
      onComplete={async (pin) => {
        if (!first) {
          setFirst(pin);
          setRound(r => r + 1);
          return true;
        }
        if (pin !== first) {
          setFirst(null);
          setRound(r => r + 1);
          return false;
        }
        onDone(await hashPin(userId, pin));
        return true;
      }}
    />
  );
}

const linkBtn = {
  background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
  fontSize: '0.86rem', textDecoration: 'underline', cursor: 'pointer',
};

/* Shown when the app opens (or returns from background) with app lock turned on */
export default function LockScreen() {
  const { user, unlockApp, deleteAccount } = useApp();

  return (
    <div style={LOCK_BG}>
      <PinPad
        person={{ ...user, emoji: user.avatar }}
        title={`Hello, ${user.name.split(' ')[0]}`}
        subtitle="🔒 Enter your PIN to open Kinnect"
        onComplete={async (pin) => {
          const ok = await checkPin(user, pin);
          if (ok) unlockApp();
          return ok;
        }}
        footer={
          <button
            style={linkBtn}
            onClick={() => {
              if (window.confirm('Forgot your PIN?\n\nThe only way to reset it is to remove Kinnect from this phone. Your chats on this phone will be deleted, then you can register again with your number.')) {
                deleteAccount();
              }
            }}
          >
            Forgot PIN?
          </button>
        }
      />
    </div>
  );
}
