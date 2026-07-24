-- Defense in depth: PostgreSQL's PUBLIC role must never inherit access to Tend's
-- private user tables, even if defaults or future grants change.
revoke all privileges on table public.habits from public;
revoke all privileges on table public.habit_events from public;
