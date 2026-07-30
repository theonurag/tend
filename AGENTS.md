# Tend agent guide

Tend is a privacy-first habit-practice matrix built with vanilla JavaScript,
Vite, and Supabase. Production habit data is stored in PostgreSQL behind
Row-Level Security. Local development uses a repository adapter backed by
`localStorage`.

## Task routing

- Journey dates, duration, grouping, or progress: `src/domain/`
- Habit loading and mutations: `src/application/` and `src/data/`
- Matrix markup and scrolling: `src/features/tracker/`
- Practice form and presets: `src/features/habit-editor/`
- Authentication: `src/features/auth/`
- Growth-card image and sharing: `src/features/growth-card/`
- Database schema, grants, or RLS: `supabase/`
- Shared controls and page layout: `styles/`

Read the scoped `AGENTS.md` in an area before changing it. Dependencies point
inward: features call application services; application services use domain
functions and data contracts; only data adapters know Supabase or
`localStorage`.

## Product and security invariants

- Habit records are private to their authenticated owner in production.
- Every exposed table requires explicit grants, forced RLS, and policy tests.
- Browser code may use only a publishable Supabase key. Never expose
  `service_role`, `sb_secret_*`, database passwords, or personal access tokens.
- Missed days remain neutral. Do not add shame, broken-streak punishment,
  health loss, or scientific claims about a fixed habit-formation duration.
- Tend has no analytics, advertising trackers, or unnecessary external calls.

## Context budget

Do not inspect `node_modules/`, `dist/`, or `package-lock.json` unless the task
specifically concerns dependencies or generated output. Read
`supabase/config.toml` only for local Supabase CLI configuration. Prefer direct
imports; do not add a repository-wide barrel export.

`README.md` and the running code describe shipped behavior. `RESEARCH.md`
records product rationale, not an implementation specification.

## Verification

- Domain: `npm run test:domain`
- Data adapters: `npm run test:data`
- Tracker rendering: `npm run test:ui`
- Database/RLS: `npm run test:db`
- Full handoff: `npm run verify`

Keep changes focused and avoid adding dependencies unless they materially
improve safety or reduce complexity.
