# Character-guessing core

Framework-independent game-family foundation. There is no playable route, UI,
registry entry, franchise dataset, persistence, or connection to site services.
Future themes own their data shapes and supply a `ThemeConfig<Character>`;
the engine never imports a theme or dataset. Existing games are unaffected.

## API

Create one engine with `createCharacterGuessingEngine(config, random?)` from
`logic/session.ts`. Configuration supplies a theme ID, characters, a name getter,
and ordered trait definitions. Keep configuration/data immutable for the engine's
lifetime and pass only its own sessions back to it. Names must be unique after
trimming and lowercasing; trait keys must be unique. Empty datasets are supported.

- `engine.startSession(nowMs, durationMs?)` creates a session with no round and
  an absolute deadline, defaulting to 60,000 ms. Duration must be positive/finite.
- `engine.startRound(session, nowMs)` selects an unused character. An unresolved
  round cannot be skipped. After the pool is consumed, this action marks the
  session `exhausted`; targets never recycle. An empty pool ends the same way.
- `engine.submitGuess(session, text, nowMs)` accepts free text. Unknown, blank,
  and repeated guesses count as attempts; unknown names yield no hints.
- `onTimeout(session, nowMs)` transitions at or beyond the deadline, revealing
  only the unresolved round. Invoke it from a future timer to observe expiry
  without player input. Guess/progression actions also enforce the deadline.
- `timeLeft(session, nowMs)` reports remaining milliseconds, zero when terminal.

Pass timestamps from a consistent, monotonic clock. No timers or wall-clock reads
are hidden inside the core. Randomness defaults to `Math.random`; tests inject
deterministic samples in `[0, 1)`. Actions return new state without modifying prior
state. Treat returned state as immutable; readonly types are not a security
boundary or a server-authoritative score validator.

## Gameplay and traits

Success on attempts 1–5 awards 5/4/3/2/1 points exactly once. Five wrong guesses
reveal the round for zero points, allowing another round while time remains.
Session score accumulates successful rounds. Correct, exhausted, and timed-out
rounds are revealed. Timeout and pool exhaustion are absorbing session states:
further actions cannot restart play, including with an earlier timestamp.

Name and trait matching trim and lowercase without fuzzy matching. Exact traits
return strings; overlap traits return arrays of strings. A future adapter can
split legacy comma-separated values before supplying them. Blank values never
match. Any overlap reveals the entire target trait, preserving the source hint
semantics. Structured hints contain key, label, and original target values in
configuration order. `Guess.newTraits` surfaces each matching key once per round;
discovery resets on progression. `compareTraits` also works independently with
an optional set of previously discovered keys.

## Behavioral source and deliberate differences

Inspected the local `JaStaGa/minute-mystery` checkout at HEAD
`8bc9cc782537e048fde982f4f9792c913cf595d8`: `src/game/engine/session.ts`,
`session.test.ts`, `traits.ts`, `src/game/types.ts`, and the fake and representative
real theme adapters. The checkout had local edits, including additional types;
none were modified or copied here. This is a behavioral migration, not a verbatim
copy of that checkout.

Preserved the session engine's duration, scoring, five-attempt rounds, free-text
name matching, unused-target selection, timeout reveal, accumulated score, and
newly discovered shared traits. Deliberately replaced dataset imports and
duplicated reducers with one configured engine, fixed prior-state mutation and
post-completion scoring, prevented unresolved-round skipping, and made pool
exhaustion explicit. Correct rounds now also set `revealed` for a consistent
completed-round contract. Whitespace-only traits do not produce hints.
Legacy UI shims and all authentication/storage code were not migrated.

The IP-neutral residents and explorers fixtures exercise distinct data shapes,
exact-only versus mixed overlap/exact traits, and the same gameplay implementation.
Run repository checks with `npm test`, `npm run lint`, and `npm run build`.
