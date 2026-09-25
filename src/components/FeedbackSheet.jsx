import React, { useState } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { LANGUAGES } from '../utils/languageConfig';
import { submitFeedback } from '../services/feedback';
import Sheet from './Sheet';

const RATINGS = [
  [1, '😕', 'Hard to use'],
  [2, '😐', 'Okay'],
  [3, '🙂', 'Good'],
  [4, '😊', 'Very good'],
  [5, '😍', 'Love it'],
];

const AREAS = ['Chats', 'Calls', 'Finding contacts', 'Wisdom', 'Design & text size', 'Something else'];

export default function FeedbackSheet({ onClose }) {
  const { user, selectedLanguage, activeTab } = useApp();
  const lang = LANGUAGES[selectedLanguage] || LANGUAGES.en;
  const [rating, setRating] = useState(0);
  const [areas, setAreas] = useState([]);
  const [text, setText] = useState('');
  const [contactOk, setContactOk] = useState(true);
  const [state, setState] = useState('form'); // form | sending | sent | queued

  const { isListening, startListening, stopListening, isSupported } = useSpeechToText(lang.speechCode, (chunk) => {
    setText(prev => (prev ? prev + ' ' : '') + chunk);
  });

  async function submit() {
    setState('sending');
    const result = await submitFeedback({
      name: user.name,
      phone: contactOk ? user.phone : '',
      rating,
      areas: areas.join(', '),
      message: text.trim(),
      language: lang.label || selectedLanguage,
      screen: activeTab,
    });
    setState(result);
  }

  if (state === 'sent' || state === 'queued') {
    return (
      <Sheet title="Feedback" onClose={onClose}>
        <div className="empty-state">
          <div className="icon">🙏</div>
          <h3>Thank you!</h3>
          <p>{state === 'sent'
            ? 'Your feedback has been sent to the Kinnect team.'
            : 'Saved on your phone. It will be sent automatically the next time you open Kinnect.'}</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={onClose}>Done</button>
        </div>
      </Sheet>
    );
  }

  const ready = rating > 0 || text.trim();

  return (
    <Sheet
      title="Share feedback"
      onClose={onClose}
      footer={
        <button className="btn btn-primary btn-full" disabled={!ready || state === 'sending'} style={{ opacity: ready ? 1 : 0.5 }} onClick={submit}>
          <Send size={18} /> {state === 'sending' ? 'Sending…' : 'Send feedback'}
        </button>
      }
    >
      <p style={{ color: 'var(--c-muted)', marginBottom: 14 }}>This is an early version of Kinnect. Tell us what works and what doesn't.</p>

      <label className="field-label">How is Kinnect so far?</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {RATINGS.map(([value, emoji, label]) => (
          <button key={value} onClick={() => setRating(value)} style={{
            border: `2px solid ${rating === value ? 'var(--c-primary)' : 'var(--c-border)'}`,
            background: rating === value ? '#ECFEFF' : 'var(--c-card)',
            borderRadius: 14, padding: '8px 2px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <span style={{ fontSize: '1.6rem' }}>{emoji}</span>
            <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--c-muted)', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
          </button>
        ))}
      </div>

      <label className="field-label" style={{ marginTop: 18 }}>What is it about? (optional)</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {AREAS.map(a => (
          <button key={a} className={`chip ${areas.includes(a) ? 'active' : ''}`} style={{ padding: '6px 12px' }}
            onClick={() => setAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}>
            {a}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 6 }}>
        <label className="field-label" style={{ margin: 0 }}>Your suggestions</label>
        {isSupported && (
          <button className="pill-btn" onClick={isListening ? stopListening : startListening} style={{ padding: '4px 12px', color: isListening ? 'var(--c-red)' : undefined }}>
            {isListening ? <><MicOff size={14} /> Stop</> : <><Mic size={14} /> Speak</>}
          </button>
        )}
      </div>
      <textarea
        className="input" rows={4} value={text} onChange={e => setText(e.target.value)}
        placeholder="What did you like? What was confusing? What should we add?"
        style={{ resize: 'none', padding: 12, lineHeight: 1.5 }}
      />

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, fontSize: '0.9rem', color: 'var(--c-text-soft)', cursor: 'pointer' }}>
        <input type="checkbox" checked={contactOk} onChange={e => setContactOk(e.target.checked)} style={{ width: 20, height: 20 }} />
        The team may contact me about this
      </label>
    </Sheet>
  );
}
