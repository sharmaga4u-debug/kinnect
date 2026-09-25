import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, X, Camera, AlertCircle, Sparkles, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { realtime } from '../services/realtime';
import Avatar from './Avatar';
import { ACTIVITIES, ActivityView } from './together/Activities';

const REACTIONS = ['❤️', '😂', '👏', '😘', '🌟', '🎉'];

/* Emoji that float up the screen on both phones */
function ReactionLayer({ items }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 5 }}>
      {items.map(r => (
        <span key={r.key} className="float-reaction" style={{ left: `${r.x}%` }}>{r.emoji}</span>
      ))}
    </div>
  );
}

export default function ActiveVideoCall() {
  const { activeCall, endCall } = useApp();
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [activity, setActivity] = useState(null);
  const [picking, setPicking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [reactions, setReactions] = useState([]);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('requesting'); // requesting | granted | denied | unavailable
  const [webrtcConnected, setWebrtcConnected] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null); // voice plays here so it never cuts out when the layout changes
  const callPeerSessionRef = useRef(null);
  const initialOpened = useRef(false);

  const shared = true;
  const me = activeCall?.isIncoming ? 2 : 1;
  const theirName = (activeCall?.contact?.name || 'Them').split(' ')[0];
  const names = me === 1 ? { 1: 'You', 2: theirName } : { 1: theirName, 2: 'You' };

  /* ── Activities & reactions stay in step on both phones ── */
  function openActivity(id, { broadcast = true } = {}) {
    setActivity(id);
    setPicking(false);
    if (broadcast) realtime.sendActivity({ id: '_nav', action: { open: id } });
  }

  function showReaction(emoji) {
    const key = Math.random().toString(36).slice(2);
    setReactions(r => [...r, { key, emoji, x: 10 + Math.random() * 75 }]);
    setTimeout(() => setReactions(r => r.filter(x => x.key !== key)), 2600);
  }

  function sendReaction(emoji) {
    showReaction(emoji);
    realtime.sendActivity({ id: '_react', action: { emoji } });
  }

  useEffect(() => realtime.on('activity', (body) => {
    if (body.id === '_nav') setActivity(body.action.open || null);
    if (body.id === '_react') showReaction(body.action.emoji);
  }), []);

  // Started from the Play tab ("play on a call") → open that activity once connected
  useEffect(() => {
    if (webrtcConnected && activeCall?.activity && !initialOpened.current) {
      initialOpened.current = true;
      setTimeout(() => openActivity(activeCall.activity), 800);
    }
  }, [webrtcConnected, activeCall]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 1. Camera & microphone ── */
  useEffect(() => {
    if (!activeCall) return undefined;
    let currentStream = null;

    (async () => {
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: activeCall.type === 'video' });
          currentStream = stream;
          setLocalStream(stream);
          setPermissionStatus('granted');
        } else {
          setPermissionStatus('unavailable');
        }
      } catch (err) {
        console.warn('Camera/Microphone permission denied or unavailable:', err);
        setPermissionStatus('denied');
      }
    })();

    return () => {
      currentStream?.getTracks().forEach(track => track.stop());
      try { callPeerSessionRef.current?.close(); } catch (_) {}
    };
  }, [activeCall]);

  /* ── 2. Connect media with the other phone (PeerJS / WebRTC) ── */
  useEffect(() => {
    if (!localStream || !activeCall) return undefined;

    const attach = (call) => {
      callPeerSessionRef.current = call;
      call.on('stream', (rStream) => {
        setRemoteStream(rStream);
        setWebrtcConnected(true);
      });
      call.on('close', () => {
        setWebrtcConnected(false);
        setRemoteStream(null);
      });
    };

    // We answered: the caller's media connection may already be waiting
    if (realtime.activeCallSession) {
      const call = realtime.activeCallSession;
      call.answer(localStream);
      attach(call);
    }

    // We called: once they accept, call their peer id
    const unsubAccepted = realtime.on('call_accepted', (data) => {
      if (data.responder?.peerId && realtime.peer) {
        attach(realtime.peer.call(data.responder.peerId, localStream));
      }
    });

    // Their media connection arrived after we opened the call screen
    const unsubWebRTC = realtime.on('webrtc_call_received', ({ mediaConnection }) => {
      mediaConnection.answer(localStream);
      attach(mediaConnection);
    });

    return () => { unsubAccepted(); unsubWebRTC(); };
  }, [localStream, activeCall]);

  // Keep the video elements pointed at the streams as the layout changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
    if (remoteAudioRef.current && remoteStream && remoteAudioRef.current.srcObject !== remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activity, picking]);
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream, activity, picking, videoOff]);

  useEffect(() => { localStream?.getAudioTracks().forEach(t => { t.enabled = !muted; }); }, [muted, localStream]);
  useEffect(() => { localStream?.getVideoTracks().forEach(t => { t.enabled = !videoOff; }); }, [videoOff, localStream]);

  useEffect(() => {
    if (!activeCall) return undefined;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [activeCall]);

  if (!activeCall) return null;

  const { contact, type } = activeCall;
  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  const isVideo = type === 'video';

  function handleEndCall() {
    localStream?.getTracks().forEach(track => track.stop());
    try { callPeerSessionRef.current?.close(); } catch (_) {}
    endCall();
  }

  const roundBtn = (active) => ({
    width: 58, height: 58, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: active ? '#DC2626' : 'rgba(255,255,255,.18)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  const remoteView = remoteStream && isVideo
    ? <video ref={remoteVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    : (
      <div style={{ textAlign: 'center' }}>
        <Avatar person={contact} size={activity ? 48 : 120} style={{ margin: '0 auto', border: '3px solid rgba(255,255,255,0.3)' }} />
      </div>
    );

  return (
    <div className="animate-fadeIn" style={{
      position: 'fixed', inset: 0, zIndex: 120,
      background: 'linear-gradient(160deg, #0F172A 0%, #134E4A 100%)',
      display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      <audio ref={remoteAudioRef} autoPlay />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
        {activity && (
          /* Their face stays visible while you play */
          <div style={{ width: 64, height: 84, minWidth: 64, borderRadius: 14, overflow: 'hidden', background: '#1E293B', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {remoteView}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name}</p>
          <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            {webrtcConnected ? <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} /> {clock}</> : 'Ringing…'}
            <Lock size={12} /> Encrypted
          </p>
        </div>
        {activity && (
          <button onClick={() => openActivity(null)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 12, padding: '8px 12px', color: '#fff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <X size={18} /> Done
          </button>
        )}
      </div>

      {permissionStatus === 'denied' && (
        <div style={{ margin: '0 16px 8px', background: '#FEF2F2', borderRadius: 12, padding: '8px 12px', display: 'flex', gap: 8, fontSize: '0.84rem', color: '#991B1B', fontWeight: 600 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Camera or microphone access was blocked. Allow it for Kinnect in your phone's settings, then call again.</span>
        </div>
      )}

      {/* Main area */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', padding: '0 12px' }}>
        <ReactionLayer items={reactions} />

        {activity ? (
          <div style={{ height: '100%', overflowY: 'auto', background: '#F8FAFC', borderRadius: 22, padding: 14, paddingTop: 16 }}>
            <p style={{ fontWeight: 800, color: '#1E293B', marginBottom: 10 }}>
              {ACTIVITIES.find(a => a.id === activity)?.emoji} {ACTIVITIES.find(a => a.id === activity)?.title}
            </p>
            <ActivityView id={activity} shared={shared} me={me} names={names} />
          </div>
        ) : picking ? (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem', margin: '4px 4px 4px' }}>Do something together</p>
            <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '0.9rem', margin: '0 4px 12px' }}>{theirName} will see it on their screen too.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {ACTIVITIES.map(a => (
                <button key={a.id} onClick={() => openActivity(a.id)} style={{
                  background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 20, padding: '18px 10px',
                  color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: '2.4rem' }}>{a.emoji}</span>
                  <span style={{ fontWeight: 800, fontSize: '1rem' }}>{a.title}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setPicking(false)} style={{ display: 'block', margin: '14px auto', background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', fontWeight: 700, cursor: 'pointer' }}>
              Back to video
            </button>
          </div>
        ) : (
          <div style={{ height: '100%', borderRadius: 24, background: '#1E293B', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {remoteView}
            {!remoteStream && (
              <p style={{ position: 'absolute', bottom: 24, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,.7)' }}>
                {webrtcConnected ? 'Connected' : `Calling ${theirName}…`}
              </p>
            )}
            {isVideo && (
              <div style={{ position: 'absolute', bottom: 12, right: 12, width: 96, height: 130, borderRadius: 14, overflow: 'hidden', background: '#0F172A', border: '2px solid rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {permissionStatus === 'granted' && !videoOff
                  ? <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                  : <Camera size={22} color="rgba(255,255,255,0.5)" />}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reactions */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '10px 12px 0' }}>
        {REACTIONS.map(e => (
          <button key={e} onClick={() => sendReaction(e)} aria-label={`Send ${e}`} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.12)', fontSize: '1.35rem', cursor: 'pointer' }}>{e}</button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', padding: '14px 12px', paddingBottom: 'max(18px, env(safe-area-inset-bottom))' }}>
        <button onClick={() => setMuted(m => !m)} style={roundBtn(muted)} aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        {isVideo && (
          <button onClick={() => setVideoOff(v => !v)} style={roundBtn(videoOff)} aria-label={videoOff ? 'Turn on camera' : 'Turn off camera'}>
            {videoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
        )}
        <button onClick={handleEndCall} aria-label="End call" style={{ ...roundBtn(true), width: 70, height: 70, boxShadow: '0 8px 24px rgba(220,38,38,.5)' }}>
          <PhoneOff size={28} />
        </button>
        <button onClick={() => (activity ? openActivity(null) : setPicking(p => !p))} aria-label="Play together"
          style={{ ...roundBtn(false), width: 'auto', padding: '0 18px', borderRadius: 29, gap: 8, fontWeight: 800, fontSize: '0.95rem', background: activity || picking ? '#F59E0B' : 'rgba(255,255,255,.18)' }}>
          <Sparkles size={20} /> Play
        </button>
      </div>
    </div>
  );
}
