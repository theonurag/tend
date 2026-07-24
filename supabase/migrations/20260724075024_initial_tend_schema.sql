-- Tend's browser client uses only the authenticated role. Every row is owned by
-- one Supabase Auth user and protected by PostgreSQL row-level security.

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 70),
  why text not null default '' check (char_length(why) <= 180),
  cue text not null check (char_length(btrim(cue)) between 1 and 120),
  action text not null check (char_length(btrim(action)) between 1 and 120),
  minimum text not null check (char_length(btrim(minimum)) between 1 and 100),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.habit_events (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  event_date date not null,
  occurred_at timestamptz not null default now(),
  outcome text not null default 'done' check (outcome in ('done', 'replaced', 'missed', 'lapse')),
  reflection text not null default '' check (char_length(reflection) <= 1000),
  adjustment text not null default '' check (char_length(adjustment) <= 1000),
  constraint habit_events_habit_owner_fkey
    foreign key (habit_id, user_id)
    references public.habits (id, user_id)
    on delete cascade,
  unique (habit_id, event_date)
);

create index habits_user_created_idx on public.habits (user_id, created_at);
create index habit_events_user_date_idx on public.habit_events (user_id, event_date);

alter table public.habits enable row level security;
alter table public.habits force row level security;
alter table public.habit_events enable row level security;
alter table public.habit_events force row level security;

create policy "Users can read their own habits"
on public.habits for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own habits"
on public.habits for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own habits"
on public.habits for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own habits"
on public.habits for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their own habit events"
on public.habit_events for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own habit events"
on public.habit_events for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own habit events"
on public.habit_events for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own habit events"
on public.habit_events for delete
to authenticated
using ((select auth.uid()) = user_id);

-- New Supabase projects do not auto-expose tables. Grant only the operations and
-- columns Tend currently needs; owner IDs and server timestamps are never writable.
revoke all on public.habits from anon;
revoke all on public.habit_events from anon;
revoke all on public.habits from authenticated;
revoke all on public.habit_events from authenticated;

grant select on public.habits to authenticated;
grant insert (name, why, cue, action, minimum) on public.habits to authenticated;
grant update (name, why, cue, action, minimum) on public.habits to authenticated;
grant delete on public.habits to authenticated;

grant select on public.habit_events to authenticated;
grant insert (habit_id, event_date, outcome, reflection, adjustment) on public.habit_events to authenticated;
grant update (event_date, outcome, reflection, adjustment) on public.habit_events to authenticated;
grant delete on public.habit_events to authenticated;
