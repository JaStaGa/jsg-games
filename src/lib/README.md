# Shared application utilities

Shared non-UI application utilities and services belong here when they are
needed. Gameplay logic remains inside its owning game module, and reusable UI
belongs in `src/components`.

## Supabase

`supabase/client.ts` creates the browser client, and `supabase/server.ts`
creates a request-scoped server client backed by Next.js cookies. Both are
user-scoped clients that use only the browser-safe publishable configuration and
remain subject to database Row Level Security.

There is intentionally no secret-key/admin client. A future privileged client
must be server-only, use `SUPABASE_SECRET_KEY`, and must never enter the Client
Component module graph. `supabase/proxy.ts` creates a fresh server client for
each matched request, verifies claims, and keeps refreshed auth cookies aligned
between the request and response without making public routes private.

Pure authentication input and confirmation-type checks live under `auth/` so
their security boundaries can be tested without browser or network mocks.
