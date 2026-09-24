import React, { useState, useEffect } from 'react';
import { RotateCcw, Award, Dices, Sparkles, ChevronRight, Trophy, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

/* ─────────────────────────────────────────────────────────────
   Game 1: Tic-Tac-Toe
───────────────────────────────────────────────────────────── */
function TicTacToeGame() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [vsBot, setVsBot] = useState(true);

  function checkWinner(b) {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (const [a,c,d] of lines) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    }
    return null;
  }

  const winner = checkWinner(board);
  const isDraw = !winner && board.every(Boolean);

  useEffect(() => {
    if (winner) {
      try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } }); } catch (e) {}
    }
  }, [winner]);

  // Simple Bot Move
  useEffect(() => {
    if (vsBot && !xIsNext && !winner && !isDraw) {
      const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
      if (emptyIndices.length > 0) {
        const timer = setTimeout(() => {
          const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          const next = [...board];
          next[randomIndex] = '⭕';
          setBoard(next);
          setXIsNext(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [vsBot, xIsNext, winner, isDraw, board]);

  function handleClick(i) {
    if (board[i] || winner) return;
    if (vsBot && !xIsNext) return;

    const next = [...board];
    next[i] = '✖️';
    setBoard(next);
    setXIsNext(false);
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  }

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
        <button
          className={`chip ${vsBot ? 'active' : ''}`}
          onClick={() => { setVsBot(true); reset(); }}
          style={{ fontSize: '0.78rem', padding: '4px 12px' }}
        >
          👵 Grandma vs 👦 Aarav (Bot)
        </button>
        <button
          className={`chip ${!vsBot ? 'active' : ''}`}
          onClick={() => { setVsBot(false); reset(); }}
          style={{ fontSize: '0.78rem', padding: '4px 12px' }}
        >
          👥 2 Players (Same Phone)
        </button>
      </div>

      <p style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF', marginBottom: 12 }}>
        {winner 
          ? `🎉 ${winner === '✖️' ? 'Grandma (✖️) Wins!' : 'Aarav (⭕) Wins!'} 🏆` 
          : isDraw 
          ? "🤝 It's a Friendly Draw!" 
          : `${xIsNext ? '👵 Grandma\'s Turn (✖️)' : '👦 Grandkid\'s Turn (⭕)'}`}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        maxWidth: 240,
        margin: '0 auto 14px'
      }}>
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            style={{
              height: 72,
              fontSize: '2rem',
              borderRadius: 16,
              cursor: 'pointer',
              border: '2px solid rgba(255,255,255,0.25)',
              background: cell ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            {cell}
          </button>
        ))}
      </div>

      <button
        className="btn btn-sm"
        style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
        onClick={reset}
      >
        <RotateCcw size={15} /> Restart Game
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Game 2: Snake and Ladder (सांप और सीढ़ी)
───────────────────────────────────────────────────────────── */
const SNAKES = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const LADDERS = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 99 };

function SnakeAndLadderGame() {
  const [player1Pos, setPlayer1Pos] = useState(1); // Grandma (Gold)
  const [player2Pos, setPlayer2Pos] = useState(1); // Grandkid (Blue)
  const [currentTurn, setCurrentTurn] = useState(1); // 1 = P1, 2 = P2
  const [diceVal, setDiceVal] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [gameMessage, setGameMessage] = useState('Roll the dice to begin! 🎲');
  const [winner, setWinner] = useState(null);

  function rollDice() {
    if (isRolling || winner) return;
    setIsRolling(true);
    setGameMessage('Rolling dice...');

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceVal(roll);
      setIsRolling(false);

      if (currentTurn === 1) {
        let newPos = player1Pos + roll;
        if (newPos > 100) newPos = player1Pos; // exact bounce
        
        let note = `Grandma rolled ${roll}!`;
        if (LADDERS[newPos]) {
          newPos = LADDERS[newPos];
          note += ' 🪜 Climbed a ladder to ' + newPos + '!';
        } else if (SNAKES[newPos]) {
          newPos = SNAKES[newPos];
          note += ' 🐍 Bitten by snake! Slid to ' + newPos + '!';
        }

        setPlayer1Pos(newPos);
        setGameMessage(note);

        if (newPos === 100) {
          setWinner('Grandma');
          try { confetti(); } catch (e) {}
        } else {
          setCurrentTurn(2);
        }
      } else {
        let newPos = player2Pos + roll;
        if (newPos > 100) newPos = player2Pos;

        let note = `Aarav rolled ${roll}!`;
        if (LADDERS[newPos]) {
          newPos = LADDERS[newPos];
          note += ' 🪜 Climbed a ladder to ' + newPos + '!';
        } else if (SNAKES[newPos]) {
          newPos = SNAKES[newPos];
          note += ' 🐍 Bitten by snake! Slid to ' + newPos + '!';
        }

        setPlayer2Pos(newPos);
        setGameMessage(note);

        if (newPos === 100) {
          setWinner('Aarav');
          try { confetti(); } catch (e) {}
        } else {
          setCurrentTurn(1);
        }
      }
    }, 600);
  }

  function resetGame() {
    setPlayer1Pos(1);
    setPlayer2Pos(1);
    setCurrentTurn(1);
    setDiceVal(1);
    setWinner(null);
    setGameMessage('Roll the dice to begin! 🎲');
  }

  return (
    <div style={{ textAlign: 'center', color: '#FFFFFF', padding: '4px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 12 }}>
        <div style={{
          background: currentTurn === 1 ? '#D97706' : 'rgba(255,255,255,0.1)',
          padding: '6px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 800 }}>👵 Grandma</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>Square {player1Pos}</p>
        </div>

        <div style={{
          background: currentTurn === 2 ? '#2563EB' : 'rgba(255,255,255,0.1)',
          padding: '6px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 800 }}>👦 Aarav</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>Square {player2Pos}</p>
        </div>
      </div>

      <p style={{ fontSize: '0.88rem', fontWeight: 700, minHeight: 22, color: '#FDE68A', marginBottom: 12 }}>
        {winner ? `🏆 ${winner} reached 100 and WON! 🎉` : gameMessage}
      </p>

      {/* Mini Board Indicator / Progress */}
      <div style={{
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '12px 16px',
        marginBottom: 14,
        border: '1px solid rgba(255,255,255,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', opacity: 0.8, marginBottom: 4 }}>
          <span>Start (1)</span>
          <span>🪜 Ladders: 9, 21, 28, 51, 71</span>
          <span>Finish (100) 🏆</span>
        </div>
        <div className="progress-bar" style={{ height: 12, background: 'rgba(255,255,255,0.15)' }}>
          <div style={{
            height: '100%',
            width: `${player1Pos}%`,
            background: '#D97706',
            borderRadius: 99,
            transition: 'width 0.4s ease'
          }} />
        </div>
        <div className="progress-bar" style={{ height: 12, marginTop: 6, background: 'rgba(255,255,255,0.15)' }}>
          <div style={{
            height: '100%',
            width: `${player2Pos}%`,
            background: '#38BDF8',
            borderRadius: 99,
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Rolling Dice Button */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={rollDice}
          disabled={isRolling || Boolean(winner)}
          style={{
            minHeight: 52,
            padding: '0 24px',
            fontSize: '1.1rem',
            background: isRolling ? '#475569' : (currentTurn === 1 ? '#D97706' : '#2563EB')
          }}
        >
          <Dices size={24} style={{ animation: isRolling ? 'spin 0.5s infinite linear' : 'none' }} />
          <span>{isRolling ? 'Rolling...' : `Roll Dice (${diceVal})`}</span>
        </button>

        <button
          className="btn btn-ghost btn-sm"
          style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', minHeight: 44 }}
          onClick={resetGame}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Game 3: Quick Ludo (मिनी लूडो)
───────────────────────────────────────────────────────────── */
function QuickLudoGame() {
  const [redPos, setRedPos] = useState(0); // 0 = home, 1-15 track
  const [yellowPos, setYellowPos] = useState(0);
  const [dice, setDice] = useState(6);
  const [turn, setTurn] = useState('red'); // 'red' | 'yellow'
  const [winner, setWinner] = useState(null);

  function rollLudoDice() {
    if (winner) return;
    const r = Math.floor(Math.random() * 6) + 1;
    setDice(r);

    if (turn === 'red') {
      const nextPos = redPos === 0 ? (r === 6 ? 1 : 0) : Math.min(15, redPos + r);
      setRedPos(nextPos);
      if (nextPos === 15) {
        setWinner('Red (Grandma)');
        try { confetti(); } catch (e) {}
      } else {
        if (r !== 6) setTurn('yellow');
      }
    } else {
      const nextPos = yellowPos === 0 ? (r === 6 ? 1 : 0) : Math.min(15, yellowPos + r);
      setYellowPos(nextPos);
      if (nextPos === 15) {
        setWinner('Yellow (Grandkid)');
        try { confetti(); } catch (e) {}
      } else {
        if (r !== 6) setTurn('red');
      }
    }
  }

  function reset() {
    setRedPos(0);
    setYellowPos(0);
    setTurn('red');
    setWinner(null);
  }

  return (
    <div style={{ textAlign: 'center', color: '#FFFFFF', padding: '6px 0' }}>
      <p style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 10 }}>
        {winner ? `🏆 ${winner} reached Home! 🎉` : `${turn === 'red' ? '🔴 Red (Grandma)' : '🟡 Yellow (Aarav)\'s'} Turn`}
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 18,
        padding: '16px 20px',
        marginBottom: 16,
        border: '1px solid rgba(255,255,255,0.18)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '1.4rem' }}>🔴</span>
            <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Grandma: {redPos === 0 ? 'Home Base' : `Step ${redPos}/15`}</span>
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F87171' }}>{Math.round((redPos/15)*100)}%</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '1.4rem' }}>🟡</span>
            <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Aarav: {yellowPos === 0 ? 'Home Base' : `Step ${yellowPos}/15`}</span>
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FDE047' }}>{Math.round((yellowPos/15)*100)}%</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={rollLudoDice}
          disabled={Boolean(winner)}
          style={{ minHeight: 48, padding: '0 24px', fontSize: '1rem', background: turn === 'red' ? '#DC2626' : '#D97706' }}
        >
          <Dices size={20} /> Roll Dice ({dice})
        </button>
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
          onClick={reset}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Game 4: Memory Flip & Emoji Match
───────────────────────────────────────────────────────────── */
const EMOJI_ITEMS = ['🪔', '🦚', '🐘', '🥭', '🏏', '🌺'];

function MemoryMatchGame() {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    initCards();
  }, []);

  function initCards() {
    const deck = [...EMOJI_ITEMS, ...EMOJI_ITEMS]
      .sort(() => Math.random() - 0.5)
      .map((item, id) => ({ id, item }));
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  }

  function handleCardClick(index) {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(cards[index].item)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].item === cards[second].item) {
        setMatched(prev => [...prev, cards[first].item]);
        setFlipped([]);
        if (matched.length + 1 === EMOJI_ITEMS.length) {
          try { confetti(); } catch (e) {}
        }
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  }

  const isWon = matched.length === EMOJI_ITEMS.length;

  return (
    <div style={{ textAlign: 'center', color: '#FFFFFF', padding: '6px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 280, margin: '0 auto 10px' }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Moves: {moves}</span>
        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#34D399' }}>Matched: {matched.length}/{EMOJI_ITEMS.length}</span>
      </div>

      {isWon && (
        <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#34D399', marginBottom: 10 }}>
          🎉 Super Brain! All Pairs Matched! 🧠
        </p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
        maxWidth: 280,
        margin: '0 auto 14px'
      }}>
        {cards.map((card, i) => {
          const isCardFlipped = flipped.includes(i) || matched.includes(card.item);
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(i)}
              style={{
                height: 60,
                borderRadius: 14,
                border: '1.5px solid rgba(255,255,255,0.25)',
                background: isCardFlipped ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                fontSize: isCardFlipped ? '1.8rem' : '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              {isCardFlipped ? card.item : '❓'}
            </button>
          );
        })}
      </div>

      <button
        className="btn btn-ghost btn-sm"
        style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
        onClick={initCards}
      >
        <RotateCcw size={15} /> Play Again
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Games Hub Container
───────────────────────────────────────────────────────────── */
export default function GamesHub({ onClose }) {
  const [activeGame, setActiveGame] = useState('snakes'); // 'tictactoe' | 'snakes' | 'ludo' | 'memory'

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)',
      borderRadius: 22,
      padding: '16px 18px',
      color: '#FFFFFF'
    }}>
      {/* Game Selector Tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        marginBottom: 14,
        paddingBottom: 4
      }}>
        {[
          { id: 'snakes', label: '🐍 Snake & Ladder' },
          { id: 'tictactoe', label: '❌ Tic-Tac-Toe' },
          { id: 'ludo', label: '🎲 Quick Ludo' },
          { id: 'memory', label: '🧠 Memory Flip' },
        ].map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGame(g.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 99,
              fontSize: '0.8rem',
              fontWeight: 700,
              border: `1.5px solid ${activeGame === g.id ? '#38BDF8' : 'rgba(255,255,255,0.2)'}`,
              background: activeGame === g.id ? '#0284C7' : 'rgba(255,255,255,0.08)',
              color: '#FFFFFF',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Render Active Game */}
      {activeGame === 'snakes' && <SnakeAndLadderGame />}
      {activeGame === 'tictactoe' && <TicTacToeGame />}
      {activeGame === 'ludo' && <QuickLudoGame />}
      {activeGame === 'memory' && <MemoryMatchGame />}
    </div>
  );
}
