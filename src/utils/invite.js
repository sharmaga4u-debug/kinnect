// Public links. Inside the Android app window.location is https://localhost, so never use it for sharing.
export const APP_URL = 'https://sharmaga4u-debug.github.io/kinnect/';
export const APK_URL = 'https://github.com/sharmaga4u-debug/kinnect/releases/latest/download/kinnect.apk';

export function inviteMessage(inviterName) {
  return `${inviterName ? `${inviterName} invited you to` : 'Join me on'} Kinnect 🌿 – private, encrypted chats and calls.\n\n` +
    `📱 Android app: ${APK_URL}\n` +
    `💻 Or use it in your browser: ${APP_URL}\n\n` +
    `Register with your mobile number and we'll find each other automatically.`;
}

export function whatsappLink(phoneE164, text) {
  return `https://wa.me/${String(phoneE164 || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

export function smsLink(phoneE164, text) {
  const digits = String(phoneE164 || '').replace(/\D/g, '');
  return `sms:${digits ? '+' + digits : ''}?body=${encodeURIComponent(text)}`;
}

// Generic share sheet, falling back to copying the text
export async function shareText(text) {
  if (navigator.share) {
    try { await navigator.share({ title: 'Kinnect', text }); return 'shared'; } catch { return 'cancelled'; }
  }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch { return 'failed'; }
}
