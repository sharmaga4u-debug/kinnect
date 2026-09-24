import React, { useState } from 'react';
import { Volume2, ChevronLeft, ChevronRight, Share2, Send, Mic, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
}

function SlokaCard({ sloka, isToday }) {
  const [expanded, setExpanded] = useState(isToday);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  function handleShare() {
    setSharing(true);
    setTimeout(() => { setSharing(false); setShared(true); setTimeout(() => setShared(false), 2500); }, 1500);
  }

  return (
    <div className="card animate-slideUp" style={{ marginBottom: 18, border: isToday ? '2px solid var(--c-gold)' : '1px solid var(--c-border)' }}>
      {isToday && (
        <div style={{ marginBottom: 12 }}>
          <span className="badge badge-amber">✨ Today's Verse</span>
        </div>
      )}

      <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginBottom: 8, fontWeight: 600 }}>{sloka.source}</p>

      {/* Sanskrit text */}
      <div style={{
        background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 14,
        border: '1px solid #FDE68A',
      }}>
        <p className="font-devanagari" style={{ fontSize: '1.1rem', color: '#78350F', lineHeight: 2, whiteSpace: 'pre-line' }}>
          {sloka.sanskrit}
        </p>
      </div>

      {/* Transliteration */}
      <p style={{ fontSize: '0.88rem', color: 'var(--c-muted)', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
        {sloka.transliteration}
      </p>

      {/* Meaning */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 12, padding: '12px 14px', marginBottom: 14, borderLeft: '3px solid var(--c-primary)' }}>
        <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--c-primary)', marginBottom: 6 }}>💬 Meaning in English</p>
        <p style={{ fontSize: '0.92rem', color: 'var(--c-text)', lineHeight: 1.7 }}>{sloka.meaning}</p>
      </div>

      {/* Word meanings */}
      {expanded && (
        <div style={{ marginBottom: 16 }} className="animate-slideUp">
          <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--c-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Word-by-Word
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {sloka.words.map((w, i) => (
              <div key={i} style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 10, padding: '6px 12px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065F46' }}>{w.word}</p>
                <p style={{ fontSize: '0.75rem', color: '#047857' }}>{w.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          className="btn btn-gold btn-sm"
          onClick={() => speak(sloka.meaning)}
          style={{ flex: 1 }}
        >
          <Volume2 size={16} /> Listen
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setExpanded(e => !e)}
          style={{ flex: 1 }}
        >
          <BookOpen size={16} /> {expanded ? 'Less' : 'Word Meanings'}
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleShare}
          style={{ flex: 1 }}
          disabled={sharing || shared}
        >
          {shared ? (
            <><span>✅</span> Sent!</>
          ) : sharing ? (
            <><span>⏳</span> Sending…</>
          ) : (
            <><Send size={16} /> Teach Grandkid</>
          )}
        </button>
      </div>
    </div>
  );
}

export default function DailyWisdom() {
  const { slokas } = useApp();
  const [todayIdx] = useState(0);

  return (
    <div className="page">
      <div style={{ marginBottom: 16 }}>
        <h1 className="section-title">📖 Daily Wisdom</h1>
      </div>

      {/* Teaching callout */}
      <div style={{
        background: 'linear-gradient(135deg, #4ADE80, #16A34A)',
        borderRadius: 20, padding: '18px 20px', marginBottom: 24, color: '#fff',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '2rem', flexShrink: 0 }}>🎓</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
              Share Wisdom with Your Grandchildren
            </p>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.6 }}>
              Tap <strong>"Teach Grandkid"</strong> on any verse to send them today's sloka with its meaning as a voice message or clip — in any language.
            </p>
          </div>
        </div>
      </div>

      {/* Slokas */}
      {slokas.map((sloka, i) => (
        <SlokaCard key={sloka.id} sloka={sloka} isToday={i === todayIdx} />
      ))}
    </div>
  );
}
