begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(16);

-- Fixed UUIDs keep the fixtures deterministic. The transaction is rolled back.
insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'owner-a@example.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'owner-b@example.invalid');

select extensions.ok(
  not has_column_privilege('authenticated', 'public.habits', 'user_id', 'INSERT'),
  'authenticated clients cannot set habit ownership'
);
select extensions.ok(
  not has_column_privilege('authenticated', 'public.habit_events', 'user_id', 'INSERT'),
  'authenticated clients cannot set event ownership'
);

set local role anon;
select extensions.throws_ok(
  $$ select count(*) from public.habits $$,
  '42501',
  'permission denied for table habits',
  'anonymous users cannot read habits'
);
select extensions.throws_ok(
  $$ select count(*) from public.habit_events $$,
  '42501',
  'permission denied for table habit_events',
  'anonymous users cannot read habit events'
);
reset role;

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;
select extensions.lives_ok(
  $$ insert into public.habits (name, why, cue, action, minimum)
     values ('Owner A habit', 'Private reason', 'After lunch', 'Walk', 'One minute') $$,
  'owner A can create a habit'
);
select extensions.results_eq(
  $$ select count(*) from public.habits $$,
  array[1::bigint],
  'owner A can read their habit'
);
reset role;
select set_config(
  'test.owner_a_habit_id',
  (select id::text from public.habits where user_id = '11111111-1111-4111-8111-111111111111'),
  true
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
set local role authenticated;
select extensions.results_eq(
  $$ select count(*) from public.habits $$,
  array[0::bigint],
  'owner B cannot read owner A habits'
);
select extensions.results_eq(
  $$ with changed as (
       update public.habits set name = 'Compromised'
       where id = current_setting('test.owner_a_habit_id')::uuid
       returning id
     ) select count(*) from changed $$,
  array[0::bigint],
  'owner B cannot update owner A habits'
);
select extensions.results_eq(
  $$ with removed as (
       delete from public.habits
       where id = current_setting('test.owner_a_habit_id')::uuid
       returning id
     ) select count(*) from removed $$,
  array[0::bigint],
  'owner B cannot delete owner A habits'
);
select extensions.throws_ok(
  $$ insert into public.habit_events (habit_id, event_date, outcome, reflection, adjustment)
     values (current_setting('test.owner_a_habit_id')::uuid, current_date, 'done', '', '') $$,
  '23503',
  null,
  'owner B cannot attach an event to owner A habits'
);
select extensions.lives_ok(
  $$ insert into public.habits (name, why, cue, action, minimum)
     values ('Owner B habit', '', 'After breakfast', 'Stretch', 'One stretch') $$,
  'owner B can create a separate habit'
);
select extensions.results_eq(
  $$ select count(*) from public.habits $$,
  array[1::bigint],
  'owner B sees only their own habit'
);
reset role;

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;
select extensions.results_eq(
  $$ select name from public.habits $$,
  array['Owner A habit'::text],
  'owner A habit was not changed by owner B'
);
select extensions.lives_ok(
  $$ insert into public.habit_events (habit_id, event_date, outcome, reflection, adjustment)
     values (current_setting('test.owner_a_habit_id')::uuid, current_date, 'done', '', '') $$,
  'owner A can create an event on their habit'
);
select extensions.results_eq(
  $$ select count(*) from public.habit_events $$,
  array[1::bigint],
  'owner A can read their event'
);
reset role;

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
set local role authenticated;
select extensions.results_eq(
  $$ select count(*) from public.habit_events $$,
  array[0::bigint],
  'owner B cannot read owner A events'
);
reset role;

select * from extensions.finish();
rollback;
