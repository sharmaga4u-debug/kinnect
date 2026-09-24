import React, { useState } from 'react';
import { 
  BookOpen, Volume2, Share2, Users, Check, ChevronDown, 
  ChevronUp, Search, Sparkles, Shield, HandMetal, Send 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.88;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
}

export default function TopicsAndWisdom() {
  const { topics, joinedCircleIds, toggleCircle, sendMessage, setActiveTab, setActiveChatId } = useApp();
  const [expandedTopicId, setExpandedTopicId] = useState('bhagavad-gita');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sharedToast, setSharedToast] = useState(null);
  const [handRaisedMap, setHandRaisedMap] = useState({});

  function handleToggleTopic(id) {
    setExpandedTopicId(prev => prev === id ? null : id);
  }

  function handleShareToChat(topic) {
    const textToSend = `📖 *${topic.title} - Verse of the Day*\n"${topic.verse.meaning}"\n\n*Lesson:* ${topic.verse.insight}`;
    sendMessage('family-group', textToSend, 'text');
    setSharedToast(`Shared ${topic.title} to Family Group Chat! 💬`);
    setTimeout(() => setSharedToast(null), 3000);
  }

  function handleToggleHand(circleId) {
    setHandRaisedMap(prev => ({
      ...prev,
      [circleId]: !prev[circleId]
    }));
  }

  const filteredTopics = topics.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.verse.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'spiritual') return ['bhagavad-gita', 'ramayana'].includes(t.id);
    if (activeFilter === 'wellness') return ['yoga-wellness', 'cooking-ayurveda'].includes(t.id);
    if (activeFilter === 'heritage') return ['history-heritage', 'classical-music'].includes(t.id);
    if (activeFilter === 'science') return ['science-nature'].includes(t.id);
    return true;
  });

  return (
    <div className="page" style={{ paddingBottom: 110, maxWidth: 660 }}>
      {/* Top Title */}
      <div style={{ marginBottom: 16 }}>
        <h1 className="section-title">📖 Wisdom & Learning Topics</h1>
      </div>

      {/* Senior Friendly Quick Info Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
        border: '1.5px solid #FDE68A',
        borderRadius: 20,
        padding: '14px 18px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>🪷</span>
        <div>
          <p style={{ fontWeight: 800, color: '#92400E', fontSize: '0.92rem' }}>
            Daily Heritage & Knowledge Hub
          </p>
          <p style={{ fontSize: '0.8rem', color: '#B45309', lineHeight: 1.4 }}>
            Everything is in this single list — no need to open multiple windows. You can listen to verses or share them directly with your grandkids!
          </p>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 16, color: 'var(--c-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 42, minHeight: 48, borderRadius: 16, fontSize: '0.94rem' }}
            placeholder="Search verses, Gita, Ramayana, Yoga, Cooking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {[
            { id: 'all', label: 'All Topics' },
            { id: 'spiritual', label: '📿 Spiritual & Gita' },
            { id: 'wellness', label: '🧘 Yoga & Ayurveda' },
            { id: 'heritage', label: '🏛️ Heritage & Arts' },
            { id: 'science', label: '🔬 Science & Kids' },
          ].map(f => (
            <button
              key={f.id}
              className={`chip ${activeFilter === f.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.id)}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Topics Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredTopics.map((topic) => {
          const isExpanded = expandedTopicId === topic.id;

          return (
            <div
              key={topic.id}
              className="card animate-slideUp"
              style={{
                padding: 0,
                overflow: 'hidden',
                border: isExpanded ? `2px solid ${topic.color}` : '1px solid var(--c-border)',
                boxShadow: isExpanded ? '0 8px 26px rgba(0,0,0,0.07)' : '0 2px 10px rgba(0,0,0,0.02)',
                transition: 'all 0.22s ease'
              }}
            >
              {/* Topic Header Row (Click to toggle) */}
              <div
                onClick={() => handleToggleTopic(topic.id)}
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: isExpanded ? topic.bg : 'var(--c-card)',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: topic.bg,
                    border: `1px solid ${topic.color}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    flexShrink: 0
                  }}>
                    {topic.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h2 style={{ fontWeight: 800, fontSize: '1.08rem', color: 'var(--c-text)' }}>
                        {topic.title}
                      </h2>
                      <span className="badge" style={{ background: topic.color + '20', color: topic.color }}>
                        {topic.circles.length} Circles
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--c-muted)', marginTop: 2 }}>
                      {topic.summary}
                    </p>
                  </div>
                </div>

                <div style={{
                  width: 34, height: 34,
                  borderRadius: '50%',
                  background: isExpanded ? 'rgba(0,0,0,0.06)' : 'var(--c-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isExpanded ? topic.color : 'var(--c-muted)',
                  flexShrink: 0,
                  marginLeft: 10
                }}>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Expanded Topic Details in Same Tab */}
              {isExpanded && (
                <div style={{ padding: '18px 20px 22px', background: 'var(--c-card)', borderTop: '1px solid var(--c-border)' }}>
                  
                  {/* Daily Verse / Sacred Teaching Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #FFFDF8, #FBF6EC)',
                    border: '1.5px solid #FDE68A',
                    borderRadius: 18,
                    padding: '16px 18px',
                    marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="badge badge-amber" style={{ fontWeight: 800 }}>
                        ✨ Today’s Reflection & Verse
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--c-muted)', fontWeight: 600 }}>
                        {topic.verse.source}
                      </span>
                    </div>

                    {/* Original Script (Devanagari) */}
                    <p className="font-devanagari" style={{
                      fontSize: '1.15rem',
                      color: '#78350F',
                      fontWeight: 700,
                      lineHeight: 2,
                      whiteSpace: 'pre-line',
                      marginBottom: 8
                    }}>
                      {topic.verse.sanskrit}
                    </p>

                    {/* Transliteration */}
                    <p style={{
                      fontSize: '0.86rem',
                      color: 'var(--c-muted)',
                      fontStyle: 'italic',
                      lineHeight: 1.6,
                      marginBottom: 12
                    }}>
                      {topic.verse.transliteration}
                    </p>

                    {/* Meaning */}
                    <div style={{
                      background: 'rgba(255,255,255,0.8)',
                      borderRadius: 12,
                      padding: '10px 14px',
                      borderLeft: `4px solid ${topic.color}`,
                      marginBottom: 12
                    }}>
                      <p style={{ fontWeight: 700, fontSize: '0.82rem', color: topic.color, marginBottom: 2 }}>
                        English Meaning:
                      </p>
                      <p style={{ fontSize: '0.92rem', color: 'var(--c-text)', lineHeight: 1.55 }}>
                        {topic.verse.meaning}
                      </p>
                    </div>

                    {/* Word-by-word break down */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      {topic.verse.words.map((w, idx) => (
                        <span key={idx} style={{
                          background: '#FFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: 8,
                          padding: '4px 8px',
                          fontSize: '0.76rem',
                          color: '#334155'
                        }}>
                          <strong style={{ color: topic.color }}>{w.word}</strong>: {w.meaning}
                        </span>
                      ))}
                    </div>

                    {/* Action buttons: Listen & Share */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-sm"
                        style={{
                          background: topic.color,
                          color: '#fff',
                          flex: 1,
                          minWidth: 140
                        }}
                        onClick={() => speak(topic.verse.meaning + '. ' + topic.verse.insight)}
                      >
                        <Volume2 size={16} /> Listen Audio
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1, minWidth: 140 }}
                        onClick={() => handleShareToChat(topic)}
                      >
                        <Send size={15} /> Send to Family Chat
                      </button>
                    </div>
                  </div>

                  {/* Discussion & Learning Circles for this topic */}
                  <div>
                    <h3 style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: 'var(--c-text)',
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <Users size={16} color={topic.color} /> Active Discussion Circles ({topic.circles.length})
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {topic.circles.map(circle => {
                        const isJoined = joinedCircleIds.includes(circle.id);
                        const isHandRaised = handRaisedMap[circle.id];

                        return (
                          <div
                            key={circle.id}
                            style={{
                              background: isJoined ? '#F0FDF4' : 'var(--c-surface)',
                              border: `1.5px solid ${isJoined ? '#86EFAC' : 'var(--c-border)'}`,
                              borderRadius: 16,
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                              flexWrap: 'wrap'
                            }}
                          >
                            <div>
                              <p style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--c-text)' }}>
                                {circle.name}
                              </p>
                              <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)', marginTop: 2 }}>
                                📅 {circle.schedule} &nbsp;·&nbsp; 🗣️ {circle.language}
                              </p>
                              <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                                <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                                  👥 {circle.members} Members
                                </span>
                                {isJoined && (
                                  <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                                    🛡️ Joined (Anonymous ID)
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 6 }}>
                              {isJoined && (
                                <button
                                  className="btn btn-sm"
                                  onClick={() => handleToggleHand(circle.id)}
                                  style={{
                                    background: isHandRaised ? '#FEF3C7' : '#FFFFFF',
                                    border: `1.5px solid ${isHandRaised ? '#D97706' : 'var(--c-border)'}`,
                                    color: isHandRaised ? '#92400E' : 'var(--c-text)',
                                    fontSize: '0.78rem',
                                    padding: '0 10px',
                                    minHeight: 36
                                  }}
                                >
                                  <HandMetal size={15} />
                                  {isHandRaised ? 'Hand Raised ✋' : 'Ask Doubt'}
                                </button>
                              )}

                              <button
                                className={`btn btn-sm ${isJoined ? 'btn-ghost' : 'btn-primary'}`}
                                onClick={() => toggleCircle(circle.id)}
                                style={{
                                  minHeight: 36,
                                  padding: '0 14px',
                                  fontSize: '0.8rem',
                                  borderColor: isJoined ? '#16A34A' : undefined,
                                  color: isJoined ? '#166534' : '#fff'
                                }}
                              >
                                {isJoined ? <><Check size={14} /> Joined</> : '+ Join Circle'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Shared Toast Notification */}
      {sharedToast && (
        <div style={{
          position: 'fixed',
          bottom: 85,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0F172A',
          color: '#fff',
          padding: '12px 22px',
          borderRadius: 99,
          fontSize: '0.88rem',
          fontWeight: 700,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          zIndex: 80,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {sharedToast}
        </div>
      )}
    </div>
  );
}
