// Phone numbers are normalised to digits-only E.164 (country code + number, no "+")
// so the same person gets the same id no matter how a number was saved in someone's contacts.

export const COUNTRY_CODES = [
  { cc: '91', label: '🇮🇳 India +91' },
  { cc: '1', label: '🇺🇸 USA / 🇨🇦 Canada +1' },
  { cc: '44', label: '🇬🇧 UK +44' },
  { cc: '971', label: '🇦🇪 UAE +971' },
  { cc: '61', label: '🇦🇺 Australia +61' },
  { cc: '65', label: '🇸🇬 Singapore +65' },
  { cc: '966', label: '🇸🇦 Saudi Arabia +966' },
  { cc: '974', label: '🇶🇦 Qatar +974' },
  { cc: '49', label: '🇩🇪 Germany +49' },
  { cc: '33', label: '🇫🇷 France +33' },
  { cc: '64', label: '🇳🇿 New Zealand +64' },
  { cc: '977', label: '🇳🇵 Nepal +977' },
  { cc: '880', label: '🇧🇩 Bangladesh +880' },
  { cc: '94', label: '🇱🇰 Sri Lanka +94' },
];

// `defaultCC` is used for numbers saved without a country code (e.g. "098765 43210")
export function normalizePhone(raw, defaultCC = '91') {
  const s = String(raw || '').trim();
  if (!s) return '';
  let digits = s.replace(/\D/g, '');
  if (s.startsWith('+')) return digits.length >= 8 ? digits : '';
  if (digits.startsWith('00')) return digits.slice(2).length >= 8 ? digits.slice(2) : '';
  digits = digits.replace(/^0+/, '');
  if (digits.length < 6) return '';
  // Already includes the default country code
  if (digits.startsWith(defaultCC) && digits.length > 10) return digits;
  return defaultCC + digits;
}

// Split a normalised number back into country code + national part
export function splitPhone(e164) {
  const match = COUNTRY_CODES
    .map(c => c.cc)
    .sort((a, b) => b.length - a.length)
    .find(cc => e164.startsWith(cc));
  return match ? { cc: match, national: e164.slice(match.length) } : { cc: '', national: e164 };
}

export function formatPhone(e164) {
  if (!e164) return '';
  const { cc, national } = splitPhone(e164);
  const spaced = national.length === 10 ? `${national.slice(0, 5)} ${national.slice(5)}` : national;
  return cc ? `+${cc} ${spaced}` : `+${e164}`;
}
