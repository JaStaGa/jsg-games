# SWGA

The core logic, board and keyboard helpers, word data, and regression tests were migrated from the [JaStaGa/swga](https://github.com/JaStaGa/swga) repository at commit `f9e56e5594a163e5c9a4f163a8628fe07bca170d`.

The playable UI has now been adapted into JSG Games at `/games/swga`. It uses the shared JSG site shell while keeping SWGA-specific styling scoped locally to the game component.

Untimed play remains the default and preserves the faithful SWGA baseline. An
optional, experimental **60 Seconds** mode can be selected before gameplay
begins. Its single deadline starts with the first letter entered, applies to the
entire run, and never pauses. Reaching the deadline immediately ends the run
with a **Time's Up** result.

The experimental mode is intentionally small and removable: its timing rules
live in `logic/timer.ts`, while the existing game core and word data remain
unchanged. Owner manual gameplay evaluation and final acceptance are still
pending.
