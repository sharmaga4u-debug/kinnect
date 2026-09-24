import React, { useState } from 'react';
import { Phone, ShieldCheck, User, ArrowRight, ChevronRight, Sparkles, Check, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';

/* Simple OTP simulation */
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const DEMO_PROFILES = [
  {
    name: 'Savitri Devi',
    relation: 'Beloved Matriarch',
    avatar: '👵',
    phone: '+91 98765 12345',
    tag: 'Senior Demo',
    bg: '#FEF3C7',
    color: '#92400E'
  },
  {
    name: 'Aarav Sharma',
    relation: 'Grandson · London',
    avatar: '👦',
    phone: '+44 7700 900001',
    tag: 'Grandchild Demo',
    bg: '#DBEAFE',
    color: '#1E40AF'
  },
  {
    name: 'Priya Nair',
    relation: 'Daughter · Toronto',
    avatar: '👩',
    phone: '+1 416 555 0101',
    tag: 'Family Demo',
    bg: '#FCE7F3',
    color: '#9D174D'
  }
];

export default function AuthModal() {
  const { setUser } = useApp();
  const [authMode, setAuthMode] = useState('quick'); // 'quick' | 'phone'
  const [step, setStep] = useState('phone'); // phone | otp | profile
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleQuickLogin(profile) {
    setUser({
      name: profile.name,
      phone: profile.phone,
      avatar: profile.avatar,
      relation: profile.relation
    });
  }

  function handleSendOTP() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) { 
      setError('Please enter a valid phone number'); 
      return; 
    }
    const code = generateOTP();
    setGeneratedOTP(code);
    setError('');
    setStep('otp');
  }

  function handleOTPChange(val, idx) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
    if (next.every(d => d !== '') && next.join('') === generatedOTP) {
      setError('');
      setStep('profile');
    }
  }

  function handleAutoFillOTP() {
    if (!generatedOTP) return;
    setOtp(generatedOTP.split(''));
    setError('');
    setTimeout(() => {
      setStep('profile');
    }, 250);
  }

  function handleVerifyOTP() {
    if (otp.join('') === generatedOTP) { 
      setError(''); 
      setStep('profile'); 
    } else {
      setError('Invalid OTP code. Please re-enter.');
    }
  }

  function handleFinish() {
    if (!name.trim()) { 
      setError('Please enter your name'); 
      return; 
    }
    setUser({ 
      name: name.trim(), 
      phone: `${countryCode} ${phone}`, 
      avatar: '🌿',
      relation: 'Family Member' 
    });
  }

  return (
    <div className="login-backdrop animate-fadeIn">
      {/* Dynamic ambient floating lights */}
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="ambient-blob ambient-blob-3" />

      <div className="card glass-card animate-slideUp" style={{
        width: '100%',
        maxWidth: 440,
        position: 'relative',
        zIndex: 10,
        padding: '30px 24px',
        boxShadow: '0 25px 60px -15px rgba(14,116,144,0.18), 0 0 0 1px rgba(255,255,255,0.8) inset'
      }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{
            width: 58, height: 58, margin: '0 auto 12px',
            borderRadius: 18,
            background: 'linear-gradient(135deg, #0E7490, #15803D)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.9rem', color: '#fff',
            boxShadow: '0 10px 25px rgba(14,116,144,0.3)',
            animation: 'floatSlow 4s ease-in-out infinite'
          }}>
            🌿
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 850, letterSpacing: '-0.5px' }}>
            <span className="text-gradient">Kinnect</span>
          </h1>
          <span className="badge badge-amber" style={{ fontSize: '0.72rem', padding: '2px 8px', marginTop: 4 }}>
            Senior Friendly & Multi-Generational
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
          background: 'rgba(0,0,0,0.04)',
          padding: 4, borderRadius: 14, marginBottom: 20
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode('quick'); setError(''); }}
            style={{
              padding: '9px 10px',
              borderRadius: 10,
              fontSize: '0.86rem',
              fontWeight: 750,
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              background: authMode === 'quick' ? '#FFFFFF' : 'transparent',
              color: authMode === 'quick' ? 'var(--c-primary)' : 'var(--c-muted)',
              boxShadow: authMode === 'quick' ? '0 2px 10px rgba(0,0,0,0.06)' : 'none',
              transition: 'all .2s'
            }}
          >
            <Sparkles size={16} /> 1-Click Demo
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('phone'); setError(''); }}
            style={{
              padding: '9px 10px',
              borderRadius: 10,
              fontSize: '0.86rem',
              fontWeight: 750,
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              background: authMode === 'phone' ? '#FFFFFF' : 'transparent',
              color: authMode === 'phone' ? 'var(--c-primary)' : 'var(--c-muted)',
              boxShadow: authMode === 'phone' ? '0 2px 10px rgba(0,0,0,0.06)' : 'none',
              transition: 'all .2s'
            }}
          >
            <Phone size={16} /> Phone OTP
          </button>
        </div>

        {/* 1-Click Demo Profiles View */}
        {authMode === 'quick' && (
          <div className="animate-slideUp" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DEMO_PROFILES.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleQuickLogin(p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px',
                  borderRadius: 16,
                  border: '1.5px solid rgba(226,232,240,0.8)',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all .22s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
                className="hover-elevate"
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: p.bg, color: p.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  {p.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--c-text)' }}>{p.name}</span>
                    <span className="badge badge-teal" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>{p.tag}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)', fontWeight: 600 }}>{p.relation}</p>
                </div>
                <ChevronRight size={18} color="var(--c-primary)" />
              </button>
            ))}

            <div style={{ marginTop: 8, padding: 10, borderRadius: 12, background: 'rgba(21,128,61,0.08)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <ShieldCheck size={16} color="var(--c-emerald)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 600 }}>
                Instant private sign-in. Phone numbers are always masked.
              </p>
            </div>
          </div>
        )}

        {/* Step: Phone OTP Login */}
        {authMode === 'phone' && step === 'phone' && (
          <div className="animate-slideUp">
            <label style={{ fontWeight: 700, color: 'var(--c-text)', fontSize: '0.9rem', marginBottom: 6, display: 'block' }}>
              Mobile Phone Number
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <select
                className="input"
                style={{ width: 92, flexShrink: 0, fontWeight: 700, padding: '10px 8px' }}
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+61">🇦🇺 +61</option>
                <option value="+65">🇸🇬 +65</option>
                <option value="+971">🇦🇪 +971</option>
              </select>
              <input
                className="input"
                type="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={e => { setPhone(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                style={{ fontWeight: 600 }}
              />
            </div>
            {error && <p style={{ color: 'var(--c-red)', fontSize: '0.84rem', marginBottom: 10, fontWeight: 600 }}>{error}</p>}
            <button className="btn btn-primary btn-full btn-lg" onClick={handleSendOTP}>
              <Phone size={18} /> Send Login Code
            </button>
          </div>
        )}

        {/* Step: OTP Verification */}
        {authMode === 'phone' && step === 'otp' && (
          <div className="animate-slideUp">
            <p style={{ color: 'var(--c-muted)', fontSize: '0.88rem', marginBottom: 12, textAlign: 'center' }}>
              Verification code sent to <strong>{countryCode} {phone}</strong>
            </p>

            {/* Simulated instant code helper */}
            <div style={{
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              borderRadius: 12, padding: '10px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 700, display: 'block' }}>DEMO OTP SIMULATOR:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 850, color: '#1E40AF', letterSpacing: '2px' }}>{generatedOTP}</span>
              </div>
              <button
                type="button"
                onClick={handleAutoFillOTP}
                style={{
                  fontSize: '0.78rem', fontWeight: 800,
                  background: '#1E40AF', color: '#fff',
                  border: 'none', borderRadius: 8, padding: '6px 10px',
                  cursor: 'pointer'
                }}
              >
                Auto-fill
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  className="input"
                  style={{ width: 46, textAlign: 'center', fontSize: '1.35rem', fontWeight: 800, padding: '8px 2px' }}
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOTPChange(e.target.value, i)}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !digit && i > 0) {
                      document.getElementById(`otp-${i - 1}`)?.focus();
                    }
                  }}
                />
              ))}
            </div>

            {error && <p style={{ color: 'var(--c-red)', fontSize: '0.84rem', marginBottom: 10, textAlign: 'center', fontWeight: 600 }}>{error}</p>}
            <button className="btn btn-primary btn-full" onClick={handleVerifyOTP}>
              Verify Code <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-ghost btn-full btn-sm"
              style={{ marginTop: 10 }}
              onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError(''); }}
            >
              ← Change Number
            </button>
          </div>
        )}

        {/* Step: Profile Completion */}
        {authMode === 'phone' && step === 'profile' && (
          <div className="animate-slideUp">
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: '2.4rem', marginBottom: 4 }}>🎉</div>
              <p style={{ fontWeight: 800, color: 'var(--c-primary)', fontSize: '1.05rem' }}>Phone Verified!</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--c-muted)' }}>What should family members call you?</p>
            </div>
            <input
              className="input"
              placeholder="e.g. Ramesh Uncle / Savitri Dadi"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleFinish()}
              style={{ marginBottom: 12, fontWeight: 700 }}
            />
            {error && <p style={{ color: 'var(--c-red)', fontSize: '0.84rem', marginBottom: 10, fontWeight: 600 }}>{error}</p>}
            <button className="btn btn-primary btn-full btn-lg" onClick={handleFinish}>
              Enter Kinnect <ChevronRight size={20} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
