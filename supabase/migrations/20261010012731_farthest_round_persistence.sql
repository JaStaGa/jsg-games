-- Historical progress is unknown: keep this nullable, without a default or backfill.
alter table public.game_runs
  add column round_reached integer,
  add constraint game_runs_round_reached_positive
    check (round_reached is null or round_reached >= 1);

-- Extend only the trusted append-only insert surface.
grant insert (round_reached) on table public.game_runs
  to service_role;
