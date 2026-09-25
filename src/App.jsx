import React, { useState } from 'react';
import { MessageSquareHeart, Lock } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import Onboarding from './components/Onboarding';
import LockScreen from './components/LockScreen';
import Navigation from './components/Navigation';
import ChatsPage from './components/ChatsPage';
import CallsPage from './components/CallsPage';
import WisdomPage from './components/WisdomPage';
import ActiveVideoCall from './components/ActiveVideoCall';
import IncomingCallModal from './components/IncomingCallModal';
import SettingsSheet from './components/SettingsSheet';
import FeedbackSheet from './components/FeedbackSheet';
import Avatar from './components/Avatar';

const TITLES = { chats: 'Chats', calls: 'Calls', wisdom: 'Wisdom' };

function AppShell() {
  const { user, locked, lockApp, activeTab, activeCall, realtimeConnected } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

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
        <button className="icon-btn" onClick={() => setShowFeedback(true)} aria-label="Send feedback">
          <MessageSquareHeart size={22} color="#DB2777" />
        </button>
        <button onClick={() => setShowSettings(true)} aria-label="Profile and settings" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginLeft: 2 }}>
          <Avatar person={{ ...user, emoji: user.avatar }} size={38} />
        </button>
      </header>

      <main>
        {activeTab === 'chats'  && <ChatsPage />}
        {activeTab === 'calls'  && <CallsPage />}
        {activeTab === 'wisdom' && <WisdomPage />}
      </main>

      <Navigation />

      {showSettings && (
        <SettingsSheet
          onClose={() => setShowSettings(false)}
          onFeedback={() => { setShowSettings(false); setTimeout(() => setShowFeedback(true), 60); }}
        />
      )}
      {showFeedback && <FeedbackSheet onClose={() => setShowFeedback(false)} />}

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
