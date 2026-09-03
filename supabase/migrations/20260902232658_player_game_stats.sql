create view public.player_game_stats
with (security_invoker = true)
as
select
  user_id,
  game_id,
  count(*)::bigint as games_played,
  max(score)::integer as personal_best,
  avg(score)::numeric as average_score
from public.game_runs
group by user_id, game_id;

revoke all privileges on table public.player_game_stats
from public, anon, authenticated, service_role;

grant select on table public.player_game_stats
to authenticated;
