import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Mic, MicOff, Phone, Video, ChevronLeft, Image, Smile, 
  Check, CheckCheck, Clock, Heart, Users, Sparkles, Keyboard as KeyboardIcon,
  Globe, Radio
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../utils/languageConfig';
import { useSpeechToText } from '../hooks/useSpeechToText';
import NativeKeyboard from './NativeKeyboard';
import ProfileModal from './ProfileModal';

export default function FamilyChat() {
  const { 
    chats, activeChatId, setActiveChatId, sendMessage, 
    contacts, startCall, selectedLanguage, setSelectedLanguage
  } = useApp();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingCall, setPendingCall] = useState(null); // { contact, type }

  const langConfig = LANGUAGES[selectedLanguage] || LANGUAGES.en;
  const quickPrompts = langConfig.quickPrompts || [];

  const [inputText, setInputText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isTypingSimulated, setIsTypingSimulated] = useState(false);
  const [showNativeKeyboard, setShowNativeKeyboard] = useState(false);
  const messagesEndRef = useRef(null);

  const currentChat = chats[activeChatId] || chats['family-group'];

  // Speech-to-Text in Selected Language
  const { 
    isListening, transcript, startListening, stopListening, isSupported, error: speechError 
  } = useSpeechToText(langConfig.speechCode, (finalText) => {
    setInputText(prev => (prev ? prev + ' ' : '') + finalText);
  });

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages, isTypingSimulated]);

  // Voice recording timer simulation
  useEffect(() => {
    let interval;
    if (isRecordingVoice) {
      setRecordSeconds(0);
      interval = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  function handleSend() {
    if (!inputText.trim()) return;
    sendMessage(activeChatId, inputText.trim(), 'text');
    setInputText('');
    
    // Show temporary typing indicator before auto-reply fires
    setTimeout(() => setIsTypingSimulated(true), 500);
    setTimeout(() => setIsTypingSimulated(false), 1400);
  }

  function handleQuickPrompt(promptText) {
    sendMessage(activeChatId, promptText, 'text');
    setTimeout(() => setIsTypingSimulated(true), 500);
    setTimeout(() => setIsTypingSimulated(false), 1400);
  }

  function handleFinishVoiceRecord() {
    setIsRecordingVoice(false);
    const durationStr = `0:${recordSeconds < 10 ? '0' : ''}${recordSeconds || 4}`;
    sendMessage(activeChatId, 'Voice Note 🎙️', 'audio', { audioDuration: durationStr });
    setRecordSeconds(0);

    setTimeout(() => setIsTypingSimulated(true), 600);
    setTimeout(() => setIsTypingSimulated(false), 1500);
  }

  // Native keyboard handlers
  function handleKeyPress(char) {
    setInputText(prev => prev + char);
  }
  function handleKeyboardBackspace() {
    setInputText(prev => prev.slice(0, -1));
  }
  function handleKeyboardSpace() {
    setInputText(prev => prev + ' ');
  }
  function handleKeyboardClear() {
    setInputText('');
  }

  // Find corresponding contact for direct audio/video call
  const matchedContact = contacts.find(c => c.id === activeChatId) || contacts[0];

  function handleCallRequest(contact, type) {
    setPendingCall({ contact, type });
  }

  return (
    <div className="page" style={{ paddingBottom: 110, maxWidth: 660 }}>
      {/* Permission Dialog */}
      {pendingCall && (
        <div className="overlay animate-fadeIn" style={{ zIndex: 110 }}>
          <div className="card animate-slideUp" style={{ width: '100%', maxWidth: 370, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 10 }}>
              {pendingCall.type === 'video' ? '📹' : '📞'}
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--c-text)', marginBottom: 8 }}>
              {pendingCall.type === 'video' ? 'Camera & Microphone' : 'Microphone'} Access
            </h2>
            <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 20 }}>
              To {pendingCall.type === 'video' ? 'video call' : 'call'} <strong style={{ color: 'var(--c-text)' }}>{pendingCall.contact?.name || currentChat.name}</strong>,
              Kinnect needs access to your {pendingCall.type === 'video' ? '📷 camera and 🎙️ microphone' : '🎙️ microphone'}.
              <br /><br />
              <span style={{ fontSize: '0.82rem', color: 'var(--c-primary)', fontWeight: 700 }}>
                🔒 Only used during the call — never recorded or shared.
              </span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ minHeight: 48 }}
                onClick={() => setPendingCall(null)}
              >
                ✕ Not Now
              </button>
              <button
                className="btn btn-green"
                style={{ minHeight: 48 }}
                onClick={() => { startCall(pendingCall.contact, pendingCall.type); setPendingCall(null); }}
              >
                ✓ Allow & Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner / Heading */}
      <div style={{ marginBottom: 14 }}>
        <h1 className="section-title">💬 Family Chat</h1>
      </div>

      {/* Horizontal Conversation Selector Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 8,
        marginBottom: 16,
        scrollbarWidth: 'none'
      }}>
        {Object.values(chats).map(chat => {
          const isActive = chat.id === activeChatId;
          return (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: '99px',
                border: `2px solid ${isActive ? 'var(--c-primary)' : 'var(--c-border)'}`,
                background: isActive ? 'var(--c-primary)' : 'var(--c-card)',
                color: isActive ? '#fff' : 'var(--c-text)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: 700,
                fontSize: '0.88rem',
                boxShadow: isActive ? '0 4px 14px rgba(14,116,144,0.25)' : 'none',
                transition: 'all 0.18s ease',
                flexShrink: 0
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{chat.avatar}</span>
              <span>{chat.name.split(' ')[0]}</span>
              {chat.unread > 0 && !isActive && (
                <span style={{
                  background: 'var(--c-red)',
                  color: '#fff',
                  borderRadius: 99,
                  fontSize: '0.7rem',
                  padding: '2px 7px',
                  fontWeight: 800
                }}>
                  {chat.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Chat Box */}
      <div className="card" style={{
        padding: 0,
        overflow: 'hidden',
        border: '1px solid var(--c-border)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100dvh - 300px)',
        minHeight: 480
      }}>
        {/* Chat Header */}
        <div style={{
          padding: '12px 18px',
          background: 'linear-gradient(135deg, var(--c-surface), #FFFFFF)',
          borderBottom: '1px solid var(--c-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div 
            onClick={() => setShowProfileModal(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 14,
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            title="Click to view full Profile & Family Details"
          >
            <div
              className="avatar"
              style={{
                width: 44, height: 44,
                background: currentChat.avatarBg || '#DBEAFE',
                color: currentChat.avatarColor || '#1E40AF',
                fontSize: '1.3rem'
              }}
            >
              {currentChat.avatar}
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: '1.02rem', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{currentChat.name}</span>
                <span style={{ fontSize: '0.68rem', background: '#DCFCE7', color: '#166534', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                  Profile ℹ️
                </span>
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--c-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }}></span>
                {currentChat.relation} · Online
              </p>
            </div>
          </div>

          {/* Quick Call shortcuts inside chat */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-green btn-sm"
              style={{ minHeight: 38, padding: '0 10px', borderRadius: 10 }}
              onClick={() => handleCallRequest(matchedContact, 'video')}
              title="Start Video Call"
            >
              <Video size={17} />
              <span style={{ fontSize: '0.8rem' }}>Video</span>
            </button>
            <button
              className="btn btn-blue btn-sm"
              style={{ minHeight: 38, padding: '0 10px', borderRadius: 10 }}
              onClick={() => handleCallRequest(matchedContact, 'audio')}
              title="Start Audio Call"
            >
              <Phone size={17} />
            </button>
          </div>
        </div>

        {/* Message Thread Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px 20px',
          background: 'radial-gradient(circle at top right, #FDFBF7, #F4EFE6 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {/* Privacy Note */}
          <div style={{
            textAlign: 'center',
            margin: '0 auto 8px',
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid #E2E8F0',
            borderRadius: 99,
            padding: '4px 14px',
            fontSize: '0.74rem',
            color: 'var(--c-muted)',
            fontWeight: 600,
            maxWidth: 360
          }}>
            🔒 Private End-to-End Family Encryption
          </div>

          {currentChat.messages.map((msg) => (
            <div
              key={msg.id}
              className="animate-popIn"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.isMe ? 'flex-end' : 'flex-start',
              }}
            >
              {!msg.isMe && currentChat.id === 'family-group' && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-primary)', marginBottom: 2, marginLeft: 8 }}>
                  {msg.senderName}
                </span>
              )}

              <div className={`chat-bubble ${msg.isMe ? 'chat-bubble-me' : 'chat-bubble-other'}`}>
                {msg.type === 'audio' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: msg.isMe ? 'rgba(255,255,255,0.25)' : '#DCFCE7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer'
                    }}>
                      ▶️
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.86rem' }}>Voice Note</p>
                      <p style={{ fontSize: '0.72rem', opacity: 0.8 }}>{msg.audioDuration || '0:15'} min</p>
                    </div>
                    <div style={{ display: 'flex', gap: 2, alignItems: 'center', marginLeft: 6 }}>
                      <span style={{ width: 3, height: 12, background: 'currentColor', borderRadius: 2 }}></span>
                      <span style={{ width: 3, height: 20, background: 'currentColor', borderRadius: 2 }}></span>
                      <span style={{ width: 3, height: 8, background: 'currentColor', borderRadius: 2 }}></span>
                      <span style={{ width: 3, height: 16, background: 'currentColor', borderRadius: 2 }}></span>
                      <span style={{ width: 3, height: 10, background: 'currentColor', borderRadius: 2 }}></span>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.98rem', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 4,
                  marginTop: 4,
                  fontSize: '0.68rem',
                  opacity: msg.isMe ? 0.85 : 0.6
                }}>
                  <span>{msg.time}</span>
                  {msg.isMe && <CheckCheck size={13} />}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTypingSimulated && (
            <div className="animate-slideUp" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
              <div style={{
                background: '#fff',
                padding: '8px 14px',
                borderRadius: 16,
                fontSize: '0.8rem',
                color: 'var(--c-muted)',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span style={{ display: 'inline-block', animation: 'pulse 1s infinite' }}>💬</span>
                {currentChat.name.split(' ')[0]} is typing...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Live Audio-to-Text Listening Banner */}
        {isListening && (
          <div style={{
            background: '#DCFCE7',
            borderTop: '1px solid #86EFAC',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            color: '#166534',
            fontWeight: 700
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ animation: 'pulse 1s infinite', fontSize: '1.2rem' }}>🎙️</span>
              <span>Listening in <strong>{langConfig.nativeName}</strong>... Speak now</span>
            </div>
            <button
              className="btn btn-sm"
              onClick={stopListening}
              style={{
                minHeight: 28, padding: '0 10px', fontSize: '0.74rem',
                background: '#166534', color: '#fff'
              }}
            >
              Done Speaking ✓
            </button>
          </div>
        )}

        {/* Quick Elder Prompts Bar in Selected Language */}
        <div style={{
          padding: '8px 14px',
          background: '#FFFDF9',
          borderTop: '1px solid var(--c-border)',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: '0.76rem',
            fontWeight: 800,
            color: 'var(--c-saffron)',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            flexShrink: 0
          }}>
            <Sparkles size={13} /> {langConfig.greeting}:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              className="quick-reply-pill"
              onClick={() => handleQuickPrompt(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Voice recording indicator modal banner */}
        {isRecordingVoice && (
          <div style={{
            background: '#FEE2E2',
            borderTop: '1px solid #FCA5A5',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B' }}>
              <span style={{ fontSize: '1.2rem', animation: 'pulse 1s infinite' }}>🔴</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                Recording Voice Note… 0:0{recordSeconds}
              </span>
            </div>
            <button
              className="btn btn-red btn-sm"
              onClick={handleFinishVoiceRecord}
              style={{ minHeight: 34, padding: '0 14px' }}
            >
              Send Note 🎙️
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div style={{
          padding: '10px 12px',
          background: 'var(--c-card)',
          borderTop: '1px solid var(--c-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          {/* Audio to Text Microphone Button */}
          {isSupported && (
            <button
              className="btn btn-ghost btn-icon"
              style={{
                minWidth: 42, width: 42, height: 42, minHeight: 42,
                borderRadius: '50%',
                borderColor: isListening ? '#16A34A' : 'var(--c-border)',
                background: isListening ? '#DCFCE7' : 'var(--c-surface)'
              }}
              onClick={() => {
                if (isListening) stopListening();
                else startListening();
              }}
              title={`Voice Typing in ${langConfig.nativeName} (Audio to Text)`}
            >
              {isListening ? (
                <MicOff size={19} color="#16A34A" />
              ) : (
                <Mic size={19} color="var(--c-primary)" />
              )}
            </button>
          )}

          {/* Toggle Native Keyboard Button */}
          <button
            className="btn btn-ghost btn-icon"
            style={{
              minWidth: 42, width: 42, height: 42, minHeight: 42,
              borderRadius: '50%',
              borderColor: showNativeKeyboard ? 'var(--c-saffron)' : 'var(--c-border)',
              background: showNativeKeyboard ? '#FEF3C7' : 'var(--c-surface)',
              fontSize: '1rem'
            }}
            onClick={() => setShowNativeKeyboard(v => !v)}
            title={`Toggle On-Screen Keyboard (${langConfig.nativeName})`}
          >
            ⌨️
          </button>

          {/* Text Input */}
          <input
            className="input"
            style={{
              minHeight: 44,
              borderRadius: 24,
              padding: '8px 16px',
              fontSize: '0.94rem',
              flex: 1
            }}
            placeholder={isListening ? `Listening in ${langConfig.nativeName}...` : `Message in ${langConfig.nativeName} or English...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />

          {/* Send Button */}
          <button
            className="btn btn-primary"
            style={{
              minWidth: 44, width: 44, height: 44, minHeight: 44,
              padding: 0,
              borderRadius: '50%'
            }}
            onClick={handleSend}
            disabled={!inputText.trim()}
          >
            <Send size={18} />
          </button>
        </div>

        {/* Collapsible Native Virtual Keyboard */}
        {showNativeKeyboard && (
          <NativeKeyboard
            languageCode={selectedLanguage}
            onKeyPress={handleKeyPress}
            onBackspace={handleKeyboardBackspace}
            onSpace={handleKeyboardSpace}
            onClear={handleKeyboardClear}
            onClose={() => setShowNativeKeyboard(false)}
            onChangeLanguage={setSelectedLanguage}
          />
        )}
      </div>

      {/* Candidate / Group Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          target={currentChat}
          onClose={() => setShowProfileModal(false)}
          onCall={startCall}
          onChat={(id) => {
            setActiveChatId(id);
            setShowProfileModal(false);
          }}
        />
      )}
    </div>
  );
}
