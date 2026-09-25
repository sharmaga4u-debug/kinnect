/**
 * End-to-end encryption for Kinnect.
 *
 * Every install creates an ECDH P-256 key pair; the private key never leaves the phone.
 * Two people derive the same AES-256-GCM key from their key pairs (ECDH + HKDF), so direct
 * messages and call signalling can only be read by the two phones involved. Groups share a
 * random AES key that is handed to each member inside an encrypted direct message.
 * The relay server only ever sees ciphertext plus the sender/recipient ids.
 */
const subtle = globalThis.crypto?.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();

const IDENTITY_KEY = 'kinnect_identity_v2';

export const cryptoAvailable = !!subtle;

function toB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromB64(b64) {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

// Public user id = hash of the phone number. The number itself is never published.
export async function userIdForPhone(e164) {
  const digest = await subtle.digest('SHA-256', enc.encode(`kinnect-v2:${e164}`));
  return Array.from(new Uint8Array(digest).slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── Identity key pair ─────────────────────────────────────────── */

let identity = null; // { privateKey: CryptoKey, publicJwk: {x, y} }

export async function loadOrCreateIdentity() {
  if (identity) return identity;
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(IDENTITY_KEY) || 'null'); } catch (_) {}

  if (!stored) {
    const pair = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const priv = await subtle.exportKey('jwk', pair.privateKey);
    const pub = await subtle.exportKey('jwk', pair.publicKey);
    stored = { priv, pub: { x: pub.x, y: pub.y } };
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(stored));
  }
  const privateKey = await subtle.importKey('jwk', stored.priv, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  identity = { privateKey, publicJwk: stored.pub };
  return identity;
}

export function clearIdentity() {
  identity = null;
  sharedKeys.clear();
  try { localStorage.removeItem(IDENTITY_KEY); } catch (_) {}
}

export function publicKeyFingerprint(pub) {
  return pub ? `${pub.x}.${pub.y}` : '';
}

/* ── Pairwise keys ─────────────────────────────────────────────── */

const sharedKeys = new Map(); // `${theirId}|${fingerprint}` → Promise<CryptoKey>

async function importPeerPublic(pub) {
  return subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: pub.x, y: pub.y, ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
}

export function sharedKeyFor(myId, theirId, theirPub) {
  const cacheKey = `${theirId}|${publicKeyFingerprint(theirPub)}`;
  if (!sharedKeys.has(cacheKey)) {
    sharedKeys.set(cacheKey, (async () => {
      const { privateKey } = await loadOrCreateIdentity();
      const bits = await subtle.deriveBits({ name: 'ECDH', public: await importPeerPublic(theirPub) }, privateKey, 256);
      const hkdf = await subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
      // Both sides must use the same info string, so order the ids
      const info = [myId, theirId].sort().join(':');
      return subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt: enc.encode('kinnect-v2-dm'), info: enc.encode(info) },
        hkdf, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
      );
    })().catch(err => { sharedKeys.delete(cacheKey); throw err; }));
  }
  return sharedKeys.get(cacheKey);
}

/* ── Group keys ────────────────────────────────────────────────── */

export function newGroupKey() {
  return toB64(crypto.getRandomValues(new Uint8Array(32)));
}

const groupKeys = new Map();
export function groupKeyFor(b64) {
  if (!groupKeys.has(b64)) {
    groupKeys.set(b64, subtle.importKey('raw', fromB64(b64), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']));
  }
  return groupKeys.get(b64);
}

/* ── Encrypt / decrypt JSON ────────────────────────────────────── */

export async function encryptJson(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  return { iv: toB64(iv), ct: toB64(ct) };
}

export async function decryptJson(key, { iv, ct }) {
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, key, fromB64(ct));
  return JSON.parse(dec.decode(pt));
}
