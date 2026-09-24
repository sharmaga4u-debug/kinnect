import React, { useState } from 'react';
import { Play, Trash2, Archive, HardDrive, CheckCircle, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ALBUM = [
  { id: 'a1', emoji: '🏖️', caption: 'Beach day in Goa!', from: 'Priya Nair', date: 'Aug 2026', type: 'photo' },
  { id: 'a2', emoji: '🎂', caption: "Aarav's 8th Birthday!", from: 'Aarav Sharma', date: 'Jul 2026', type: 'photo' },
  { id: 'a3', emoji: '🌸', caption: 'Cherry blossoms in London park', from: 'Aarav Sharma', date: 'Apr 2026', type: 'photo' },
  { id: 'a4', emoji: '🎭', caption: 'School play performance', from: 'Riya Sharma', date: 'Mar 2026', type: 'video' },
  { id: 'a5', emoji: '🏔️', caption: 'Trekking in Coorg!', from: 'Dev Menon', date: 'Feb 2026', type: 'photo' },
  { id: 'a6', emoji: '🪔', caption: 'Diwali 2025 celebrations', from: 'Riya Sharma', date: 'Nov 2025', type: 'photo' },
];

export default function FamilyAlbum() {
  const { snippets, markSnippetWatched, storageMode, setStorageMode } = useApp();
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [playingSnippet, setPlayingSnippet] = useState(null);

  const usedMB = 148;
  const totalMB = 1024;
  const usedPct = Math.round((usedMB / totalMB) * 100);

  function handlePlaySnippet(s) {
    markSnippetWatched(s.id);
    setPlayingSnippet(s);
    setTimeout(() => setPlayingSnippet(null), 3000);
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 16 }}>
        <h1 className="section-title">📸 Family Memories</h1>
      </div>

      {/* Video Snippets */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          📬 Video Messages
          {snippets.filter(s => !s.watched).length > 0 && (
            <span className="badge badge-red">{snippets.filter(s => !s.watched).length} New</span>
          )}
        </h2>

        {snippets.map(s => (
          <div key={s.id} className="contact-row" style={{ background: s.watched ? 'var(--c-surface)' : 'var(--c-card)', border: s.watched ? '1px solid var(--c-border)' : '2px solid #16A34A' }}>
            <div style={{
              width: 54, height: 54, borderRadius: 12,
              background: s.watched ? 'var(--c-border)' : '#DCFCE7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0,
            }}>
              {s.thumbnail}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{s.from}</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)', marginTop: 2 }}>{s.message}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--c-muted)' }}>{s.time}</span>
                <span className="badge badge-gray">{s.duration}</span>
                {!s.watched && <span className="badge badge-green">New</span>}
              </div>
            </div>
            <button
              className="btn btn-green btn-sm btn-icon"
              onClick={() => handlePlaySnippet(s)}
              aria-label="Play video message"
            >
              <Play size={20} />
            </button>
          </div>
        ))}
      </section>

      {/* Playing modal */}
      {playingSnippet && (
        <div className="overlay">
          <div className="card animate-slideUp" style={{ textAlign: 'center', maxWidth: 320 }}>
            <div style={{ fontSize: '4rem', marginBottom: 8 }}>▶️</div>
            <h3 style={{ fontWeight: 700 }}>Playing message from {playingSnippet.from.split(' ')[0]}</h3>
            <p style={{ color: 'var(--c-muted)', fontSize: '0.88rem', marginTop: 6 }}>{playingSnippet.message}</p>
            <div className="progress-bar" style={{ margin: '16px 0' }}>
              <div className="progress-fill" style={{ width: '60%', animationDuration: '3s' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} color="var(--c-primary)" />
              <span style={{ color: 'var(--c-primary)', fontSize: '0.85rem' }}>Playing…</span>
            </div>
          </div>
        </div>
      )}

      {/* Storage card */}
      <div className="card" style={{ marginBottom: 24, border: '1px solid var(--c-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <HardDrive size={18} color="var(--c-muted)" />
            <span style={{ fontWeight: 600 }}>Storage Used</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowStorageModal(true)}>Manage</button>
        </div>
        <div className="progress-bar" style={{ marginBottom: 8 }}>
          <div className="progress-fill" style={{ width: `${usedPct}%` }} />
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)' }}>
          {usedMB} MB used of {totalMB} MB &nbsp;·&nbsp;
          <span style={{ color: 'var(--c-primary)', fontWeight: 600 }}>
            {storageMode === 'archive' ? '☁️ Auto-Archive ON' : storageMode === 'delete-30' ? '🗑️ Auto-delete after 30 days' : '🗑️ Auto-delete after 7 days'}
          </span>
        </p>
      </div>

      {/* Photo Album grid */}
      <section>
        <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 12 }}>🗂️ Family Album</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {ALBUM.map(item => (
            <div key={item.id} style={{
              borderRadius: 16, overflow: 'hidden',
              background: 'var(--c-card)', border: '1px solid var(--c-border)',
            }}>
              <div style={{
                height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3.5rem',
                background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)',
                position: 'relative',
              }}>
                {item.emoji}
                {item.type === 'video' && (
                  <span style={{
                    position: 'absolute', bottom: 6, right: 6,
                    background: 'rgba(0,0,0,.6)', color: '#fff', borderRadius: 6,
                    padding: '2px 6px', fontSize: '0.7rem', fontWeight: 700,
                  }}>▶ VIDEO</span>
                )}
              </div>
              <div style={{ padding: '8px 10px' }}>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>{item.caption}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--c-muted)' }}>{item.from} · {item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Storage modal */}
      {showStorageModal && (
        <div className="overlay" onClick={() => setShowStorageModal(false)}>
          <div className="card animate-slideUp" style={{ width: '100%', maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontWeight: 700, marginBottom: 6 }}>📦 Storage Preferences</h2>
            <p style={{ color: 'var(--c-muted)', fontSize: '0.88rem', marginBottom: 20 }}>
              Choose how your media is managed to keep your device free of clutter.
            </p>
            {[
              { id: 'archive', icon: <Archive size={20} />, label: 'Auto-Archive to Cloud', desc: 'All photos & videos are securely saved online. Access anytime.' },
              { id: 'delete-30', icon: <Trash2 size={20} />, label: 'Auto-Delete after 30 days', desc: 'Clips older than 30 days are permanently removed from your device.' },
              { id: 'delete-7', icon: <Trash2 size={20} />, label: 'Auto-Delete after 7 days', desc: 'Maximum storage saving. Clips removed after 7 days.' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => { setStorageMode(opt.id); setShowStorageModal(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: 14, marginBottom: 10,
                  background: storageMode === opt.id ? '#F0FDF4' : 'var(--c-surface)',
                  border: `2px solid ${storageMode === opt.id ? 'var(--c-primary)' : 'var(--c-border)'}`,
                  cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start',
                  color: 'var(--c-text)',
                }}
              >
                <span style={{ color: storageMode === opt.id ? 'var(--c-primary)' : 'var(--c-muted)', marginTop: 2 }}>{opt.icon}</span>
                <div>
                  <p style={{ fontWeight: 700 }}>{opt.label}</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--c-muted)', marginTop: 2 }}>{opt.desc}</p>
                </div>
                {storageMode === opt.id && <CheckCircle size={18} color="var(--c-primary)" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
