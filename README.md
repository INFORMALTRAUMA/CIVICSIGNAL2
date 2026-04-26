This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Mobile Scaffold (Expo)

A React Native scaffold is available at `mobile/`.

Run it from the repo root:

```bash
pnpm install
cp mobile/.env.example mobile/.env
pnpm dev
```

In a second terminal:

```bash
pnpm --filter civic-signal-mobile start
```

Current mobile scaffold includes:
- Citizen feed (`GET /api/issues`)
- Report signal (`POST /api/issues`)
- Signal detail screen (`GET /api/issues/:id`)
- Supabase auth flow (`/sign-in`) and protected tabs

## Environment

Create a `.env` file with the following keys (values depend on your Supabase/Map provider setup):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Notes:
- `SUPABASE_SERVICE_ROLE_KEY` is only required for server-side admin workflows.
- Maps are currently disabled in the UI. You can add a provider later if needed.

## Database

Initial schema SQL lives in `supabase/migrations/20260209231000_initial.sql`.

If you are using the Supabase CLI, you can apply it with:

```bash
supabase db reset
# or
supabase db push
```

## API

Scaffolded routes:
- `GET /api/issues` (query: `status`, `wardId`, `search`, `limit`, `offset`, `lat`, `lng`, `radius`)
- `POST /api/issues`
- `GET /api/issues/:id`
- `PATCH /api/issues/:id`
- `POST /api/issues/:id` with `action: upvote|report`
- `GET /api/issues/:id/detail`
- `GET /api/issues/duplicates`
- `POST /api/issues/media`
- `POST /api/issues/status`

## Clerk Roles

Set a role on the user so `/official` routes are restricted to officials.

Recommended values:
- `official`
- `citizen`

You can set this in Clerk Dashboard (Users → Public Metadata) or via API:

```json
{
  "publicMetadata": {
    "role": "official"
  }
}
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
