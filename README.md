# BIG CRUISE〽️ (BCH〽️)

Production-first, mobile-first Progressive Web App foundation for BIG CRUISE〽️: a Nigerian internet-culture community platform for entertainment, memes, banter, games, music, events, rewards, and X/Twitter community culture.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Supabase/PostgreSQL-ready data architecture
- PWA manifest + service worker shell cache

## Official logo rule

The approved official logo must be placed at:

```txt
public/assets/big-cruise-logo-official.png
```

Do not redraw, recolor, regenerate, distort, crop, stretch, or replace the logo. The UI theme changes around it; the asset itself remains fixed.

## Environment

Copy `.env.example` to `.env.local` and fill values locally. Never commit real secrets.

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
X_CLIENT_ID=
X_CLIENT_SECRET=
X_REDIRECT_URI=http://localhost:3000/api/auth/x/callback
```

## Commands

```bash
npm run dev
npm run typecheck
npm run test
npm run build
npm run check
```
