// App-lock PIN hashing. This keeps the PIN out of plain sight on the device;
// it is a privacy lock for a shared phone, not account security.
export async function hashPin(userId, pin) {
  const input = `kinnect:${userId}:${pin}`;
  try {
    if (window.crypto?.subtle) {
      const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (_) {}
  // Fallback for insecure (plain http) contexts where SubtleCrypto is unavailable
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 'f' + h.toString(16);
}

export async function checkPin(profile, pin) {
  if (!profile?.pinHash) return false;
  return (await hashPin(profile.id, pin)) === profile.pinHash;
}
