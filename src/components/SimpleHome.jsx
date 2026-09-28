import React, { useState } from 'react';
import { Video, Siren, MessageCircle, Settings } from 'lucide-react';
import { useApp, personView } from '../context/AppContext';
import { useCare } from '../context/CareContext';
import { localTimeIn, differentTimeZone } from '../context/AppContext';
import Avatar from './Avatar';
import Sheet from './Sheet';

/* Simple mode: big photos of favourite people, one tap to video call, I'm OK and SOS. */
export default function SimpleHome() {
  const { user, people, kinnectContacts, requestCall, startCall, openChat } = useApp();
  const { care, toggleFavorite, setSimpleMode, sayImOk, okToday, sendSOS } = useCare();
  const [choosing, setChoosing] = useState(false);
  const [sosState, setSosState] = useState(null);
  const favs = care.favorites.map(id => people[id]).filter(Boolean).map(personView);

  return (
    <div style={{ minHeight: '100dvh', background: '#FAF8F5', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <Avatar person={{ ...user, emoji: user.avatar }} size={52} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--c-text)' }}>Namaste, {user.name.split(' ')[0]} 🙏</p>
          <p style={{ color: 'var(--c-muted)', fontSize: '1rem' }}>Tap a photo to video call</p>
        </div>
      </div>

      {favs.length === 0 ? (
        <button onClick={() => setChoosing(true)} className="list-card" style={{ width: '100%', padding: 24, fontSize: '1.2rem', fontWeight: 700, color: 'var(--c-primary)', cursor: 'pointer' }}>
          ➕ Choose your family members
        </button>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {favs.map(p => (
            <div key={p.id} className="simple-tile">
              <button onClick={() => requestCall(p, 'video')} aria-label={`Video call ${p.name}`} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%' }}>
                <Avatar person={p} size={118} style={{ margin: '0 auto', border: '4px solid #fff', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }} />
                <p style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: 10, color: 'var(--c-text)' }}>{p.name.split(' ')[0]}</p>
                {differentTimeZone(p.timezone) && <p style={{ fontSize: '1rem', color: 'var(--c-muted)' }}>🕒 {localTimeIn(p.timezone)} there</p>}
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 10 }}>
                <button className="btn btn-green" style={{ minHeight: 56, fontSize: '1.1rem' }} onClick={() => requestCall(p, 'video')}><Video size={24} /> Call</button>
                <button className="btn btn-ghost" style={{ minHeight: 56, padding: '0 14px' }} onClick={() => { setSimpleMode(false); setTimeout(() => openChat(p.id), 50); }} aria-label={`Message ${p.name}`}><MessageCircle size={24} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
        {care.checkIn.enabled && (
          okToday
            ? <div className="ok-done" style={{ fontSize: '1.15rem' }}>✅ Your family knows you're OK today</div>
            : <button className="im-ok-btn" style={{ fontSize: '1.4rem', minHeight: 76 }} onClick={sayImOk}>👋 I'm OK today</button>
        )}
        <button className="sos-btn" style={{ fontSize: '1.3rem', minHeight: 70 }} onClick={() => setSosState('confirm')}><Siren size={28} /> SOS · Get help</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26 }}>
        <button className="pill-btn" onClick={() => setChoosing(true)}>✏️ Change people</button>
        <button className="pill-btn" onClick={() => { if (window.confirm('Switch to the full Kinnect app?')) setSimpleMode(false); }}><Settings size={15} /> Full app</button>
      </div>

      {choosing && (
        <Sheet title="Who should be on your home screen?" onClose={() => setChoosing(false)}>
          <p style={{ color: 'var(--c-muted)', marginBottom: 8 }}>Pick up to 6 people.</p>
          {kinnectContacts.map(c => {
            const on = care.favorites.includes(c.id);
            return (
              <button key={c.id} className="list-row" onClick={() => toggleFavorite(c.id)}>
                <Avatar person={c} size={48} />
                <span className="row-main row-title" style={{ fontSize: '1.1rem' }}>{c.name}</span>
                <span className={`check-dot ${on ? 'on' : ''}`}>{on && '✓'}</span>
              </button>
            );
          })}
          {!kinnectContacts.length && <p style={{ color: 'var(--c-muted)' }}>No family on Kinnect yet. Ask a family member to help invite them.</p>}
        </Sheet>
      )}

      {sosState && (
        <Sheet title="Send SOS?" onClose={() => setSosState(null)}>
          {sosState === 'confirm' ? (
            <>
              <p style={{ fontSize: '1.15rem', lineHeight: 1.5 }}>Your family will get an alert with your location.</p>
              <button className="sos-btn" style={{ marginTop: 16, minHeight: 64, fontSize: '1.2rem' }} onClick={async () => {
                setSosState('sending');
                const r = await sendSOS();
                setSosState(r.error ? 'error' : 'sent');
                if (r.first && people[r.first]) setTimeout(() => startCall(personView(people[r.first]), 'audio'), 800); // emergency: no late-night check
              }}>Yes, send SOS</button>
              <button className="btn btn-ghost btn-full" style={{ marginTop: 10, minHeight: 56 }} onClick={() => setSosState(null)}>Cancel</button>
            </>
          ) : sosState === 'sending' ? <div className="empty-state"><div className="icon">📍</div><h3>Sending…</h3></div>
            : sosState === 'error' ? <div className="empty-state"><div className="icon">⚠️</div><h3>Choose family first</h3><p>Ask a family member to set up SOS contacts in the full app (Family → My care).</p></div>
            : <div className="empty-state"><div className="icon">✅</div><h3>Help is on the way</h3><p>Your family has been alerted.</p></div>}
        </Sheet>
      )}
    </div>
  );
}

/* Full-screen alert when a family member sends SOS */
export function SosAlert() {
  const { sosAlert, setSosAlert } = useCare();
  const { people, startCall, openChat, activeCall } = useApp();
  if (!sosAlert) return null;
  // Already talking to them: keep the call visible; the alert (with location) returns afterwards
  if (activeCall?.contact?.id === sosAlert.from) return null;
  const p = people[sosAlert.from];
  const view = p ? personView(p) : { id: sosAlert.from, name: sosAlert.name, emoji: '🙂' };
  const map = sosAlert.loc ? `https://www.openstreetmap.org/?mlat=${sosAlert.loc.lat}&mlon=${sosAlert.loc.lng}#map=17/${sosAlert.loc.lat}/${sosAlert.loc.lng}` : null;
  return (
    <div className="sos-overlay">
      <div style={{ fontSize: '3.5rem' }}>🆘</div>
      <Avatar person={view} size={96} style={{ margin: '10px auto', border: '4px solid #fff' }} />
      <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{view.name} needs help!</h2>
      <p style={{ opacity: 0.9, marginTop: 6 }}>Sent at {new Date(sosAlert.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}{sosAlert.loc ? (sosAlert.loc.acc >= 5 ? ` · location within ${sosAlert.loc.acc} m` : ' · location shared') : ' · no location'}</p>
      <div style={{ display: 'grid', gap: 10, width: '100%', maxWidth: 360, marginTop: 22 }}>
        <button className="btn btn-lg" style={{ background: '#fff', color: '#B91C1C', fontWeight: 800 }} onClick={() => startCall(view, 'audio')}>📞 Call {view.name.split(' ')[0]} now</button>
        {map && <a className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none' }} href={map} target="_blank" rel="noreferrer">📍 Open their location</a>}
        <button className="btn" style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.5)' }} onClick={() => { setSosAlert(null); openChat(sosAlert.from); }}>Open chat</button>
      </div>
    </div>
  );
}
