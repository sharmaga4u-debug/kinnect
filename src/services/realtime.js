import mqtt from 'mqtt';
import Peer from 'peerjs';
import {
  loadOrCreateIdentity, sharedKeyFor, groupKeyFor, encryptJson, decryptJson,
} from './crypto';

/**
 * Realtime transport over a public MQTT broker. Everything personal is end-to-end encrypted
 * (see crypto.js) before it is published:
 *   kinnect/v2/dir/<userId>   retained public profile: name, avatar, photo, timezone, public key
 *   kinnect/v2/in/<userId>    encrypted direct messages, receipts, group invites, call signalling,
 *                             and group messages (encrypted with the group key, one copy per member)
 * Group messages go to each member's own inbox rather than a shared topic, so the broker holds them
 * for members who are offline or who haven't processed their group invite yet.
 */
const PREFIX = 'kinnect/v2';
const BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';
const RING_TIMEOUT_MS = 45000;

class RealtimeService {
  constructor() {
    this.mqttClient = null;
    this.peer = null;
    this.peerId = null;
    this.currentUser = null;
    this.listeners = new Map();
    this.activeCallSession = null;
    this.isConnected = false;
    this.ringInterval = null;
    this.profiles = new Map();   // userId → directory record
    this.watched = new Set();    // userIds whose directory record we follow
    this.groups = new Map();     // groupId → group (with key)
    this.callPartnerId = null;
    this.inbox = Promise.resolve(); // processes incoming messages strictly in order
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

  // Initialize with the signed-in user
  async init(user) {
    if (!user) return;
    this.currentUser = user;
    this.identity = await loadOrCreateIdentity();
    this.connectMQTT();
    this.initPeer(`kinnect2-${user.id}`);
  }

  // Tear down connections (on account removal)
  disconnect() {
    this.stopRingtone();
    if (this.mqttClient) {
      try { this.mqttClient.end(true); } catch (_) {}
      this.mqttClient = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (_) {}
      this.peer = null;
    }
    this.isConnected = false;
    this.currentUser = null;
    this.watched.clear();
    this.groups.clear();
    this.profiles.clear();
    this.emit('connection_status', { connected: false });
  }

  // Stable per-install id so the broker keeps our session (and queues messages) while the app is closed
  getDeviceId() {
    try {
      let id = localStorage.getItem('kinnect_device_id');
      if (!id) {
        id = Math.random().toString(36).slice(2, 10);
        localStorage.setItem('kinnect_device_id', id);
      }
      return id;
    } catch {
      return Math.random().toString(36).slice(2, 10);
    }
  }

  connectMQTT() {
    if (this.mqttClient) {
      try { this.mqttClient.end(true); } catch (_) {}
    }
    const me = this.currentUser;
    const clientId = `kn2_${me.id.slice(0, 16)}_${this.getDeviceId()}`;

    try {
      this.mqttClient = mqtt.connect(BROKER_URL, {
        clientId,
        protocolVersion: 5,
        clean: false, // persistent session: QoS 1 messages are queued while we're offline
        properties: { sessionExpiryInterval: 7 * 24 * 60 * 60 },
        connectTimeout: 5000,
        reconnectPeriod: 3000,
      });

      this.mqttClient.on('connect', () => {
        this.isConnected = true;
        this.emit('connection_status', { connected: true });
        this.subscribe([
          `${PREFIX}/in/${me.id}`,
          ...[...this.watched].map(id => `${PREFIX}/dir/${id}`),
        ]);
        this.publishProfile(this.currentUser);
      });

      this.mqttClient.on('message', (topic, payload) => {
        const raw = payload.toString();
        // In order: a group invite must be handled before that group's first message
        this.inbox = this.inbox
          .then(() => this.handleMessage(topic, raw))
          .catch(e => console.warn('[Realtime] message error', e));
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

  subscribe(topics) {
    if (!this.mqttClient || !this.isConnected || !topics.length) return;
    // Subscribe in batches; people can have hundreds of contacts
    for (let i = 0; i < topics.length; i += 50) {
      this.mqttClient.subscribe(topics.slice(i, i + 50), { qos: 1 }, (err) => {
        if (err) console.warn('[Realtime] Subscription error:', err);
      });
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
        this.peerId = id;
        this.emit('peer_ready', { peerId: id });
      });

      // Handle incoming WebRTC video/audio call
      this.peer.on('call', (mediaConnection) => {
        this.activeCallSession = mediaConnection;
        this.emit('webrtc_call_received', { mediaConnection });
      });

      this.peer.on('error', (err) => {
        // If peer ID already taken (e.g. a second tab), fall back to a random suffix
        if (err.type === 'unavailable-id') {
          this.initPeer(`${preferredId}-${Math.floor(Math.random() * 1000)}`);
        } else {
          console.warn('[Realtime] PeerJS warning:', err);
        }
      });
    } catch (e) {
      console.warn('[Realtime] PeerJS initialization error:', e);
    }
  }

  /* ── Directory (public profiles) ─────────────────────────────── */

  publishProfile(user) {
    if (!this.mqttClient || !this.isConnected || !user || !this.identity) return;
    const record = {
      id: user.id,
      name: user.name,
      avatar: user.avatar || '🙂',
      photo: user.photo || '',
      about: user.about || '',
      tz: user.timezone || '',
      pub: this.identity.publicJwk,
      ts: Date.now(),
    };
    this.mqttClient.publish(`${PREFIX}/dir/${user.id}`, JSON.stringify(record), { qos: 1, retain: true });
  }

  // Remove our public profile (account deleted)
  clearProfile(userId) {
    if (!this.mqttClient || !this.isConnected) return;
    this.mqttClient.publish(`${PREFIX}/dir/${userId}`, '', { qos: 1, retain: true });
  }

  // Follow people's public profiles; registered users arrive as retained 'profile' events
  watchUsers(ids) {
    const fresh = ids.filter(id => id && id !== this.currentUser?.id && !this.watched.has(id));
    fresh.forEach(id => this.watched.add(id));
    this.subscribe(fresh.map(id => `${PREFIX}/dir/${id}`));
  }

  getProfile(id) {
    return this.profiles.get(id) || null;
  }

  // Resolve once someone's public key is known (or null after a timeout)
  waitForProfile(id, timeoutMs = 8000) {
    const known = this.profiles.get(id);
    if (known?.pub) return Promise.resolve(known);
    this.watchUsers([id]);
    return new Promise((resolve) => {
      const timer = setTimeout(() => { off(); resolve(null); }, timeoutMs);
      const off = this.on('profile', (p) => {
        if (p.id === id && p.pub) { clearTimeout(timer); off(); resolve(p); }
      });
    });
  }

  /* ── Groups ──────────────────────────────────────────────────── */

  watchGroup(group) {
    if (!group?.id || !group.key) return;
    this.groups.set(group.id, group);
  }

  unwatchGroup(groupId) {
    this.groups.delete(groupId);
  }

  /* ── Sending ─────────────────────────────────────────────────── */

  // Encrypt `body` for one person. Throws 'NO_KEY' if they aren't on Kinnect (yet).
  async sendDirect(toId, body, { qos = 1, waitMs = 8000 } = {}) {
    if (!this.mqttClient || !this.currentUser) throw new Error('OFFLINE');
    const profile = await this.waitForProfile(toId, waitMs);
    if (!profile?.pub) throw new Error('NO_KEY');
    const me = this.currentUser.id;
    const key = await sharedKeyFor(me, toId, profile.pub);
    const sealed = await encryptJson(key, { ...body, ts: body.ts || Date.now() });
    const envelope = { v: 2, f: me, k: this.identity.publicJwk, ...sealed };
    // mqtt.js queues QoS 1 publishes while disconnected and sends them on reconnect
    this.mqttClient.publish(`${PREFIX}/in/${toId}`, JSON.stringify(envelope), { qos });
  }

  // Encrypt once with the group key, then drop a copy in every other member's inbox
  async sendGroup(groupId, body, members) {
    const group = this.groups.get(groupId);
    if (!this.mqttClient || !group) throw new Error('NO_GROUP');
    const me = this.currentUser.id;
    const sealed = await encryptJson(await groupKeyFor(group.key), { ...body, ts: body.ts || Date.now() });
    const payload = JSON.stringify({ v: 2, g: groupId, f: me, ...sealed });
    for (const m of members || group.members) {
      if (m.id !== me) this.mqttClient.publish(`${PREFIX}/in/${m.id}`, payload, { qos: 1 });
    }
  }

  /* ── Receiving ───────────────────────────────────────────────── */

  async handleMessage(topic, raw) {
    const me = this.currentUser?.id;
    if (!me) return;

    if (topic.startsWith(`${PREFIX}/dir/`)) {
      const id = topic.slice(`${PREFIX}/dir/`.length);
      if (!raw) {
        this.profiles.delete(id);
        this.emit('profile_removed', { id });
        return;
      }
      const record = JSON.parse(raw);
      if (record.id !== id) return;
      this.profiles.set(id, record);
      this.emit('profile', record);
      return;
    }

    if (!raw) return;
    const env = JSON.parse(raw);

    if (topic !== `${PREFIX}/in/${me}` || !env.f) return;

    if (env.g) {
      const group = this.groups.get(env.g);
      if (!group || env.f === me) return;
      let body;
      try {
        body = await decryptJson(await groupKeyFor(group.key), env);
      } catch {
        return;
      }
      if (body.t === 'msg') this.playMessageSound();
      this.emit('group', { groupId: env.g, from: env.f, body });
      return;
    }

    if (!env.k) return;
    let body;
    try {
      body = await decryptJson(await sharedKeyFor(me, env.f, env.k), env);
    } catch {
      console.warn('[Realtime] Could not decrypt message from', env.f);
      return;
    }
    this.handleDirect(env.f, env.k, body);
  }

  handleDirect(from, pub, body) {
    // Remember the sender's key so we can reply before their directory record arrives
    if (!this.profiles.get(from)?.pub) this.profiles.set(from, { id: from, pub });
    switch (body.t) {
      case 'call_ring':
        if (Date.now() - (body.ts || 0) > RING_TIMEOUT_MS) return; // missed while offline
        this.callPartnerId = from;
        this.playRingtone();
        this.emit('incoming_call', {
          callId: body.callId,
          callType: body.callType,
          caller: { id: from, name: body.name, avatar: body.avatar, peerId: body.peerId },
        });
        return;
      case 'call_accept':
        this.stopRingtone();
        this.emit('call_accepted', { callId: body.callId, responder: { id: from, peerId: body.peerId } });
        return;
      case 'call_decline':
      case 'call_end':
        this.stopRingtone();
        this.emit('call_ended', { callId: body.callId, reason: body.t });
        return;
      case 'act':
        // Shared activity during a call (drawing, story page, game move, reaction)
        if (from === this.callPartnerId) this.emit('activity', body);
        return;
      case 'group_invite':
        // Register right away so the group's next message (queued behind this one) can be read
        if (body.group?.id && body.group.key) this.groups.set(body.group.id, body.group);
        break;
      case 'msg':
        this.playMessageSound();
        break;
      default:
        break;
    }
    this.emit('direct', { from, pub, body });
  }

  /* ── Calls (signalling is encrypted; media is WebRTC/DTLS) ───── */

  initiateCall({ targetContact, callType }) {
    const callId = 'call-' + Date.now();
    this.callPartnerId = targetContact.id;
    this.sendDirect(targetContact.id, {
      t: 'call_ring',
      callId,
      callType: callType || 'video',
      peerId: this.peerId,
      name: this.currentUser?.name,
      avatar: this.currentUser?.avatar,
    }).catch(e => {
      console.warn('[Realtime] Could not ring', e);
      this.emit('call_ended', { callId, reason: 'unreachable' });
    });
    return { callId };
  }

  respondToCall({ callData, accepted }) {
    this.stopRingtone();
    const to = callData.caller?.id;
    if (!to) return;
    this.sendDirect(to, { t: accepted ? 'call_accept' : 'call_decline', callId: callData.callId, peerId: this.peerId })
      .catch(() => {});
  }

  endCall({ callData } = {}) {
    this.stopRingtone();
    const to = this.callPartnerId;
    if (to) this.sendDirect(to, { t: 'call_end', callId: callData?.callId }, { qos: 0 }).catch(() => {});
    this.callPartnerId = null;
    if (this.activeCallSession) {
      try { this.activeCallSession.close(); } catch (_) {}
      this.activeCallSession = null;
    }
  }

  // Shared activity event for the person we're on a call with (encrypted like everything else)
  sendActivity(data) {
    const to = this.callPartnerId;
    if (!to) return;
    // Queue so moves are encrypted and published in the order they happened
    this.activityQueue = (this.activityQueue || Promise.resolve())
      .then(() => this.sendDirect(to, { t: 'act', ...data }, { qos: 1, waitMs: 0 }))
      .catch(() => {});
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
