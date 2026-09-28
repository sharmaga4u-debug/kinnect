import React from 'react';

/* Last line of defence: an unexpected error shows a friendly screen instead of a blank app */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[Kinnect] crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', background: '#FAF8F5' }}>
        <div style={{ fontSize: '3rem' }}>🌿</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 8, color: '#1E293B' }}>Something went wrong</h1>
        <p style={{ color: '#64748B', marginTop: 6, maxWidth: 320, lineHeight: 1.5 }}>Your chats are safe on this phone. Tap below to open Kinnect again.</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 18, padding: '14px 28px', borderRadius: 16, border: 'none', background: '#0E7490', color: '#fff', fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer' }}>
          Reload Kinnect
        </button>
      </div>
    );
  }
}
