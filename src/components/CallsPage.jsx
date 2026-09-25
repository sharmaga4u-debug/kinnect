import React, { useEffect, useState } from 'react';
import { Phone, Video, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';

function localTime(tz) {
  try { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: tz }); }
  catch { return ''; }
}

function localHour(tz) {
  try { return Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(new Date())); }
  catch { return 12; }
}

// A gentle hint about whether it's a good time to ring
function timeHint(tz) {
  const h = localHour(tz);
  if (h >= 22 || h < 6) return { text: 'Probably asleep', color: '#6366F1', icon: '🌙' };
  if (h < 9) return { text: 'Early morning', color: '#D97706', icon: '🌅' };
  if (h >= 19) return { text: 'Evening', color: '#0E7490', icon: '🌆' };
  return { text: 'Daytime', color: '#16A34A', icon: '☀️' };
}

export default function CallsPage() {
  const { kinnectContacts, startCall, setActiveTab } = useApp();
  const [query, setQuery] = useState('');
  const [, tick] = useState(0);

  // Keep the local times fresh
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const q = query.trim().toLowerCase();
  const list = kinnectContacts.filter(c => !q || c.name.toLowerCase().includes(q));

  return (
    <div className="page" style={{ paddingTop: 12, paddingBottom: 120 }}>
      {kinnectContacts.length > 0 && (
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search people" />
        </label>
      )}

      {kinnectContacts.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="icon">📞</div>
          <h3>No one to call yet</h3>
          <p>People you know appear here once they join Kinnect. Calls are free and encrypted.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setActiveTab('chats')}>
            Find people
          </button>
        </div>
      ) : (
        <>
          <p className="section-label">Their local time</p>
          <div className="list-card">
            {list.map(c => {
              const hint = timeHint(c.timezone);
              return (
                <div key={c.id} className="list-row" style={{ cursor: 'default' }}>
                  <Avatar person={c} size={50} />
                  <div className="row-main">
                    <p className="row-title">{c.name}</p>
                    <p className="row-sub">
                      <strong style={{ color: 'var(--c-text-soft)' }}>{localTime(c.timezone)}</strong>
                      <span style={{ color: hint.color }}> · {hint.icon} {hint.text}</span>
                    </p>
                  </div>
                  <button className="icon-btn" onClick={() => startCall(c, 'audio')} aria-label={`Call ${c.name}`} style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    <Phone size={19} />
                  </button>
                  <button className="icon-btn" onClick={() => startCall(c, 'video')} aria-label={`Video call ${c.name}`} style={{ background: '#F0FDF4', color: '#16A34A' }}>
                    <Video size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
