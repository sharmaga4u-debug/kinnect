import React from 'react';
import { Phone, PhoneOff, Video, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function IncomingCallModal() {
  const { incomingCall, answerIncomingCall, declineIncomingCall } = useApp();

  if (!incomingCall) return null;

  const { caller, callType } = incomingCall;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16
    }} className="animate-fadeIn">
      <div 
        className="card glass-card animate-popIn" 
        style={{
          width: '100%', maxWidth: 420,
          background: 'linear-gradient(145deg, #1E293B, #0F172A)',
          border: '2px solid rgba(255,255,255,0.2)',
          borderRadius: 28, padding: '32px 24px',
          textAlign: 'center', color: '#fff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Pulsing ring indicator */}
        <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 20px' }}>
          <div style={{
            position: 'absolute', inset: -8,
            borderRadius: '50%',
            background: 'rgba(34, 197, 94, 0.3)',
            animation: 'pulse 1.6s infinite'
          }} />
          <div style={{
            width: '100%', height: '100%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', position: 'relative', zIndex: 2,
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
          }}>
            {caller?.avatar || '👵'}
          </div>
        </div>

        <p style={{
          fontSize: '0.85rem',
          color: '#34D399',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          marginBottom: 6
        }}>
          Incoming {callType === 'video' ? 'Video' : 'Voice'} Call...
        </p>

        <h2 style={{
          fontSize: '1.65rem',
          fontWeight: 850,
          letterSpacing: '-0.5px',
          marginBottom: 4,
          color: '#FFFFFF'
        }}>
          {caller?.name || 'Family Member'}
        </h2>

        <p style={{
          fontSize: '0.92rem',
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 600,
          marginBottom: 32
        }}>
          {caller?.relation || 'Family'} · Tap below to connect
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          {/* Decline Button */}
          <button
            onClick={declineIncomingCall}
            style={{
              flex: 1,
              padding: '16px 20px',
              borderRadius: 18,
              border: 'none',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#F87171',
              fontWeight: 800,
              fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            <PhoneOff size={22} />
            <span>Decline</span>
          </button>

          {/* Answer Button */}
          <button
            onClick={answerIncomingCall}
            style={{
              flex: 1.4,
              padding: '16px 20px',
              borderRadius: 18,
              border: 'none',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: '#FFFFFF',
              fontWeight: 850,
              fontSize: '1.05rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)',
              transition: 'all 0.2s'
            }}
          >
            {callType === 'video' ? <Video size={24} /> : <Phone size={24} />}
            <span>Answer Call</span>
          </button>
        </div>
      </div>
    </div>
  );
}
