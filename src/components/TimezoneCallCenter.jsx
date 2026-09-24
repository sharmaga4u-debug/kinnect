import React, { useState, useEffect } from 'react';
import { Video, Phone, MessageCircle, Clock, Cloud, Sun, Moon, Coffee, BookOpen, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProfileModal from './ProfileModal';

function getLocalTime(timezone) {
  try {
    return new Date().toLocaleTimeString('en-IN', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '--:--';
  }
}

function getLocalHour(timezone) {
  try {
    const str = new Date().toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false });
    return parseInt(str, 10);
  } catch { return 12; }
}

function getStatusInfo(hour) {
  if (hour >= 22 || hour < 6)  return { label: 'Sleeping', icon: <Moon size={15} />, color: '#6366F1', bg: '#EDE9FE', badge: 'badge-violet' };
  if (hour >= 6 && hour < 9)   return { label: 'Waking Up', icon: <Coffee size={15} />, color: '#D97706', bg: '#FEF3C7', badge: 'badge-amber' };
  if (hour >= 9 && hour < 18)  return { label: 'At Work / School', icon: <BookOpen size={15} />, color: '#2563EB', bg: '#DBEAFE', badge: 'badge-blue' };
  if (hour >= 18 && hour < 22) return { label: 'Evening – Free', icon: <Sun size={15} />, color: '#16A34A', bg: '#DCFCE7', badge: 'badge-green' };
  return { label: 'Busy', icon: <Clock size={15} />, color: '#64748B', bg: '#F1F5F9', badge: 'badge-gray' };
}

/* ── Permission Request Dialog ── */
function PermissionDialog({ type, contactName, onAllow, onDeny }) {
  return (
    <div className="overlay animate-fadeIn" style={{ zIndex: 110 }}>
      <div
        className="card animate-slideUp"
        style={{ width: '100%', maxWidth: 370, padding: 28, textAlign: 'center' }}
      >
        <div style={{ fontSize: '3.5rem', marginBottom: 10 }}>
          {type === 'video' ? '📹' : '📞'}
        </div>
        <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--c-text)', marginBottom: 8 }}>
          {type === 'video' ? 'Camera & Microphone' : 'Microphone'} Access
        </h2>
        <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 20 }}>
          To {type === 'video' ? 'video call' : 'call'} <strong style={{ color: 'var(--c-text)' }}>{contactName}</strong>,
          Kinnect needs access to your {type === 'video' ? '📷 camera and 🎙️ microphone' : '🎙️ microphone'}.
          <br /><br />
          <span style={{ fontSize: '0.82rem', color: 'var(--c-primary)', fontWeight: 700 }}>
            🔒 Only used during the call — never recorded or shared.
          </span>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ minHeight: 48, borderColor: 'var(--c-border)' }}
            onClick={onDeny}
          >
            ✕ Not Now
          </button>
          <button
            className="btn btn-green"
            style={{ minHeight: 48, fontSize: '0.96rem' }}
            onClick={onAllow}
          >
            ✓ Allow & Call
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ contact, onProfileOpen, onStartCall, onChat, onSnippet }) {
  const [time, setTime] = useState(getLocalTime(contact.timezone));
  const hour = getLocalHour(contact.timezone);
  const status = getStatusInfo(hour);
  const isSleeping = hour >= 22 || hour < 6;

  useEffect(() => {
    const t = setInterval(() => setTime(getLocalTime(contact.timezone)), 30000);
    return () => clearInterval(t);
  }, [contact.timezone]);

  return (
    <div className="card animate-slideUp" style={{ marginBottom: 14 }}>
      {/* Top row — name/avatar are clickable → opens profile */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div
          className="avatar"
          style={{
            background: contact.avatarBg, color: contact.avatarColor,
            fontSize: '1.6rem', width: 58, height: 58,
            cursor: 'pointer', outline: '2px solid transparent',
            transition: 'outline 0.15s'
          }}
          onClick={() => onProfileOpen(contact)}
          title="View Profile"
          onMouseEnter={e => e.currentTarget.style.outline = '2px solid var(--c-primary)'}
          onMouseLeave={e => e.currentTarget.style.outline = '2px solid transparent'}
        >
          {contact.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              style={{
                fontWeight: 800, fontSize: '1.1rem',
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', color: 'var(--c-text)',
                textDecoration: 'underline dotted',
                textDecorationColor: 'var(--c-primary)'
              }}
              onClick={() => onProfileOpen(contact)}
              title="View Profile"
            >
              {contact.name}
            </button>
            <span className="badge badge-gray">{contact.relation}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: 'var(--c-muted)', fontSize: '0.88rem' }}>
            <Clock size={13} />
            <strong style={{ color: 'var(--c-text)', fontSize: '1rem' }}>{time}</strong>
            <span>in {contact.city}, {contact.country}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <span className={`badge ${status.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {status.icon} {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Bedtime warning */}
      {isSleeping && (
        <div style={{
          background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10,
          padding: '8px 12px', marginBottom: 12, fontSize: '0.86rem', color: '#92400E',
          display: 'flex', gap: 6, alignItems: 'center'
        }}>
          <Moon size={15} />
          It's nighttime for {contact.name.split(' ')[0]}. Consider leaving a voice/video message instead.
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <button
          className="btn btn-green btn-sm"
          onClick={() => onStartCall(contact, 'video')}
          style={{ flexDirection: 'column', gap: 4, minHeight: 58, fontSize: '0.78rem', padding: '6px 4px' }}
        >
          <Video size={19} />
          Video
        </button>
        <button
          className="btn btn-blue btn-sm"
          onClick={() => onStartCall(contact, 'audio')}
          style={{ flexDirection: 'column', gap: 4, minHeight: 58, fontSize: '0.78rem', padding: '6px 4px' }}
        >
          <Phone size={19} />
          Audio
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onChat(contact.id)}
          style={{ flexDirection: 'column', gap: 4, minHeight: 58, fontSize: '0.78rem', padding: '6px 4px' }}
        >
          <MessageCircle size={19} />
          Chat
        </button>
        <button
          className="btn btn-saffron btn-sm"
          onClick={() => onSnippet(contact)}
          style={{ flexDirection: 'column', gap: 4, minHeight: 58, fontSize: '0.78rem', padding: '6px 4px' }}
        >
          <Clock size={19} />
          Clip
        </button>
      </div>
    </div>
  );
}

function SnippetModal({ contact, onClose }) {
  const [recording, setRecording] = useState(false);
  const [done, setDone] = useState(false);
  const [type, setType] = useState('video');

  function startRecord() {
    setRecording(true);
    setTimeout(() => { setRecording(false); setDone(true); }, 3000);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card animate-slideUp" style={{ width: '100%', maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontWeight: 700, marginBottom: 4 }}>Send a Clip to {contact.name.split(' ')[0]}</h2>
        <p style={{ color: 'var(--c-muted)', fontSize: '0.88rem', marginBottom: 18 }}>
          They'll see it whenever they wake up — no missed calls!
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {['video', 'voice'].map(t => (
            <button key={t} className={`chip ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
              {t === 'video' ? '🎥 Video Clip' : '🎙️ Voice Note'}
            </button>
          ))}
        </div>

        {!done ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: recording ? '#FEE2E2' : '#DCFCE7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', margin: '0 auto 16px', transition: 'all 0.3s',
              position: 'relative', cursor: 'pointer',
            }} onClick={!recording ? startRecord : undefined}>
              {recording ? '🔴' : (type === 'video' ? '🎥' : '🎙️')}
            </div>
            <p style={{ color: 'var(--c-muted)', fontSize: '0.88rem' }}>
              {recording ? '● Recording… tap to stop' : 'Tap the icon to start recording'}
            </p>
            {recording && (
              <button className="btn btn-red btn-sm" style={{ marginTop: 12 }} onClick={() => { setRecording(false); setDone(true); }}>
                Stop & Send
              </button>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>✅</div>
            <p style={{ fontWeight: 600, color: 'var(--c-primary)' }}>Clip sent to {contact.name.split(' ')[0]}!</p>
            <p style={{ color: 'var(--c-muted)', fontSize: '0.88rem', marginTop: 4 }}>
              They'll be notified when they're awake.
            </p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TimezoneCallCenter() {
  const { contacts, startCall, openChat } = useApp();
  const [snippetTarget, setSnippetTarget] = useState(null);
  const [profileTarget, setProfileTarget] = useState(null);

  // Permission dialog state
  const [pendingCall, setPendingCall] = useState(null); // { contact, type }

  function handleStartCall(contact, type) {
    // Show permission dialog first, then start actual call
    setPendingCall({ contact, type });
  }

  function handleAllowCall() {
    if (!pendingCall) return;
    startCall(pendingCall.contact, pendingCall.type);
    setPendingCall(null);
  }

  return (
    <div className="page" style={{ paddingBottom: 110, maxWidth: 660 }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 className="section-title">📞 Family Calls & Timezones</h1>
      </div>

      {contacts.map(contact => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onProfileOpen={setProfileTarget}
          onStartCall={handleStartCall}
          onSnippet={setSnippetTarget}
          onChat={openChat}
        />
      ))}

      {/* Permission Dialog */}
      {pendingCall && (
        <PermissionDialog
          type={pendingCall.type}
          contactName={pendingCall.contact.name}
          onAllow={handleAllowCall}
          onDeny={() => setPendingCall(null)}
        />
      )}

      {/* Profile Modal */}
      {profileTarget && (
        <ProfileModal
          target={profileTarget}
          onClose={() => setProfileTarget(null)}
          onCall={(contact, type) => { setProfileTarget(null); handleStartCall(contact, type); }}
          onChat={(id) => { setProfileTarget(null); openChat(id); }}
        />
      )}

      {snippetTarget && (
        <SnippetModal contact={snippetTarget} onClose={() => setSnippetTarget(null)} />
      )}
    </div>
  );
}
