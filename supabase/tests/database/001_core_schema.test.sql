begin;

create extension if not exists pgtap with schema extensions;

select plan(40);

select has_table('public', 'games', 'games table exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'game_runs', 'game_runs table exists');

select columns_are(
  'public',
  'games',
  array['id', 'slug', 'name', 'created_at'],
  'games has only the approved columns'
);
select columns_are(
  'public',
  'profiles',
  array['id', 'created_at'],
  'profiles has only the auth identity foundation columns'
);
select columns_are(
  'public',
  'game_runs',
  array['id', 'user_id', 'game_id', 'score', 'completed_at'],
  'game_runs has only the generic completed-run columns'
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
  and (select atttypid = 'timestamptz'::regtype from pg_attribute where attrelid = 'public.profiles'::regclass and attname = 'created_at'),
  'profiles column types match the contract'
);
select ok(
  (select atttypid = 'int8'::regtype from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = 'id')
  and (select atttypid = 'uuid'::regtype from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = 'user_id')
  and (select atttypid = 'int8'::regtype from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = 'game_id')
  and (select atttypid = 'int4'::regtype from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = 'score')
  and (select atttypid = 'timestamptz'::regtype from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = 'completed_at'),
  'game_runs column types match the contract'
);

select ok(
  (select count(*) = 4 and bool_and(attnotnull) from pg_attribute where attrelid = 'public.games'::regclass and attname = any (array['id', 'slug', 'name', 'created_at'])),
  'all games columns are not null'
);
select ok(
  (select count(*) = 2 and bool_and(attnotnull) from pg_attribute where attrelid = 'public.profiles'::regclass and attname = any (array['id', 'created_at'])),
  'all profiles columns are not null'
);
select ok(
  (select count(*) = 5 and bool_and(attnotnull) from pg_attribute where attrelid = 'public.game_runs'::regclass and attname = any (array['id', 'user_id', 'game_id', 'score', 'completed_at'])),
  'all game_runs columns are not null'
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

select * from finish();

rollback;
