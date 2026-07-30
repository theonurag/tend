# Supabase rules

- Migrations are append-only after deployment; add a new timestamped migration
  instead of rewriting production history.
- Enable and force RLS for every private table.
- Revoke `PUBLIC` and anonymous access, then grant only required columns and
  operations to `authenticated`.
- Ownership columns and server timestamps must not be browser-writable.
- Extend `tests/database/rls.test.sql` for policy or grant changes.
- Run `npm run test:db`.
