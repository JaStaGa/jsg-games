-- Local-only fixtures; every write is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

select has_column('public', 'game_runs', 'round_reached', 'round progress column exists');
select ok(
  (select atttypid = 'int4'::regtype from pg_attribute
   where attrelid = 'public.game_runs'::regclass and attname = 'round_reached'),
  'round progress uses int4 storage'
);
select col_is_null('public', 'game_runs', 'round_reached', 'unknown historical progress may remain NULL');
select col_hasnt_default('public', 'game_runs', 'round_reached', 'round progress has no database default');

select ok(has_column_privilege('service_role', 'public.game_runs', 'round_reached', 'INSERT'),
  'service_role can insert round progress');
select ok(not has_table_privilege('service_role', 'public.game_runs', 'INSERT'),
  'service_role has no table-wide INSERT');
select ok(
  not has_column_privilege('service_role', 'public.game_runs', 'id', 'INSERT')
  and not has_column_privilege('service_role', 'public.game_runs', 'completed_at', 'INSERT'),
  'service_role cannot insert generated identity or timestamp'
);
select ok(
  not has_any_column_privilege('service_role', 'public.game_runs', 'UPDATE')
  and not has_table_privilege('service_role', 'public.game_runs', 'DELETE'),
  'service_role still cannot update or delete runs'
);
select ok(
  not has_any_column_privilege('anon', 'public.game_runs', 'INSERT')
  and not has_any_column_privilege('authenticated', 'public.game_runs', 'INSERT'),
  'browser roles cannot insert any run column'
);
select ok((select relrowsecurity from pg_class where oid = 'public.game_runs'::regclass),
  'run RLS remains enabled');
select results_eq(
  $$select polname::text from pg_policy where polrelid = 'public.game_runs'::regclass order by polname$$,
  array['game_runs_select_own']::text[],
  'the existing own-row read policy remains the only run policy'
);

insert into auth.users (id, email)
values ('80000000-0000-4000-8000-000000000001', 'round-test@example.test');
insert into public.profiles (id, username)
values ('80000000-0000-4000-8000-000000000001', 'RoundTest');

set local role service_role;

select lives_ok($$insert into public.game_runs (user_id, game_id, score, submission_id, round_reached)
    values ('80000000-0000-4000-8000-000000000001', (select id from public.games where slug = 'swga'), 0,
      '81000000-0000-4000-8000-000000000001', 1)$$,
  'swga: trusted insert accepts positive progress');

select lives_ok($$insert into public.game_runs (user_id, game_id, score, submission_id, round_reached)
    values ('80000000-0000-4000-8000-000000000001', (select id from public.games where slug = 'character-guessing-expedition-crew'), 0,
      '81000000-0000-4000-8000-000000000002', 10)$$,
  'character-guessing-expedition-crew: trusted insert accepts positive progress');

select lives_ok($$insert into public.game_runs (user_id, game_id, score, submission_id, round_reached)
    values ('80000000-0000-4000-8000-000000000001', (select id from public.games where slug = 'character-guessing-copperlight-city'), 0,
      '81000000-0000-4000-8000-000000000003', 2147483647)$$,
  'character-guessing-copperlight-city: trusted insert accepts positive progress without a universal maximum');

select lives_ok($$insert into public.game_runs (user_id, game_id, score, submission_id)
    values ('80000000-0000-4000-8000-000000000001', (select id from public.games where slug = 'swga'), 0,
      '81000000-0000-4000-8000-000000000004')$$, 'legacy insert may omit round progress');

select lives_ok($$insert into public.game_runs (user_id, game_id, score, submission_id, round_reached)
    values ('80000000-0000-4000-8000-000000000001', (select id from public.games where slug = 'swga'), 0,
      '81000000-0000-4000-8000-000000000005', null)$$, 'explicit NULL round progress remains accepted');

select is((select count(*) from public.game_runs where user_id = '80000000-0000-4000-8000-000000000001' and round_reached is null), 2::bigint,
  'legacy-style rows retain unknown progress');
select results_eq(
  $$select round_reached from public.game_runs where user_id = '80000000-0000-4000-8000-000000000001' and round_reached is not null order by round_reached$$,
  array[1, 10, 2147483647]::integer[],
  'trusted progress is stored exactly'
);

select throws_ok($$insert into public.game_runs (user_id, game_id, score, submission_id, round_reached)
    values ('80000000-0000-4000-8000-000000000001', (select id from public.games where slug = 'swga'), 0,
      '81000000-0000-4000-8000-000000000006', 0)$$, '23514', null, 'round 0 is rejected');

select throws_ok($$insert into public.game_runs (user_id, game_id, score, submission_id, round_reached)
    values ('80000000-0000-4000-8000-000000000001', (select id from public.games where slug = 'swga'), 0,
      '81000000-0000-4000-8000-000000000007', -1)$$, '23514', null, 'round -1 is rejected');

select throws_ok($$insert into public.game_runs (user_id, game_id, score, submission_id, round_reached, id)
    values ('80000000-0000-4000-8000-000000000001', (select id from public.games where slug = 'swga'), 0,
      '81000000-0000-4000-8000-000000000008', 1, default)$$, '42501', null, 'service_role cannot specify generated id');

select throws_ok($$insert into public.game_runs (user_id, game_id, score, submission_id, round_reached, completed_at)
    values ('80000000-0000-4000-8000-000000000001', (select id from public.games where slug = 'swga'), 0,
      '81000000-0000-4000-8000-000000000009', 1, now())$$, '42501', null, 'service_role cannot specify completed_at');

select throws_ok($$update public.game_runs set round_reached = 2 where user_id = '80000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'service_role cannot fill legacy progress');
select throws_ok($$delete from public.game_runs where user_id = '80000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'service_role cannot delete runs');
reset role;

set local role anon;
select throws_ok($$insert into public.game_runs (user_id, game_id, score, submission_id, round_reached)
    values ('80000000-0000-4000-8000-000000000001', (select id from public.games where slug = 'swga'), 0,
      '81000000-0000-4000-8000-000000000010', 1)$$, '42501', null, 'anon cannot directly insert ranked round progress');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000001', true);
select throws_ok($$insert into public.game_runs (user_id, game_id, score, submission_id, round_reached)
    values ('80000000-0000-4000-8000-000000000001', (select id from public.games where slug = 'swga'), 0,
      '81000000-0000-4000-8000-000000000011', 1)$$, '42501', null, 'authenticated cannot directly insert ranked round progress');
reset role;

select is((select count(*) from public.game_runs where user_id = '80000000-0000-4000-8000-000000000001' and round_reached is null), 2::bigint,
  'rejected writes leave legacy NULL progress untouched');

select * from finish();
rollback;
