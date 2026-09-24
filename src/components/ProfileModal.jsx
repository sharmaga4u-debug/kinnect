import React, { useState } from 'react';
import { 
  X, Phone, Video, MessageCircle, Clock, MapPin, 
  Shield, Copy, Check, Users, Heart, Share2, Sparkles 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ProfileModal({ target, onClose, onCall, onChat, onSnippet }) {
  const { contacts } = useApp();
  const [copied, setCopied] = useState(false);

  if (!target) return null;

  const isGroup = target.id === 'family-group' || target.relation?.includes('family members');

  function handleCopyPhone(phone) {
    if (!phone) return;
    navigator.clipboard?.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Find contact object if target is a simple contact
  const contact = isGroup ? null : (contacts.find(c => c.id === target.id) || target);

  return (
    <div className="overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div 
        className="card animate-slideUp"
        style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: '90dvh',
          overflowY: 'auto',
          padding: 0,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with Close Button */}
        <div style={{
          background: isGroup 
            ? 'linear-gradient(135deg, #0E7490, #15803D)' 
            : 'linear-gradient(135deg, #D97706, #BE185D)',
          padding: '24px 20px 48px',
          position: 'relative',
          color: '#FFFFFF'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(0,0,0,0.25)',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
          
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 1,
            background: 'rgba(255,255,255,0.2)',
            padding: '3px 10px',
            borderRadius: 99
          }}>
            {isGroup ? 'Family Group Profile' : 'Member Profile'}
          </span>
        </div>

        {/* Profile Card Body */}
        <div style={{
          padding: '0 20px 24px',
          marginTop: -38,
          background: 'var(--c-card)',
          borderRadius: '24px 24px 0 0',
          position: 'relative'
        }}>
          {/* Avatar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            <div
              className="avatar"
              style={{
                width: 76,
                height: 76,
                fontSize: '2.5rem',
                background: target.avatarBg || '#FEF3C7',
                color: target.avatarColor || '#92400E',
                border: '4px solid var(--c-card)',
                boxShadow: '0 6px 18px rgba(0,0,0,0.1)'
              }}
            >
              {target.avatar || '👤'}
            </div>

            <span className="badge badge-green" style={{ marginBottom: 8, fontSize: '0.8rem' }}>
              🔒 Verified Family Member
            </span>
          </div>

          {/* Name & Relation */}
          <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--c-text)', lineHeight: 1.2 }}>
            {target.name}
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--c-primary)', fontWeight: 700, marginTop: 2 }}>
            {target.relation}
          </p>

          {/* Location & Status */}
          {contact && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 10,
              fontSize: '0.86rem',
              color: 'var(--c-muted)',
              flexWrap: 'wrap'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={15} color="var(--c-primary)" />
                {contact.city}, {contact.country}
              </span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={15} color="var(--c-saffron)" />
                {contact.timezone}
              </span>
            </div>
          )}

          {/* Status Note Box */}
          {contact?.statusText && (
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 14,
              padding: '10px 14px',
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <Sparkles size={18} color="#D97706" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.86rem', color: '#92400E', fontWeight: 600 }}>
                Status: {contact.statusText}
              </p>
            </div>
          )}

          {/* Action Buttons for Individual Contact */}
          {!isGroup && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              margin: '18px 0'
            }}>
              <button
                className="btn btn-green btn-sm"
                onClick={() => { onClose(); onCall(contact, 'video'); }}
                style={{ flexDirection: 'column', gap: 4, minHeight: 60, fontSize: '0.82rem' }}
              >
                <Video size={20} />
                Video Call
              </button>
              <button
                className="btn btn-blue btn-sm"
                onClick={() => { onClose(); onCall(contact, 'audio'); }}
                style={{ flexDirection: 'column', gap: 4, minHeight: 60, fontSize: '0.82rem' }}
              >
                <Phone size={20} />
                Audio Call
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { onClose(); onChat(contact.id); }}
                style={{ flexDirection: 'column', gap: 4, minHeight: 60, fontSize: '0.82rem' }}
              >
                <MessageCircle size={20} />
                Chat
              </button>
            </div>
          )}

          {/* Phone Number / Contact Information */}
          {contact?.phone && (
            <div style={{
              background: 'var(--c-surface)',
              borderRadius: 16,
              padding: '14px 16px',
              marginTop: 14,
              border: '1px solid var(--c-border)'
            }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Phone Number
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--c-text)' }}>
                  {contact.phone}
                </span>
                <button
                  onClick={() => handleCopyPhone(contact.phone)}
                  className="btn btn-ghost btn-sm"
                  style={{ minHeight: 32, padding: '0 10px', fontSize: '0.76rem' }}
                >
                  {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
            </div>
          )}

          {/* Group Specific: Members List */}
          {isGroup && (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--c-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={16} color="var(--c-primary)" /> Family Members (5)
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--c-emerald)', fontWeight: 700 }}>
                  Active Global Circle
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {contacts.map(c => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--c-surface)',
                      borderRadius: 14,
                      padding: '10px 14px',
                      border: '1px solid var(--c-border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        className="avatar"
                        style={{ width: 38, height: 38, fontSize: '1.2rem', background: c.avatarBg, color: c.avatarColor }}
                      >
                        {c.emoji}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--c-text)' }}>
                          {c.name}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--c-muted)' }}>
                          {c.relation} · {c.city}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-green btn-sm"
                        style={{ minHeight: 32, padding: '0 8px', borderRadius: 8 }}
                        onClick={() => { onClose(); onCall(c, 'video'); }}
                        title="Video Call"
                      >
                        <Video size={14} />
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ minHeight: 32, padding: '0 8px', borderRadius: 8 }}
                        onClick={() => { onClose(); onChat(c.id); }}
                        title="Chat"
                      >
                        <MessageCircle size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shared Family Memories Preview */}
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--c-text)', marginBottom: 8 }}>
              📸 Shared Memories in Chat
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { title: 'Diwali Diyas', emoji: '🪔' },
                { title: 'Science Fair', emoji: '🏆' },
                { title: 'Goa Holiday', emoji: '🏖️' },
              ].map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--c-surface)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 14,
                    height: 70,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '1.8rem' }}>{m.emoji}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--c-muted)', marginTop: 2 }}>
                    {m.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
