import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, RotateCcw, Gamepad2, 
  BookOpen, Pencil, X, RotateCw, Camera, AlertCircle, CheckCircle2,
  Users, Radio
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { realtime } from '../services/realtime';
import GamesHub from './GamesHub';
import Avatar from './Avatar';

/* ── Simple Storybook ── */
const STORY_PAGES = [
  { title: 'The Clever Crow', text: 'Long ago, a thirsty crow found a pot with water at the very bottom. No matter how hard it tried, it could not reach the water.', emoji: '🦢' },
  { title: 'The Clever Crow', text: 'The clever crow noticed pebbles nearby. One by one, it dropped pebbles into the pot... and the water rose higher and higher!', emoji: '🪨' },
  { title: 'The Clever Crow', text: 'When the water reached the top, the crow finally drank! 🎉\n\n✨ Lesson: Where there is a will, there is a way!', emoji: '💧' },
];

function Storybook() {
  const [page, setPage] = useState(0);
  const p = STORY_PAGES[page];

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: 10 }}>{p.emoji}</div>
      <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 10 }}>{p.title}</h3>
      <p style={{ color: 'rgba(255,255,255,.85)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 16, whiteSpace: 'pre-line' }}>{p.text}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
        <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }} disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '0.85rem' }}>{page + 1}/{STORY_PAGES.length}</span>
        <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }} disabled={page === STORY_PAGES.length - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>
    </div>
  );
}

/* ── Real-Time Shared Doodle Canvas ── */
function DoodleCanvas() {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  // Handle incoming real-time drawing from other family member
  useEffect(() => {
    const unsub = realtime.on('doodle_draw', (data) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      if (data.action === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else if (data.action === 'start') {
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
      } else if (data.action === 'move') {
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = data.color || '#38BDF8';
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
      }
    });

    return () => unsub();
  }, []);

  function onStart(e) {
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);

    realtime.broadcastDoodle({ action: 'start', x, y });
  }

  function onMove(e) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#FFD700';
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();

    realtime.broadcastDoodle({ action: 'move', x, y, color: '#FFD700' });
  }

  function onEnd() { drawing.current = false; }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    realtime.broadcastDoodle({ action: 'clear' });
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '0.85rem', marginBottom: 8 }}>
        Live Shared Canvas! Draw together in real time 🎨
      </p>
      <canvas
        ref={canvasRef} width={280} height={200}
        style={{ borderRadius: 12, border: '2px solid rgba(255,255,255,.3)', background: 'rgba(0,0,0,.3)', touchAction: 'none', cursor: 'crosshair' }}
        onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
        onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
      />
      <br />
      <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', marginTop: 10 }} onClick={clearCanvas}>
        <RotateCw size={14} /> Clear Canvas
      </button>
    </div>
  );
}

/* ── Main Call Overlay with Real WebRTC Camera & Microphone ── */
export default function ActiveVideoCall() {
  const { activeCall, endCall, user } = useApp();
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [activity, setActivity] = useState(null); // null | 'game' | 'story' | 'draw'
  const [elapsed, setElapsed] = useState(0);

  // Real Camera & Microphone stream states
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('requesting'); // 'requesting' | 'granted' | 'denied' | 'unavailable'
  const [webrtcConnected, setWebrtcConnected] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callPeerSessionRef = useRef(null);

  // 1. Request local media stream
  useEffect(() => {
    if (!activeCall) return;

    let currentStream = null;

    async function setupLocalMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: activeCall.type === 'video'
          });
          currentStream = stream;
          setLocalStream(stream);
          setPermissionStatus('granted');

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } else {
          setPermissionStatus('unavailable');
        }
      } catch (err) {
        console.warn('Camera/Microphone permission denied or unavailable:', err);
        setPermissionStatus('denied');
      }
    }

    setupLocalMedia();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (callPeerSessionRef.current) {
        try { callPeerSessionRef.current.close(); } catch (_) {}
      }
    };
  }, [activeCall]);

  // 2. Connect to remote peer via WebRTC PeerJS once local stream is ready
  useEffect(() => {
    if (!localStream || !activeCall) return;

    // Check if we are answering an incoming WebRTC call
    if (realtime.activeCallSession) {
      const call = realtime.activeCallSession;
      callPeerSessionRef.current = call;

      call.answer(localStream);
      call.on('stream', (rStream) => {
        console.log('[WebRTC] Received remote stream from caller');
        setRemoteStream(rStream);
        setWebrtcConnected(true);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = rStream;
        }
      });
      call.on('close', () => {
        setWebrtcConnected(false);
        setRemoteStream(null);
      });
    }

    // Handle when remote accepts our call
    const unsubAccepted = realtime.on('call_accepted', (data) => {
      if (data.responder?.peerId && realtime.peer) {
        console.log('[WebRTC] Calling responder peer ID:', data.responder.peerId);
        const call = realtime.peer.call(data.responder.peerId, localStream);
        callPeerSessionRef.current = call;

        call.on('stream', (rStream) => {
          console.log('[WebRTC] Received remote stream from responder');
          setRemoteStream(rStream);
          setWebrtcConnected(true);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = rStream;
          }
        });
        call.on('close', () => {
          setWebrtcConnected(false);
          setRemoteStream(null);
        });
      }
    });

    // Handle direct WebRTC call received while already in call component
    const unsubWebRTC = realtime.on('webrtc_call_received', ({ mediaConnection }) => {
      callPeerSessionRef.current = mediaConnection;
      mediaConnection.answer(localStream);
      mediaConnection.on('stream', (rStream) => {
        console.log('[WebRTC] Stream connected');
        setRemoteStream(rStream);
        setWebrtcConnected(true);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = rStream;
        }
      });
    });

    return () => {
      unsubAccepted();
      unsubWebRTC();
    };
  }, [localStream, activeCall]);

  // 3. Connect remote stream to video element when ready
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activity]);

  // 4. Attach local stream to pip
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activity]);

  // Mute audio track toggle
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = !muted);
    }
  }, [muted, localStream]);

  // Turn video track on/off toggle
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = !videoOff);
    }
  }, [videoOff, localStream]);

  // Elapsed Call Timer
  useEffect(() => {
    if (!activeCall) return;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [activeCall]);

  if (!activeCall) return null;

  const { contact, type } = activeCall;
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');

  function handleEndCall() {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (callPeerSessionRef.current) {
      try { callPeerSessionRef.current.close(); } catch (_) {}
    }
    endCall();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 120,
      background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }} className="animate-fadeIn">

      {/* Top Header */}
      <div style={{ width: '100%', maxWidth: 520, padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              {type === 'video' ? '📹 Video Call' : '📞 Audio Call'}
            </p>
            {webrtcConnected ? (
              <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} /> Connected
              </span>
            ) : (
              <span className="badge badge-amber" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                Ringing…
              </span>
            )}
          </div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem' }}>{contact.name}</p>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '0.82rem', fontFamily: 'monospace' }}>
            {minutes}:{seconds}
          </p>
        </div>
        <button 
          onClick={handleEndCall} 
          style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Permission Status Alert Banner */}
      {permissionStatus === 'denied' && (
        <div style={{
          width: '90%', maxWidth: 480,
          background: '#FEF2F2', border: '1px solid #F87171', borderRadius: 12,
          padding: '8px 14px', marginTop: 10, display: 'flex', alignItems: 'center', gap: 8,
          fontSize: '0.78rem', color: '#991B1B', fontWeight: 600
        }}>
          <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
          <span>Camera or microphone access was blocked. Allow it for Kinnect in your phone's settings, then call again.</span>
        </div>
      )}

      {/* Video / Content Display Area */}
      <div style={{ flex: 1, width: '100%', maxWidth: 520, padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {!activity ? (
          <>
            {/* Main Video Display Area (Remote Family Video or Avatar) */}
            <div style={{
              flex: 1, borderRadius: 24, background: 'linear-gradient(135deg, #1E293B, #334155)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
              boxShadow: '0 12px 36px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {/* REAL REMOTE STREAM (When connected to another phone/computer) */}
              {remoteStream && type !== 'video' && (
                <video ref={remoteVideoRef} autoPlay playsInline style={{ display: 'none' }} />
              )}
              {remoteStream && type === 'video' ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                /* Contact Avatar & City while connecting or audio-only */
                <div style={{ textAlign: 'center' }}>
                  <Avatar person={contact} size={120} style={{ margin: '0 auto 12px', border: '3px solid rgba(255,255,255,0.3)' }} />
                  <p style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.2rem' }}>{contact.name}</p>
                  <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '0.86rem' }}>
                    {webrtcConnected ? 'Connected' : `Ringing ${contact.name.split(' ')[0]}…`}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.74rem', marginTop: 6 }}>
                    🔒 End-to-end encrypted
                  </p>
                </div>
              )}

              {/* REAL CAMERA PIP Self-View Window */}
              {type === 'video' && (
                <div style={{
                  position: 'absolute', bottom: 12, right: 12, width: 100, height: 135,
                  borderRadius: 16, background: '#0F172A',
                  border: '2.5px solid rgba(255,255,255,0.4)',
                  overflow: 'hidden',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {permissionStatus === 'granted' && !videoOff ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)' // mirror camera
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#FFFFFF', padding: 4 }}>
                      <Camera size={22} color="rgba(255,255,255,0.6)" />
                      <p style={{ fontSize: '0.62rem', marginTop: 4, opacity: 0.7 }}>
                        {videoOff ? 'Video Off' : 'No Camera'}
                      </p>
                    </div>
                  )}
                  
                  {/* You Badge */}
                  <span style={{
                    position: 'absolute', bottom: 4, left: 6,
                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                    borderRadius: 4, fontSize: '0.6rem', padding: '1px 4px', fontWeight: 800
                  }}>
                    You
                  </span>
                </div>
              )}
            </div>

            {/* Activities During Call: Games, Story, Drawing */}
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '0.78rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              While you talk
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { id: 'game',  icon: <Gamepad2 size={22} />, label: 'Play Games' },
                { id: 'story', icon: <BookOpen size={22} />, label: 'Read Story' },
                { id: 'draw',  icon: <Pencil size={22} />,   label: 'Draw Together' },
              ].map(a => (
                <button key={a.id} onClick={() => setActivity(a.id)} style={{
                  background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)',
                  borderRadius: 16, padding: '12px 8px', color: '#fff', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.18s',
                }}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Interactive Activity Panel (GamesHub, Story, Draw) */
          <div style={{
            flex: 1, borderRadius: 24, background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.15)', padding: '16px 14px',
            display: 'flex', flexDirection: 'column', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: '0.98rem' }}>
                {activity === 'game' ? '🎮 Games' : activity === 'story' ? '📖 Storybook' : '🎨 Draw Together'}
              </p>
              <button 
                onClick={() => setActivity(null)} 
                style={{ 
                  background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 8, 
                  padding: '6px 12px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 
                }}
              >
                Back to Video 📹
              </button>
            </div>
            {activity === 'game' && <GamesHub />}
            {activity === 'story' && <Storybook />}
            {activity === 'draw' && <DoodleCanvas />}
          </div>
        )}
      </div>

      {/* Call Controls Bar */}
      <div style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))', paddingTop: 8 }}>
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'center' }}>
          {/* Mute Button */}
          <button
            onClick={() => setMuted(m => !m)}
            style={{
              width: 58, height: 58, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: muted ? '#DC2626' : 'rgba(255,255,255,.18)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)', transition: 'all .2s',
            }}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            style={{
              width: 72, height: 72, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: '#DC2626', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 28px rgba(220,38,38,.5)', transition: 'all .2s',
            }}
            aria-label="End call"
          >
            <PhoneOff size={28} />
          </button>

          {/* Video Toggle Button */}
          {type === 'video' && (
            <button
              onClick={() => setVideoOff(v => !v)}
              style={{
                width: 58, height: 58, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: videoOff ? '#DC2626' : 'rgba(255,255,255,.18)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)', transition: 'all .2s',
              }}
              aria-label={videoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {videoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
