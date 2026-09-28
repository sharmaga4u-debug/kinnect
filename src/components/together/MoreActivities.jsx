import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Eraser } from 'lucide-react';
import { useShared, useActivityEvents } from './useShared';

/* Same props as the other activities: { shared, me, names } */

const bigBtn = { minHeight: 52, fontSize: '1.05rem', borderRadius: 16 };

function Banner({ text, mine }) {
  return (
    <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.05rem', padding: '8px 12px', borderRadius: 14, marginBottom: 12, background: mine ? '#DCFCE7' : '#F1F5F9', color: mine ? '#166534' : '#475569' }}>{text}</div>
  );
}

/* ═══════════════════ Watch Together (YouTube, in sync) ═══════════════════ */
function youtubeId(input) {
  const s = String(input || '').trim();
  const m = s.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/) || s.match(/^([\w-]{11})$/);
  return m ? m[1] : null;
}

let ytReady = null;
function loadYouTube() {
  if (ytReady) return ytReady;
  ytReady = new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
  return ytReady;
}

function watchReducer(s, a) {
  if (a.type === 'load') return { videoId: a.videoId, playing: false, t: 0 };
  if (a.type === 'play') return { ...s, playing: true, t: a.t };
  if (a.type === 'pause') return { ...s, playing: false, t: a.t };
  if (a.type === 'close') return { videoId: null, playing: false, t: 0 };
  return s;
}

export function WatchTogether({ shared }) {
  const [s, dispatch] = useShared('watch', watchReducer, { videoId: null, playing: false, t: 0 }, shared);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const holder = useRef(null);
  const player = useRef(null);

  // Create / change the player when the video changes
  useEffect(() => {
    if (!s.videoId) return undefined;
    let dead = false;
    loadYouTube().then((YT) => {
      if (dead || !holder.current) return;
      player.current?.destroy?.();
      const div = document.createElement('div');
      holder.current.innerHTML = '';
      holder.current.appendChild(div);
      player.current = new YT.Player(div, {
        videoId: s.videoId, width: '100%', height: '100%',
        playerVars: { playsinline: 1, controls: 0, rel: 0, modestbranding: 1 },
      });
    });
    return () => { dead = true; };
  }, [s.videoId]);

  // Follow play/pause from either phone
  useEffect(() => {
    const p = player.current;
    if (!p?.seekTo) return;
    const here = p.getCurrentTime?.() || 0;
    if (Math.abs(here - s.t) > 1.5) p.seekTo(s.t, true);
    if (s.playing) p.playVideo?.(); else p.pauseVideo?.();
  }, [s.playing, s.t]);

  useEffect(() => () => player.current?.destroy?.(), []);

  if (!s.videoId) {
    return (
      <div>
        <p style={{ color: '#475569', marginBottom: 10, lineHeight: 1.5 }}>Paste a YouTube link: a bhajan, a cartoon, a cricket highlight. It plays at the same moment on both phones.</p>
        <input className="input" value={link} onChange={e => { setLink(e.target.value); setError(''); }} placeholder="https://youtu.be/…" />
        {error && <p style={{ color: 'var(--c-red)', fontSize: '0.86rem', marginTop: 6 }}>{error}</p>}
        <button className="btn btn-primary btn-full" style={{ ...bigBtn, marginTop: 12 }} onClick={() => {
          const id = youtubeId(link);
          if (!id) { setError("That doesn't look like a YouTube link."); return; }
          dispatch({ type: 'load', videoId: id });
        }}>▶ Watch together</button>
      </div>
    );
  }

  const now = () => player.current?.getCurrentTime?.() || s.t || 0;
  return (
    <div>
      <div ref={holder} data-video-id={s.videoId} style={{ width: '100%', aspectRatio: '16 / 9', background: '#000', borderRadius: 16, overflow: 'hidden' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
        <button className="btn btn-primary" style={bigBtn} onClick={() => dispatch(s.playing ? { type: 'pause', t: now() } : { type: 'play', t: now() })}>
          {s.playing ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Play</>}
        </button>
        <button className="btn btn-ghost" style={bigBtn} onClick={() => dispatch({ type: 'close' })}>Change video</button>
      </div>
      {shared && <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748B', marginTop: 8 }}>{s.playing ? 'Playing on both phones' : 'Paused on both phones'}</p>}
    </div>
  );
}

/* ═══════════════════ Draw & Guess ═══════════════════ */
const WORDS = [
  ['elephant', '🐘'], ['mango', '🥭'], ['kite', '🪁'], ['sun', '☀️'], ['cat', '🐱'], ['house', '🏠'], ['tree', '🌳'], ['fish', '🐟'],
  ['star', '⭐'], ['flower', '🌸'], ['rainbow', '🌈'], ['boat', '⛵'], ['apple', '🍎'], ['ball', '⚽'], ['car', '🚗'], ['moon', '🌙'],
  ['cake', '🎂'], ['butterfly', '🦋'], ['umbrella', '☂️'], ['peacock', '🦚'], ['train', '🚂'], ['banana', '🍌'], ['cow', '🐄'], ['rocket', '🚀'],
];

const guessInit = { round: 0, drawer: 1, word: null, solved: false, scores: { 1: 0, 2: 0 }, lastGuess: '' };

function guessReducer(s, a) {
  if (a.type === 'start') return { ...s, round: s.round + 1, drawer: a.drawer, word: a.word, solved: false, lastGuess: '' };
  if (a.type === 'guess') {
    if (s.solved || !s.word) return s;
    const ok = a.text.trim().toLowerCase() === s.word[0];
    return { ...s, lastGuess: a.text, solved: ok, scores: ok ? { ...s.scores, [a.by]: s.scores[a.by] + 1 } : s.scores };
  }
  if (a.type === 'giveup') return { ...s, solved: true };
  return s;
}

export function DrawAndGuess({ shared, me, names }) {
  const [s, dispatch] = useShared('guess', guessReducer, guessInit, shared);
  const canvas = useRef(null);
  const last = useRef(null);
  const [guess, setGuess] = useState('');
  const other = (p) => (p === 1 ? 2 : 1);
  const iDraw = !shared || s.drawer === me;
  const guesser = shared ? me : other(s.drawer);

  const clear = () => canvas.current?.getContext('2d').clearRect(0, 0, 900, 640);
  const line = (a, b) => {
    const c = canvas.current?.getContext('2d');
    if (!c) return;
    c.strokeStyle = '#1E293B'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(a[0] * 900, a[1] * 640); c.lineTo(b[0] * 900, b[1] * 640); c.stroke();
  };
  const send = useActivityEvents('guess-ink', (ev) => { if (ev.clear) clear(); else line(ev.a, ev.b); }, shared);
  useEffect(() => { clear(); }, [s.round]);

  const pos = (e) => { const r = canvas.current.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return [(t.clientX - r.left) / r.width, (t.clientY - r.top) / r.height]; };
  const down = (e) => { if (!iDraw || s.solved) return; e.preventDefault(); last.current = pos(e); };
  const move = (e) => {
    if (!last.current) return;
    e.preventDefault();
    const p = pos(e);
    line(last.current, p);
    send({ a: last.current.map(n => +n.toFixed(3)), b: p.map(n => +n.toFixed(3)) });
    last.current = p;
  };
  const up = () => { last.current = null; };

  const newRound = () => dispatch({ type: 'start', drawer: s.round === 0 ? 1 : other(s.drawer), word: WORDS[Math.floor(Math.random() * WORDS.length)] });

  if (!s.word) {
    return (
      <div className="empty-state">
        <div className="icon">✏️</div>
        <h3>Draw &amp; Guess</h3>
        <p>One person draws a secret word, the other guesses. Then swap!</p>
        <button className="btn btn-primary" style={{ ...bigBtn, marginTop: 16, padding: '0 28px' }} onClick={newRound}>Start</button>
      </div>
    );
  }

  return (
    <div>
      {s.solved
        ? <Banner text={`${s.lastGuess.toLowerCase() === s.word[0] ? `🎉 ${names[guesser]} guessed it!` : 'The word was'} ${s.word[1]} ${s.word[0]}`} mine />
        : iDraw
          ? <Banner text={`Draw: ${s.word[1]} ${s.word[0].toUpperCase()}`} mine />
          : <Banner text={`${names[s.drawer]} is drawing… guess what it is!`} />}
      <canvas ref={canvas} width={900} height={640}
        style={{ width: '100%', aspectRatio: '900 / 640', background: '#fff', borderRadius: 18, border: '2px solid #E2E8F0', touchAction: 'none', display: 'block' }}
        onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up} onTouchStart={down} onTouchMove={move} onTouchEnd={up} />

      {!s.solved && iDraw && shared && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { clear(); send({ clear: true }); }}><Eraser size={16} /> Clear</button>
          <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'giveup' })}>Reveal the word</button>
        </div>
      )}
      {!s.solved && (!shared || !iDraw) && (
        <form onSubmit={(e) => { e.preventDefault(); if (guess.trim()) { dispatch({ type: 'guess', text: guess, by: guesser }); setGuess(''); } }} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input className="input" value={guess} onChange={e => setGuess(e.target.value)} placeholder="Type your guess" style={{ minHeight: 48 }} />
          <button className="btn btn-primary" style={{ minHeight: 48 }}>Guess</button>
        </form>
      )}
      {!s.solved && s.lastGuess && <p style={{ textAlign: 'center', color: '#64748B', marginTop: 6 }}>“{s.lastGuess}” — not quite, try again!</p>}
      {s.solved && <button className="btn btn-primary btn-full" style={{ ...bigBtn, marginTop: 12 }} onClick={newRound}><RotateCcw size={18} /> Next round (swap)</button>}
      <p style={{ textAlign: 'center', fontWeight: 700, color: '#475569', marginTop: 8 }}>{names[1]} {s.scores[1]} · {names[2]} {s.scores[2]}</p>
    </div>
  );
}

/* ═══════════════════ Light the Diyas (festival) ═══════════════════ */
const DIYAS = 12;
const diyaInit = { lit: Array(DIYAS).fill(0) };
function diyaReducer(s, a) {
  if (a.type === 'light' && !s.lit[a.i]) { const lit = s.lit.slice(); lit[a.i] = a.by; return { lit }; }
  if (a.type === 'reset') return diyaInit;
  return s;
}

export function LightDiyas({ shared, me, names }) {
  const [s, dispatch] = useShared('diyas', diyaReducer, diyaInit, shared);
  const done = s.lit.every(Boolean);
  const count = (p) => s.lit.filter(x => x === p).length;
  return (
    <div style={{ background: 'linear-gradient(180deg,#1E1B4B,#312E81)', borderRadius: 20, padding: 16, color: '#fff', position: 'relative', overflow: 'hidden' }}>
      {done && <div className="fireworks" aria-hidden="true">{['🎆', '🎇', '✨', '🎆', '🎇', '✨'].map((f, i) => <span key={i} style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 0.25}s` }}>{f}</span>)}</div>}
      <p style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
        {done ? '🪔 Happy Diwali! Your home is full of light 🪔' : 'Tap the diyas to light them together'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, margin: '16px 0' }}>
        {s.lit.map((by, i) => (
          <button key={i} onClick={() => dispatch({ type: 'light', i, by: shared ? me : 1 })} aria-label={by ? 'Lit diya' : 'Light this diya'}
            style={{ aspectRatio: '1', borderRadius: 18, border: 'none', cursor: 'pointer', fontSize: '2rem', background: by ? 'radial-gradient(circle, rgba(251,191,36,0.55), rgba(251,191,36,0) 70%)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }}>
            {by ? '🪔' : '🕯️'}
          </button>
        ))}
      </div>
      {shared && <p style={{ textAlign: 'center', opacity: 0.85 }}>{names[1]} lit {count(1)} · {names[2]} lit {count(2)}</p>}
      {done && <button className="btn btn-full" style={{ ...bigBtn, marginTop: 10, background: '#F59E0B', color: '#fff' }} onClick={() => dispatch({ type: 'reset' })}>Light them again</button>}
    </div>
  );
}
