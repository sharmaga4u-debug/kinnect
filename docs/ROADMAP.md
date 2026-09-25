# Kinnect roadmap

**Current state:** 1.3 is with testers. Nothing below starts until their feedback is in.

## Order of work

1. **Tester feedback first.** Review what testers report (Google Sheet, see
   [feedback-sheet.md](feedback-sheet.md)) and fix or change what they ask for before any new feature.
2. **Then the planned features below, one at a time**, each tested and shipped before the next.

## Rule: no paid services

Everything must run free: on the phone itself, or on free infrastructure already in use
(public MQTT relay, PeerJS, GitHub Pages / Releases). No paid APIs, cloud translation,
SMS or hosting until this is explicitly revisited.

## Planned: translation (English ↔ Telugu and other Indian languages)

Each person picks their preferred language; Kinnect translates what they receive.

| Step | What | Effort | Notes |
|---|---|---|---|
| 1 | **Chat message translation** | Medium (days) | On-device translation (e.g. Google ML Kit, free, offline after a one-time language download), so messages stay end-to-end encrypted. Show translation with "see original". |
| 2 | **Voice message translation** | Medium | On-device speech-to-text → translate → read aloud in the listener's language. |
| 3 | **Live translated subtitles in calls** | Large (1–2 weeks) | Needs a native speech-recognition plugin compatible with Capacitor 8 (the community plugin only targets Capacitor 7 today). Only if it can run free/on-device. |
| 4 | Live translated *voice* in calls | Very large | Not planned: 3–5 s delay and typically needs paid cloud services. |

## Known limitations to revisit later

- Phone numbers aren't verified by SMS (verification services are paid). Security codes in contact info are the current safeguard.
- Messages relay through a free public MQTT broker; messages waiting more than ~7 days for an offline person may be lost.
- Voice *typing* (speech-to-text in the chat box) isn't available in the Android app; the keyboard's mic key covers it.
- Light theme only; dark mode needs a proper pass.
