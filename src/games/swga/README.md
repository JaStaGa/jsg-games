# SWGA

The core logic, board and keyboard helpers, word data, and regression tests were migrated from the [JaStaGa/swga](https://github.com/JaStaGa/swga) repository at commit `f9e56e5594a163e5c9a4f163a8628fe07bca170d`.

The playable UI has now been adapted into JSG Games at `/games/swga`. It uses the shared JSG site shell while keeping SWGA-specific styling scoped locally to the game component.

Untimed play remains the default practice/unranked mode and preserves the
faithful SWGA baseline. The optional **60 Seconds (Ranked)** timed mode is the
ranked mode and can be selected before gameplay begins. Its single
deadline starts with the first letter entered, applies to the entire run, and
never pauses. Reaching the deadline immediately ends the run with a **Time's
Up** result.

The optional mode is intentionally small and removable: its timing rules live
in `logic/timer.ts`, while the existing game core and word data remain
unchanged.

Project-owner manual gameplay evaluation is complete. The owner tested the
optional **60 Seconds** mode on mobile through the protected Vercel Preview and
decided to keep it. The 60-second duration was judged about right, and no
gameplay bugs were reported. **Untimed** remains the default, while **60
Seconds** remains optional.

Ranked terminal summaries have a trusted persistence foundation at
`POST /api/games/swga/runs`. The route authenticates the player, requires a
profile, validates SWGA-specific score plausibility, resolves the game on the
server, and performs an idempotent append-only write. The browser game component
automatically submits each terminal Timed run once with a stable UUID, and a
manual retry reuses the same terminal payload and UUID. Untimed runs never
submit. Signed-out and profileless players can still play normally; the result
status directs them to sign in or create a profile without forcing navigation.
Real hosted end-to-end persistence has not yet been accepted because the
server-only `SUPABASE_SECRET_KEY` will be configured separately. The current
validation is not a fully server-authoritative simulation.
