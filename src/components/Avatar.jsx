import React from 'react';

// Shows a person's photo if they added one, otherwise their emoji avatar
export default function Avatar({ person, size = 44, ring = false, style = {}, onClick, title }) {
  const photo = person?.photo;
  const emoji = person?.emoji || person?.avatar || '🙂';

  return (
    <div
      onClick={onClick}
      title={title}
      style={{
        width: size, height: size, minWidth: size,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: person?.avatarBg || 'var(--c-surface-warm)',
        color: person?.avatarColor || 'var(--c-text)',
        fontSize: size * 0.52,
        lineHeight: 1,
        border: ring ? '2px solid var(--c-primary)' : '1px solid var(--c-border)',
        cursor: onClick ? 'pointer' : undefined,
        flexShrink: 0,
        ...style,
      }}
    >
      {photo
        ? <img src={photo} alt={person?.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : emoji}
    </div>
  );
}
