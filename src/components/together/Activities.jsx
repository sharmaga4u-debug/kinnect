import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Volume2, Square, RotateCcw, Eraser } from 'lucide-react';
import { useShared, useActivityEvents, seededRandom } from './useShared';
import { STORIES } from '../../data/stories';
import { speak, stopSpeaking, canSpeak } from '../../utils/speech';

/* Every activity takes the same props:
   shared  – true on a call (moves sync to the other phone), false when playing on one phone
   me      – 1 (the caller) or 2 (the person called); ignored when not shared
   names   – { 1: 'Asha', 2: 'Bala' } for turn labels */

export const ACTIVITIES = [
  { id: 'draw', title: 'Draw Together', emoji: '🎨', color: '#DB2777', blurb: 'Draw on the same page at the same time' },
  { id: 'story', title: 'Story Time', emoji: '📖', color: '#D97706', blurb: 'Read a picture story together' },
  { id: 'tictactoe', title: 'Tic-Tac-Toe', emoji: '❌', color: '#2563EB', blurb: 'Classic noughts and crosses' },
  { id: 'memory', title: 'Memory Match', emoji: '🧠', color: '#7C3AED', blurb: 'Find the matching animal pairs' },
  { id: 'snakes', title: 'Snakes & Ladders', emoji: '🐍', color: '#16A34A', blurb: 'Roll the dice, climb the ladders' },
];

export function ActivityView({ id, ...props }) {
  if (id === 'draw') return <DrawTogether {...props} />;
  if (id === 'story') return <StoryTime {...props} />;
  if (id === 'tictactoe') return <TicTacToe {...props} />;
  if (id === 'memory') return <MemoryMatch {...props} />;
  if (id === 'snakes') return <SnakesAndLadders {...props} />;
  return null;
}

const bigBtn = { minHeight: 52, fontSize: '1.05rem', borderRadius: 16 };

function TurnBanner({ text, mine }) {
  return (
    <div style={{
      textAlign: 'center', fontWeight: 800, fontSize: '1.05rem', padding: '8px 12px', borderRadius: 14, marginBottom: 12,
      background: mine ? '#DCFCE7' : '#F1F5F9', color: mine ? '#166534' : '#475569',
    }}>{text}</div>
  );
}

/* ═══════════════════ Draw Together ═══════════════════ */
const COLORS = ['#111827', '#DC2626', '#F97316', '#FACC15', '#16A34A', '#2563EB', '#9333EA', '#EC4899'];
const STICKERS = ['⭐', '❤️', '🌸', '🐘', '🦋', '🌈'];

function DrawTogether({ shared }) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#2563EB');
  const [sticker, setSticker] = useState(null);
  const stroke = useRef(null); // { pts: [[x,y]...], color, last }
  const pending = useRef([]);

  // Coordinates are 0..1 so drawings line up on phones with different screen sizes
  function toPoint(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return [(t.clientX - rect.left) / rect.width, (t.clientY - rect.top) / rect.height];
  }

  function drawSegment(pts, c, size = 6) {
    const canvas = canvasRef.current;
    if (!canvas || pts.length < 2) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = c;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * canvas.width, pts[0][1] * canvas.height);
    for (const [x, y] of pts.slice(1)) ctx.lineTo(x * canvas.width, y * canvas.height);
    ctx.stroke();
  }

  function drawSticker(s, [x, y]) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.font = `${canvas.width * 0.09}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x * canvas.width, y * canvas.height);
  }

  function clearLocal() {
    const canvas = canvasRef.current;
    canvas?.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }

  const send = useActivityEvents('draw', (a) => {
    if (a.type === 'line') drawSegment(a.pts, a.color);
    else if (a.type === 'sticker') drawSticker(a.s, a.at);
    else if (a.type === 'clear') clearLocal();
  }, shared);

  // Send stroke points in small batches (about 12 per second)
  useEffect(() => {
    const t = setInterval(() => {
      if (pending.current.length > 1) {
        send({ type: 'line', pts: pending.current.map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]), color: stroke.current?.color || color });
        pending.current = pending.current.slice(-1); // keep last point so segments join
      }
    }, 80);
    return () => clearInterval(t);
  }, [send, color]);

  function start(e) {
    e.preventDefault();
    const p = toPoint(e);
    if (sticker) {
      drawSticker(sticker, p);
      send({ type: 'sticker', s: sticker, at: p });
      return;
    }
    stroke.current = { color, last: p };
    pending.current = [p];
  }
  function move(e) {
    if (!stroke.current) return;
    e.preventDefault();
    const p = toPoint(e);
    drawSegment([stroke.current.last, p], stroke.current.color);
    stroke.current.last = p;
    pending.current.push(p);
  }
  function end() {
    if (stroke.current && pending.current.length > 1) {
      send({ type: 'line', pts: pending.current, color: stroke.current.color });
    }
    pending.current = [];
    stroke.current = null;
  }

  return (
    <div>
      <canvas
        ref={canvasRef} width={900} height={640}
        style={{ width: '100%', aspectRatio: '900 / 640', background: '#fff', borderRadius: 18, border: '2px solid #E2E8F0', touchAction: 'none', display: 'block' }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'center' }}>
        {COLORS.map(c => (
          <button key={c} onClick={() => { setColor(c); setSticker(null); }} aria-label={`Colour ${c}`} style={{
            width: 36, height: 36, minWidth: 0, flexShrink: 1, borderRadius: '50%', background: c, cursor: 'pointer',
            border: color === c && !sticker ? '4px solid #0E7490' : '3px solid #fff', boxShadow: '0 0 0 1px #CBD5E1',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        {STICKERS.map(s => (
          <button key={s} onClick={() => setSticker(sticker === s ? null : s)} aria-label={`Sticker ${s}`} style={{
            width: 44, height: 44, borderRadius: 12, fontSize: '1.4rem', cursor: 'pointer',
            background: sticker === s ? '#FEF3C7' : '#F8FAFC', border: `2px solid ${sticker === s ? '#F59E0B' : '#E2E8F0'}`,
          }}>{s}</button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={() => { clearLocal(); send({ type: 'clear' }); }} style={{ marginLeft: 4 }}>
          <Eraser size={16} /> Clear
        </button>
      </div>
      {sticker && <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748B', marginTop: 6 }}>Tap the page to stick {sticker}</p>}
    </div>
  );
}

/* ═══════════════════ Story Time ═══════════════════ */
function storyReducer(s, a) {
  if (a.type === 'open') return { storyId: a.storyId, page: 0 };
  if (a.type === 'page') return { ...s, page: a.page };
  if (a.type === 'close') return { storyId: null, page: 0 };
  return s;
}

function StoryTime({ shared }) {
  const [state, dispatch] = useShared('story', storyReducer, { storyId: null, page: 0 }, shared);
  const [reading, setReading] = useState(false);
  const story = STORIES.find(s => s.id === state.storyId);

  useEffect(() => () => { stopSpeaking(); }, []);
  useEffect(() => { stopSpeaking(); setReading(false); }, [state.storyId, state.page]);

  if (!story) {
    return (
      <div>
        <p style={{ textAlign: 'center', color: '#64748B', marginBottom: 12, fontSize: '1rem' }}>Pick a story to read together</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {STORIES.map(s => (
            <button key={s.id} onClick={() => dispatch({ type: 'open', storyId: s.id })} style={{
              background: '#fff', border: `2px solid ${s.color}33`, borderRadius: 18, padding: '16px 10px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: '2.6rem' }}>{s.cover}</span>
              <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.95rem', textAlign: 'center', lineHeight: 1.3 }}>{s.title}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const page = story.pages[state.page];
  const last = state.page === story.pages.length - 1;

  async function readAloud() {
    if (reading) { stopSpeaking(); setReading(false); return; }
    setReading(true);
    await speak(page.text.replace('✨', ''));
    setReading(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button className="pill-btn" onClick={() => dispatch({ type: 'close' })}><ChevronLeft size={16} /> All stories</button>
        <span style={{ fontWeight: 700, color: '#64748B' }}>Page {state.page + 1} of {story.pages.length}</span>
      </div>
      <div style={{ background: '#FFFBEB', border: `2px solid ${story.color}33`, borderRadius: 22, padding: '18px 18px 20px', textAlign: 'center' }}>
        <p style={{ fontWeight: 800, color: story.color, fontSize: '0.95rem' }}>{story.title}</p>
        <div style={{ fontSize: '3.6rem', margin: '10px 0', lineHeight: 1.2 }}>{page.art}</div>
        <p style={{ fontSize: 'calc(1.2rem * var(--app-font-scale))', lineHeight: 1.6, color: '#1E293B', whiteSpace: 'pre-line', fontWeight: 500 }}>{page.text}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginTop: 12 }}>
        <button className="btn btn-ghost" style={bigBtn} disabled={state.page === 0} onClick={() => dispatch({ type: 'page', page: state.page - 1 })}>
          <ChevronLeft size={22} /> Back
        </button>
        {canSpeak && (
          <button className="btn btn-ghost" style={{ ...bigBtn, padding: '0 14px' }} onClick={readAloud} aria-label="Read aloud">
            {reading ? <Square size={20} /> : <Volume2 size={22} />}
          </button>
        )}
        <button className="btn btn-primary" style={bigBtn} onClick={() => dispatch(last ? { type: 'close' } : { type: 'page', page: state.page + 1 })}>
          {last ? 'The End 🎉' : <>Next <ChevronRight size={22} /></>}
        </button>
      </div>
      {shared && <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748B', marginTop: 8 }}>Pages turn on both phones</p>}
    </div>
  );
}

/* ═══════════════════ Tic-Tac-Toe ═══════════════════ */
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const tttInit = { board: Array(9).fill(0), turn: 1, winner: 0, starter: 1 };

function tttReducer(s, a) {
  if (a.type === 'reset') {
    const starter = s.starter === 1 ? 2 : 1;
    return { ...tttInit, turn: starter, starter };
  }
  if (a.type === 'move') {
    if (s.winner || s.board[a.i] || a.by !== s.turn) return s;
    const board = s.board.slice();
    board[a.i] = a.by;
    const line = LINES.find(l => l.every(i => board[i] === a.by));
    const winner = line ? a.by : (board.every(Boolean) ? -1 : 0);
    return { ...s, board, turn: a.by === 1 ? 2 : 1, winner, line };
  }
  return s;
}

function TicTacToe({ shared, me, names }) {
  const [s, dispatch] = useShared('tictactoe', tttReducer, tttInit, shared);
  const mark = { 1: '❌', 2: '⭕' };
  const actor = shared ? me : s.turn;
  const myTurn = !shared || s.turn === me;

  const status = s.winner === -1 ? "It's a draw! 🤝"
    : s.winner ? `${names[s.winner]} wins! ${mark[s.winner]} 🎉`
    : shared ? (myTurn ? `Your turn ${mark[me]}` : `${names[s.turn]}'s turn…`)
    : `${names[s.turn]}'s turn ${mark[s.turn]}`;

  return (
    <div>
      <TurnBanner text={status} mine={myTurn && !s.winner} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 330, margin: '0 auto' }}>
        {s.board.map((v, i) => (
          <button key={i} onClick={() => myTurn && dispatch({ type: 'move', i, by: actor })} aria-label={`Square ${i + 1}`} style={{
            aspectRatio: '1', borderRadius: 18, fontSize: '2.6rem', cursor: 'pointer',
            background: s.line?.includes(i) ? '#DCFCE7' : '#fff', border: '2px solid #E2E8F0',
          }}>{v ? mark[v] : ''}</button>
        ))}
      </div>
      <button className="btn btn-ghost btn-full" style={{ ...bigBtn, marginTop: 14 }} onClick={() => dispatch({ type: 'reset' })}>
        <RotateCcw size={18} /> New game
      </button>
    </div>
  );
}

/* ═══════════════════ Memory Match ═══════════════════ */
const ANIMALS = ['🐘', '🦚', '🐯', '🐒', '🦜', '🐄'];

function dealCards(seed) {
  const rnd = seededRandom(seed);
  const cards = [...ANIMALS, ...ANIMALS];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

const memInit = { cards: null, flipped: [], matched: [], turn: 1, scores: { 1: 0, 2: 0 }, waiting: false };

function memReducer(s, a) {
  if (a.type === 'new') return { ...memInit, cards: dealCards(a.seed) };
  if (!s.cards) return s;
  if (a.type === 'flip') {
    if (s.waiting || a.by !== s.turn || s.flipped.includes(a.i) || s.matched.includes(a.i)) return s;
    const flipped = [...s.flipped, a.i];
    if (flipped.length < 2) return { ...s, flipped };
    const [x, y] = flipped;
    if (s.cards[x] === s.cards[y]) {
      return { ...s, flipped: [], matched: [...s.matched, x, y], scores: { ...s.scores, [a.by]: s.scores[a.by] + 1 } };
    }
    return { ...s, flipped, waiting: true };
  }
  if (a.type === 'hide') {
    if (!s.waiting) return s;
    return { ...s, flipped: [], waiting: false, turn: s.turn === 1 ? 2 : 1 };
  }
  return s;
}

function MemoryMatch({ shared, me, names }) {
  const [s, dispatch] = useShared('memory', memReducer, memInit, shared);
  const actor = shared ? me : s.turn;
  const myTurn = !shared || s.turn === me;

  // The player who flipped the mismatched pair turns them back over
  useEffect(() => {
    if (!s.waiting || !myTurn) return undefined;
    const t = setTimeout(() => dispatch({ type: 'hide' }), 1100);
    return () => clearTimeout(t);
  }, [s.waiting, myTurn, dispatch]);

  if (!s.cards) {
    return (
      <div className="empty-state">
        <div className="icon">🧠</div>
        <h3>Memory Match</h3>
        <p>Take turns flipping two cards. Find a pair and you go again!</p>
        <button className="btn btn-primary" style={{ ...bigBtn, marginTop: 16, padding: '0 28px' }} onClick={() => dispatch({ type: 'new', seed: Math.floor(Math.random() * 1e9) })}>
          Start game
        </button>
      </div>
    );
  }

  const done = s.matched.length === s.cards.length;
  const winner = s.scores[1] === s.scores[2] ? 0 : (s.scores[1] > s.scores[2] ? 1 : 2);
  const status = done
    ? (winner ? `${names[winner]} wins! 🎉` : "It's a tie! 🤝")
    : shared ? (myTurn ? 'Your turn: flip two cards' : `${names[s.turn]}'s turn…`) : `${names[s.turn]}'s turn`;

  return (
    <div>
      <TurnBanner text={status} mine={myTurn && !done} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 10, fontWeight: 700, color: '#475569' }}>
        <span>{names[1]}: {s.scores[1]}</span><span>{names[2]}: {s.scores[2]}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {s.cards.map((c, i) => {
          const open = s.flipped.includes(i) || s.matched.includes(i);
          return (
            <button key={i} onClick={() => myTurn && dispatch({ type: 'flip', i, by: actor })} aria-label={open ? c : 'Hidden card'} style={{
              aspectRatio: '3 / 4', borderRadius: 14, fontSize: '2.1rem', cursor: 'pointer',
              background: s.matched.includes(i) ? '#DCFCE7' : open ? '#fff' : 'linear-gradient(135deg,#7C3AED,#DB2777)',
              border: '2px solid #E2E8F0', transition: 'background 0.2s',
            }}>{open ? c : ''}</button>
          );
        })}
      </div>
      {done && (
        <button className="btn btn-primary btn-full" style={{ ...bigBtn, marginTop: 14 }} onClick={() => dispatch({ type: 'new', seed: Math.floor(Math.random() * 1e9) })}>
          <RotateCcw size={18} /> Play again
        </button>
      )}
    </div>
  );
}

/* ═══════════════════ Snakes & Ladders ═══════════════════ */
const GOAL = 30;
const JUMPS = { 3: 11, 6: 17, 9: 18, 14: 4, 20: 29, 22: 13, 27: 8 }; // up = ladder, down = snake
const snakesInit = { pos: { 1: 0, 2: 0 }, turn: 1, last: null, winner: 0 };

function snakesReducer(s, a) {
  if (a.type === 'reset') return snakesInit;
  if (a.type === 'roll') {
    if (s.winner || a.by !== s.turn) return s;
    let to = s.pos[a.by] + a.value;
    if (to > GOAL) to = s.pos[a.by]; // need the exact number to finish
    const jump = JUMPS[to];
    const landed = jump ?? to;
    const winner = landed === GOAL ? a.by : 0;
    return {
      pos: { ...s.pos, [a.by]: landed },
      turn: a.value === 6 && !winner ? a.by : (a.by === 1 ? 2 : 1), // a six rolls again
      last: { by: a.by, value: a.value, jump: jump ? (jump > to ? 'ladder' : 'snake') : null },
      winner,
    };
  }
  return s;
}

function SnakesAndLadders({ shared, me, names }) {
  const [s, dispatch] = useShared('snakes', snakesReducer, snakesInit, shared);
  const actor = shared ? me : s.turn;
  const myTurn = !shared || s.turn === me;
  const tokens = { 1: '🔴', 2: '🔵' };
  const dice = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  // Board rows zig-zag like a real board, 1 at bottom-left
  const rows = [];
  for (let r = GOAL / 6 - 1; r >= 0; r--) {
    const row = Array.from({ length: 6 }, (_, c) => r * 6 + c + 1);
    rows.push(r % 2 ? row.reverse() : row);
  }

  const lastText = s.last
    ? `${names[s.last.by]} rolled ${s.last.value}${s.last.jump === 'ladder' ? ' and climbed a ladder 🪜' : s.last.jump === 'snake' ? ' and slid down a snake 🐍' : ''}`
    : 'First to reach 30 wins. Roll a 6 to go again!';
  const status = s.winner ? `${names[s.winner]} wins! 🎉`
    : shared ? (myTurn ? `Your turn ${tokens[me]}` : `${names[s.turn]}'s turn…`) : `${names[s.turn]}'s turn ${tokens[s.turn]}`;

  return (
    <div>
      <TurnBanner text={status} mine={myTurn && !s.winner} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3, background: '#E2E8F0', padding: 3, borderRadius: 14 }}>
        {rows.flat().map(n => {
          const jump = JUMPS[n];
          return (
            <div key={n} style={{
              aspectRatio: '1', borderRadius: 8, position: 'relative', fontSize: '0.7rem', fontWeight: 700, color: '#64748B',
              background: n === GOAL ? '#FEF3C7' : jump ? (jump > n ? '#DCFCE7' : '#FEE2E2') : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            }}>
              <span style={{ position: 'absolute', top: 2, left: 4 }}>{n}</span>
              <span style={{ fontSize: '0.95rem' }}>{n === GOAL ? '🏆' : jump ? (jump > n ? '🪜' : '🐍') : ''}</span>
              <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>{s.pos[1] === n && tokens[1]}{s.pos[2] === n && tokens[2]}</span>
            </div>
          );
        })}
      </div>
      <p style={{ textAlign: 'center', color: '#475569', margin: '10px 0', minHeight: 24 }}>
        {s.last && <span style={{ fontSize: '1.6rem', verticalAlign: '-4px', marginRight: 6 }}>{dice[s.last.value]}</span>}
        {lastText}
      </p>
      {s.winner ? (
        <button className="btn btn-primary btn-full" style={bigBtn} onClick={() => dispatch({ type: 'reset' })}><RotateCcw size={18} /> Play again</button>
      ) : (
        <button className="btn btn-primary btn-full" style={bigBtn} disabled={!myTurn}
          onClick={() => dispatch({ type: 'roll', by: actor, value: 1 + Math.floor(Math.random() * 6) })}>
          🎲 Roll the dice
        </button>
      )}
      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94A3B8', marginTop: 6 }}>
        Positions: {tokens[1]} {names[1]} {s.pos[1] || 0} · {tokens[2]} {names[2]} {s.pos[2] || 0}
      </p>
    </div>
  );
}
