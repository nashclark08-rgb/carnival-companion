# Carnival Companion

Mobile-first PWA for school athletics carnivals. Students and parents scan a QR code, identify themselves, and immediately see a personalised schedule with a live countdown, a real-time house-points leaderboard, and announcement banners. Staff use a separate admin portal to configure the carnival, broadcast updates, and (optionally) let Claude parse the existing program PDF into structured events.

Built per the v1.1 PRD (`Carnival_Companion_PRD_v1.1.md`).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Firebase 11 — Firestore for live data (with persistent IndexedDB cache for offline), Auth for admin sign-in
- Anthropic SDK — Claude Sonnet 4.6 for program parsing
- `qrcode` for the attendee QR
- Deployed on Vercel

## One-time setup

### 1. Create a Firebase project

1. Go to <https://console.firebase.google.com/> and create a new project.
2. In **Build → Firestore Database**, create a database in production mode.
3. In **Build → Authentication → Sign-in method**, enable **Email/Password**, then add at least one staff user under the **Users** tab.
4. In **Project settings → Your apps**, register a **Web app** and copy the config values.

### 2. Get an Anthropic API key (only needed for AI import)

Create a key at <https://console.anthropic.com/settings/keys>. Top up a few dollars of credit if it's a fresh account.

### 3. Configure environment

Copy `.env.local.example` to `.env.local` and fill in:

```
# Public — bundled into the browser
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Server-only — never prefix with NEXT_PUBLIC_
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Apply Firestore security rules

Paste `firestore.rules` into Firebase Console → Firestore → Rules → Publish. Public read on carnival data, admin-only writes.

### 5. Run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Routes

**Attendee (no login)**
| Path | Purpose |
|---|---|
| `/` | Role picker (Student / Parent) — first visit only |
| `/onboarding/student` | Student details form |
| `/onboarding/parent` | Parent details form (about the child). Append a second child with `?mode=addChild`. |
| `/schedule` | Personalised schedule + countdown + leaderboard + announcement banner |
| `/announcements` | Full history with severity filter |

**Admin (Firebase Auth required)**
| Path | Purpose |
|---|---|
| `/admin/login` | Email/password sign-in |
| `/admin` | Dashboard + one-click demo carnival seeder |
| `/admin/setup` | Houses, age groups, categories, sessions |
| `/admin/events` | Event editor + bulk schedule shift (for weather delays) |
| `/admin/import` | AI program import — PDF/image/CSV → review → save |
| `/admin/leaderboard` | House points editor with live preview |
| `/admin/announcements` | Compose alerts with severity + targeting (all / house / age group). Urgent has confirm dialog. |
| `/admin/preview` | "Preview as attendee" — see exactly what a given role/house/age/category sees |
| `/admin/qr` | Print/download the attendee QR for venue entry |

**Public venue display**
| Path | Purpose |
|---|---|
| `/display` | Kiosk fullscreen view: clock, latest announcement, in-progress events, next 5 upcoming, full leaderboard. Designed for projecting on a big screen. |

## First-run flow for staff

1. **`/admin/login`** with the Firebase Auth user.
2. **Setup** tab: name, school, venue, date, then add houses (name + colour), age groups, categories, sessions. Save.
3. **Add events** either way:
   - **Manually** in the Events tab, or
   - **AI import**: Import tab → upload PDF/image/CSV → Claude extracts events → review/edit → Save.
4. **Preview** tab: walk through what each cohort will see before the day.
5. **QR code** tab: download/print, display at carnival entry.
6. **On the day:**
   - **Leaderboard** to update points.
   - **Announcements** to broadcast (everyone / per-house / per-age-group). Urgent confirms before sending.
   - **Events → Shift schedule…** if rain delays everything by 15 min.
   - **`/display`** on the venue projector for the live scoreboard.

## AI program import

The Import tab uses the Anthropic API (Claude Sonnet 4.6) to read a program file and extract structured events.

- **Supported file types:** PDF, PNG, JPEG, WebP, CSV, TSV, plain text. Excel users: export to CSV first.
- Claude maps each event to the IDs you configured (age groups, categories, sessions) and returns warnings for anything it couldn't fully parse.
- The review step (FR-29 in the PRD) is mandatory — nothing is written to Firestore until you click Save.
- Prompt caching is enabled on the system prompt so repeated uploads are cheap.

## Deploy to Vercel

```bash
vercel
```

Set the same env vars in the Vercel project (Settings → Environment Variables, Production / Preview / Development). The QR-code page reads the deployed origin at runtime, so the QR auto-updates to your live URL.

## Features delivered against the PRD

| Phase | Feature | Status |
|---|---|---|
| MVP | QR onboarding with role split (Student / Parent) | shipped |
| MVP | Personalised schedule + countdown | shipped |
| MVP | House-points leaderboard | shipped |
| MVP | Broadcast announcements (banner) | shipped |
| MVP | Admin portal (setup, events, points, alerts, QR) | shipped |
| Phase 2 | AI program import (PDF / image / CSV) with mandatory review | shipped |
| Phase 2 | Scoped announcement targeting (per house / per age group) | shipped |
| Phase 2 | Opt-in push notifications | partial — local Notification API for in-app browser alerts; full background push (service worker + FCM) not yet wired |
| Phase 3 | Combined multi-child view for parents | shipped |
| Phase 3 | Offline resilience (Firestore IndexedDB cache + offline indicator) | shipped |
| Phase 3 | Announcement history page with severity filter | shipped |
| Beyond | PA / scoreboard `/display` mode | shipped |
| Beyond | Admin "Preview as attendee" tool | shipped |
| Beyond | Bulk schedule shift with optional auto-announcement | shipped |
| Beyond | Schedule-clash warnings for parents following multiple children | shipped |

## Known limitations

- Background push notifications require a service worker + FCM and aren't wired up. The in-app banner is still the guaranteed alert channel.
- Countdown timer trusts the device clock; severe clock drift on attendee devices could mis-display countdowns.
- Single carnival assumed (Firestore doc id `default`). Multi-carnival is out of scope for v1.
- AI import only handles single-file uploads up to ~32 MB (Anthropic limit for PDFs).
