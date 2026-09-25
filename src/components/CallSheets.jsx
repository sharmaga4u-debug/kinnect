import React, { useState } from 'react';
import { Phone, Video } from 'lucide-react';
import { useApp, localTimeIn, tzCity } from '../context/AppContext';
import { submitFeedback } from '../services/feedback';
import Avatar from './Avatar';
import Sheet from './Sheet';

/* "It's 2 AM for them" check before ringing someone late at night */
export function LateCallSheet() {
  const { lateCall, setLateCall, startCall } = useApp();
  if (!lateCall) return null;
  const { contact, type, activity } = lateCall;
  const first = contact.name.split(' ')[0];

  return (
    <Sheet title="Call now?" onClose={() => setLateCall(null)}>
      <div style={{ textAlign: 'center' }}>
        <Avatar person={contact} size={80} style={{ margin: '4px auto 12px' }} />
        <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--c-text)' }}>🌙 {localTimeIn(contact.timezone)}</p>
        <p style={{ fontSize: '1.05rem', color: 'var(--c-text-soft)', marginTop: 4, lineHeight: 1.5 }}>
          It's night for {first}{contact.timezone ? ` in ${tzCity(contact.timezone)}` : ''}. They may be sleeping.
        </p>
      </div>
      <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
        <button className="btn btn-primary btn-full btn-lg" onClick={() => setLateCall(null)}>Call later</button>
        <button className="btn btn-ghost btn-full" onClick={() => startCall(contact, type, activity)}>
          {type === 'video' ? <Video size={18} /> : <Phone size={18} />} Call anyway
        </button>
      </div>
    </Sheet>
  );
}

/* Quick "how was the call?" after a call, straight into the feedback sheet */
export function CallRatingSheet() {
  const { lastCall, setLastCall, user, setPrefs } = useApp();
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  if (!lastCall) return null;

  async function send() {
    await submitFeedback({
      name: user.name, phone: user.phone, rating,
      areas: `${lastCall.type === 'video' ? 'Video' : 'Voice'} call (${Math.round(lastCall.seconds / 60)} min)`,
      message: note.trim(), screen: 'after-call',
    });
    setSent(true);
    setTimeout(() => setLastCall(null), 900);
  }

  return (
    <Sheet title="How was your call?" onClose={() => setLastCall(null)}>
      {sent ? (
        <div className="empty-state"><div className="icon">🙏</div><h3>Thanks!</h3></div>
      ) : (
        <>
          <p style={{ color: 'var(--c-muted)', marginBottom: 12 }}>With {lastCall.name}. Your answer helps us improve calls.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {[[1, '😕'], [2, '😐'], [3, '🙂'], [4, '😊'], [5, '😍']].map(([v, e]) => (
              <button key={v} onClick={() => setRating(v)} aria-label={`Rating ${v}`} style={{
                fontSize: '2rem', padding: '8px 0', borderRadius: 14, cursor: 'pointer',
                border: `2px solid ${rating === v ? 'var(--c-primary)' : 'var(--c-border)'}`, background: rating === v ? '#ECFEFF' : 'var(--c-card)',
              }}>{e}</button>
            ))}
          </div>
          {rating > 0 && rating < 4 && (
            <textarea className="input" rows={2} value={note} onChange={e => setNote(e.target.value)}
              placeholder="What went wrong? (sound, video, dropped…)" style={{ marginTop: 12, resize: 'none', padding: 12 }} />
          )}
          <button className="btn btn-primary btn-full" style={{ marginTop: 14 }} disabled={!rating} onClick={send}>Send</button>
          <button onClick={() => { setPrefs({ noCallPrompt: true }); setLastCall(null); }}
            style={{ display: 'block', margin: '10px auto 0', background: 'none', border: 'none', color: 'var(--c-muted)', fontSize: '0.84rem', textDecoration: 'underline', cursor: 'pointer' }}>
            Don't ask after calls
          </button>
        </>
      )}
    </Sheet>
  );
}
