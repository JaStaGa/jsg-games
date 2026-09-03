begin;

create extension if not exists pgtap with schema extensions;

select plan(70);

select has_table('public', 'games', 'games table exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'game_runs', 'game_runs table exists');
select has_view('public', 'player_game_stats', 'player_game_stats view exists');

select ok(
  to_regprocedure('public.get_swga_leaderboard()') is not null,
  'get_swga_leaderboard function exists'
);
select is(
  (
    select pronargs
    from pg_proc
    where oid = 'public.get_swga_leaderboard()'::regprocedure
  ),
  0::smallint,
  'get_swga_leaderboard accepts zero arguments'
);
select is(
  pg_get_function_result('public.get_swga_leaderboard()'::regprocedure),
  'TABLE(rank bigint, username text, score integer, achieved_at timestamp with time zone)'::text,
  'get_swga_leaderboard exposes exactly the approved result columns and types'
);
select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.get_swga_leaderboard()'::regprocedure
  ),
  'get_swga_leaderboard uses SECURITY DEFINER'
);
select is(
  (
    select provolatile
    from pg_proc
    where oid = 'public.get_swga_leaderboard()'::regprocedure
  ),
  's'::"char",
  'get_swga_leaderboard is STABLE'
);
select is(
  (
    select proconfig
    from pg_proc
    where oid = 'public.get_swga_leaderboard()'::regprocedure
  ),
  array['search_path=pg_catalog']::text[],
  'get_swga_leaderboard has the hardened search_path'
);
select is(
  (
    select lanname
    from pg_proc
    inner join pg_language on pg_language.oid = pg_proc.prolang
    where pg_proc.oid = 'public.get_swga_leaderboard()'::regprocedure
  ),
  'sql'::name,
  'get_swga_leaderboard is a SQL function'
);
select is(
  (
    select pg_get_userbyid(proowner)
    from pg_proc
    where oid = 'public.get_swga_leaderboard()'::regprocedure
  ),
  'postgres'::name,
  'get_swga_leaderboard is owned by postgres'
);

select columns_are(
  'public',
  'games',
  array['id', 'slug', 'name', 'created_at'],
  'games has only the approved columns'
);
select columns_are(
  'public',
  'profiles',
  array['id', 'created_at', 'username'],
  'profiles has only the approved profile columns'
);
select columns_are(
  'public',
  'game_runs',
  array['id', 'user_id', 'game_id', 'score', 'completed_at', 'submission_id'],
  'game_runs has only the generic completed-run columns'
);
select columns_are(
  'public',
  'player_game_stats',
  array['user_id', 'game_id', 'games_played', 'personal_best', 'average_score'],
  'player_game_stats has only the approved aggregate columns'
);

select ok(
  (select atttypid = 'uuid'::regtype from pg_attribute where attrelid = 'public.player_game_stats'::regclass and attname = 'user_id')
  and (select atttypid = 'int8'::regtype from pg_attribute where attrelid = 'public.player_game_stats'::regclass and attname = 'game_id')
  and (select atttypid = 'int8'::regtype from pg_attribute where attrelid = 'public.player_game_stats'::regclass and attname = 'games_played')
  and (select atttypid = 'int4'::regtype from pg_attribute where attrelid = 'public.player_game_stats'::regclass and attname = 'personal_best')
  and (select atttypid = 'numeric'::regtype from pg_attribute where attrelid = 'public.player_game_stats'::regclass and attname = 'average_score'),
  'player_game_stats column types match the read-model contract'
);
select ok(
  coalesce(
    (select reloptions from pg_class where oid = 'public.player_game_stats'::regclass),
    array[]::text[]
  ) @> array['security_invoker=true'],
  'player_game_stats executes with invoker security'
);

select has_column(
  'public',
  'game_runs',
  'submission_id',
  'game_runs.submission_id exists'
);
select col_type_is(
  'public',
  'game_runs',
  'submission_id',
  'uuid',
  'game_runs.submission_id uses UUID storage'
);
select col_not_null(
  'public',
  'game_runs',
  'submission_id',
  'game_runs.submission_id is required'
);

select ok(
  (select atttypid = 'int8'::regtype from pg_attribute where attrelid = 'public.games'::regclass and attname = 'id')
  and (select atttypid = 'text'::regtype from pg_attribute where attrelid = 'public.games'::regclass and attname = 'slug')
  and (select atttypid = 'text'::regtype from pg_attribute where attrelid = 'public.games'::regclass and attname = 'name')
  and (select atttypid = 'timestamptz'::regtype from pg_attribute where attrelid = 'public.games'::regclass and attname = 'created_at'),
  'games column types match the contract'
);
select ok(
  (select atttypid = 'uuid'::regtype from pg_attribute where attrelid = 'public.profiles'::regclass and attname = 'id')
  and (select atttypid = 'timestamptz'::regtype from pg_attribute where attrelid = 'public.profiles'::regclass and attname = 'created_at')
  and (select atttypid = 'text'::regtype from pg_attribute where attrelid = 'public.profiles'::regclass and attname = 'username'),
  'profiles column types match the contract'
);
select ok(
  (select atttypid = 'int8'::regtype from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = 'id')
  and (select atttypid = 'uuid'::regtype from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = 'user_id')
  and (select atttypid = 'int8'::regtype from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = 'game_id')
  and (select atttypid = 'int4'::regtype from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = 'score')
  and (select atttypid = 'timestamptz'::regtype from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = 'completed_at')
  and (select atttypid = 'uuid'::regtype from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = 'submission_id'),
  'game_runs column types match the contract'
);

select ok(
  (select count(*) = 4 and bool_and(attnotnull) from pg_attribute where attrelid = 'public.games'::regclass and attname = any (array['id', 'slug', 'name', 'created_at'])),
  'all games columns are not null'
);
select ok(
  (select count(*) = 3 and bool_and(attnotnull) from pg_attribute where attrelid = 'public.profiles'::regclass and attname = any (array['id', 'created_at', 'username'])),
  'all profiles columns are not null'
);
select ok(
  (select count(*) = 6 and bool_and(attnotnull) from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = any (array['id', 'user_id', 'game_id', 'score', 'completed_at', 'submission_id'])),
  'all game_runs columns are not null'
);

select ok(
  not (select atthasdef from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = 'submission_id'),
  'game_runs.submission_id has no database default'
);

select has_pk('public', 'games', 'games has a primary key');
select has_pk('public', 'profiles', 'profiles has a primary key');
select has_pk('public', 'game_runs', 'game_runs has a primary key');

select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.games'::regclass
      and conname = 'games_slug_unique'
      and contype = 'u'
  ),
  'games.slug has a unique constraint'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and confrelid = 'auth.users'::regclass
      and conname = 'profiles_auth_user_fk'
      and contype = 'f'
      and confdeltype = 'c'
  ),
  'profiles.id references auth.users with cascade delete'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_username_valid'
      and contype = 'c'
  ),
  'profiles.username has the approved validation constraint'
);
select ok(
  exists (
    select 1
    from pg_index
    where indrelid = 'public.profiles'::regclass
      and indexrelid = 'public.profiles_username_lower_unique'::regclass
      and indisunique
      and pg_get_indexdef(indexrelid) like '%lower(username)%'
  ),
  'profiles.username has a case-insensitive unique index'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.game_runs'::regclass
      and confrelid = 'public.profiles'::regclass
      and conname = 'game_runs_profile_fk'
      and contype = 'f'
      and confdeltype = 'c'
  ),
  'game_runs.user_id references profiles with cascade delete'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.game_runs'::regclass
      and confrelid = 'public.games'::regclass
      and conname = 'game_runs_game_fk'
      and contype = 'f'
      and confdeltype = 'r'
  ),
  'game_runs.game_id references games with restrictive delete behavior'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.game_runs'::regclass
      and conname = 'game_runs_score_nonnegative'
      and contype = 'c'
  ),
  'game_runs.score has a nonnegative check constraint'
);

select ok((select relrowsecurity from pg_class where oid = 'public.games'::regclass), 'games has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.game_runs'::regclass), 'game_runs has RLS enabled');

select ok(
  exists (
    select 1 from pg_policy
    where polrelid = 'public.games'::regclass
      and polname = 'games_select_api_roles'
      and polcmd = 'r'
      and 'anon'::regrole::oid = any (polroles)
      and 'authenticated'::regrole::oid = any (polroles)
  ),
  'games has the intended anon/authenticated SELECT policy'
);
select ok(
  exists (
    select 1 from pg_policy
    where polrelid = 'public.profiles'::regclass
      and polname = 'profiles_select_own'
      and polcmd = 'r'
      and 'authenticated'::regrole::oid = any (polroles)
  ),
  'profiles has the authenticated own-row SELECT policy'
);
select ok(
  exists (
    select 1 from pg_policy
    where polrelid = 'public.profiles'::regclass
      and polname = 'profiles_insert_own'
      and polcmd = 'a'
      and 'authenticated'::regrole::oid = any (polroles)
      and polwithcheck is not null
  ),
  'profiles has the authenticated own-row INSERT policy'
);
select ok(
  exists (
    select 1 from pg_policy
    where polrelid = 'public.profiles'::regclass
      and polname = 'profiles_update_own'
      and polcmd = 'w'
      and 'authenticated'::regrole::oid = any (polroles)
      and polqual is not null
      and polwithcheck is not null
  ),
  'profiles has the authenticated own-row UPDATE policy with both predicates'
);
select ok(
  exists (
    select 1 from pg_policy
    where polrelid = 'public.game_runs'::regclass
      and polname = 'game_runs_select_own'
      and polcmd = 'r'
      and 'authenticated'::regrole::oid = any (polroles)
  ),
  'game_runs has the authenticated own-row SELECT policy'
);
select ok(
  not exists (
    select 1 from pg_policy
    where polrelid = 'public.game_runs'::regclass
      and polcmd in ('a', 'w', 'd', '*')
      and (
        'authenticated'::regrole::oid = any (polroles)
        or 0::oid = any (polroles)
      )
  ),
  'game_runs has no authenticated or public write policy'
);
select ok(
  not exists (
    select 1 from pg_policy
    where polrelid in ('public.games'::regclass, 'public.profiles'::regclass, 'public.game_runs'::regclass)
      and 'service_role'::regrole::oid = any (polroles)
  ),
  'no policy is created for the RLS-bypassing service_role'
);

select ok(
  (select attidentity = 'a' from pg_attribute where attrelid = 'public.games'::regclass and attname = 'id'),
  'games.id is generated always as identity'
);
select ok(
  (select attidentity = 'a' from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = 'id'),
  'game_runs.id is generated always as identity'
);

select col_has_default('public', 'games', 'created_at', 'games.created_at has a database default');
select col_has_default('public', 'profiles', 'created_at', 'profiles.created_at has a database default');
select col_has_default('public', 'game_runs', 'completed_at', 'game_runs.completed_at has a database default');

select has_index('public', 'game_runs', 'game_runs_user_game_completed_at_idx', 'user/game run history index exists');
select has_index('public', 'game_runs', 'game_runs_game_score_idx', 'per-game score index exists');
select ok(
  exists (
    select 1
    from pg_index
    where indrelid = 'public.game_runs'::regclass
      and indexrelid = 'public.game_runs_user_submission_id_unique'::regclass
      and indisunique
      and pg_get_indexdef(indexrelid) like '%(user_id, submission_id)%'
  ),
  'game_runs has per-user submission ID uniqueness'
);

select results_eq(
  $$select slug || ':' || name from public.games where slug = 'swga'$$,
  array['swga:SWGA']::text[],
  'SWGA is predefined with the approved slug and name'
);
select is((select count(*) from public.games), 1::bigint, 'no speculative games are registered');

select throws_ok(
  $$insert into public.games (slug, name) values ('Invalid Slug', 'Invalid')$$,
  '23514',
  null,
  'invalid game slugs are rejected'
);
select throws_ok(
  $$insert into public.games (slug, name) values ('blank-name', '   ')$$,
  '23514',
  null,
  'blank game names are rejected'
);
select throws_ok(
  $$insert into public.games (slug, name) values ('swga', 'Duplicate')$$,
  '23505',
  null,
  'duplicate game slugs are rejected'
);

insert into auth.users (id, email)
values
  ('31111111-1111-1111-1111-111111111111', 'profile-one@example.com'),
  ('32222222-2222-2222-2222-222222222222', 'profile-two@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'profile-invalid@example.com');

select lives_ok(
  $$insert into public.profiles (id, username) values ('31111111-1111-1111-1111-111111111111', 'PlayerOne')$$,
  'a normal username is accepted'
);
select lives_ok(
  $$insert into public.profiles (id, username) values ('32222222-2222-2222-2222-222222222222', 'Player_two')$$,
  'an underscore after the first character is accepted'
);
select is(
  (select username from public.profiles where id = '31111111-1111-1111-1111-111111111111'),
  'PlayerOne'::text,
  'username capitalization is preserved'
);
select throws_ok(
  $$insert into public.profiles (id, username) values ('33333333-3333-3333-3333-333333333333', 'ab')$$,
  '23514',
  null,
  'a username shorter than three characters is rejected'
);
select throws_ok(
  $$insert into public.profiles (id, username) values ('33333333-3333-3333-3333-333333333333', 'a12345678901234567890')$$,
  '23514',
  null,
  'a username longer than twenty characters is rejected'
);
select throws_ok(
  $$insert into public.profiles (id, username) values ('33333333-3333-3333-3333-333333333333', '_player')$$,
  '23514',
  null,
  'a username starting with an underscore is rejected'
);
select throws_ok(
  $$insert into public.profiles (id, username) values ('33333333-3333-3333-3333-333333333333', 'player one')$$,
  '23514',
  null,
  'a username containing spaces is rejected'
);
select throws_ok(
  $$insert into public.profiles (id, username) values ('33333333-3333-3333-3333-333333333333', 'player-one')$$,
  '23514',
  null,
  'a username containing punctuation is rejected'
);
select throws_ok(
  $$insert into public.profiles (id, username) values ('33333333-3333-3333-3333-333333333333', 'playerone')$$,
  '23505',
  null,
  'case variants of an existing username are rejected'
);

select * from finish();

rollback;
