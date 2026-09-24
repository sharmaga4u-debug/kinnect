import React, { useState } from 'react';
import { 
  Heart, Star, MessageSquare, Mic, MicOff, Send, 
  CheckCircle, Sparkles, X, ChevronRight, ThumbsUp, Smile 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { LANGUAGES } from '../utils/languageConfig';

const SMILEY_RATINGS = [
  { stars: 5, emoji: '😍', label: 'Loved it!' },
  { stars: 4, emoji: '😊', label: 'Very Good' },
  { stars: 3, emoji: '🙂', label: 'Good' },
  { stars: 2, emoji: '😐', label: 'Needs work' },
  { stars: 1, emoji: '😕', label: 'Difficult' },
];

export default function FeedbackModal() {
  const { user, selectedLanguage, feedbackList, submitFeedback } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('form'); // 'form' | 'list'
  const [rating, setRating] = useState(5);
  const [memberName, setMemberName] = useState(user ? user.name : 'Family Member');
  const [feedbackText, setFeedbackText] = useState('');
  const [isTextEasyToRead, setIsTextEasyToRead] = useState(true);
  const [likesChat, setLikesChat] = useState(true);
  const [likesWisdomList, setLikesWisdomList] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const langConfig = LANGUAGES[selectedLanguage] || LANGUAGES.en;

  // Real-time Speech to Text for feedback
  const { isListening, startListening, stopListening, isSupported, error: speechError } = useSpeechToText(
    langConfig.speechCode,
    (chunk) => {
      setFeedbackText(prev => (prev ? prev + ' ' : '') + chunk);
    }
  );

  function handleSubmit() {
    if (!feedbackText.trim() && rating === 0) return;

    submitFeedback({
      memberName: memberName.trim() || 'Family Member',
      rating,
      text: feedbackText.trim() || 'Great initiative for our family!',
      isTextEasyToRead,
      likesChat,
      likesWisdomList,
      language: langConfig.label
    });

    // Fire celebration confetti
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFeedbackText('');
      setViewMode('list');
    }, 1800);
  }

  return (
    <>
      {/* Floating Action Button on Mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="animate-popIn"
        style={{
          position: 'fixed',
          bottom: 74,
          right: 16,
          zIndex: 45,
          background: 'linear-gradient(135deg, #D97706, #BE185D)',
          color: '#FFFFFF',
          border: '2px solid #FFFFFF',
          borderRadius: 99,
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 800,
          fontSize: '0.84rem',
          boxShadow: '0 8px 24px rgba(217,119,6,0.38)',
          cursor: 'pointer',
          transition: 'transform 0.18s ease'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ fontSize: '1.1rem' }}>💌</span>
        <span>Family Feedback</span>
        {feedbackList?.length > 0 && (
          <span style={{
            background: '#FFFFFF',
            color: '#D97706',
            borderRadius: 99,
            padding: '1px 6px',
            fontSize: '0.7rem',
            fontWeight: 800
          }}>
            {feedbackList.length}
          </span>
        )}
      </button>

      {/* Main Feedback Modal */}
      {isOpen && (
        <div className="overlay" onClick={() => setIsOpen(false)}>
          <div
            className="card animate-slideUp"
            style={{
              width: '100%',
              maxWidth: 460,
              maxHeight: '90dvh',
              overflowY: 'auto',
              padding: '22px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.22rem', color: 'var(--c-text)' }}>
                  💌 Family Review & Feedback
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--c-muted)', marginTop: 2 }}>
                  Your thoughts help make this app comfortable for everyone!
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--c-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Mode Switcher: Give Feedback vs View Feedback */}
            <div style={{
              display: 'flex',
              background: 'var(--c-surface)',
              borderRadius: 12,
              padding: 4,
              marginBottom: 16
            }}>
              <button
                onClick={() => setViewMode('form')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 10,
                  border: 'none',
                  background: viewMode === 'form' ? 'var(--c-card)' : 'transparent',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  color: viewMode === 'form' ? 'var(--c-primary)' : 'var(--c-muted)',
                  boxShadow: viewMode === 'form' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer'
                }}
              >
                ✍️ Give Feedback
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 10,
                  border: 'none',
                  background: viewMode === 'list' ? 'var(--c-card)' : 'transparent',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  color: viewMode === 'list' ? 'var(--c-primary)' : 'var(--c-muted)',
                  boxShadow: viewMode === 'list' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer'
                }}
              >
                📋 View Reviews ({feedbackList?.length || 0})
              </button>
            </div>

            {/* FORM VIEW */}
            {viewMode === 'form' && (
              <div>
                {isSubmitted ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 10 }}>🎉</div>
                    <h3 style={{ fontWeight: 800, color: 'var(--c-emerald)', fontSize: '1.2rem' }}>
                      Thank you for your loving feedback!
                    </h3>
                    <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem', marginTop: 6 }}>
                      Your voice helps us make this experience joyful for all generations.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Star / Smiley Rating */}
                    <div style={{ marginBottom: 16, textAlign: 'center' }}>
                      <label style={{ fontWeight: 800, fontSize: '0.92rem', display: 'block', marginBottom: 8 }}>
                        How do you feel using this app?
                      </label>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                        {SMILEY_RATINGS.map(item => (
                          <button
                            key={item.stars}
                            onClick={() => setRating(item.stars)}
                            style={{
                              background: rating === item.stars ? '#FFFBEB' : 'var(--c-surface)',
                              border: `2px solid ${rating === item.stars ? '#F59E0B' : 'var(--c-border)'}`,
                              borderRadius: 14,
                              padding: '8px 10px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 2,
                              transition: 'all 0.15s'
                            }}
                          >
                            <span style={{ fontSize: '1.6rem' }}>{item.emoji}</span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#92400E' }}>
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Member Name */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontWeight: 700, fontSize: '0.84rem', display: 'block', marginBottom: 4 }}>
                        Your Name:
                      </label>
                      <input
                        className="input"
                        style={{ minHeight: 44, borderRadius: 12, fontSize: '0.92rem' }}
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        placeholder="e.g. Dadi, Aarav, Priya"
                      />
                    </div>

                    {/* Quick Elder-Friendly Checkboxes */}
                    <div style={{
                      background: 'var(--c-surface)',
                      borderRadius: 14,
                      padding: '12px 14px',
                      marginBottom: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Is the text easy to read?</span>
                        <button
                          className={`chip ${isTextEasyToRead ? 'active' : ''}`}
                          onClick={() => setIsTextEasyToRead(v => !v)}
                          style={{ padding: '3px 10px', fontSize: '0.74rem' }}
                        >
                          {isTextEasyToRead ? 'Yes 👍' : 'No 👎'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Do you like the new Chat window?</span>
                        <button
                          className={`chip ${likesChat ? 'active' : ''}`}
                          onClick={() => setLikesChat(v => !v)}
                          style={{ padding: '3px 10px', fontSize: '0.74rem' }}
                        >
                          {likesChat ? 'Yes 👍' : 'No 👎'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Topics list in one tab easy to browse?</span>
                        <button
                          className={`chip ${likesWisdomList ? 'active' : ''}`}
                          onClick={() => setLikesWisdomList(v => !v)}
                          style={{ padding: '3px 10px', fontSize: '0.74rem' }}
                        >
                          {likesWisdomList ? 'Yes 👍' : 'No 👎'}
                        </button>
                      </div>
                    </div>

                    {/* Audio to Text Microphone Button + Textarea */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <label style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                          Suggestions / Voice Message:
                        </label>
                        {isSupported && (
                          <button
                            type="button"
                            onClick={isListening ? stopListening : startListening}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              background: isListening ? '#FEE2E2' : '#DCFCE7',
                              color: isListening ? '#DC2626' : '#166534',
                              border: `1px solid ${isListening ? '#F87171' : '#86EFAC'}`,
                              borderRadius: 99,
                              padding: '3px 10px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {isListening ? (
                              <><MicOff size={13} /> Listening ({langConfig.nativeName})…</>
                            ) : (
                              <><Mic size={13} /> Speak in {langConfig.nativeName}</>
                            )}
                          </button>
                        )}
                      </div>

                      {speechError && (
                        <p style={{ fontSize: '0.74rem', color: 'var(--c-red)', marginBottom: 4 }}>
                          {speechError}
                        </p>
                      )}

                      <textarea
                        className="input"
                        rows={3}
                        style={{ borderRadius: 12, fontSize: '0.92rem', padding: 10, resize: 'none' }}
                        placeholder="Tell us what you loved, or what we should add next..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      className="btn btn-primary btn-full"
                      onClick={handleSubmit}
                    >
                      <Send size={18} /> Submit Family Feedback
                    </button>
                  </>
                )}
              </div>
            )}

            {/* LIST VIEW (VIEW ALL FEEDBACK) */}
            {viewMode === 'list' && (
              <div>
                {(!feedbackList || feedbackList.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--c-muted)' }}>
                    <p style={{ fontSize: '2.4rem', marginBottom: 6 }}>📭</p>
                    <p style={{ fontWeight: 700 }}>No reviews submitted yet.</p>
                    <p style={{ fontSize: '0.82rem', marginTop: 2 }}>
                      Be the first to share your thoughts with the family!
                    </p>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: 14 }}
                      onClick={() => setViewMode('form')}
                    >
                      Give First Feedback
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {feedbackList.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: 'var(--c-surface)',
                          border: '1px solid var(--c-border)',
                          borderRadius: 14,
                          padding: '12px 14px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.94rem' }}>{item.memberName}</span>
                          <span style={{ fontSize: '1.2rem' }}>
                            {'⭐'.repeat(item.rating || 5)}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--c-text)', lineHeight: 1.4 }}>
                          "{item.text}"
                        </p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: '0.72rem', color: 'var(--c-muted)' }}>
                          <span>📅 {item.date}</span>
                          <span>·</span>
                          <span>🗣️ {item.language || 'English'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
