-- All fixtures and assertions run inside a rolled-back local test transaction.
begin;
create extension if not exists pgtap with schema extensions;
select plan(95);

select ok(to_regprocedure('public.get_swga_average_leaderboard()') is not null, 'get_swga_average_leaderboard: zero-argument signature exists');

select is((select pronargs from pg_proc where oid = 'public.get_swga_average_leaderboard()'::regprocedure), 0::smallint, 'get_swga_average_leaderboard: no browser-selected scope');

select is(pg_get_function_result('public.get_swga_average_leaderboard()'::regprocedure), 'TABLE(rank bigint, username text, average_score numeric, games_played bigint)'::text, 'get_swga_average_leaderboard: approved public columns only');

select ok((select prosecdef from pg_proc where oid = 'public.get_swga_average_leaderboard()'::regprocedure), 'get_swga_average_leaderboard: SECURITY DEFINER');

select is((select provolatile from pg_proc where oid = 'public.get_swga_average_leaderboard()'::regprocedure), 's'::"char", 'get_swga_average_leaderboard: STABLE');

select is((select proconfig from pg_proc where oid = 'public.get_swga_average_leaderboard()'::regprocedure), array['search_path=pg_catalog']::text[], 'get_swga_average_leaderboard: hardened search path');

select is((select pg_get_userbyid(proowner) from pg_proc where oid = 'public.get_swga_average_leaderboard()'::regprocedure), 'postgres'::name, 'get_swga_average_leaderboard: postgres owner');

select is((select lanname from pg_language join pg_proc on pg_proc.prolang = pg_language.oid where pg_proc.oid = 'public.get_swga_average_leaderboard()'::regprocedure), 'sql'::name, 'get_swga_average_leaderboard: SQL function');

select ok(has_function_privilege('anon', 'public.get_swga_average_leaderboard()'::regprocedure, 'EXECUTE'), 'get_swga_average_leaderboard: anonymous aggregate access');

select ok(has_function_privilege('authenticated', 'public.get_swga_average_leaderboard()'::regprocedure, 'EXECUTE'), 'get_swga_average_leaderboard: authenticated aggregate access');

select ok(not has_function_privilege('service_role', 'public.get_swga_average_leaderboard()'::regprocedure, 'EXECUTE'), 'get_swga_average_leaderboard: no service-role grant');

select ok(not exists (
  select 1 from pg_proc
  cross join lateral aclexplode(coalesce(proacl, acldefault('f', proowner))) acl
  where oid = 'public.get_swga_average_leaderboard()'::regprocedure and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
), 'get_swga_average_leaderboard: no PUBLIC grant');

select ok(to_regprocedure('public.get_character_guessing_expedition_crew_average_leaderboard()') is not null, 'get_character_guessing_expedition_crew_average_leaderboard: zero-argument signature exists');

select is((select pronargs from pg_proc where oid = 'public.get_character_guessing_expedition_crew_average_leaderboard()'::regprocedure), 0::smallint, 'get_character_guessing_expedition_crew_average_leaderboard: no browser-selected scope');

select is(pg_get_function_result('public.get_character_guessing_expedition_crew_average_leaderboard()'::regprocedure), 'TABLE(rank bigint, username text, average_score numeric, games_played bigint)'::text, 'get_character_guessing_expedition_crew_average_leaderboard: approved public columns only');

select ok((select prosecdef from pg_proc where oid = 'public.get_character_guessing_expedition_crew_average_leaderboard()'::regprocedure), 'get_character_guessing_expedition_crew_average_leaderboard: SECURITY DEFINER');

select is((select provolatile from pg_proc where oid = 'public.get_character_guessing_expedition_crew_average_leaderboard()'::regprocedure), 's'::"char", 'get_character_guessing_expedition_crew_average_leaderboard: STABLE');

select is((select proconfig from pg_proc where oid = 'public.get_character_guessing_expedition_crew_average_leaderboard()'::regprocedure), array['search_path=pg_catalog']::text[], 'get_character_guessing_expedition_crew_average_leaderboard: hardened search path');

select is((select pg_get_userbyid(proowner) from pg_proc where oid = 'public.get_character_guessing_expedition_crew_average_leaderboard()'::regprocedure), 'postgres'::name, 'get_character_guessing_expedition_crew_average_leaderboard: postgres owner');

select is((select lanname from pg_language join pg_proc on pg_proc.prolang = pg_language.oid where pg_proc.oid = 'public.get_character_guessing_expedition_crew_average_leaderboard()'::regprocedure), 'sql'::name, 'get_character_guessing_expedition_crew_average_leaderboard: SQL function');

select ok(has_function_privilege('anon', 'public.get_character_guessing_expedition_crew_average_leaderboard()'::regprocedure, 'EXECUTE'), 'get_character_guessing_expedition_crew_average_leaderboard: anonymous aggregate access');

select ok(has_function_privilege('authenticated', 'public.get_character_guessing_expedition_crew_average_leaderboard()'::regprocedure, 'EXECUTE'), 'get_character_guessing_expedition_crew_average_leaderboard: authenticated aggregate access');

select ok(not has_function_privilege('service_role', 'public.get_character_guessing_expedition_crew_average_leaderboard()'::regprocedure, 'EXECUTE'), 'get_character_guessing_expedition_crew_average_leaderboard: no service-role grant');

select ok(not exists (
  select 1 from pg_proc
  cross join lateral aclexplode(coalesce(proacl, acldefault('f', proowner))) acl
  where oid = 'public.get_character_guessing_expedition_crew_average_leaderboard()'::regprocedure and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
), 'get_character_guessing_expedition_crew_average_leaderboard: no PUBLIC grant');

select ok(to_regprocedure('public.get_character_guessing_copperlight_city_average_leaderboard()') is not null, 'get_character_guessing_copperlight_city_average_leaderboard: zero-argument signature exists');

select is((select pronargs from pg_proc where oid = 'public.get_character_guessing_copperlight_city_average_leaderboard()'::regprocedure), 0::smallint, 'get_character_guessing_copperlight_city_average_leaderboard: no browser-selected scope');

select is(pg_get_function_result('public.get_character_guessing_copperlight_city_average_leaderboard()'::regprocedure), 'TABLE(rank bigint, username text, average_score numeric, games_played bigint)'::text, 'get_character_guessing_copperlight_city_average_leaderboard: approved public columns only');

select ok((select prosecdef from pg_proc where oid = 'public.get_character_guessing_copperlight_city_average_leaderboard()'::regprocedure), 'get_character_guessing_copperlight_city_average_leaderboard: SECURITY DEFINER');

select is((select provolatile from pg_proc where oid = 'public.get_character_guessing_copperlight_city_average_leaderboard()'::regprocedure), 's'::"char", 'get_character_guessing_copperlight_city_average_leaderboard: STABLE');

select is((select proconfig from pg_proc where oid = 'public.get_character_guessing_copperlight_city_average_leaderboard()'::regprocedure), array['search_path=pg_catalog']::text[], 'get_character_guessing_copperlight_city_average_leaderboard: hardened search path');

select is((select pg_get_userbyid(proowner) from pg_proc where oid = 'public.get_character_guessing_copperlight_city_average_leaderboard()'::regprocedure), 'postgres'::name, 'get_character_guessing_copperlight_city_average_leaderboard: postgres owner');

select is((select lanname from pg_language join pg_proc on pg_proc.prolang = pg_language.oid where pg_proc.oid = 'public.get_character_guessing_copperlight_city_average_leaderboard()'::regprocedure), 'sql'::name, 'get_character_guessing_copperlight_city_average_leaderboard: SQL function');

select ok(has_function_privilege('anon', 'public.get_character_guessing_copperlight_city_average_leaderboard()'::regprocedure, 'EXECUTE'), 'get_character_guessing_copperlight_city_average_leaderboard: anonymous aggregate access');

select ok(has_function_privilege('authenticated', 'public.get_character_guessing_copperlight_city_average_leaderboard()'::regprocedure, 'EXECUTE'), 'get_character_guessing_copperlight_city_average_leaderboard: authenticated aggregate access');

select ok(not has_function_privilege('service_role', 'public.get_character_guessing_copperlight_city_average_leaderboard()'::regprocedure, 'EXECUTE'), 'get_character_guessing_copperlight_city_average_leaderboard: no service-role grant');

select ok(not exists (
  select 1 from pg_proc
  cross join lateral aclexplode(coalesce(proacl, acldefault('f', proowner))) acl
  where oid = 'public.get_character_guessing_copperlight_city_average_leaderboard()'::regprocedure and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
), 'get_character_guessing_copperlight_city_average_leaderboard: no PUBLIC grant');

create temporary table average_test_players (n integer primary key, username text);
insert into average_test_players values
  (1, 'NoRuns'), (2, 'FourRuns'), (3, 'FiveZero'), (4, 'MoreRuns'),
  (5, 'HighOnly'), (6, 'SplitRuns'), (7, 'alphaTie'), (8, 'BravoTie'),
  (9, 'ZuluPrecision'), (10, 'AlphaPrecision'), (11, 'CrewOnly');

insert into auth.users (id, email)
select ('70000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'average-test-' || n || '@example.test'
from average_test_players;
insert into public.profiles (id, username)
select ('70000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, username
from average_test_players;

-- The same independent fixtures in all three competitive games. Zero counts.
insert into public.game_runs (user_id, game_id, score, submission_id, completed_at)
select
  ('70000000-0000-4000-8000-' || lpad(player.n::text, 12, '0'))::uuid,
  game.id,
  case
    when player.n = 5 then 100000
    when player.n = 2 then 40
    when player.n = 3 and run.n = 1 then 0
    when player.n = 3 and run.n = 5 then 20
    when player.n in (9, 10) and run.n = 1 then 11
    else 10
  end,
  gen_random_uuid(), '2026-09-02T20:15:00Z'
from average_test_players player
cross join public.games game
cross join lateral generate_series(1, case player.n
  when 2 then 4 when 3 then 5 when 4 then 6 when 5 then 1
  when 7 then 5 when 8 then 5 when 9 then 25 when 10 then 50 else 0 end) run(n)
where game.slug in ('swga', 'character-guessing-expedition-crew', 'character-guessing-copperlight-city');

-- Three SWGA plus two Expedition runs must not combine into five.
insert into public.game_runs (user_id, game_id, score, submission_id)
select '70000000-0000-4000-8000-000000000006', game.id, 90, gen_random_uuid()
from public.games game
cross join lateral generate_series(1, case game.slug when 'swga' then 3 else 2 end) run(n)
where game.slug in ('swga', 'character-guessing-expedition-crew');

-- Exercise the existing unique submission identity exactly as replayed writes do.
insert into public.game_runs (user_id, game_id, score, submission_id)
select user_id, game_id, score, submission_id from public.game_runs
where user_id = '70000000-0000-4000-8000-000000000002'
on conflict (user_id, submission_id) do nothing;

select is((select count(*) from public.get_swga_average_leaderboard()), 6::bigint, 'swga: exactly the qualifying players');

select is((select count(*) from public.get_swga_average_leaderboard() where username in ('NoRuns', 'FourRuns', 'HighOnly', 'SplitRuns')), 0::bigint, 'swga: zero/four/single-high/cross-game counts excluded');

select is((select games_played from public.get_swga_average_leaderboard() where username = 'FiveZero'), 5::bigint, 'swga: exactly five saved runs qualify');

select is((select average_score from public.get_swga_average_leaderboard() where username = 'FiveZero'), 10::numeric, 'swga: all scores including zero contribute');

select is((select games_played from public.get_swga_average_leaderboard() where username = 'MoreRuns'), 6::bigint, 'swga: more than five qualifies');

select results_eq(
  $$ select username from public.get_swga_average_leaderboard() order by rank $$,
  $$ values ('ZuluPrecision'::text), ('AlphaPrecision'), ('MoreRuns'), ('alphaTie'), ('BravoTie'), ('FiveZero') $$,
  'swga: unrounded average, then count descending, then case-insensitive username'
);

select is((select average_score from public.get_swga_average_leaderboard() where username = 'ZuluPrecision'), 10.04::numeric, 'swga: full precision retained');

select is((select count(distinct username) from public.get_swga_average_leaderboard()), 6::bigint, 'swga: one row per player');

select is((select count(*) from public.game_runs join public.games on games.id = game_runs.game_id where games.slug = 'swga' and user_id = '70000000-0000-4000-8000-000000000002'), 4::bigint, 'swga: replay did not inflate count');

select is((select username from public.get_swga_leaderboard() where rank = 1), 'HighOnly'::text, 'swga: best-score single-run eligibility unchanged');

select is((select count(*) from public.get_character_guessing_expedition_crew_average_leaderboard()), 6::bigint, 'character-guessing-expedition-crew: exactly the qualifying players');

select is((select count(*) from public.get_character_guessing_expedition_crew_average_leaderboard() where username in ('NoRuns', 'FourRuns', 'HighOnly', 'SplitRuns')), 0::bigint, 'character-guessing-expedition-crew: zero/four/single-high/cross-game counts excluded');

select is((select games_played from public.get_character_guessing_expedition_crew_average_leaderboard() where username = 'FiveZero'), 5::bigint, 'character-guessing-expedition-crew: exactly five saved runs qualify');

select is((select average_score from public.get_character_guessing_expedition_crew_average_leaderboard() where username = 'FiveZero'), 10::numeric, 'character-guessing-expedition-crew: all scores including zero contribute');

select is((select games_played from public.get_character_guessing_expedition_crew_average_leaderboard() where username = 'MoreRuns'), 6::bigint, 'character-guessing-expedition-crew: more than five qualifies');

select results_eq(
  $$ select username from public.get_character_guessing_expedition_crew_average_leaderboard() order by rank $$,
  $$ values ('ZuluPrecision'::text), ('AlphaPrecision'), ('MoreRuns'), ('alphaTie'), ('BravoTie'), ('FiveZero') $$,
  'character-guessing-expedition-crew: unrounded average, then count descending, then case-insensitive username'
);

select is((select average_score from public.get_character_guessing_expedition_crew_average_leaderboard() where username = 'ZuluPrecision'), 10.04::numeric, 'character-guessing-expedition-crew: full precision retained');

select is((select count(distinct username) from public.get_character_guessing_expedition_crew_average_leaderboard()), 6::bigint, 'character-guessing-expedition-crew: one row per player');

select is((select count(*) from public.game_runs join public.games on games.id = game_runs.game_id where games.slug = 'character-guessing-expedition-crew' and user_id = '70000000-0000-4000-8000-000000000002'), 4::bigint, 'character-guessing-expedition-crew: replay did not inflate count');

select is((select username from public.get_character_guessing_expedition_crew_leaderboard() where rank = 1), 'HighOnly'::text, 'character-guessing-expedition-crew: best-score single-run eligibility unchanged');

select is((select count(*) from public.get_character_guessing_copperlight_city_average_leaderboard()), 6::bigint, 'character-guessing-copperlight-city: exactly the qualifying players');

select is((select count(*) from public.get_character_guessing_copperlight_city_average_leaderboard() where username in ('NoRuns', 'FourRuns', 'HighOnly', 'SplitRuns')), 0::bigint, 'character-guessing-copperlight-city: zero/four/single-high/cross-game counts excluded');

select is((select games_played from public.get_character_guessing_copperlight_city_average_leaderboard() where username = 'FiveZero'), 5::bigint, 'character-guessing-copperlight-city: exactly five saved runs qualify');

select is((select average_score from public.get_character_guessing_copperlight_city_average_leaderboard() where username = 'FiveZero'), 10::numeric, 'character-guessing-copperlight-city: all scores including zero contribute');

select is((select games_played from public.get_character_guessing_copperlight_city_average_leaderboard() where username = 'MoreRuns'), 6::bigint, 'character-guessing-copperlight-city: more than five qualifies');

select results_eq(
  $$ select username from public.get_character_guessing_copperlight_city_average_leaderboard() order by rank $$,
  $$ values ('ZuluPrecision'::text), ('AlphaPrecision'), ('MoreRuns'), ('alphaTie'), ('BravoTie'), ('FiveZero') $$,
  'character-guessing-copperlight-city: unrounded average, then count descending, then case-insensitive username'
);

select is((select average_score from public.get_character_guessing_copperlight_city_average_leaderboard() where username = 'ZuluPrecision'), 10.04::numeric, 'character-guessing-copperlight-city: full precision retained');

select is((select count(distinct username) from public.get_character_guessing_copperlight_city_average_leaderboard()), 6::bigint, 'character-guessing-copperlight-city: one row per player');

select is((select count(*) from public.game_runs join public.games on games.id = game_runs.game_id where games.slug = 'character-guessing-copperlight-city' and user_id = '70000000-0000-4000-8000-000000000002'), 4::bigint, 'character-guessing-copperlight-city: replay did not inflate count');

select is((select username from public.get_character_guessing_copperlight_city_leaderboard() where rank = 1), 'HighOnly'::text, 'character-guessing-copperlight-city: best-score single-run eligibility unchanged');

insert into public.game_runs (user_id, game_id, score, submission_id)
select '70000000-0000-4000-8000-000000000011', games.id, 99, gen_random_uuid()
from public.games cross join generate_series(1, 5)
where slug = 'character-guessing-expedition-crew';

select is((select count(*) from public.get_character_guessing_expedition_crew_average_leaderboard() where username = 'CrewOnly'), 1::bigint, 'crew history qualifies only for crew');

select is((select count(*) from public.get_swga_average_leaderboard() where username = 'CrewOnly'), 0::bigint, 'crew history does not qualify SWGA');

select is((select count(*) from public.get_character_guessing_copperlight_city_average_leaderboard() where username = 'CrewOnly'), 0::bigint, 'crew history does not qualify city');

update public.profiles set username = 'ZuluRenamed'
where id = '70000000-0000-4000-8000-000000000009';

select is((select count(*) from public.get_swga_average_leaderboard() where username = 'ZuluRenamed'), 1::bigint, 'swga: current username reflected');

select is((select count(*) from public.get_character_guessing_expedition_crew_average_leaderboard() where username = 'ZuluRenamed'), 1::bigint, 'character-guessing-expedition-crew: current username reflected');

select is((select count(*) from public.get_character_guessing_copperlight_city_average_leaderboard() where username = 'ZuluRenamed'), 1::bigint, 'character-guessing-copperlight-city: current username reflected');

-- More than ten eligible players: public output remains capped and ordered.
insert into auth.users (id, email)
select ('71000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'average-extra-' || n || '@example.test'
from generate_series(1, 12) n;
insert into public.profiles (id, username)
select ('71000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'Extra' || lpad(n::text, 2, '0')
from generate_series(1, 12) n;
insert into public.game_runs (user_id, game_id, score, submission_id)
select ('71000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, games.id, 1, gen_random_uuid()
from generate_series(1, 12) n cross join public.games cross join generate_series(1, 5) attempt
where games.slug in ('swga', 'character-guessing-expedition-crew', 'character-guessing-copperlight-city');

set local role anon;

select is((select count(*) from public.get_swga_average_leaderboard()), 10::bigint, 'anon swga: ten public aggregate rows maximum');

select results_eq(
  $$ select rank from public.get_swga_average_leaderboard() $$,
  $$ select generate_series(1, 10)::bigint $$,
  'anon swga: stable sequential ranking order'
);

select results_eq(
  $$ select jsonb_object_keys(to_jsonb(row)) from (select * from public.get_swga_average_leaderboard() limit 1) row order by 1 $$,
  $$ values ('average_score'::text), ('games_played'), ('rank'), ('username') $$,
  'anon swga: no private fields in public payload'
);

select is((select count(*) from public.get_character_guessing_expedition_crew_average_leaderboard()), 10::bigint, 'anon character-guessing-expedition-crew: ten public aggregate rows maximum');

select results_eq(
  $$ select rank from public.get_character_guessing_expedition_crew_average_leaderboard() $$,
  $$ select generate_series(1, 10)::bigint $$,
  'anon character-guessing-expedition-crew: stable sequential ranking order'
);

select results_eq(
  $$ select jsonb_object_keys(to_jsonb(row)) from (select * from public.get_character_guessing_expedition_crew_average_leaderboard() limit 1) row order by 1 $$,
  $$ values ('average_score'::text), ('games_played'), ('rank'), ('username') $$,
  'anon character-guessing-expedition-crew: no private fields in public payload'
);

select is((select count(*) from public.get_character_guessing_copperlight_city_average_leaderboard()), 10::bigint, 'anon character-guessing-copperlight-city: ten public aggregate rows maximum');

select results_eq(
  $$ select rank from public.get_character_guessing_copperlight_city_average_leaderboard() $$,
  $$ select generate_series(1, 10)::bigint $$,
  'anon character-guessing-copperlight-city: stable sequential ranking order'
);

select results_eq(
  $$ select jsonb_object_keys(to_jsonb(row)) from (select * from public.get_character_guessing_copperlight_city_average_leaderboard() limit 1) row order by 1 $$,
  $$ values ('average_score'::text), ('games_played'), ('rank'), ('username') $$,
  'anon character-guessing-copperlight-city: no private fields in public payload'
);

select throws_ok('select * from public.game_runs', '42501', 'permission denied for table game_runs', 'anonymous cannot read private run history');

select throws_ok('select * from public.player_game_stats', '42501', null, 'anonymous cannot read private stats view');

reset role;

set local role authenticated;

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000001', true);

select is((select count(*) from public.get_swga_average_leaderboard()), 10::bigint, 'authenticated swga: ten public aggregate rows maximum');

select results_eq(
  $$ select rank from public.get_swga_average_leaderboard() $$,
  $$ select generate_series(1, 10)::bigint $$,
  'authenticated swga: stable sequential ranking order'
);

select results_eq(
  $$ select jsonb_object_keys(to_jsonb(row)) from (select * from public.get_swga_average_leaderboard() limit 1) row order by 1 $$,
  $$ values ('average_score'::text), ('games_played'), ('rank'), ('username') $$,
  'authenticated swga: no private fields in public payload'
);

select is((select count(*) from public.get_character_guessing_expedition_crew_average_leaderboard()), 10::bigint, 'authenticated character-guessing-expedition-crew: ten public aggregate rows maximum');

select results_eq(
  $$ select rank from public.get_character_guessing_expedition_crew_average_leaderboard() $$,
  $$ select generate_series(1, 10)::bigint $$,
  'authenticated character-guessing-expedition-crew: stable sequential ranking order'
);

select results_eq(
  $$ select jsonb_object_keys(to_jsonb(row)) from (select * from public.get_character_guessing_expedition_crew_average_leaderboard() limit 1) row order by 1 $$,
  $$ values ('average_score'::text), ('games_played'), ('rank'), ('username') $$,
  'authenticated character-guessing-expedition-crew: no private fields in public payload'
);

select is((select count(*) from public.get_character_guessing_copperlight_city_average_leaderboard()), 10::bigint, 'authenticated character-guessing-copperlight-city: ten public aggregate rows maximum');

select results_eq(
  $$ select rank from public.get_character_guessing_copperlight_city_average_leaderboard() $$,
  $$ select generate_series(1, 10)::bigint $$,
  'authenticated character-guessing-copperlight-city: stable sequential ranking order'
);

select results_eq(
  $$ select jsonb_object_keys(to_jsonb(row)) from (select * from public.get_character_guessing_copperlight_city_average_leaderboard() limit 1) row order by 1 $$,
  $$ values ('average_score'::text), ('games_played'), ('rank'), ('username') $$,
  'authenticated character-guessing-copperlight-city: no private fields in public payload'
);

select is((select count(*) from public.game_runs), 0::bigint, 'authenticated user with no runs cannot see other histories');

select is((select count(*) from public.player_game_stats), 0::bigint, 'authenticated user cannot see other private stats');

select is((select count(*) from public.profiles), 1::bigint, 'authenticated profile reads remain user-scoped');

reset role;

select * from finish();
rollback;
