import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { useApp } from '../context/AppContext';
import { formatPhone } from '../utils/phone';
import Avatar from './Avatar';
import Sheet from './Sheet';

// What the QR code holds: just your number, so someone next to you can add you
const PREFIX = 'KINNECT:+';

export function MyQrSheet({ onClose }) {
  const { user } = useApp();
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(PREFIX + user.phone, { width: 560, margin: 1, color: { dark: '#0F172A', light: '#FFFFFF' } }).then(setSrc);
  }, [user.phone]);
  return (
    <Sheet title="My QR code" onClose={onClose}>
      <div style={{ textAlign: 'center' }}>
        <Avatar person={{ ...user, emoji: user.avatar }} size={64} style={{ margin: '0 auto 8px' }} />
        <p className="row-title" style={{ fontSize: '1.15rem' }}>{user.name}</p>
        <p className="row-sub">{formatPhone(user.phone)}</p>
        {src && <img src={src} alt="My Kinnect QR code" style={{ width: '78%', maxWidth: 300, margin: '14px auto', display: 'block', borderRadius: 16, border: '1px solid var(--c-border)' }} />}
        <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem' }}>Family can scan this in Kinnect (New chat → Scan QR code) to add you, without typing your number.</p>
      </div>
    </Sheet>
  );
}

export function ScanQrSheet({ onClose, onFound }) {
  const { addByNumber } = useApp();
  const video = useRef(null);
  const [status, setStatus] = useState('Point the camera at a Kinnect QR code');
  const done = useRef(false);

  useEffect(() => {
    let stream;
    let timer;
    const canvas = document.createElement('canvas');
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.current.srcObject = stream;
        await video.current.play();
        timer = setInterval(async () => {
          const v = video.current;
          if (!v || done.current || !v.videoWidth) return;
          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(v, 0, 0);
          const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
          if (!code?.data) return;
          if (!code.data.startsWith(PREFIX)) { setStatus("That's not a Kinnect QR code"); return; }
          done.current = true;
          setStatus('Found! Looking them up…');
          const r = await addByNumber(code.data.slice(PREFIX.length - 1));
          if (r.error) { setStatus(r.error); done.current = false; return; }
          onFound(r);
        }, 300);
      } catch {
        setStatus('Camera permission is needed to scan. Allow it for Kinnect in your phone settings.');
      }
    })();
    return () => { clearInterval(timer); stream?.getTracks().forEach(t => t.stop()); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Sheet title="Scan QR code" onClose={onClose}>
      <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: '#000', aspectRatio: '1' }}>
        <video ref={video} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: '18%', border: '3px solid rgba(255,255,255,0.85)', borderRadius: 20 }} />
      </div>
      <p style={{ textAlign: 'center', marginTop: 12, color: 'var(--c-text-soft)' }}>{status}</p>
    </Sheet>
  );
}
