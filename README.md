# JSG Games

JSG Games is a shared website for multiple games. The application uses Next.js,
TypeScript, and the App Router, with each game organized as a feature module
alongside shared site-level systems.

## Current state

Phase 3 is complete: SWGA is migrated and playable, including its optional timed
mode. Phase 4 now includes the local Supabase tooling and the first shared
database/security foundation. Account UI, profile lifecycle, score submission,
statistics, leaderboards, and hosted Supabase infrastructure remain future work.

## Prerequisites

- Node.js 22 or newer
- npm
- Docker Desktop or another Docker-compatible container runtime to run the
  optional local Supabase stack

## Install

Install the exact dependency versions recorded in `package-lock.json`:

```bash
npm ci
```

Use `npm install` instead when intentionally updating dependencies or the
lockfile.

## Environment setup

Copy the tracked placeholder contract to an ignored local file:

```bash
cp .env.example .env.local
```

On PowerShell, use `Copy-Item .env.example .env.local`. Replace the placeholders
in `.env.local` with values for the environment you are using. For the local
stack, get the API URL and publishable key from `npm run supabase:status`.

- `NEXT_PUBLIC_SUPABASE_URL` is the browser-safe project API URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the browser-safe, low-privilege key.
  Database access made with it must be protected by Row Level Security.
- `SUPABASE_SECRET_KEY` is reserved for a future server-only privileged client.
  No current application code reads it or creates that client. Never add
  `NEXT_PUBLIC_` to this name or import future privileged code into a Client
  Component.

Only `.env.example` is version controlled. Real `.env*` files remain ignored
and must never contain credentials that are committed to Git.

## Local development

Start the development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Local Supabase development

The `supabase` npm script always invokes the CLI pinned in this repository; no
global installation is needed.

```bash
npm run supabase:version
npm run supabase:start
npm run supabase:status
npm run supabase:stop
```

Local auth is configured for email/password signup, required email confirmation,
an eight-character minimum password with no additional complexity rules, and
localhost redirects. Local test emails are captured by the Supabase email
testing service shown by `status`; they are not sent to real recipients.

Database changes follow a migration-first workflow. Create a migration with
`npm run supabase -- migration new <name>`, edit the generated SQL, and validate
the complete migration history and pgTAP suite locally:

```bash
npm run supabase -- db reset --local --no-seed
npm run supabase -- test db --local
```

Do not make schema changes only through a dashboard. The separate Database CI
workflow starts an ephemeral local Postgres stack, resets all migrations, runs
the pgTAP suite, and always stops the stack. Neither local validation nor CI
links a hosted project or requires hosted credentials.

## Database foundation

The first migration creates three game-generic tables:

- `games` is the application-controlled registry and initially contains only
  SWGA.
- `profiles` currently contains only an auth-linked UUID and creation time. It
  has no product identity fields or automatic auth-user trigger yet.
- `game_runs` stores only terminal tracked runs and is the append-only canonical
  source for future statistics and leaderboards.

PostgreSQL grants and RLS are both enforced. Browser/user-scoped roles can read
the predefined games, while authenticated users can read only their own profile
and runs. They cannot insert, update, or delete competitive runs. The trusted
runtime role can later insert only `user_id`, `game_id`, and `score`; run IDs and
completion timestamps remain database-generated, and runtime update/delete is
not granted.

No score-submission path, privileged application client, profile lifecycle,
statistics query, or leaderboard exists yet. Hosted Supabase remains
deliberately unconfigured and no remote database workflow is defined.

## Supabase trust boundary

Both shared clients are user-scoped and use the publishable key. The browser
client runs in public code. The server client also uses the publishable key, but
adapts the signed-in user's cookies to Next.js so server-side work can act as
that user and remain subject to RLS.

No secret-key/admin client exists yet. Future ranked score submission will cross
the trust boundary as browser -> JSG Games server -> database; browsers will not
directly insert competitive game runs.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

Use `npm run test:watch` for Vitest watch mode during development.

## Source structure

- `src/app/` contains App Router routes, the root layout, and global styles.
- `src/components/` contains reusable site-level UI, separate from gameplay.
- `src/games/` is the boundary for game feature modules and the site game
  registry. See `src/games/README.md` for ownership guidelines.
- `src/lib/` contains shared non-UI application utilities and services,
  including the user-scoped Supabase client factories.
- `supabase/` contains reproducible local Supabase configuration and will hold
  migration history beginning with the schema phase.
