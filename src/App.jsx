import React, { useState } from 'react';
import { MessageSquareHeart, Lock } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import Onboarding from './components/Onboarding';
import LockScreen from './components/LockScreen';
import Navigation from './components/Navigation';
import ChatsPage from './components/ChatsPage';
import CallsPage from './components/CallsPage';
import WisdomPage from './components/WisdomPage';
import PlayPage from './components/PlayPage';
import { LateCallSheet, CallRatingSheet } from './components/CallSheets';
import ActiveVideoCall from './components/ActiveVideoCall';
import IncomingCallModal from './components/IncomingCallModal';
import SettingsSheet from './components/SettingsSheet';
import FeedbackSheet from './components/FeedbackSheet';
import Avatar from './components/Avatar';

const TITLES = { chats: 'Chats', calls: 'Calls', play: 'Play together', wisdom: 'Wisdom' };

function AppShell() {
  const { user, locked, lockApp, activeTab, activeCall, realtimeConnected, feedbackOpen, openFeedback, closeFeedback } = useApp();
  const [showSettings, setShowSettings] = useState(false);

  if (!user) return <Onboarding />;

  // Calls can still ring (and be answered) while the app is locked
  if (locked) {
    return (
      <>
        <LockScreen />
        <IncomingCallModal />
        {activeCall && <ActiveVideoCall />}
      </>
    );
  }

  return (
    <div style={{ minHeight: '100dvh' }}>
      <header className="app-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="app-header-title">{TITLES[activeTab] || 'Kinnect'}</h1>
          {!realtimeConnected && (
            <p className="app-header-sub"><span className="status-dot" style={{ background: '#F59E0B' }} /> Connecting…</p>
          )}
        </div>
        {user.pinHash && (
          <button className="icon-btn" onClick={lockApp} aria-label="Lock app"><Lock size={20} /></button>
        )}
        {/* Testing phase: feedback is always one tap away */}
        <button className="pill-btn" onClick={openFeedback} aria-label="Send feedback" style={{ color: '#DB2777', borderColor: '#FBCFE8', background: '#FDF2F8', padding: '7px 12px' }}>
          <MessageSquareHeart size={17} /> Feedback
        </button>
        <button onClick={() => setShowSettings(true)} aria-label="Profile and settings" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginLeft: 2 }}>
          <Avatar person={{ ...user, emoji: user.avatar }} size={38} />
        </button>
      </header>

      <main>
        {activeTab === 'chats'  && <ChatsPage />}
        {activeTab === 'calls'  && <CallsPage />}
        {activeTab === 'play'   && <PlayPage />}
        {activeTab === 'wisdom' && <WisdomPage />}
      </main>

      <Navigation />

      {showSettings && (
        <SettingsSheet
          onClose={() => setShowSettings(false)}
          onFeedback={() => { setShowSettings(false); setTimeout(openFeedback, 60); }}
        />
      )}
      {feedbackOpen && <FeedbackSheet onClose={closeFeedback} />}
      <LateCallSheet />
      <CallRatingSheet />

      <IncomingCallModal />
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
