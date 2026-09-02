# Shared application utilities

Shared non-UI application utilities and services belong here when they are
needed. Gameplay logic remains inside its owning game module, and reusable UI
belongs in `src/components`.

## Supabase

`supabase/client.ts` creates the browser client, and `supabase/server.ts`
creates a request-scoped server client backed by Next.js cookies. Both are
user-scoped clients that use only the browser-safe publishable configuration and
remain subject to database Row Level Security.

`supabase/privileged.ts` is a separate server-only client for trusted ranked-run
writes. It uses `SUPABASE_SECRET_KEY`, keeps Auth session persistence and token
refresh disabled, and must never enter the Client Component module graph.
`supabase/proxy.ts` creates a fresh user-scoped server client for each matched
request, verifies claims, and keeps refreshed auth cookies aligned between the
request and response without making public routes private.

Pure authentication input and signup-error classification live under `auth/`
so their security boundaries can be tested without browser or network mocks.
