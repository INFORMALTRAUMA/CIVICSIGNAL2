# Civic Signal Mobile (Expo)

This is the React Native scaffold for Civic Signal.

## Quick start

1. Install dependencies from repo root:

```bash
pnpm install
```

2. Configure mobile env:

```bash
cp mobile/.env.example mobile/.env
```

Set these in `mobile/.env`:

- `EXPO_PUBLIC_API_BASE_URL` (your Next.js backend, e.g. `http://localhost:3000`)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

3. Start web backend in one terminal:

```bash
pnpm dev
```

4. Start mobile app in another terminal:

```bash
pnpm --filter civic-signal-mobile start
```

Use Expo Go (Android/iOS) to run the app.

## Current scaffold

- Feed screen reading `/api/issues`
- Report screen posting to `/api/issues`
- Issue detail screen using `/api/issues/:id`
- Supabase email/password auth (`/sign-in`)
- Account screen with signed-in user + sign out

## Next implementation

- `createdBy` now uses the authenticated Supabase user id.
- Add media upload flow (`/api/issues/media`) from camera/gallery.
- Add realtime issue updates and push notifications.
