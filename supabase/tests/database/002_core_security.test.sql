begin;

create extension if not exists pgtap with schema extensions;

select plan(67);

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
  ('22222222-2222-2222-2222-222222222222', (select id from public.games where slug = 'swga'), 20, '00000000-0000-4000-8000-000000000002');

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
  array['11111111-1111-1111-1111-111111111111'::uuid],
  'user A reads only their own runs'
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
  array[3::bigint],
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

select * from finish();

rollback;
