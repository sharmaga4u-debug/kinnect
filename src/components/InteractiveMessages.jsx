import React, { useState } from 'react';
import { Image as ImageIcon, BarChart3, ListChecks, MapPin, Plus, Trash2, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getLocation, mapLink, startLiveShare, stopLiveShare } from '../services/location';
import Sheet from './Sheet';

/* ── Poll bubble ─────────────────────────────────────────── */
export function PollBubble({ m, chatKey }) {
  const { user, votePoll } = useApp();
  const votes = m.votes || {};
  const total = Object.keys(votes).length;
  const mine = votes[user.id];
  return (
    <div style={{ minWidth: 220 }}>
      <p style={{ fontWeight: 800, marginBottom: 8 }}>📊 {m.poll.q}</p>
      {m.poll.options.map((opt, i) => {
        const n = Object.values(votes).filter(v => v === i).length;
        const pct = total ? Math.round((n / total) * 100) : 0;
        return (
          <button key={i} onClick={(e) => { e.stopPropagation(); votePoll(chatKey, m.id, i); }} aria-label={`Vote ${opt}`}
            className={`poll-option ${mine === i ? 'mine' : ''}`}>
            <span className="poll-bar" style={{ width: `${pct}%` }} />
            <span className="poll-label">{mine === i ? '✓ ' : ''}{opt}</span>
            <span className="poll-count">{n}</span>
          </button>
        );
      })}
      <p style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 4 }}>{total} vote{total === 1 ? '' : 's'} · tap to vote</p>
    </div>
  );
}

/* ── Shared list bubble ──────────────────────────────────── */
export function ListBubble({ m, chatKey }) {
  const { editList } = useApp();
  const [text, setText] = useState('');
  const items = m.list.items || [];
  const done = items.filter(i => i.done).length;
  return (
    <div style={{ minWidth: 230 }} onClick={e => e.stopPropagation()}>
      <p style={{ fontWeight: 800, marginBottom: 6 }}>📝 {m.list.title} <span style={{ fontWeight: 600, color: '#64748B', fontSize: '0.8rem' }}>{done}/{items.length}</span></p>
      {items.map(i => (
        <button key={i.id} className="list-item" onClick={() => editList(chatKey, m.id, { type: 'toggle', id: i.id, done: !i.done })}>
          <span className={`check-dot ${i.done ? 'on' : ''}`} style={{ width: 22, height: 22 }}>{i.done && <Check size={13} />}</span>
          <span style={{ textDecoration: i.done ? 'line-through' : 'none', color: i.done ? '#94A3B8' : 'inherit', flex: 1, textAlign: 'left' }}>{i.text}</span>
          {i.done && i.doneBy && <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{i.doneBy.split(' ')[0]}</span>}
        </button>
      ))}
      <form style={{ display: 'flex', gap: 6, marginTop: 6 }} onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        editList(chatKey, m.id, { type: 'add', item: { id: 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), text: text.trim(), done: false } });
        setText('');
      }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Add item" className="list-add-input" />
        <button className="list-add-btn" aria-label="Add item"><Plus size={16} /></button>
      </form>
    </div>
  );
}

/* ── Live location bubble ────────────────────────────────── */
export function LocationBubble({ m, chatKey }) {
  const { updateLiveLocation } = useApp();
  const live = m.loc.until > Date.now();
  const ago = Math.max(0, Math.round((Date.now() - (m.loc.at || m.timestamp)) / 60000));
  return (
    <div style={{ minWidth: 220 }} onClick={e => e.stopPropagation()}>
      <div className="loc-card">
        <span style={{ fontSize: '2.2rem' }}>📍</span>
        <div>
          <p style={{ fontWeight: 800 }}>{live ? 'Live location' : 'Location (ended)'}</p>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            {live ? `Until ${new Date(m.loc.until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · ` : ''}updated {ago ? `${ago} min ago` : 'just now'}
          </p>
        </div>
      </div>
      <a href={mapLink(m.loc)} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary" style={{ width: '100%', textDecoration: 'none', marginTop: 6 }}>Open map</a>
      {m.isMe && live && (
        <button className="btn btn-sm btn-ghost" style={{ width: '100%', marginTop: 6 }} onClick={() => { stopLiveShare(m.id); updateLiveLocation(chatKey, m.id, { until: Date.now() }); }}>
          Stop sharing
        </button>
      )}
    </div>
  );
}

/* ── Attach menu: photo, poll, list, live location ───────── */
export function AttachSheet({ chatKey, onClose, onPhoto }) {
  const { sendMessage, updateLiveLocation } = useApp();
  const [mode, setMode] = useState('menu');
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState(['', '']);
  const [listTitle, setListTitle] = useState('');
  const [items, setItems] = useState(['']);
  const [locState, setLocState] = useState('');

  async function shareLocation(minutes) {
    setLocState('Getting your location…');
    const loc = await getLocation();
    if (!loc) { setLocState('Location is off or not allowed. Turn it on for Kinnect in your phone settings.'); return; }
    const until = Date.now() + minutes * 60000;
    const id = sendMessage(chatKey, '', 'location', { loc: { ...loc, until } });
    if (id) startLiveShare(id, until, (fresh) => updateLiveLocation(chatKey, id, fresh)); // keep it fresh
    onClose();
  }

  if (mode === 'poll') {
    const ready = q.trim() && opts.filter(o => o.trim()).length >= 2;
    return (
      <Sheet title="Create a poll" onClose={onClose} onBack={() => setMode('menu')}
        footer={<button className="btn btn-primary btn-full" disabled={!ready} onClick={() => { sendMessage(chatKey, '', 'poll', { poll: { q: q.trim(), options: opts.map(o => o.trim()).filter(Boolean) } }); onClose(); }}>Send poll</button>}>
        <label className="field-label">Question</label>
        <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. Diwali dinner at whose house?" />
        <label className="field-label" style={{ marginTop: 12 }}>Options</label>
        {opts.map((o, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input className="input" value={o} onChange={e => setOpts(opts.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Option ${i + 1}`} />
            {opts.length > 2 && <button className="icon-btn" onClick={() => setOpts(opts.filter((_, j) => j !== i))} aria-label="Remove option"><Trash2 size={18} /></button>}
          </div>
        ))}
        {opts.length < 6 && <button className="pill-btn" onClick={() => setOpts([...opts, ''])}><Plus size={15} /> Add option</button>}
      </Sheet>
    );
  }

  if (mode === 'list') {
    const clean = items.map(i => i.trim()).filter(Boolean);
    return (
      <Sheet title="Shared list" onClose={onClose} onBack={() => setMode('menu')}
        footer={<button className="btn btn-primary btn-full" disabled={!listTitle.trim()} onClick={() => {
          sendMessage(chatKey, '', 'list', { list: { title: listTitle.trim(), items: clean.map((text, n) => ({ id: `i${Date.now().toString(36)}${n}`, text, done: false })) } });
          onClose();
        }}>Send list</button>}>
        <p style={{ color: 'var(--c-muted)', marginBottom: 10 }}>Everyone in the chat can add items and tick them off.</p>
        <label className="field-label">Title</label>
        <input className="input" value={listTitle} onChange={e => setListTitle(e.target.value)} placeholder="e.g. Groceries for Sunday lunch" />
        <label className="field-label" style={{ marginTop: 12 }}>Items</label>
        {items.map((it, i) => (
          <input key={i} className="input" style={{ marginBottom: 6 }} value={it} placeholder={`Item ${i + 1}`}
            onChange={e => { const next = items.map((x, j) => (j === i ? e.target.value : x)); if (i === items.length - 1 && e.target.value) next.push(''); setItems(next); }} />
        ))}
      </Sheet>
    );
  }

  if (mode === 'location') {
    return (
      <Sheet title="Share live location" onClose={onClose} onBack={() => setMode('menu')}>
        <p style={{ color: 'var(--c-muted)', marginBottom: 12 }}>Your location updates in this chat while Kinnect is open, then stops automatically.</p>
        {[15, 60].map(min => (
          <button key={min} className="btn btn-ghost btn-full" style={{ marginBottom: 8 }} onClick={() => shareLocation(min)}>📍 For {min === 60 ? '1 hour' : '15 minutes'}</button>
        ))}
        {locState && <p style={{ color: 'var(--c-text-soft)', marginTop: 6 }}>{locState}</p>}
      </Sheet>
    );
  }

  return (
    <Sheet title="Share" onClose={onClose}>
      <div className="attach-grid">
        {[
          [ImageIcon, 'Photo', '#2563EB', () => { onClose(); setTimeout(onPhoto, 50); }],
          [BarChart3, 'Poll', '#7C3AED', () => setMode('poll')],
          [ListChecks, 'List', '#16A34A', () => setMode('list')],
          [MapPin, 'Location', '#DC2626', () => setMode('location')],
        ].map(([Icon, label, color, go]) => (
          <button key={label} className="attach-btn" onClick={go}>
            <span style={{ background: color }}><Icon size={24} color="#fff" /></span>
            {label}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
