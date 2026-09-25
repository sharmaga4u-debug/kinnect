import React, { useState } from 'react';
import { ChevronDown, Volume2, Share2, Square } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { shareText } from '../utils/invite';
import { speak as speakText, stopSpeaking, canSpeak } from '../utils/speech';
import Avatar from './Avatar';
import Sheet from './Sheet';

const FILTERS = [
  ['all', 'All'],
  ['spiritual', 'Spiritual', ['bhagavad-gita', 'ramayana']],
  ['wellness', 'Wellness', ['yoga-wellness', 'cooking-ayurveda']],
  ['heritage', 'Heritage', ['history-heritage', 'classical-music']],
  ['science', 'Science', ['science-nature']],
];


function shareTextFor(topic) {
  return `📖 ${topic.title}\n${topic.verse.source}\n\n“${topic.verse.meaning}”\n\n💡 ${topic.verse.insight}`;
}

export default function WisdomPage() {
  const { topics } = useApp();
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [shareTopic, setShareTopic] = useState(null);

  const ids = FILTERS.find(f => f[0] === filter)?.[2];
  const list = topics.filter(t => !ids || ids.includes(t.id));

  // Works on Android through the phone's own text-to-speech engine
  async function toggleSpeak(topic) {
    if (speakingId === topic.id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(topic.id);
    await speakText(`${topic.title}. ${topic.verse.meaning} ${topic.verse.insight}`);
    setSpeakingId(id => (id === topic.id ? null : id));
  }

  return (
    <div className="page" style={{ paddingTop: 12, paddingBottom: 120 }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
        {FILTERS.map(([id, label]) => (
          <button key={id} className={`chip ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
        {list.map(topic => {
          const open = openId === topic.id;
          return (
            <div key={topic.id} className="list-card">
              <button className="list-row" onClick={() => setOpenId(open ? null : topic.id)} style={{ padding: 14 }}>
                <div style={{ width: 48, height: 48, minWidth: 48, borderRadius: 14, background: topic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {topic.icon}
                </div>
                <div className="row-main">
                  <p className="row-title">{topic.title}</p>
                  <p className="row-sub" style={{ whiteSpace: 'normal' }}>{topic.summary}</p>
                </div>
                <ChevronDown size={20} color="var(--c-muted)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </button>

              {open && (
                <div style={{ padding: '0 16px 16px' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: topic.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {topic.verse.source}
                  </p>
                  <p className="font-devanagari" style={{ fontSize: '1.08rem', color: '#78350F', fontWeight: 600, whiteSpace: 'pre-line', marginTop: 6 }}>
                    {topic.verse.sanskrit}
                  </p>
                  <p style={{ fontSize: '0.86rem', color: 'var(--c-muted)', fontStyle: 'italic', whiteSpace: 'pre-line', lineHeight: 1.6, marginTop: 4 }}>
                    {topic.verse.transliteration}
                  </p>
                  <p style={{ fontSize: '1rem', color: 'var(--c-text)', lineHeight: 1.6, marginTop: 12, paddingLeft: 12, borderLeft: `3px solid ${topic.color}` }}>
                    {topic.verse.meaning}
                  </p>

                  <p className="section-label" style={{ marginTop: 16 }}>Key words</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {topic.verse.words.map((w, i) => (
                      <p key={i} style={{ fontSize: '0.88rem', color: 'var(--c-text-soft)' }}>
                        <strong style={{ color: topic.color }}>{w.word}</strong> — {w.meaning}
                      </p>
                    ))}
                  </div>

                  <div style={{ background: topic.bg, borderRadius: 14, padding: '12px 14px', marginTop: 14, fontSize: '0.92rem', color: 'var(--c-text-soft)', lineHeight: 1.5 }}>
                    💡 {topic.verse.insight}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: canSpeak ? '1fr 1fr' : '1fr', gap: 8, marginTop: 14 }}>
                    {canSpeak && <button className="btn btn-ghost btn-sm" onClick={() => toggleSpeak(topic)}>
                      {speakingId === topic.id ? <><Square size={15} /> Stop</> : <><Volume2 size={17} /> Listen</>}
                    </button>}
                    <button className="btn btn-ghost btn-sm" onClick={() => setShareTopic(topic)}>
                      <Share2 size={17} /> Share
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {shareTopic && <ShareToChatSheet text={shareTextFor(shareTopic)} onClose={() => setShareTopic(null)} />}
    </div>
  );
}

/* Send some text into one of your chats, or share it outside Kinnect */
function ShareToChatSheet({ text, onClose }) {
  const { chatList, kinnectContacts, sendMessage } = useApp();
  const [sentTo, setSentTo] = useState(null);
  const [note, setNote] = useState('');

  const chatted = new Set(chatList.map(r => r.key));
  const targets = [
    ...chatList.map(r => ({ key: r.key, view: r.view })),
    ...kinnectContacts.filter(c => !chatted.has(c.id)).map(c => ({ key: c.id, view: c })),
  ];

  return (
    <Sheet title="Share to…" onClose={onClose}>
      <button className="list-row" onClick={async () => {
        const r = await shareText(text);
        if (r === 'copied') setNote('Copied. Paste it into any app.');
        else if (r === 'failed') setNote('Sharing is not available here.');
      }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--c-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Share2 size={20} />
        </div>
        <span className="row-title">Other apps (WhatsApp, SMS…)</span>
      </button>
      {note && <p style={{ color: 'var(--c-emerald)', fontSize: '0.86rem', margin: '4px 4px 8px' }}>{note}</p>}
      {targets.length > 0 && <p className="section-label">Send in Kinnect</p>}
      {targets.map(t => (
        <button key={t.key} className="list-row" disabled={sentTo === t.key} onClick={() => { sendMessage(t.key, text); setSentTo(t.key); setTimeout(onClose, 700); }}>
          <Avatar person={t.view} size={44} />
          <span className="row-main row-title">{t.view.name}</span>
          {sentTo === t.key && <span className="badge badge-green">Sent ✓</span>}
        </button>
      ))}
    </Sheet>
  );
}
