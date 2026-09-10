create function public.get_character_guessing_expedition_crew_leaderboard()
returns table (
  rank bigint,
  username text,
  score integer,
  achieved_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  with theme as (
    select public.games.id
    from public.games
    where public.games.slug = 'character-guessing-expedition-crew'
  ),
  personal_bests as (
    select distinct on (public.game_runs.user_id)
      public.game_runs.user_id,
      public.game_runs.score,
      public.game_runs.completed_at,
      public.game_runs.id
    from public.game_runs
    inner join theme
      on theme.id = public.game_runs.game_id
    order by
      public.game_runs.user_id,
      public.game_runs.score desc,
      public.game_runs.completed_at asc,
      public.game_runs.id asc
  ),
  ranked_bests as (
    select
      row_number() over (
        order by
          personal_bests.score desc,
          personal_bests.completed_at asc,
          personal_bests.id asc
      )::bigint as rank,
      public.profiles.username,
      personal_bests.score,
      personal_bests.completed_at as achieved_at
    from personal_bests
    inner join public.profiles
      on public.profiles.id = personal_bests.user_id
  )
  select
    ranked_bests.rank,
    ranked_bests.username,
    ranked_bests.score,
    ranked_bests.achieved_at
  from ranked_bests
  where ranked_bests.rank <= 10
  order by ranked_bests.rank;
$$;

alter function public.get_character_guessing_expedition_crew_leaderboard() owner to postgres;

revoke execute on function public.get_character_guessing_expedition_crew_leaderboard()
from public, anon, authenticated, service_role;

grant execute on function public.get_character_guessing_expedition_crew_leaderboard()
to anon, authenticated;

create function public.get_character_guessing_copperlight_city_leaderboard()
returns table (
  rank bigint,
  username text,
  score integer,
  achieved_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  with theme as (
    select public.games.id
    from public.games
    where public.games.slug = 'character-guessing-copperlight-city'
  ),
  personal_bests as (
    select distinct on (public.game_runs.user_id)
      public.game_runs.user_id,
      public.game_runs.score,
      public.game_runs.completed_at,
      public.game_runs.id
    from public.game_runs
    inner join theme
      on theme.id = public.game_runs.game_id
    order by
      public.game_runs.user_id,
      public.game_runs.score desc,
      public.game_runs.completed_at asc,
      public.game_runs.id asc
  ),
  ranked_bests as (
    select
      row_number() over (
        order by
          personal_bests.score desc,
          personal_bests.completed_at asc,
          personal_bests.id asc
      )::bigint as rank,
      public.profiles.username,
      personal_bests.score,
      personal_bests.completed_at as achieved_at
    from personal_bests
    inner join public.profiles
      on public.profiles.id = personal_bests.user_id
  )
  select
    ranked_bests.rank,
    ranked_bests.username,
    ranked_bests.score,
    ranked_bests.achieved_at
  from ranked_bests
  where ranked_bests.rank <= 10
  order by ranked_bests.rank;
$$;

alter function public.get_character_guessing_copperlight_city_leaderboard() owner to postgres;

revoke execute on function public.get_character_guessing_copperlight_city_leaderboard()
from public, anon, authenticated, service_role;

grant execute on function public.get_character_guessing_copperlight_city_leaderboard()
to anon, authenticated;
