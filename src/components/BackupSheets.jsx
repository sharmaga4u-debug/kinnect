import React, { useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { createBackup, saveBackupFile, openBackup, restoreBackup } from '../services/backup';
import Sheet from './Sheet';

/* Make an encrypted backup file */
export function BackupSheet({ onClose }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [state, setState] = useState('form'); // form | working | done | error
  const [msg, setMsg] = useState('');
  const ok = pw.length >= 6 && pw === pw2;

  async function run() {
    setState('working');
    try {
      const file = await saveBackupFile(await createBackup(pw));
      setMsg(file);
      setState('done');
    } catch (e) {
      setMsg(e?.message || 'Something went wrong');
      setState('error');
    }
  }

  return (
    <Sheet title="Back up chats" onClose={onClose}>
      {state === 'done' ? (
        <div className="empty-state">
          <div className="icon">✅</div>
          <h3>Backup ready</h3>
          <p>Keep <strong>{msg}</strong> somewhere safe (Google Drive, email to yourself, a computer). You'll need it and your password to restore.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={onClose}>Done</button>
        </div>
      ) : (
        <>
          <div className="notice" style={{ marginBottom: 16 }}>
            <ShieldCheck size={20} style={{ flexShrink: 0 }} />
            <span>Your chats, photos, contacts and encryption key are locked with this password. Without it, nobody (including us) can open the backup.</span>
          </div>
          <label className="field-label">Backup password (6+ characters)</label>
          <input className="input" type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" />
          <label className="field-label" style={{ marginTop: 12 }}>Type it again</label>
          <input className="input" type="password" value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" />
          {pw2 && pw !== pw2 && <p style={{ color: 'var(--c-red)', fontSize: '0.85rem', marginTop: 6 }}>Passwords don't match</p>}
          {state === 'error' && <p style={{ color: 'var(--c-red)', fontSize: '0.85rem', marginTop: 8 }}>{msg}</p>}
          <button className="btn btn-primary btn-full" style={{ marginTop: 18 }} disabled={!ok || state === 'working'} onClick={run}>
            {state === 'working' ? 'Preparing backup…' : 'Create backup file'}
          </button>
        </>
      )}
    </Sheet>
  );
}

/* Restore a backup on a new phone (from the welcome screen) */
export function RestoreSheet({ onClose }) {
  const fileRef = useRef(null);
  const [content, setContent] = useState(null);
  const [fileName, setFileName] = useState('');
  const [pw, setPw] = useState('');
  const [state, setState] = useState('form');
  const [error, setError] = useState('');

  async function pick(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setFileName(f.name);
    setContent(await f.text());
    setError('');
  }

  async function run() {
    setState('working');
    setError('');
    try {
      const data = await openBackup(content, pw);
      await restoreBackup(data);
      window.location.reload();
    } catch (e) {
      setState('form');
      setError(e.message === 'WRONG_PASSWORD' ? 'Wrong password. Please try again.'
        : e.message === 'NOT_A_BACKUP' ? "That file isn't a Kinnect backup."
        : 'Could not restore this backup.');
    }
  }

  return (
    <Sheet title="Restore from backup" onClose={onClose}>
      <p style={{ color: 'var(--c-muted)', marginBottom: 14 }}>Moving to a new phone? Pick your Kinnect backup file and enter its password.</p>
      <input ref={fileRef} type="file" onChange={pick} style={{ display: 'none' }} />
      <button className="btn btn-ghost btn-full" onClick={() => fileRef.current?.click()}>
        📁 {fileName || 'Choose backup file'}
      </button>
      {content && (
        <>
          <label className="field-label" style={{ marginTop: 14 }}>Backup password</label>
          <input className="input" type="password" value={pw} onChange={e => setPw(e.target.value)} />
        </>
      )}
      {error && <p style={{ color: 'var(--c-red)', fontSize: '0.86rem', marginTop: 10 }}>{error}</p>}
      <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} disabled={!content || !pw || state === 'working'} onClick={run}>
        {state === 'working' ? 'Restoring…' : 'Restore'}
      </button>
    </Sheet>
  );
}
