import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Video, ChevronLeft } from 'lucide-react';
import { useApp, localTimeIn, differentTimeZone } from '../context/AppContext';
import { useBackButton } from '../hooks/useBackButton';
import { ACTIVITIES, ActivityView } from './together/Activities';
import Avatar from './Avatar';
import Sheet from './Sheet';

export default function PlayPage() {
  const { kinnectContacts, requestCall, setActiveTab } = useApp();
  const [solo, setSolo] = useState(null);
  const [pickFor, setPickFor] = useState(null);

  return (
    <div className="page" style={{ paddingTop: 12, paddingBottom: 120 }}>
      <div style={{ background: 'linear-gradient(135deg,#F59E0B,#DB2777)', color: '#fff', borderRadius: 22, padding: '18px 18px 16px' }}>
        <p style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.3 }}>Play together, even far apart 👵🧒</p>
        <p style={{ fontSize: '0.92rem', opacity: 0.95, marginTop: 6, lineHeight: 1.5 }}>
          Start a video call and draw, read a story or play a game. Both of you see the same screen while you talk.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {ACTIVITIES.map(a => (
          <div key={a.id} className="list-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 58, height: 58, minWidth: 58, borderRadius: 18, background: `${a.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                {a.emoji}
              </div>
              <div className="row-main">
                <p className="row-title" style={{ fontSize: 'calc(1.08rem * var(--app-font-scale))' }}>{a.title}</p>
                <p className="row-sub" style={{ whiteSpace: 'normal' }}>{a.blurb}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" style={{ minHeight: 46 }} onClick={() => setPickFor(a)}>
                <Video size={18} /> On a video call
              </button>
              <button className="btn btn-ghost btn-sm" style={{ minHeight: 46 }} onClick={() => setSolo(a)}>
                Play here
              </button>
            </div>
          </div>
        ))}
      </div>

      {pickFor && (
        <Sheet title={`${pickFor.emoji} ${pickFor.title} with…`} onClose={() => setPickFor(null)}>
          {kinnectContacts.length === 0 ? (
            <div className="empty-state">
              <div className="icon">👨‍👩‍👧</div>
              <h3>No one to call yet</h3>
              <p>Invite your family to Kinnect first.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => { setPickFor(null); setActiveTab('chats'); }}>Find people</button>
            </div>
          ) : kinnectContacts.map(c => (
            <button key={c.id} className="list-row" onClick={() => { const a = pickFor; setPickFor(null); setTimeout(() => requestCall(c, 'video', a.id), 60); }}>
              <Avatar person={c} size={48} />
              <div className="row-main">
                <p className="row-title">{c.name}</p>
                {differentTimeZone(c.timezone) && <p className="row-sub">🕒 {localTimeIn(c.timezone)} for them</p>}
              </div>
              <Video size={22} color="var(--c-primary)" />
            </button>
          ))}
        </Sheet>
      )}

      {solo && createPortal(<SoloActivity activity={solo} onClose={() => setSolo(null)} />, document.body)}
    </div>
  );
}

/* Full-screen activity on one phone (pass the phone between players) */
function SoloActivity({ activity, onClose }) {
  const close = useBackButton(onClose);
  return (
    <div className="chat-screen animate-fadeIn" style={{ background: 'var(--c-bg)' }}>
      <div className="chat-header">
        <button className="icon-btn" onClick={close} aria-label="Back"><ChevronLeft size={28} /></button>
        <p className="row-title" style={{ flex: 1, fontSize: '1.15rem' }}>{activity.emoji} {activity.title}</p>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <ActivityView id={activity.id} shared={false} me={1} names={{ 1: 'Player 1', 2: 'Player 2' }} />
        </div>
      </div>
    </div>
  );
}
