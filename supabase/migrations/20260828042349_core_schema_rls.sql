-- Prevent future objects created by postgres in public from receiving broad
-- Data API privileges. Per-object grants below remain authoritative.
alter default privileges for role postgres in schema public
  revoke all privileges on tables
  from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all privileges on sequences
  from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all privileges on functions
  from public, anon, authenticated, service_role;

create table public.games (
  id bigint generated always as identity,
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint games_pkey primary key (id),
  constraint games_slug_unique unique (slug),
  constraint games_slug_valid check (
    slug = btrim(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint games_name_not_blank check (length(btrim(name)) > 0)
);

create table public.profiles (
  id uuid not null,
  created_at timestamptz not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_auth_user_fk
    foreign key (id)
    references auth.users (id)
    on delete cascade
);

create table public.game_runs (
  id bigint generated always as identity,
  user_id uuid not null,
  game_id bigint not null,
  score integer not null,
  completed_at timestamptz not null default now(),
  constraint game_runs_pkey primary key (id),
  constraint game_runs_profile_fk
    foreign key (user_id)
    references public.profiles (id)
    on delete cascade,
  constraint game_runs_game_fk
    foreign key (game_id)
    references public.games (id)
    on delete restrict,
  constraint game_runs_score_nonnegative check (score >= 0)
);

create index game_runs_user_game_completed_at_idx
  on public.game_runs (user_id, game_id, completed_at desc);

create index game_runs_game_score_idx
  on public.game_runs (game_id, score desc);

insert into public.games (slug, name)
values ('swga', 'SWGA');

alter table public.games enable row level security;
alter table public.profiles enable row level security;
alter table public.game_runs enable row level security;

revoke all privileges on table
  public.games,
  public.profiles,
  public.game_runs
from anon, authenticated, service_role;

revoke all privileges on sequence
  public.games_id_seq,
  public.game_runs_id_seq
from anon, authenticated, service_role;

grant select on table public.games
  to anon, authenticated, service_role;

grant select on table public.profiles
  to authenticated, service_role;

grant select on table public.game_runs
  to authenticated, service_role;

grant insert (user_id, game_id, score) on table public.game_runs
  to service_role;

grant usage on sequence public.game_runs_id_seq
  to service_role;

create policy games_select_api_roles
  on public.games
  for select
  to anon, authenticated
  using (true);

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy game_runs_select_own
  on public.game_runs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
