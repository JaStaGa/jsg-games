# JSG Games

JSG Games is a shared website for multiple games. The application uses Next.js,
TypeScript, and the App Router, with each game organized as a feature module
alongside shared site-level systems.

## Current state

Phase 3 is complete: SWGA is migrated and playable, including its optional timed
mode. Phase 4 now includes local Supabase tooling, the first shared
database/security foundation, and the hosted `JSG Games Development` Supabase
project in `us-east-1`. That hosted project is development infrastructure only;
there is no production Supabase project. Public email/password account access
and confirmation are implemented, along with password recovery through the
standard Supabase PKCE flow. Authenticated users can explicitly create and
rename their username-backed profile at `/profile`. The trusted server and
database foundation for ranked SWGA submissions now exists, and terminal
60-second Timed runs automatically submit through it from the browser. Untimed
play remains practice and does not submit a ranked run. Signed-in players can
review their ranked SWGA statistics and latest results at `/stats`. Real hosted
write acceptance is still pending server-side secret configuration. The public
top-10 leaderboard remains future Task 4I work.

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
in `.env.local` with values for either the local stack or the hosted development
project. For the local stack, get the API URL and publishable key from
`npm run supabase:status`. For hosted development, use the API URL and modern
publishable key for `JSG Games Development`. Do not mix values from different
environments.

- `NEXT_PUBLIC_SUPABASE_URL` is the browser-safe API URL for the selected local
  or hosted development environment.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the browser-safe, low-privilege key.
  Database access made with it must be protected by Row Level Security.
- `SUPABASE_SECRET_KEY` is the server-only credential used by the trusted
  ranked-run route. It is required before a real local or hosted environment
  can accept ranked writes. Never add `NEXT_PUBLIC_` to this name, import the
  privileged client into a Client Component, or commit a real value.

Only `.env.example` is version controlled. `.env.local` and other real `.env*`
files remain ignored and must never be committed.

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
localhost redirects, including the exact password-recovery callback at
`http://localhost:3000/auth/recovery-callback`. Local test emails are captured
by the Supabase email testing service shown by `status`; they are not sent to
real recipients. Signup and recovery use Supabase's default emails. Password
recovery must be requested and completed in the same browser profile so the
PKCE verifier cookie is available. After confirmation or a completed password
reset, sign in normally at `/login`.

Database changes follow a migration-first workflow. Create a migration with
`npm run supabase -- migration new <name>`, edit the generated SQL, and validate
the complete migration history and pgTAP suite locally:

```bash
npm run supabase -- db reset --local --no-seed
npm run supabase -- test db --local
```

Do not make schema changes only through a dashboard. The separate Database CI
workflow starts an ephemeral local Postgres stack, resets all migrations, runs
the pgTAP suite, and always stops the stack. Local validation and CI are
independent of the hosted project and require no hosted credentials.

## Hosted Supabase development

`JSG Games Development` is the shared hosted development project in
`us-east-1`; it is not production infrastructure. It has the versioned core
schema migration applied, containing `games`, `profiles`, and `game_runs`, with
SWGA as the only predefined game. Its hosted Auth configuration uses the same
approved development baseline as local configuration: email/password enabled,
email confirmation required, an eight-character minimum password, no additional
character-complexity requirement, and localhost site/redirect URLs. The project
uses the Free plan and Supabase's default email provider, so signup uses
Supabase's default confirmation email without a custom template or SMTP
provider. After confirming the address, the user returns to JSG Games and signs
in normally at `/login`. Before hosted password-recovery verification, add the
exact `http://localhost:3000/auth/recovery-callback` URL to the hosted Auth
redirect allowlist. Recovery continues to use Supabase's standard email; no
custom template or SMTP provider is required.

Remote schema changes must remain migration-first. Do not change schema directly
through the hosted Dashboard SQL or Table editors. For an authorized deployment,
authenticate the CLI locally, link only to the intended development project,
inspect its migration history, and dry-run before applying anything:

```bash
npm run supabase -- login
npm run supabase -- link --project-ref <development-project-ref>
npm run supabase -- migration list --linked
npm run supabase -- db push --linked --dry-run
# Review the target and migration plan before continuing.
npm run supabase -- db push --linked
```

The link metadata is machine-local under ignored `supabase/.temp` and must not
be committed. `db reset --linked` is destructive and must not be run casually or
used as the normal hosted-development workflow. Production Supabase
infrastructure remains a separate future decision.

## Database foundation

The first migration creates three game-generic tables:

- `games` is the application-controlled registry and initially contains only
  SWGA.
- `profiles` contains an auth-linked UUID, a case-insensitively unique username,
  and creation time. Profiles are created explicitly; there is no automatic
  auth-user trigger.
- `game_runs` stores only terminal tracked runs and is the append-only canonical
  source for future statistics and leaderboards. A client-generated UUID is
  unique per user so network retries cannot create duplicate runs.
- `player_game_stats` is a read-only aggregate view over `game_runs`. It derives
  games played, personal best, and average score per player and game without
  duplicating score data.

PostgreSQL grants and RLS are both enforced. Browser/user-scoped roles can read
the predefined games, while authenticated users can read only their own profile
and runs. They cannot insert, update, or delete competitive runs. The trusted
runtime role can insert only `user_id`, `game_id`, `score`, and `submission_id`;
run IDs and completion timestamps remain database-generated, and runtime
update/delete is not granted.

The ranked SWGA route is `POST /api/games/swga/runs`. It accepts only validated
terminal summaries, derives the user from verified Auth claims, requires an
existing profile, resolves SWGA by its predefined slug on the server, and uses
the server-only privileged client for the append-only write. Terminal Timed
runs automatically call this route with a stable client-generated submission
ID; Untimed runs never do. Signed-out and profileless players can still play,
but the results screen explains why their ranked result could not be saved.
The previously reviewed hosted development migrations through the ranked-run
foundation are applied, but real hosted end-to-end write acceptance has not yet
been performed because `SUPABASE_SECRET_KEY` remains a separate server-side
configuration step. The player-statistics migration in this task remains
local/CI-only pending separate approval for hosted application.

The protected `/stats` page uses the cookie-backed, user-scoped server client.
It verifies Auth claims, resolves the predefined `swga` game server-side, reads
the signed-in player's derived aggregate, and displays the latest 20 ranked
SWGA runs in deterministic newest-first order with UTC completion times. A
player with no runs sees zero games played and dashes for personal best and
average score; an account without a profile is directed to `/profile`.
`game_runs` remains the canonical score source, and `player_game_stats` remains
derived and read-only with invoker security so underlying run RLS stays
authoritative. Public top-10 leaderboard work is intentionally deferred to Task
4I.

## Supabase trust boundary

The shared browser and cookie-backed clients are user-scoped and use the
publishable key. The browser client runs in public code. The server client also
uses the publishable key, but adapts the signed-in user's cookies to Next.js so
server-side work can act as that user and remain subject to RLS. A
request-scoped proxy verifies claims and refreshes cookie-backed sessions
without restricting public pages or games.

A separate server-only client uses `SUPABASE_SECRET_KEY` only after the ranked
route has authenticated the request and validated the SWGA terminal summary.
Ranked score submission crosses the trust boundary as browser -> JSG Games
server -> database; browsers remain unable to insert competitive game runs
directly.

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
- `supabase/` contains reproducible local Supabase configuration, versioned
  migration history, and pgTAP database tests.
