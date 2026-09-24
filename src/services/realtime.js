import mqtt from 'mqtt';
import Peer from 'peerjs';

class RealtimeService {
  constructor() {
    this.mqttClient = null;
    this.peer = null;
    this.peerId = null;
    this.familyCode = 'sharma-family';
    this.currentUser = null;
    this.listeners = new Map();
    this.activeCallSession = null;
    this.isConnected = false;
    this.ringInterval = null;
  }

  // Event subscription
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try { cb(data); } catch (e) { console.error('Realtime listener error:', e); }
      });
    }
  }

  // Initialize with user profile and family code
  init(user, familyCode = 'sharma-family') {
    if (!user) return;
    this.currentUser = user;
    this.familyCode = (familyCode || 'sharma-family').toLowerCase().replace(/[^a-z0-9-_]/g, '');

    const sanitizedUserId = (user.id || user.name || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const cleanPeerId = `kinnect-${this.familyCode}-${sanitizedUserId}`;

    this.connectMQTT();
    this.initPeer(cleanPeerId);
  }

  // Connect to MQTT Broker over WebSockets
  connectMQTT() {
    if (this.mqttClient) {
      try { this.mqttClient.end(true); } catch (_) {}
    }

    const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
    const clientId = `kinnect_client_${Math.random().toString(16).slice(2, 10)}`;

    try {
      this.mqttClient = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 3000,
      });

      this.mqttClient.on('connect', () => {
        console.log('[Realtime] Connected to live messaging broker');
        this.isConnected = true;
        this.emit('connection_status', { connected: true });

        // Subscribe to family room topics
        const topics = [
          `kinnect/${this.familyCode}/chat`,
          `kinnect/${this.familyCode}/direct/${this.currentUser?.id || 'me'}`,
          `kinnect/${this.familyCode}/calls/${this.currentUser?.id || 'me'}`,
          `kinnect/${this.familyCode}/calls/broadcast`,
          `kinnect/${this.familyCode}/draw`,
          `kinnect/${this.familyCode}/presence`,
        ];

        this.mqttClient.subscribe(topics, (err) => {
          if (err) console.error('[Realtime] Subscription error:', err);
          else {
            // Announce presence
            this.broadcastPresence('online');
          }
        });
      });

      this.mqttClient.on('message', (topic, payload) => {
        try {
          const msg = JSON.parse(payload.toString());
          this.handleIncomingMQTTMessage(topic, msg);
        } catch (e) {
          console.warn('[Realtime] Could not parse message:', e);
        }
      });

      this.mqttClient.on('error', (err) => {
        console.warn('[Realtime] MQTT Error:', err);
        this.isConnected = false;
        this.emit('connection_status', { connected: false });
      });

      this.mqttClient.on('close', () => {
        this.isConnected = false;
        this.emit('connection_status', { connected: false });
      });
    } catch (err) {
      console.warn('[Realtime] Failed to initialize MQTT client:', err);
    }
  }

  // Initialize WebRTC PeerJS for direct media & data
  initPeer(preferredId) {
    if (this.peer) {
      try { this.peer.destroy(); } catch (_) {}
    }

    try {
      this.peer = new Peer(preferredId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log('[Realtime] PeerJS online with ID:', id);
        this.peerId = id;
        this.emit('peer_ready', { peerId: id });
      });

      // Handle incoming WebRTC video/audio call
      this.peer.on('call', (mediaConnection) => {
        console.log('[Realtime] Incoming P2P WebRTC media call from:', mediaConnection.peer);
        this.activeCallSession = mediaConnection;
        this.emit('webrtc_call_received', { mediaConnection });
      });

      this.peer.on('error', (err) => {
        // If peer ID already taken, fallback to random ID
        if (err.type === 'unavailable-id') {
          const fallbackId = `${preferredId}-${Math.floor(Math.random() * 1000)}`;
          this.initPeer(fallbackId);
        } else {
          console.warn('[Realtime] PeerJS warning:', err);
        }
      });
    } catch (e) {
      console.warn('[Realtime] PeerJS initialization error:', e);
    }
  }

  // Handle incoming message based on topic
  handleIncomingMQTTMessage(topic, data) {
    // Ignore self messages
    if (data.senderId === this.currentUser?.id && data.clientId === this.mqttClient?.options?.clientId) {
      return;
    }

    if (topic.endsWith('/chat') || topic.includes('/direct/')) {
      this.playMessageSound();
      this.emit('chat_message', data);
    } else if (topic.includes('/calls/')) {
      if (data.type === 'CALL_RINGING') {
        this.playRingtone();
        this.emit('incoming_call', data);
      } else if (data.type === 'CALL_ACCEPTED') {
        this.stopRingtone();
        this.emit('call_accepted', data);
      } else if (data.type === 'CALL_DECLINED' || data.type === 'CALL_ENDED') {
        this.stopRingtone();
        this.emit('call_ended', data);
      }
    } else if (topic.endsWith('/draw')) {
      this.emit('doodle_draw', data);
    } else if (topic.endsWith('/presence')) {
      this.emit('presence_update', data);
    }
  }

  // Send Chat message across devices
  sendChatMessage({ chatId, text, type = 'text', media = {} }) {
    if (!this.mqttClient || !this.isConnected) return false;

    const payload = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      chatId,
      senderId: this.currentUser?.id,
      senderName: this.currentUser?.name || 'Family Member',
      avatar: this.currentUser?.avatar || '👵',
      text: text || '',
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      clientId: this.mqttClient.options.clientId,
      ...media
    };

    const topic = chatId === 'family-group' 
      ? `kinnect/${this.familyCode}/chat` 
      : `kinnect/${this.familyCode}/direct/${chatId}`;

    this.mqttClient.publish(topic, JSON.stringify(payload), { qos: 1 });
    return payload;
  }

  // Ring a family member on video or audio call
  initiateCall({ targetContact, callType }) {
    if (!this.mqttClient) return;

    const payload = {
      type: 'CALL_RINGING',
      callId: 'call-' + Date.now(),
      callType: callType || 'video',
      caller: {
        id: this.currentUser?.id,
        name: this.currentUser?.name,
        avatar: this.currentUser?.avatar,
        relation: this.currentUser?.relation || 'Family Member',
        peerId: this.peerId
      },
      targetContactId: targetContact.id,
      targetContactName: targetContact.name,
      familyCode: this.familyCode,
      timestamp: Date.now(),
      clientId: this.mqttClient.options.clientId
    };

    // Target specific contact topic and also broadcast topic for redundancy
    this.mqttClient.publish(`kinnect/${this.familyCode}/calls/${targetContact.id}`, JSON.stringify(payload), { qos: 1 });
    this.mqttClient.publish(`kinnect/${this.familyCode}/calls/broadcast`, JSON.stringify(payload), { qos: 1 });

    return payload;
  }

  // Respond to incoming call
  respondToCall({ callData, accepted }) {
    if (!this.mqttClient) return;
    this.stopRingtone();

    const payload = {
      type: accepted ? 'CALL_ACCEPTED' : 'CALL_DECLINED',
      callId: callData.callId,
      callType: callData.callType,
      responder: {
        id: this.currentUser?.id,
        name: this.currentUser?.name,
        peerId: this.peerId
      },
      callerId: callData.caller?.id,
      timestamp: Date.now(),
      clientId: this.mqttClient.options.clientId
    };

    this.mqttClient.publish(`kinnect/${this.familyCode}/calls/${callData.caller?.id}`, JSON.stringify(payload), { qos: 1 });
    this.mqttClient.publish(`kinnect/${this.familyCode}/calls/broadcast`, JSON.stringify(payload), { qos: 1 });
  }

  // End an active call
  endCall({ callData }) {
    this.stopRingtone();
    if (!this.mqttClient) return;

    const payload = {
      type: 'CALL_ENDED',
      callId: callData?.callId,
      endedBy: this.currentUser?.id,
      timestamp: Date.now(),
      clientId: this.mqttClient.options?.clientId
    };

    this.mqttClient.publish(`kinnect/${this.familyCode}/calls/broadcast`, JSON.stringify(payload), { qos: 1 });

    if (this.activeCallSession) {
      try { this.activeCallSession.close(); } catch (_) {}
      this.activeCallSession = null;
    }
  }

  // Broadcast shared doodle stroke
  broadcastDoodle(doodleData) {
    if (!this.mqttClient || !this.isConnected) return;
    const payload = {
      ...doodleData,
      senderId: this.currentUser?.id,
      clientId: this.mqttClient.options.clientId
    };
    this.mqttClient.publish(`kinnect/${this.familyCode}/draw`, JSON.stringify(payload), { qos: 0 });
  }

  // Announce user presence
  broadcastPresence(status = 'online') {
    if (!this.mqttClient || !this.isConnected) return;
    const payload = {
      userId: this.currentUser?.id,
      userName: this.currentUser?.name,
      avatar: this.currentUser?.avatar,
      peerId: this.peerId,
      status,
      timestamp: Date.now(),
      clientId: this.mqttClient.options.clientId
    };
    this.mqttClient.publish(`kinnect/${this.familyCode}/presence`, JSON.stringify(payload), { qos: 0 });
  }

  // Browser Web Audio synthesized ringtone (Zero external audio file needed!)
  playRingtone() {
    this.stopRingtone();
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const ringCycle = () => {
        if (!this.ringInterval) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(480, now + 0.4);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);
      };

      this.ringInterval = setInterval(ringCycle, 2400);
      ringCycle();
    } catch (e) {
      console.warn('Could not play ringtone:', e);
    }
  }

  stopRingtone() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  // Gentle chime for incoming message
  playMessageSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (_) {}
  }
}

export const realtime = new RealtimeService();
export default realtime;
