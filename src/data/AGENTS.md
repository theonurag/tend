# Data adapter rules

Data adapters implement the same habit repository contract.

- Keep Supabase row names and mapping inside this directory.
- Local and Supabase adapters must return the same domain-shaped objects.
- Do not render UI or show notifications from an adapter.
- Preserve production ownership through database defaults and RLS; never send
  a user ID from the browser for row ownership.
- Run `npm run test:data` after changing mapping or repository behavior.
