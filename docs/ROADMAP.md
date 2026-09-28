# Kinnect roadmap

**Rule: no paid services.** Everything runs on the phone or on free infrastructure already in use
(public MQTT relay, PeerJS, GitHub Pages / Releases, Google ML Kit on-device).

## Built (local, not yet released)

**Everyday messaging**
- End-to-end encrypted chats, groups, photos, voice messages, replies, reactions, delete for everyone
- Typing indicator, online / last seen (can be hidden), delivery ticks, notifications while in background
- Large messages split into parts (the free relay drops anything over ~250 KB)
- Polls, shared lists, live location (15 min / 1 h), family photo album with "On this day"
- Password-encrypted backup file + restore on a new phone (includes the encryption key)
- Add people from phone contacts, by number, or by QR code; scam warning for strangers; blocking

**Calls & playing together**
- 1:1 and group (up to 4) video/voice calls, encrypted signalling, save-data mode
- Shared activities on calls: Draw Together, Story Time, Tic-Tac-Toe, Memory Match, Snakes & Ladders,
  Draw & Guess, Watch Together (YouTube in sync), Light the Diyas; floating reactions
- Late-night call warning using the other person's time zone; quick call rating

**Family & care**
- Daily "I'm OK" check-in, medicine reminders with a taken log for caregivers, SOS with location + auto-call
- Scheduled family calls reminded in each person's own time zone, best-time-to-call helper
- Birthdays & anniversaries, family tree with Hindi/Telugu relation names
- Recorded bedtime stories and family memories (story library, memory prompts)
- Simple mode for grandparents; text-size choice at sign-up; dark theme
- On-device chat translation (ML Kit: en, hi, te, ta, kn, mr, bn, gu), Android app only

**Kids**
- Sticker book and weekly call streaks

## Still to do

| Item | Notes |
|---|---|
| Notifications when the app is fully closed | Needs a push server. Firebase Cloud Messaging is free but needs a tiny sender (e.g. Cloudflare free tier). **Decision needed.** |
| Kid profile on a parent's tablet | Child account without a phone number, parent-approved contacts |
| Live translated subtitles in calls | Needs a Capacitor-8 speech-recognition plugin; only if it can run free/on-device |
| Malayalam translation | Not supported by ML Kit on-device translation |
| Phone-number verification | SMS is paid; security codes are the current safeguard |
| Play Store / iPhone app | $25 one-time / $99 per year — outside the no-paid rule for now |

## Testing notes

Everything above was tested in Chrome with 2–4 simulated phones (automated suites in the scratchpad,
110+ checks). Not yet tested on a real Android phone: contacts, native notifications and reminders,
on-device translation, text-to-speech, geolocation, hardware back button.
