import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Lock } from 'lucide-react';
import { useApp, personView } from '../context/AppContext';
import { realtime } from '../services/realtime';
import Avatar from './Avatar';

// PeerJS ids look like "kinnect2-<userId>" (maybe with a "-123" suffix if the id was taken)
const userIdFromPeer = (peerId = '') => peerId.replace(/^kinnect2-/, '').replace(/-\d{1,3}$/, '');

function Tile({ stream, person, video, muted }) {
  const vRef = useRef(null);
  const aRef = useRef(null);
  useEffect(() => {
    if (vRef.current && stream) vRef.current.srcObject = stream;
    if (aRef.current && stream && !muted) aRef.current.srcObject = stream;
  }, [stream, video, muted]);
  const hasVideo = video && stream?.getVideoTracks().some(t => t.enabled);
  return (
    <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
      {hasVideo
        ? <video ref={vRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: muted ? 'scaleX(-1)' : undefined }} />
        : <Avatar person={person} size={72} />}
      {!muted && <audio ref={aRef} autoPlay />}
      <span style={{ position: 'absolute', left: 8, bottom: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: '0.8rem', fontWeight: 700 }}>
        {person.name}{!stream && !muted ? ' · connecting…' : ''}
      </span>
    </div>
  );
}

export default function GroupCallScreen() {
  const { activeGroupCall, endGroupCall, user, people } = useApp();
  const { group, type, callId, joinedAt } = activeGroupCall;
  const isVideo = type === 'video';
  const [local, setLocal] = useState(null);
  const [remotes, setRemotes] = useState({}); // userId → stream | null (connecting)
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const conns = useRef({});
  const localRef = useRef(null);

  const memberIds = group.members.map(m => m.id).filter(id => id !== user.id);
  const personFor = (id) => {
    const p = people[id];
    if (p) return personView(p);
    const m = group.members.find(x => x.id === id);
    return { id, name: m?.name || 'Member', emoji: '🙂' };
  };

  function attach(id, conn) {
    try { conns.current[id]?.close(); } catch (_) {}
    conns.current[id] = conn;
    setRemotes(r => ({ ...r, [id]: r[id] || null }));
    conn.on('stream', (s) => setRemotes(r => ({ ...r, [id]: s })));
    conn.on('close', () => setRemotes(r => { const n = { ...r }; delete n[id]; return n; }));
  }

  // Camera / microphone
  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo && (JSON.parse(localStorage.getItem('kinnect_prefs') || '{}').lowData ? { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 12 } } : true) });
        localRef.current = stream;
        setLocal(stream);
        // Tell everyone we're here; people already in the call will connect to us
        realtime.groupCallSignal(memberIds, { t: 'gcall_join', callId, groupId: group.id, peerId: realtime.peerId, joinedAt, name: user.name });
      } catch (e) {
        console.warn('Group call media error', e);
      }
    })();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Signalling
  useEffect(() => {
    const offJoin = realtime.on('gcall_join', (b) => {
      if (b.callId !== callId || !localRef.current || !realtime.peer) return;
      // The earlier joiner calls the later one, so each pair connects exactly once
      const iCall = joinedAt < b.joinedAt || (joinedAt === b.joinedAt && user.id < b.from);
      if (iCall && b.peerId) attach(b.from, realtime.peer.call(b.peerId, localRef.current));
    });
    const offMedia = realtime.on('webrtc_call_received', ({ mediaConnection }) => {
      if (!localRef.current) return;
      mediaConnection.answer(localRef.current);
      realtime.activeCallSession = null; // handled here, not by the one-to-one call screen
      attach(userIdFromPeer(mediaConnection.peer), mediaConnection);
    });
    const offLeave = realtime.on('gcall_leave', (b) => {
      if (b.callId !== callId) return;
      try { conns.current[b.from]?.close(); } catch (_) {}
      setRemotes(r => { const n = { ...r }; delete n[b.from]; return n; });
    });
    return () => { offJoin(); offMedia(); offLeave(); };
  }, [callId, joinedAt, user.id]);

  useEffect(() => { local?.getAudioTracks().forEach(t => { t.enabled = !muted; }); }, [muted, local]);
  useEffect(() => { local?.getVideoTracks().forEach(t => { t.enabled = !camOff; }); }, [camOff, local]);
  useEffect(() => { const t = setInterval(() => setElapsed(s => s + 1), 1000); return () => clearInterval(t); }, []);

  function hangUp() {
    realtime.groupCallSignal(memberIds, { t: 'gcall_leave', callId });
    Object.values(conns.current).forEach(c => { try { c.close(); } catch (_) {} });
    localRef.current?.getTracks().forEach(t => t.stop());
    realtime.activeCallSession = null;
    endGroupCall();
  }

  const ids = Object.keys(remotes);
  const tiles = [
    ...ids.map(id => ({ key: id, stream: remotes[id], person: personFor(id), mine: false })),
    { key: 'me', stream: local, person: { ...user, emoji: user.avatar, name: 'You' }, mine: true },
  ];
  const cols = tiles.length <= 1 ? 1 : 2;
  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250 /* above sheets (200): a call always stays on top */, background: 'linear-gradient(160deg,#0F172A,#134E4A)', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div style={{ padding: '12px 16px' }}>
        <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>{group.name}</p>
        <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          {ids.length ? `${ids.length + 1} people · ${clock}` : 'Ringing the group…'} <Lock size={12} /> Encrypted
        </p>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: '1fr', gap: 8, padding: '0 12px' }}>
        {tiles.map(t => <Tile key={t.key} stream={t.stream} person={t.person} video={isVideo && !(t.mine && camOff)} muted={t.mine} />)}
      </div>
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', padding: '16px 12px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
        <button onClick={() => setMuted(m => !m)} aria-label={muted ? 'Unmute' : 'Mute'} className="call-btn" style={{ background: muted ? '#DC2626' : 'rgba(255,255,255,.18)' }}>
          {muted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        {isVideo && (
          <button onClick={() => setCamOff(v => !v)} aria-label={camOff ? 'Turn on camera' : 'Turn off camera'} className="call-btn" style={{ background: camOff ? '#DC2626' : 'rgba(255,255,255,.18)' }}>
            {camOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
        )}
        <button onClick={hangUp} aria-label="Leave call" className="call-btn" style={{ background: '#DC2626', width: 70, height: 70 }}>
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
}
