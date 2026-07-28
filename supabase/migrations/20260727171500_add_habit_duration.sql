-- Existing practices retain their original 90-day length. New practices may
-- choose a length, and owners may extend it later through the edit flow.
alter table public.habits
  add column duration_days integer not null default 90
  check (duration_days between 1 and 3650);

grant insert (duration_days) on public.habits to authenticated;
grant update (duration_days) on public.habits to authenticated;
