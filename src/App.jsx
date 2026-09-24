import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import AuthModal from './components/AuthModal';
import Navigation from './components/Navigation';
import FamilyChat from './components/FamilyChat';
import TimezoneCallCenter from './components/TimezoneCallCenter';
import CommunityHub from './components/CommunityHub';
import TopicsAndWisdom from './components/TopicsAndWisdom';
import FamilyAlbum from './components/FamilyAlbum';
import ActiveVideoCall from './components/ActiveVideoCall';
import IncomingCallModal from './components/IncomingCallModal';
import FeedbackModal from './components/FeedbackModal';
import { LANGUAGES } from './utils/languageConfig';
import { LogOut, User as UserIcon, Radio } from 'lucide-react';

function AppShell() {
  const { 
    user, logout, activeTab, activeCall, fontScale, setFontScale,
    selectedLanguage, setSelectedLanguage, realtimeConnected, familyCode, setFamilyCode
  } = useApp();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [editingFamilyCode, setEditingFamilyCode] = useState(false);
  const [tempFamilyCode, setTempFamilyCode] = useState(familyCode);

  if (!user) return <AuthModal />;

  const langConfig = LANGUAGES[selectedLanguage] || LANGUAGES.en;

  function toggleFontSize() {
    if (fontScale === 'normal') setFontScale('large');
    else if (fontScale === 'large') setFontScale('xlarge');
    else setFontScale('normal');
  }

  function handleShareInvite() {
    const link = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'Kinnect', text: `Join our family room "${familyCode}" on Kinnect! 🌿`, url: link });
    } else {
      navigator.clipboard?.writeText(link);
      alert('🔗 Link copied!\n' + link + `\n\nFamily Room: ${familyCode}\nShare this with family to join on any phone or PC!`);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', position: 'relative', overflowX: 'hidden' }}>
      {/* Dynamic Ambient Mesh Glow Background */}
      <div className="ambient-blob ambient-blob-1" style={{ position: 'fixed', pointerEvents: 'none' }} />
      <div className="ambient-blob ambient-blob-2" style={{ position: 'fixed', pointerEvents: 'none' }} />
      <div className="ambient-blob ambient-blob-3" style={{ position: 'fixed', pointerEvents: 'none' }} />

      {/* Friendly Top Header Bar */}
      <header className="glass-header" style={{
        position: 'sticky', top: 0, zIndex: 40,
        padding: '10px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        {/* Left: App Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'linear-gradient(135deg, #0E7490, #15803D)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.45rem', color: '#fff',
            boxShadow: '0 4px 14px rgba(14,116,144,0.25)'
          }}>
            🌿
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontWeight: 850,
                fontSize: '1.2rem',
                letterSpacing: '-0.4px',
                background: 'linear-gradient(135deg, #0E7490, #15803D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Kinnect
              </span>
              <span 
                className={realtimeConnected ? "badge badge-green" : "badge badge-amber"} 
                style={{ fontSize: '0.66rem', padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                title={realtimeConnected ? "Real-time sync connected" : "Connecting to real-time network"}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: realtimeConnected ? '#22C55E' : '#F59E0B', display: 'inline-block' }} />
                {realtimeConnected ? 'Live' : 'Connecting'}
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--c-muted)', fontWeight: 600 }}>
              {langConfig.greeting}, {user.name.split(' ')[0]} ji! 🙏
            </p>
            {/* Invite family link */}
            <button
              style={{
                marginTop: 1,
                fontSize: '0.69rem',
                fontWeight: 700,
                background: 'none',
                border: 'none',
                color: 'var(--c-primary)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                textDecoration: 'underline dotted'
              }}
              onClick={handleShareInvite}
              title="Share app link with family members"
            >
              🔗 Invite Family ({familyCode})
            </button>
          </div>
        </div>

        {/* Right side: Language Selector (Top Right Only), Font scale toggle & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
          {/* Header Language Dropdown */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              borderRadius: 10,
              padding: '6px 8px',
              border: '1.5px solid var(--c-border)',
              background: '#FFF',
              color: 'var(--c-primary)',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
            title="Change Application Language"
          >
            {Object.values(LANGUAGES).map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.nativeName}
              </option>
            ))}
          </select>

          {/* Senior Accessibility Text Size Button */}
          <button
            onClick={toggleFontSize}
            className="chip"
            style={{
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              background: fontScale !== 'normal' ? 'var(--c-saffron)' : 'var(--c-surface)',
              color: fontScale !== 'normal' ? '#fff' : 'var(--c-text)',
              borderColor: fontScale !== 'normal' ? 'var(--c-saffron)' : 'var(--c-border)'
            }}
            title="Adjust text size for easier reading"
          >
            Aa {fontScale === 'normal' ? '1x' : fontScale === 'large' ? '1.2x' : '1.4x'}
          </button>

          {/* User Avatar with Profile & Logout dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu(p => !p)}
              style={{
                width: 40, height: 40,
                borderRadius: '50%',
                fontSize: '1.2rem',
                background: '#FEF3C7',
                color: '#92400E',
                border: '2px solid #FDE68A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
              title="View profile & account options"
              aria-label="Profile menu"
            >
              {user.avatar || '👵'}
            </button>

            {/* Profile / Logout Dropdown Menu */}
            {showProfileMenu && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 45 }} 
                  onClick={() => setShowProfileMenu(false)} 
                />
                <div 
                  className="card glass-card animate-popIn" 
                  style={{
                    position: 'absolute', top: 48, right: 0, width: 240,
                    zIndex: 50, padding: 14, borderRadius: 16,
                    boxShadow: '0 12px 36px rgba(0,0,0,0.15)'
                  }}
                >
                  <div style={{ paddingBottom: 10, borderBottom: '1px solid var(--c-border)', marginBottom: 8 }}>
                    <p style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--c-text)' }}>{user.name}</p>
                    <p style={{ fontSize: '0.76rem', color: 'var(--c-muted)', fontWeight: 600 }}>{user.relation || 'Member'}</p>
                    {user.phone && <p style={{ fontSize: '0.72rem', color: 'var(--c-muted)' }}>{user.phone}</p>}
                    
                    {/* Family Room Room ID */}
                    <div style={{ marginTop: 8, padding: '6px 8px', background: 'rgba(14,116,144,0.08)', borderRadius: 8 }}>
                      <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--c-primary)' }}>
                        Family Room:
                      </p>
                      {editingFamilyCode ? (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          <input 
                            value={tempFamilyCode}
                            onChange={(e) => setTempFamilyCode(e.target.value)}
                            style={{ width: '100%', fontSize: '0.75rem', padding: '2px 4px', borderRadius: 4, border: '1px solid var(--c-border)' }}
                          />
                          <button 
                            onClick={() => {
                              setFamilyCode(tempFamilyCode);
                              setEditingFamilyCode(false);
                            }}
                            className="btn btn-sm btn-primary"
                            style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--c-primary)' }}>{familyCode}</span>
                          <button 
                            onClick={() => {
                              setTempFamilyCode(familyCode);
                              setEditingFamilyCode(true);
                            }}
                            style={{ fontSize: '0.68rem', color: 'var(--c-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Change
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      fontWeight: 750,
                      fontSize: '0.82rem',
                      display: 'flex', alignItems: 'center', gap: 8,
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={16} /> Sign Out / Switch Profile
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main style={{ position: 'relative', zIndex: 10 }}>
        {activeTab === 'chats'     && <FamilyChat />}
        {activeTab === 'calls'     && <TimezoneCallCenter />}
        {activeTab === 'community' && <CommunityHub />}
        {activeTab === 'wisdom'    && <TopicsAndWisdom />}
        {activeTab === 'album'     && <FamilyAlbum />}
      </main>

      {/* Bottom Navigation */}
      <Navigation />

      {/* Floating Family Feedback Button & Modal */}
      <FeedbackModal />

      {/* Incoming Call Ringing Overlay */}
      <IncomingCallModal />

      {/* Active Video/Audio Call Overlay with In-Call Games */}
      {activeCall && <ActiveVideoCall />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
