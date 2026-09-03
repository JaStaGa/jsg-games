begin;

create extension if not exists pgtap with schema extensions;

select plan(89);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'user-a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'user-b@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'user-c@example.com'),
  ('44444444-4444-4444-4444-444444444444', 'user-d@example.com');

insert into public.profiles (id, username)
values
  ('11111111-1111-1111-1111-111111111111', 'UserA'),
  ('22222222-2222-2222-2222-222222222222', 'UserB');

insert into public.game_runs (user_id, game_id, score, submission_id)
values
  ('11111111-1111-1111-1111-111111111111', (select id from public.games where slug = 'swga'), 10, '00000000-0000-4000-8000-000000000001'),
  ('11111111-1111-1111-1111-111111111111', (select id from public.games where slug = 'swga'), 20, '00000000-0000-4000-8000-000000000011'),
  ('11111111-1111-1111-1111-111111111111', (select id from public.games where slug = 'swga'), 30, '00000000-0000-4000-8000-000000000012'),
  ('22222222-2222-2222-2222-222222222222', (select id from public.games where slug = 'swga'), 40, '00000000-0000-4000-8000-000000000002');

select ok(
  not exists (
    select 1
    from pg_default_acl default_acl
    cross join lateral aclexplode(default_acl.defaclacl) privilege
    where default_acl.defaclrole = 'postgres'::regrole
      and default_acl.defaclnamespace = 'public'::regnamespace
      and default_acl.defaclobjtype = 'r'
      and privilege.grantee = any (array['anon'::regrole::oid, 'authenticated'::regrole::oid, 'service_role'::regrole::oid])
  ),
  'future postgres-owned public tables have no default API-role grants'
);
select ok(
  not exists (
    select 1
    from pg_default_acl default_acl
    cross join lateral aclexplode(default_acl.defaclacl) privilege
    where default_acl.defaclrole = 'postgres'::regrole
      and default_acl.defaclnamespace = 'public'::regnamespace
      and default_acl.defaclobjtype = 'S'
      and privilege.grantee = any (array['anon'::regrole::oid, 'authenticated'::regrole::oid, 'service_role'::regrole::oid])
  ),
  'future postgres-owned public sequences have no default API-role grants'
);
select ok(
  not exists (
    select 1
    from pg_default_acl default_acl
    cross join lateral aclexplode(default_acl.defaclacl) privilege
    where default_acl.defaclrole = 'postgres'::regrole
      and default_acl.defaclnamespace = 'public'::regnamespace
      and default_acl.defaclobjtype = 'f'
      and privilege.grantee = any (array[0::oid, 'anon'::regrole::oid, 'authenticated'::regrole::oid, 'service_role'::regrole::oid])
      and privilege.privilege_type = 'EXECUTE'
  ),
  'future postgres-owned public functions have no default public/API-role EXECUTE grant'
);

select ok(
  not exists (
    select 1
    from pg_proc
    cross join lateral aclexplode(coalesce(pg_proc.proacl, acldefault('f', pg_proc.proowner))) privilege
    where pg_proc.oid = 'public.get_swga_leaderboard()'::regprocedure
      and privilege.grantee = 0::oid
      and privilege.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute get_swga_leaderboard'
);
select ok(
  has_function_privilege('anon', 'public.get_swga_leaderboard()', 'EXECUTE'),
  'anon can execute get_swga_leaderboard'
);
select ok(
  has_function_privilege('authenticated', 'public.get_swga_leaderboard()', 'EXECUTE'),
  'authenticated can execute get_swga_leaderboard'
);
select ok(
  not has_function_privilege('service_role', 'public.get_swga_leaderboard()', 'EXECUTE'),
  'service_role cannot execute get_swga_leaderboard'
);

select ok(has_table_privilege('anon', 'public.games', 'SELECT'), 'anon can SELECT games');
select ok(
  not has_table_privilege('anon', 'public.profiles', 'SELECT')
  and not has_table_privilege('anon', 'public.profiles', 'INSERT')
  and not has_table_privilege('anon', 'public.profiles', 'UPDATE')
  and not has_table_privilege('anon', 'public.profiles', 'DELETE'),
  'anon has no profiles access'
);
select ok(
  not has_table_privilege('anon', 'public.game_runs', 'SELECT')
  and not has_table_privilege('anon', 'public.game_runs', 'INSERT')
  and not has_table_privilege('anon', 'public.game_runs', 'UPDATE')
  and not has_table_privilege('anon', 'public.game_runs', 'DELETE'),
  'anon has no game_runs access'
);
select ok(
  not has_table_privilege('anon', 'public.player_game_stats', 'SELECT')
  and not has_table_privilege('anon', 'public.player_game_stats', 'INSERT')
  and not has_table_privilege('anon', 'public.player_game_stats', 'UPDATE')
  and not has_table_privilege('anon', 'public.player_game_stats', 'DELETE'),
  'anon has no player_game_stats access'
);

select ok(has_table_privilege('authenticated', 'public.games', 'SELECT'), 'authenticated can SELECT games');
select ok(has_table_privilege('authenticated', 'public.profiles', 'SELECT'), 'authenticated can SELECT profiles through RLS');
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'INSERT')
  and has_column_privilege('authenticated', 'public.profiles', 'id', 'INSERT')
  and has_column_privilege('authenticated', 'public.profiles', 'username', 'INSERT')
  and not has_column_privilege('authenticated', 'public.profiles', 'created_at', 'INSERT'),
  'authenticated can INSERT only the profile identity and username columns'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE')
  and has_column_privilege('authenticated', 'public.profiles', 'username', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.profiles', 'created_at', 'UPDATE'),
  'authenticated can UPDATE only profiles.username'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'DELETE'),
  'authenticated cannot DELETE profiles'
);
select ok(has_table_privilege('authenticated', 'public.game_runs', 'SELECT'), 'authenticated can SELECT game_runs through RLS');
select ok(not has_table_privilege('authenticated', 'public.game_runs', 'INSERT'), 'authenticated cannot INSERT game_runs');
select ok(not has_table_privilege('authenticated', 'public.game_runs', 'UPDATE'), 'authenticated cannot UPDATE game_runs');
select ok(not has_table_privilege('authenticated', 'public.game_runs', 'DELETE'), 'authenticated cannot DELETE game_runs');
select ok(
  has_table_privilege('authenticated', 'public.player_game_stats', 'SELECT'),
  'authenticated can SELECT player_game_stats through underlying RLS'
);
select ok(
  not has_table_privilege('authenticated', 'public.player_game_stats', 'INSERT')
  and not has_table_privilege('authenticated', 'public.player_game_stats', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.player_game_stats', 'DELETE'),
  'authenticated cannot write player_game_stats'
);

select ok(has_table_privilege('service_role', 'public.games', 'SELECT'), 'service_role can SELECT games');
select ok(
  not has_table_privilege('service_role', 'public.games', 'INSERT')
  and not has_table_privilege('service_role', 'public.games', 'UPDATE')
  and not has_table_privilege('service_role', 'public.games', 'DELETE'),
  'service_role cannot write games'
);
select ok(has_table_privilege('service_role', 'public.profiles', 'SELECT'), 'service_role can SELECT profiles');
select ok(
  not has_table_privilege('service_role', 'public.profiles', 'INSERT')
  and not has_table_privilege('service_role', 'public.profiles', 'UPDATE')
  and not has_table_privilege('service_role', 'public.profiles', 'DELETE'),
  'service_role cannot write profiles'
);
select ok(has_table_privilege('service_role', 'public.game_runs', 'SELECT'), 'service_role can SELECT game_runs');
select ok(has_column_privilege('service_role', 'public.game_runs', 'user_id', 'INSERT'), 'service_role can INSERT game_runs.user_id');
select ok(has_column_privilege('service_role', 'public.game_runs', 'game_id', 'INSERT'), 'service_role can INSERT game_runs.game_id');
select ok(has_column_privilege('service_role', 'public.game_runs', 'score', 'INSERT'), 'service_role can INSERT game_runs.score');
select ok(has_column_privilege('service_role', 'public.game_runs', 'submission_id', 'INSERT'), 'service_role can INSERT game_runs.submission_id');
select ok(not has_column_privilege('service_role', 'public.game_runs', 'id', 'INSERT'), 'service_role cannot INSERT game_runs.id');
select ok(not has_column_privilege('service_role', 'public.game_runs', 'completed_at', 'INSERT'), 'service_role cannot INSERT game_runs.completed_at');
select ok(not has_table_privilege('service_role', 'public.game_runs', 'UPDATE'), 'service_role cannot UPDATE game_runs');
select ok(not has_table_privilege('service_role', 'public.game_runs', 'DELETE'), 'service_role cannot DELETE game_runs');
select ok(
  not has_table_privilege('service_role', 'public.player_game_stats', 'SELECT')
  and not has_table_privilege('service_role', 'public.player_game_stats', 'INSERT')
  and not has_table_privilege('service_role', 'public.player_game_stats', 'UPDATE')
  and not has_table_privilege('service_role', 'public.player_game_stats', 'DELETE'),
  'service_role has no player_game_stats access'
);

select ok(has_sequence_privilege('service_role', 'public.game_runs_id_seq', 'USAGE'), 'service_role has required game_runs identity-sequence USAGE');
select ok(
  not has_sequence_privilege('service_role', 'public.game_runs_id_seq', 'SELECT')
  and not has_sequence_privilege('service_role', 'public.game_runs_id_seq', 'UPDATE'),
  'service_role has no broader game_runs sequence privileges'
);
select ok(
  not has_sequence_privilege('anon', 'public.game_runs_id_seq', 'USAGE')
  and not has_sequence_privilege('authenticated', 'public.game_runs_id_seq', 'USAGE'),
  'user-scoped roles have no game_runs sequence access'
);
select ok(
  not has_sequence_privilege('anon', 'public.games_id_seq', 'USAGE')
  and not has_sequence_privilege('authenticated', 'public.games_id_seq', 'USAGE')
  and not has_sequence_privilege('service_role', 'public.games_id_seq', 'USAGE'),
  'API roles have no games identity-sequence access'
);

set local role anon;

select results_eq(
  $$select slug from public.games order by slug$$,
  array['swga']::text[],
  'anon can read the predefined game registry'
);
select throws_ok($$select * from public.profiles$$, '42501', null, 'anon cannot read profiles');
select throws_ok($$select * from public.game_runs$$, '42501', null, 'anon cannot read game_runs');
select throws_ok($$select * from public.player_game_stats$$, '42501', null, 'anon cannot read player_game_stats');
select throws_ok(
  $$insert into public.game_runs (user_id, game_id, score, submission_id)
    values ('11111111-1111-1111-1111-111111111111', (select id from public.games where slug = 'swga'), 30, '00000000-0000-4000-8000-000000000009')$$,
  '42501',
  null,
  'anon cannot directly insert a competitive run'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$select slug from public.games order by slug$$,
  array['swga']::text[],
  'authenticated can read the predefined game registry'
);
select results_eq(
  $$select id from public.profiles order by id$$,
  array['11111111-1111-1111-1111-111111111111'::uuid],
  'user A reads only their own profile'
);
select results_eq(
  $$update public.profiles
    set username = 'RenamedA'
    where id = '11111111-1111-1111-1111-111111111111'
    returning username$$,
  array['RenamedA']::text[],
  'user A can update their own username'
);
select results_eq(
  $$update public.profiles
    set username = 'StolenB'
    where id = '22222222-2222-2222-2222-222222222222'
    returning id$$,
  '{}'::uuid[],
  'user A cannot update user B profile'
);
select throws_ok(
  $$update public.profiles
    set id = '22222222-2222-2222-2222-222222222222'
    where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'profile ownership cannot be reassigned'
);
select throws_ok(
  $$delete from public.profiles where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'authenticated profile deletion remains unavailable'
);
select results_eq(
  $$select user_id from public.game_runs order by id$$,
  array[
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid
  ],
  'user A reads only their own runs'
);
select results_eq(
  $$select user_id, games_played, personal_best, average_score
    from public.player_game_stats
    order by user_id, game_id$$,
  $$values (
    '11111111-1111-1111-1111-111111111111'::uuid,
    3::bigint,
    30::integer,
    20::numeric
  )$$,
  'user A sees only their correctly derived aggregate'
);
select throws_ok(
  $$insert into public.game_runs (user_id, game_id, score, submission_id) values ('11111111-1111-1111-1111-111111111111', (select id from public.games where slug = 'swga'), 30, '00000000-0000-4000-8000-000000000010')$$,
  '42501',
  null,
  'authenticated cannot directly insert a competitive run'
);
select throws_ok(
  $$update public.game_runs set score = 999 where user_id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'authenticated cannot update a competitive run'
);
select throws_ok(
  $$delete from public.game_runs where user_id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'authenticated cannot delete a competitive run'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select results_eq(
  $$select id from public.profiles order by id$$,
  array['22222222-2222-2222-2222-222222222222'::uuid],
  'user B reads only their own profile'
);
select results_eq(
  $$select user_id, games_played, personal_best, average_score
    from public.player_game_stats
    order by user_id, game_id$$,
  $$values (
    '22222222-2222-2222-2222-222222222222'::uuid,
    1::bigint,
    40::integer,
    40::numeric
  )$$,
  'user B sees only their aggregate and cannot see user A stats'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select lives_ok(
  $$insert into public.profiles (id, username)
    values ('33333333-3333-3333-3333-333333333333', 'UserC')$$,
  'user C can create their own profile'
);
select throws_ok(
  $$insert into public.profiles (id, username)
    values ('44444444-4444-4444-4444-444444444444', 'TakenD')$$,
  '42501',
  null,
  'user C cannot create user D profile'
);
select results_eq(
  $$select id from public.profiles order by id$$,
  array['33333333-3333-3333-3333-333333333333'::uuid],
  'user C reads only their newly created profile'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select lives_ok(
  $$insert into public.profiles (id, username)
    values ('44444444-4444-4444-4444-444444444444', 'UserD')$$,
  'user D can create their own profile'
);
select results_eq(
  $$select id from public.profiles order by id$$,
  array['44444444-4444-4444-4444-444444444444'::uuid],
  'user D reads only their own profile'
);

reset role;
set local role service_role;

select results_eq(
  $$insert into public.game_runs (user_id, game_id, score, submission_id)
    values ('11111111-1111-1111-1111-111111111111', (select id from public.games where slug = 'swga'), 30, '00000000-0000-4000-8000-000000000003')
    returning id > 0 and completed_at is not null$$,
  array[true],
  'service_role can insert allowed columns while generated fields are populated'
);
select results_eq(
  $$select count(*) from public.game_runs$$,
  array[5::bigint],
  'service_role can read all runs while bypassing RLS'
);
select throws_ok(
  $$insert into public.game_runs (id, user_id, game_id, score, submission_id)
    values (default, '11111111-1111-1111-1111-111111111111', (select id from public.games where slug = 'swga'), 40, '00000000-0000-4000-8000-000000000004')$$,
  '42501',
  null,
  'service_role cannot supply game_runs.id'
);
select throws_ok(
  $$insert into public.game_runs (user_id, game_id, score, submission_id, completed_at)
    values ('11111111-1111-1111-1111-111111111111', (select id from public.games where slug = 'swga'), 40, '00000000-0000-4000-8000-000000000005', default)$$,
  '42501',
  null,
  'service_role cannot supply game_runs.completed_at'
);
select throws_ok(
  $$update public.game_runs set score = 999$$,
  '42501',
  null,
  'service_role cannot update competitive runs'
);
select throws_ok(
  $$delete from public.game_runs$$,
  '42501',
  null,
  'service_role cannot delete competitive runs'
);
select throws_ok(
  $$insert into public.game_runs (user_id, game_id, score, submission_id)
    values ('11111111-1111-1111-1111-111111111111', (select id from public.games where slug = 'swga'), -1, '00000000-0000-4000-8000-000000000006')$$,
  '23514',
  null,
  'negative scores are rejected'
);
select throws_ok(
  $$insert into public.game_runs (user_id, game_id, score, submission_id)
    values ('99999999-9999-4999-8999-999999999999', (select id from public.games where slug = 'swga'), 10, '00000000-0000-4000-8000-000000000007')$$,
  '23503',
  null,
  'a run must reference an existing profile'
);
select throws_ok(
  $$insert into public.game_runs (user_id, game_id, score, submission_id)
    values ('11111111-1111-1111-1111-111111111111', 999999, 10, '00000000-0000-4000-8000-000000000008')$$,
  '23503',
  null,
  'a run must reference an existing game'
);
select throws_ok(
  $$insert into public.game_runs (user_id, game_id, score, submission_id)
    values ('11111111-1111-1111-1111-111111111111', (select id from public.games where slug = 'swga'), 31, '00000000-0000-4000-8000-000000000003')$$,
  '23505',
  null,
  'duplicate submission IDs are rejected for the same user'
);

reset role;

select lives_ok(
  $$delete from auth.users where id = '11111111-1111-1111-1111-111111111111'$$,
  'deleting auth user A succeeds'
);
select is(
  (select count(*) from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  0::bigint,
  'deleting auth user A cascades to their profile'
);
select is(
  (select count(*) from public.game_runs where user_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint,
  'deleting auth user A cascades through profile deletion to their runs'
);
select is(
  (select count(*) from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  1::bigint,
  'user B profile remains after deleting user A'
);
select is(
  (select count(*) from public.game_runs where user_id = '22222222-2222-2222-2222-222222222222'),
  1::bigint,
  'user B run remains after deleting user A'
);

insert into auth.users (id, email)
values
  ('50000000-0000-4000-8000-000000000001', 'leader-01@example.com'),
  ('50000000-0000-4000-8000-000000000002', 'leader-02@example.com'),
  ('50000000-0000-4000-8000-000000000003', 'leader-03@example.com'),
  ('50000000-0000-4000-8000-000000000004', 'leader-04@example.com'),
  ('50000000-0000-4000-8000-000000000005', 'leader-05@example.com'),
  ('50000000-0000-4000-8000-000000000006', 'leader-06@example.com'),
  ('50000000-0000-4000-8000-000000000007', 'leader-07@example.com'),
  ('50000000-0000-4000-8000-000000000008', 'leader-08@example.com'),
  ('50000000-0000-4000-8000-000000000009', 'leader-09@example.com'),
  ('50000000-0000-4000-8000-000000000010', 'leader-10@example.com'),
  ('50000000-0000-4000-8000-000000000011', 'leader-11@example.com'),
  ('50000000-0000-4000-8000-000000000012', 'leader-12@example.com'),
  ('50000000-0000-4000-8000-000000000013', 'no-ranked-run@example.com');

insert into public.profiles (id, username)
values
  ('50000000-0000-4000-8000-000000000001', 'FormerChamp'),
  ('50000000-0000-4000-8000-000000000002', 'TieFirst'),
  ('50000000-0000-4000-8000-000000000003', 'TieSecond'),
  ('50000000-0000-4000-8000-000000000004', 'BestNinety'),
  ('50000000-0000-4000-8000-000000000005', 'PlayerFive'),
  ('50000000-0000-4000-8000-000000000006', 'PlayerSix'),
  ('50000000-0000-4000-8000-000000000007', 'PlayerSeven'),
  ('50000000-0000-4000-8000-000000000008', 'PlayerEight'),
  ('50000000-0000-4000-8000-000000000009', 'PlayerNine'),
  ('50000000-0000-4000-8000-000000000010', 'PlayerTen'),
  ('50000000-0000-4000-8000-000000000011', 'PlayerEleven'),
  ('50000000-0000-4000-8000-000000000012', 'PlayerTwelve'),
  ('50000000-0000-4000-8000-000000000013', 'NoRankedRun');

insert into public.game_runs (
  user_id,
  game_id,
  score,
  submission_id,
  completed_at
)
select
  fixture.user_id,
  public.games.id,
  fixture.score,
  fixture.submission_id,
  fixture.completed_at
from (
  values
    (1, '50000000-0000-4000-8000-000000000001'::uuid, 100, '60000000-0000-4000-8000-000000000001'::uuid, '2026-01-03 12:00:00+00'::timestamptz),
    (2, '50000000-0000-4000-8000-000000000001'::uuid, 99, '60000000-0000-4000-8000-000000000002'::uuid, '2025-12-01 12:00:00+00'::timestamptz),
    (3, '50000000-0000-4000-8000-000000000001'::uuid, 100, '60000000-0000-4000-8000-000000000003'::uuid, '2026-01-01 12:00:00+00'::timestamptz),
    (4, '50000000-0000-4000-8000-000000000002'::uuid, 100, '60000000-0000-4000-8000-000000000004'::uuid, '2026-01-02 12:00:00+00'::timestamptz),
    (5, '50000000-0000-4000-8000-000000000003'::uuid, 100, '60000000-0000-4000-8000-000000000005'::uuid, '2026-01-02 12:00:00+00'::timestamptz),
    (6, '50000000-0000-4000-8000-000000000004'::uuid, 85, '60000000-0000-4000-8000-000000000006'::uuid, '2025-01-01 12:00:00+00'::timestamptz),
    (7, '50000000-0000-4000-8000-000000000004'::uuid, 90, '60000000-0000-4000-8000-000000000007'::uuid, '2026-02-01 12:00:00+00'::timestamptz),
    (8, '50000000-0000-4000-8000-000000000005'::uuid, 80, '60000000-0000-4000-8000-000000000008'::uuid, '2026-02-02 12:00:00+00'::timestamptz),
    (9, '50000000-0000-4000-8000-000000000006'::uuid, 70, '60000000-0000-4000-8000-000000000009'::uuid, '2026-02-03 12:00:00+00'::timestamptz),
    (10, '50000000-0000-4000-8000-000000000007'::uuid, 60, '60000000-0000-4000-8000-000000000010'::uuid, '2026-02-04 12:00:00+00'::timestamptz),
    (11, '50000000-0000-4000-8000-000000000008'::uuid, 59, '60000000-0000-4000-8000-000000000011'::uuid, '2026-02-05 12:00:00+00'::timestamptz),
    (12, '50000000-0000-4000-8000-000000000009'::uuid, 58, '60000000-0000-4000-8000-000000000012'::uuid, '2026-02-06 12:00:00+00'::timestamptz),
    (13, '50000000-0000-4000-8000-000000000010'::uuid, 57, '60000000-0000-4000-8000-000000000013'::uuid, '2026-02-07 12:00:00+00'::timestamptz),
    (14, '50000000-0000-4000-8000-000000000011'::uuid, 56, '60000000-0000-4000-8000-000000000014'::uuid, '2026-02-08 12:00:00+00'::timestamptz),
    (15, '50000000-0000-4000-8000-000000000012'::uuid, 55, '60000000-0000-4000-8000-000000000015'::uuid, '2026-02-09 12:00:00+00'::timestamptz)
) as fixture(position, user_id, score, submission_id, completed_at)
cross join public.games
where public.games.slug = 'swga'
order by fixture.position;

update public.profiles
set username = 'ChampionNow'
where id = '50000000-0000-4000-8000-000000000001';

set local role anon;

select results_eq(
  $$select rank, username, score
    from public.get_swga_leaderboard()
    order by rank$$,
  $$values
    (1::bigint, 'ChampionNow'::text, 100::integer),
    (2::bigint, 'TieFirst'::text, 100::integer),
    (3::bigint, 'TieSecond'::text, 100::integer),
    (4::bigint, 'BestNinety'::text, 90::integer),
    (5::bigint, 'PlayerFive'::text, 80::integer),
    (6::bigint, 'PlayerSix'::text, 70::integer),
    (7::bigint, 'PlayerSeven'::text, 60::integer),
    (8::bigint, 'PlayerEight'::text, 59::integer),
    (9::bigint, 'PlayerNine'::text, 58::integer),
    (10::bigint, 'PlayerTen'::text, 57::integer)$$,
  'anon receives the top ten personal bests in deterministic leaderboard order'
);
select is(
  (select count(*) from public.get_swga_leaderboard()),
  10::bigint,
  'the leaderboard returns at most ten players'
);
select is(
  (
    select count(*) = count(distinct username)
    from public.get_swga_leaderboard()
  ),
  true,
  'each player contributes only one leaderboard row'
);
select results_eq(
  $$select score
    from public.get_swga_leaderboard()
    where username = 'BestNinety'$$,
  array[90::integer],
  'only a player personal-best score is ranked'
);
select results_eq(
  $$select achieved_at
    from public.get_swga_leaderboard()
    where username = 'ChampionNow'$$,
  array['2026-01-01 12:00:00+00'::timestamptz],
  'an equal repeated personal best uses its earliest achievement'
);
select results_eq(
  $$select username
    from public.get_swga_leaderboard()
    where rank = 1$$,
  array['ChampionNow'::text],
  'the leaderboard publishes the current profile username'
);
select results_eq(
  $$select username
    from public.get_swga_leaderboard()
    where score = 100
    order by rank
    limit 2$$,
  array['ChampionNow', 'TieFirst']::text[],
  'an earlier best-score timestamp wins a global score tie'
);
select results_eq(
  $$select username
    from public.get_swga_leaderboard()
    where username in ('TieFirst', 'TieSecond')
    order by rank$$,
  array['TieFirst', 'TieSecond']::text[],
  'equal scores and timestamps use the lower run ID as final tie-break'
);
select ok(
  (select rank from public.get_swga_leaderboard() where username = 'BestNinety')
    < (select rank from public.get_swga_leaderboard() where username = 'PlayerFive'),
  'a higher personal best outranks a lower personal best'
);
select is(
  (
    select count(*)
    from public.get_swga_leaderboard()
    where username in ('PlayerEleven', 'PlayerTwelve')
  ),
  0::bigint,
  'players below the top ten are excluded'
);
select is(
  (
    select count(*)
    from public.get_swga_leaderboard()
    where username = 'NoRankedRun'
  ),
  0::bigint,
  'a player without a ranked SWGA run does not appear'
);

reset role;

select * from finish();

rollback;
