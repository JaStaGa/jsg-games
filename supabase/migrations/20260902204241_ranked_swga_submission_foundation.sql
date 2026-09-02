alter table public.game_runs
  add column submission_id uuid not null;

create unique index game_runs_user_submission_id_unique
  on public.game_runs (user_id, submission_id);

grant insert (submission_id) on table public.game_runs
  to service_role;
