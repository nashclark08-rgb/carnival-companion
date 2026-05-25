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
│       ├── announcements/page.tsx # Compose + history (Urgent has confirm dialog)
│       └── qr/page.tsx          # QR code for the deployed URL
├── components/                  # AnnouncementBanner, CountdownPin, Leaderboard, etc.
└── lib/                         # Firebase init, types, db hooks, auth, attendee storage
```

## First-run flow for staff

1. Visit `/admin/login` and sign in with the email/password you created in Firebase.
2. Go to **Setup**: enter carnival name, school, venue, date. Add houses (name + colour), age groups, categories, and sessions. Save.
3. Go to **Events**: add each event with name, type, age group, category, session, start time, location.
4. Go to **QR code**: download/print the QR. Display it at the carnival entry.
5. On the day: use **Leaderboard** to update points and **Announcements** to broadcast.

## Deploy to Vercel

```bash
vercel
```

Set the same `NEXT_PUBLIC_FIREBASE_*` env vars in the Vercel project settings. The QR code page reads the deployed origin at runtime, so the QR will point at whichever URL you deploy to.

## Known limitations (v1 MVP)

- Announcements broadcast to **all** attendees. Scoped targeting (per house / age group) is Phase 2.
- Push notifications are not yet wired up — the in-app banner is the primary alert channel (per PRD §6.1). Add-to-Home-Screen is supported via the manifest.
- AI program import is Phase 2.
- Countdown timer trusts the device clock; severe clock drift on attendee devices could mis-display countdowns.
- Single carnival assumed (`default` doc id). Multi-carnival support is out of scope for v1.
