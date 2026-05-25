# Carnival Companion

Mobile-first PWA for school athletics carnivals. Students and parents scan a QR code, identify themselves, and immediately see a personalised schedule with a live countdown, a real-time house-points leaderboard, and announcement banners. Staff use a separate admin portal to configure the carnival and broadcast updates.

Built per the v1.1 PRD (`Carnival_Companion_PRD_v1.1.md`).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Firebase (Firestore for live data, Auth for admin sign in)
- `qrcode` for generating the attendee QR
- Deployed on Vercel

## One-time setup

### 1. Create a Firebase project

1. Go to <https://console.firebase.google.com/> and create a new project (e.g. `carnival-companion`).
2. In **Build → Firestore Database**, create a database in production mode.
3. In **Build → Authentication → Sign-in method**, enable **Email/Password**, then add at least one staff user under the **Users** tab.
4. In **Project settings → Your apps**, register a **Web app** and copy the config values.

### 2. Configure environment

Copy `.env.local.example` to `.env.local` and fill in the values from the Firebase web-app config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 3. Apply Firestore security rules

Deploy `firestore.rules` from this repo to your Firebase project (Firestore → Rules → paste and publish). The rules allow public read on carnival data and admin-only writes.

### 4. Install + run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## App structure

```
src/
├── app/
│   ├── page.tsx                 # Landing — role picker (Student / Parent)
│   ├── onboarding/
│   │   ├── student/page.tsx     # Student details form
│   │   └── parent/page.tsx      # Parent: child's details form
│   ├── schedule/page.tsx        # Personalised schedule + countdown + leaderboard + banner
│   └── admin/
│       ├── login/page.tsx
│       ├── page.tsx             # Dashboard
│       ├── setup/page.tsx       # Carnival + houses + age groups + categories + sessions
│       ├── events/page.tsx      # Event editor
│       ├── leaderboard/page.tsx # House points editor
│       ├── announcements/page.tsx # Compose + history (Urgent has confirm dialog, supports targeting)
│       ├── import/page.tsx      # AI program import (PDF/image → Claude → review → save)
│       └── qr/page.tsx          # QR code for the deployed URL
├── app/api/
│   └── parse-program/route.ts   # Server route that calls the Anthropic API
├── components/                  # AnnouncementBanner, CountdownPin, Leaderboard, etc.
└── lib/                         # Firebase init, types, db hooks, auth, attendee storage
```

## First-run flow for staff

1. Visit `/admin/login` and sign in with the email/password you created in Firebase.
2. Go to **Setup**: enter carnival name, school, venue, date. Add houses (name + colour), age groups, categories, and sessions. Save.
3. Add events either way:
   - **Manually** via the Events tab, OR
   - **AI import**: Import tab → upload PDF/image of the existing program → Claude parses it → review and edit the extracted events → Save.
4. Go to **QR code**: download/print the QR. Display it at the carnival entry.
5. On the day: use **Leaderboard** to update points and **Announcements** to broadcast (target everyone, a single house, or a single age group).

## AI program import

The Import tab uses the Anthropic API (Claude Sonnet 4.6) to read a program file and extract structured events.

- **Set the key:** add `ANTHROPIC_API_KEY=sk-ant-...` to `.env.local`. **This is server-only — never prefix it with `NEXT_PUBLIC_`** or it will leak into every browser bundle.
- Get a key at https://console.anthropic.com/settings/keys. You'll need a few dollars of credit on the account.
- Supported file types: PDF, PNG, JPEG, WebP. CSV/Excel not yet supported — convert to PDF first.
- The review step (FR-29 in the PRD) is mandatory — nothing is written to Firestore until you click Save.
- When deploying to Vercel, add `ANTHROPIC_API_KEY` in the Vercel project's env settings (Environment Variables → Production / Preview / Development).

## Deploy to Vercel

```bash
vercel
```

Set the same `NEXT_PUBLIC_FIREBASE_*` env vars in the Vercel project settings. The QR code page reads the deployed origin at runtime, so the QR will point at whichever URL you deploy to.

## Known limitations

- Push notifications are not yet wired up — the in-app banner is the primary alert channel (per PRD §6.1). Add-to-Home-Screen is supported via the manifest. Web push is the only remaining Phase 2 item.
- Countdown timer trusts the device clock; severe clock drift on attendee devices could mis-display countdowns.
- Single carnival assumed (`default` doc id). Multi-carnival support is out of scope for v1.
- AI import only accepts PDF and image files. CSV/Excel programs need to be exported to PDF first.
