# Domain rules

This directory contains pure, deterministic habit and calendar rules.

- Do not access the DOM, browser storage, environment variables, or Supabase.
- Accept clocks and dates as arguments when behavior depends on time.
- Keep browser and database field naming out of the domain model.
- Add or update a colocated `*.test.js` for every behavior change.
- Run `npm run test:domain`.
