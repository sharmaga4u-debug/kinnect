import React from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft } from 'lucide-react';
import { useBackButton } from '../hooks/useBackButton';

/* Bottom sheet used for every popup in the app. Rendered into <body> so it always sits above the nav. */
export default function Sheet({ title, onClose, onBack, children, footer, full = false }) {
  const close = useBackButton(onClose);

  return createPortal(
    <div className="sheet-backdrop animate-fadeIn" onClick={close}>
      <div
        className="sheet animate-slideUp"
        onClick={e => e.stopPropagation()}
        style={full ? { height: '92dvh' } : undefined}
        role="dialog"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        <div className="sheet-handle" />
        <div className="sheet-header">
          {onBack && (
            <button className="icon-btn" onClick={onBack} aria-label="Back"><ChevronLeft size={24} /></button>
          )}
          <h2 className="sheet-title">{title}</h2>
          <button className="icon-btn" onClick={close} aria-label="Close"><X size={22} /></button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
