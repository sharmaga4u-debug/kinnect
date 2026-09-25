import React from 'react';
import { MessageSquare, Phone, BookOpen, Gamepad2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const TABS = [
  { id: 'chats',  label: 'Chats',  Icon: MessageSquare },
  { id: 'calls',  label: 'Calls',  Icon: Phone },
  { id: 'play',   label: 'Play',   Icon: Gamepad2 },
  { id: 'wisdom', label: 'Wisdom', Icon: BookOpen },
];

export default function Navigation() {
  const { activeTab, setActiveTab, totalUnreadChats } = useApp();

  return (
    <nav className="nav-bar" role="navigation" aria-label="Main navigation">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={24} strokeWidth={isActive ? 2.4 : 1.8} />
              {id === 'chats' && totalUnreadChats > 0 && (
                <span className="unread-badge" style={{ position: 'absolute', top: -6, right: -12, fontSize: '0.65rem', padding: '0 5px', minWidth: 18 }}>
                  {totalUnreadChats}
                </span>
              )}
            </div>
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
