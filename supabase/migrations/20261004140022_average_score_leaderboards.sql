-- Public aggregate only; saved ranked rows are the sole qualification source.
create function public.get_swga_average_leaderboard()
returns table (
  rank bigint,
  username text,
  average_score numeric,
  games_played bigint
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  with qualified as (
    select
      runs.user_id,
      avg(runs.score) as average_score,
      count(*) as games_played
    from public.game_runs as runs
    inner join public.games as game on game.id = runs.game_id
    where game.slug = 'swga'
    group by runs.game_id, runs.user_id
    having count(*) >= 5
  ),
  ranked as (
    select
      row_number() over (
        order by qualified.average_score desc,
          qualified.games_played desc, lower(profile.username) asc
      ) as rank,
      profile.username,
      qualified.average_score,
      qualified.games_played
    from qualified
    inner join public.profiles as profile on profile.id = qualified.user_id
  )
  select ranked.rank, ranked.username, ranked.average_score, ranked.games_played
  from ranked
  where ranked.rank <= 10
  order by ranked.rank;
$$;

alter function public.get_swga_average_leaderboard() owner to postgres;
revoke execute on function public.get_swga_average_leaderboard()
from public, anon, authenticated, service_role;
grant execute on function public.get_swga_average_leaderboard()
to anon, authenticated;

-- Public aggregate only; saved ranked rows are the sole qualification source.
create function public.get_character_guessing_expedition_crew_average_leaderboard()
returns table (
  rank bigint,
  username text,
  average_score numeric,
  games_played bigint
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  with qualified as (
    select
      runs.user_id,
      avg(runs.score) as average_score,
      count(*) as games_played
    from public.game_runs as runs
    inner join public.games as game on game.id = runs.game_id
    where game.slug = 'character-guessing-expedition-crew'
    group by runs.game_id, runs.user_id
    having count(*) >= 5
  ),
  ranked as (
    select
      row_number() over (
        order by qualified.average_score desc,
          qualified.games_played desc, lower(profile.username) asc
      ) as rank,
      profile.username,
      qualified.average_score,
      qualified.games_played
    from qualified
    inner join public.profiles as profile on profile.id = qualified.user_id
  )
  select ranked.rank, ranked.username, ranked.average_score, ranked.games_played
  from ranked
  where ranked.rank <= 10
  order by ranked.rank;
$$;

alter function public.get_character_guessing_expedition_crew_average_leaderboard() owner to postgres;
revoke execute on function public.get_character_guessing_expedition_crew_average_leaderboard()
from public, anon, authenticated, service_role;
grant execute on function public.get_character_guessing_expedition_crew_average_leaderboard()
to anon, authenticated;

-- Public aggregate only; saved ranked rows are the sole qualification source.
create function public.get_character_guessing_copperlight_city_average_leaderboard()
returns table (
  rank bigint,
  username text,
  average_score numeric,
  games_played bigint
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  with qualified as (
    select
      runs.user_id,
      avg(runs.score) as average_score,
      count(*) as games_played
    from public.game_runs as runs
    inner join public.games as game on game.id = runs.game_id
    where game.slug = 'character-guessing-copperlight-city'
    group by runs.game_id, runs.user_id
    having count(*) >= 5
  ),
  ranked as (
    select
      row_number() over (
        order by qualified.average_score desc,
          qualified.games_played desc, lower(profile.username) asc
      ) as rank,
      profile.username,
      qualified.average_score,
      qualified.games_played
    from qualified
    inner join public.profiles as profile on profile.id = qualified.user_id
  )
  select ranked.rank, ranked.username, ranked.average_score, ranked.games_played
  from ranked
  where ranked.rank <= 10
  order by ranked.rank;
$$;

alter function public.get_character_guessing_copperlight_city_average_leaderboard() owner to postgres;
revoke execute on function public.get_character_guessing_copperlight_city_average_leaderboard()
from public, anon, authenticated, service_role;
grant execute on function public.get_character_guessing_copperlight_city_average_leaderboard()
to anon, authenticated;
