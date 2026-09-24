import React, { useState } from 'react';
import { Users, Plus, LogIn, Copy, Check, Shield, HandMetal, Clock, ChevronRight, X, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

/* ── Join Circle Modal ── */
function JoinModal({ onJoin, onClose }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { circles, joinCircle } = useApp();

  function handleJoin() {
    const found = circles.find(c => c.id.toUpperCase() === code.trim().toUpperCase());
    if (!found) { setError('Group ID not found. Please check and try again.'); return; }
    if (found.isJoined) { setError('You are already a member of this group.'); return; }
    joinCircle(found.id);
    onJoin(found);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card animate-slideUp" style={{ width: '100%', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontWeight: 700 }}>Join a Study Circle</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)' }}><X size={20} /></button>
        </div>

        {/* Privacy note */}
        <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '12px 14px', marginBottom: 18, display: 'flex', gap: 10 }}>
          <Shield size={18} color="var(--c-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontWeight: 700, color: '#166534', fontSize: '0.88rem' }}>Your Privacy is Protected</p>
            <p style={{ color: '#15803D', fontSize: '0.81rem', marginTop: 3, lineHeight: 1.5 }}>
              When you join, you get a private <strong>Member ID</strong> (e.g. MBR-7749-K). No one in the group — not even the creator — can see your phone number or real identity unless you choose to share it.
            </p>
          </div>
        </div>

        <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Enter Group ID</label>
        <input
          className="input"
          placeholder="e.g. GRP-GITA-9021"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
          style={{ marginBottom: 8, fontFamily: 'monospace', letterSpacing: 1, fontSize: '1.1rem' }}
        />
        {error && <p style={{ color: 'var(--c-red)', fontSize: '0.85rem', marginBottom: 10 }}>{error}</p>}
        <button className="btn btn-primary btn-full btn-lg" onClick={handleJoin}>
          <LogIn size={20} /> Join Circle
        </button>

        <div className="divider" />
        <p style={{ color: 'var(--c-muted)', fontSize: '0.82rem', textAlign: 'center' }}>
          Ask the group creator for their Group ID (e.g. GRP-GITA-9021)
        </p>
      </div>
    </div>
  );
}

/* ── Create Circle Modal ── */
function CreateModal({ onClose, onCreated }) {
  const { studyTopics, createCircle } = useApp();
  const [form, setForm] = useState({ name: '', topic: '', icon: '📖', description: '', schedule: '', language: 'English' });
  const [step, setStep] = useState(1);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  function handleCreate() {
    const circle = createCircle(form);
    setCreated(circle);
    setStep(3);
  }

  function handleCopy() {
    navigator.clipboard.writeText(created.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card animate-slideUp" style={{ width: '100%', maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontWeight: 700 }}>
            {step === 1 ? '🌱 Create Study Circle' : step === 2 ? '📋 Circle Details' : '🎉 Circle Created!'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)' }}><X size={20} /></button>
        </div>

        {/* Step 1: Choose topic */}
        {step === 1 && (
          <div className="animate-slideUp">
            <p style={{ color: 'var(--c-muted)', fontSize: '0.88rem', marginBottom: 16 }}>
              Choose the learning topic for your circle. Anyone can join using your Group ID.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
              {useApp().studyTopics.map(t => (
                <button
                  key={t.id}
                  onClick={() => setForm(f => ({ ...f, topic: t.label, icon: t.icon }))}
                  style={{
                    padding: '14px 12px', borderRadius: 14, border: `2px solid ${form.topic === t.label ? t.color : 'var(--c-border)'}`,
                    background: form.topic === t.label ? t.color + '18' : 'var(--c-surface)',
                    cursor: 'pointer', textAlign: 'center', color: 'var(--c-text)',
                    transition: 'all 0.18s',
                  }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{t.icon}</div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{t.label}</p>
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-full" disabled={!form.topic} onClick={() => setStep(2)}>
              Continue <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="animate-slideUp">
            {[
              { label: 'Circle Name', key: 'name', placeholder: 'e.g. Morning Gita Satsang' },
              { label: 'Schedule', key: 'schedule', placeholder: 'e.g. Daily 7:00 AM – 7:30 AM' },
              { label: 'Language', key: 'language', placeholder: 'e.g. Hindi, English, Tamil' },
              { label: 'Brief Description', key: 'description', placeholder: 'What will you learn & discuss?' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: '0.9rem' }}>{f.label}</label>
                {f.key === 'description'
                  ? <textarea className="input" rows={3} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ resize: 'none' }} />
                  : <input className="input" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                }
              </div>
            ))}

            {/* Privacy reminder */}
            <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '10px 12px', marginBottom: 16, display: 'flex', gap: 8 }}>
              <Shield size={15} color="var(--c-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: '0.8rem', color: '#166534' }}>
                Each member gets a unique anonymous Member ID. No phone numbers are ever shared within the group.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!form.name || !form.schedule} style={{ flex: 2 }}>
                Create Circle 🌱
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && created && (
          <div className="animate-slideUp" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎉</div>
            <h3 style={{ fontWeight: 800, marginBottom: 4 }}>{created.name}</h3>
            <p style={{ color: 'var(--c-muted)', fontSize: '0.88rem', marginBottom: 20 }}>
              Share this Group ID with friends & family to invite them:
            </p>

            <div style={{
              background: 'linear-gradient(135deg, #0F172A, #1E293B)',
              borderRadius: 16, padding: '18px 20px', marginBottom: 20, position: 'relative',
            }}>
              <p style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 800, color: '#34D399', letterSpacing: 2 }}>
                {created.id}
              </p>
              <button
                onClick={handleCopy}
                style={{
                  position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8,
                  padding: '8px 10px', cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem',
                }}
              >
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>

            <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '12px 14px', marginBottom: 18, textAlign: 'left', display: 'flex', gap: 10 }}>
              <Shield size={18} color="var(--c-primary)" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, color: '#166534', fontSize: '0.88rem' }}>Your Member ID</p>
                <p style={{ fontFamily: 'monospace', fontWeight: 800, color: '#15803D', fontSize: '1rem' }}>{created.myMemberId}</p>
                <p style={{ fontSize: '0.78rem', color: '#16A34A', marginTop: 2 }}>This is how you appear in the group — anonymous by default.</p>
              </div>
            </div>

            <button className="btn btn-primary btn-full" onClick={() => { onCreated(created); onClose(); }}>
              Enter My Circle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Circle Detail Sheet ── */
function CircleSheet({ circle, onClose }) {
  const { joinCircle, leaveCircle } = useApp();
  const [handRaised, setHandRaised] = useState(false);
  const [joined, setJoined] = useState(circle.isJoined);
  const [memberId, setMemberId] = useState(circle.myMemberId);
  const [copied, setCopied] = useState(false);

  function handleJoin() {
    joinCircle(circle.id);
    setJoined(true);
    setMemberId(circle.myMemberId); // will update after context re-renders
  }

  function handleLeave() {
    leaveCircle(circle.id);
    setJoined(false);
    setMemberId(null);
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card animate-slideUp" style={{ width: '100%', maxWidth: 440, maxHeight: '90dvh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: 4 }}>{circle.icon}</div>
            <h2 style={{ fontWeight: 800, fontSize: '1.25rem' }}>{circle.name}</h2>
            <span className="badge badge-violet">{circle.topic}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)' }}><X size={20} /></button>
        </div>

        {/* Group ID */}
        <div style={{ background: '#0F172A', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#94A3B8', fontSize: '0.75rem', marginBottom: 2 }}>Group ID</p>
            <p style={{ fontFamily: 'monospace', fontWeight: 800, color: '#34D399', fontSize: '1.05rem', letterSpacing: 1 }}>{circle.id}</p>
          </div>
          <button onClick={() => handleCopy(circle.id)} style={{ background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#fff', fontSize: '0.78rem', display: 'flex', gap: 4, alignItems: 'center' }}>
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
          </button>
        </div>

        {/* My Member ID */}
        {joined && memberId && (
          <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Shield size={16} color="var(--c-primary)" />
              <p style={{ fontWeight: 700, color: '#166534', fontSize: '0.88rem' }}>Your Anonymous Member ID</p>
            </div>
            <p style={{ fontFamily: 'monospace', fontWeight: 800, color: '#15803D', fontSize: '1.1rem', marginTop: 4 }}>{memberId}</p>
            <p style={{ fontSize: '0.78rem', color: '#16A34A', marginTop: 2 }}>
              Other members only see this ID — not your name, phone, or identity. You are safe and anonymous.
            </p>
          </div>
        )}

        {/* Details */}
        {[
          { icon: <Users size={15} />, label: `${circle.memberCount} Members` },
          { icon: <Clock size={15} />, label: circle.schedule },
          { icon: <BookOpen size={15} />, label: circle.language },
          { icon: <ChevronRight size={15} />, label: circle.level },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--c-muted)', fontSize: '0.88rem', marginBottom: 6 }}>
            {row.icon} {row.label}
          </div>
        ))}

        <p style={{ color: 'var(--c-text)', fontSize: '0.9rem', lineHeight: 1.7, margin: '14px 0' }}>{circle.description}</p>

        {/* Next session */}
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)' }}>Next Session</p>
          <p style={{ fontWeight: 700, color: 'var(--c-text)' }}>📅 {circle.nextSession}</p>
        </div>

        {/* Raise hand */}
        {joined && (
          <button
            className="btn btn-full btn-sm"
            onClick={() => { setHandRaised(h => !h); }}
            style={{
              background: handRaised ? '#FEF3C7' : 'var(--c-surface)',
              border: `2px solid ${handRaised ? '#D97706' : 'var(--c-border)'}`,
              color: handRaised ? '#92400E' : 'var(--c-text)',
              marginBottom: 12,
              justifyContent: 'flex-start', gap: 10,
            }}
          >
            <HandMetal size={20} />
            {handRaised ? '✋ Hand Raised – Waiting for your turn…' : '🙋 Raise Hand to Ask a Doubt'}
          </button>
        )}

        {/* Join / Leave */}
        {!joined ? (
          <button className="btn btn-primary btn-full btn-lg" onClick={handleJoin}>
            <LogIn size={20} /> Join This Circle
          </button>
        ) : (
          <button className="btn btn-ghost btn-full" onClick={handleLeave} style={{ color: 'var(--c-red)', borderColor: 'var(--c-red)' }}>
            Leave Circle
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function StudyCircle() {
  const { circles, studyTopics } = useApp();
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [detailCircle, setDetailCircle] = useState(null);
  const [joinedCircle, setJoinedCircle] = useState(null);

  const filtered = selectedTopic === 'all' ? circles : circles.filter(c => c.topic === selectedTopic || studyTopics.find(t => t.id === selectedTopic)?.label === c.topic);

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 className="section-title">👥 Learning Circles</h1>
      </div>

      {/* Privacy banner */}
      <div style={{
        background: 'linear-gradient(135deg, #312E81, #4C1D95)',
        borderRadius: 18, padding: '16px 18px', marginBottom: 20, color: '#fff',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <Shield size={22} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 3 }}>Anonymous & Safe for Everyone</p>
          <p style={{ fontSize: '0.83rem', opacity: 0.87, lineHeight: 1.6 }}>
            Every member gets a unique <strong>Member ID</strong> (like MBR-7749-K) when joining a circle. No phone numbers, no real names visible to the group — safe for girls, boys, students, teachers, and VIPs alike.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
        <button className="btn btn-primary btn-full" onClick={() => setShowJoin(true)}>
          <LogIn size={18} /> Join with ID
        </button>
        <button className="btn btn-ghost btn-full" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> Create Circle
        </button>
      </div>

      {/* Topic filters */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 18 }}>
        <button className={`chip ${selectedTopic === 'all' ? 'active' : ''}`} onClick={() => setSelectedTopic('all')}>
          🌐 All Topics
        </button>
        {studyTopics.map(t => (
          <button key={t.id} className={`chip ${selectedTopic === t.id ? 'active' : ''}`} onClick={() => setSelectedTopic(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Joined circles */}
      {circles.filter(c => c.isJoined).length > 0 && (
        <section style={{ marginBottom: 22 }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
            ✅ My Circles <span className="badge badge-green">{circles.filter(c => c.isJoined).length}</span>
          </h2>
          {circles.filter(c => c.isJoined).map(c => (
            <div
              key={c.id} className="contact-row" style={{ cursor: 'pointer', border: '2px solid var(--c-primary)', background: '#F0FDF4' }}
              onClick={() => setDetailCircle(c)}
            >
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>{c.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{c.name}</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--c-muted)' }}>{c.schedule}</p>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <span className="badge badge-green">Joined</span>
                  {c.myMemberId && (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                      🛡️ {c.myMemberId}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} color="var(--c-muted)" />
            </div>
          ))}
        </section>
      )}

      {/* Discover circles */}
      <section>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 12 }}>🔍 Discover Circles</h2>
        {filtered.filter(c => !c.isJoined).length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--c-muted)', padding: '40px 0' }}>
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>🌱</p>
            <p>No circles found. Be the first to create one!</p>
          </div>
        )}
        {filtered.filter(c => !c.isJoined).map(c => (
          <div key={c.id} className="contact-row" style={{ cursor: 'pointer' }} onClick={() => setDetailCircle(c)}>
            <div style={{ fontSize: '2rem', flexShrink: 0 }}>{c.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{c.name}</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--c-muted)', marginTop: 2 }}>{c.description}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="badge badge-gray"><Users size={11} /> {c.memberCount} members</span>
                <span className="badge badge-blue"><Clock size={11} /> {c.nextSession}</span>
              </div>
            </div>
            <ChevronRight size={18} color="var(--c-muted)" />
          </div>
        ))}
      </section>

      {/* Modals */}
      {showJoin && (
        <JoinModal
          onJoin={(c) => { setJoinedCircle(c); setShowJoin(false); }}
          onClose={() => setShowJoin(false)}
        />
      )}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => setDetailCircle(c)}
        />
      )}
      {detailCircle && (
        <CircleSheet circle={detailCircle} onClose={() => setDetailCircle(null)} />
      )}

      {/* Success toast */}
      {joinedCircle && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: '#0F172A', color: '#fff', padding: '12px 20px', borderRadius: 12,
          fontSize: '0.88rem', fontWeight: 600, zIndex: 200, display: 'flex', gap: 8, alignItems: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
        }}>
          ✅ Joined {joinedCircle.name}!
          <button onClick={() => setJoinedCircle(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', marginLeft: 4 }}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
