import React from 'react';
import { MessageSquare, Phone, Users, BookOpen, Image, Gamepad2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const TABS = [
  { id: 'chats',     label: 'Chats',       Icon: MessageSquare, emoji: '💬' },
  { id: 'calls',     label: 'Calls',       Icon: Phone,         emoji: '📞' },
  { id: 'community', label: 'Community',   Icon: Users,         emoji: '👥' },
  { id: 'wisdom',    label: 'Wisdom',      Icon: BookOpen,      emoji: '📖' },
  { id: 'album',     label: 'Memories',    Icon: Image,         emoji: '📸' },
];

export default function Navigation() {
  const { activeTab, setActiveTab, snippets, totalUnreadChats } = useApp();
  const unwatched = snippets.filter(s => !s.watched).length;

  return (
    <nav className="nav-bar" role="navigation" aria-label="Main navigation">
      {TABS.map(({ id, label, Icon, emoji }) => {
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />

              {/* Badge for unread chats */}
              {id === 'chats' && totalUnreadChats > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -8,
                  background: 'var(--c-red)', color: '#fff',
                  borderRadius: '99px', fontSize: '0.65rem', fontWeight: 800,
                  padding: '1px 5px', minWidth: 17, textAlign: 'center',
                  lineHeight: '15px',
                  boxShadow: '0 2px 6px rgba(220,38,38,0.4)'
                }}>
                  {totalUnreadChats}
                </span>
              )}

              {/* Badge for unwatched memories */}
              {id === 'album' && unwatched > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -8,
                  background: 'var(--c-saffron)', color: '#fff',
                  borderRadius: '99px', fontSize: '0.65rem', fontWeight: 800,
                  padding: '1px 5px', minWidth: 17, textAlign: 'center',
                  lineHeight: '15px',
                }}>
                  {unwatched}
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.72rem', marginTop: 2 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
