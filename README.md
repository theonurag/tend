# Tend

An open-source, privacy-first 90-day habit tracker. Tend uses a compact spreadsheet-like matrix so many habits can be tracked together without turning the everyday screen into a dashboard.

## Run locally

Requirements: Node.js 22 and npm.

```bash
npm ci
cp .env.example .env.local
# Add this Supabase project's URL and browser-safe publishable key to .env.local.
npm run dev
```

Open <http://127.0.0.1:3000/>. Never put a `service_role`, `sb_secret_*`, database password, or Supabase personal access token in a Vite environment variable.

## Core model

- **One row per habit:** the frozen first column opens the habit's cue, action, minimum version, reason, and progress.
- **Ninety day columns:** each available cell is a simple achieved/not-achieved toggle; future days remain unavailable.
- **Independent start dates:** every habit begins its own 90-day journey when it is created.
- **Quiet missed days:** unmarked days stay visually neutral and never erase previous progress.
- **Private accounts:** passwordless Supabase Auth identifies each user. PostgreSQL Row-Level Security limits every habit and event query to its owner.

## Data and privacy

Supabase PostgreSQL is Tend's source of truth. Habit data is held in memory while the page is open and is not copied to browser `localStorage`. The Supabase client stores the signed-in session locally so it can refresh securely; signing out removes the local session. Tend has no analytics or advertising trackers.

No legacy browser data is imported. A user begins with a fresh server-side account.

## Evidence and boundaries

Ninety days is a motivating practice frame, not a scientific promise that every behavior becomes automatic on day 90. Habits form at different rates. Tend is not medical or psychological treatment.

## Verify

```bash
npm run check
npm test
npm run build
npm audit
```

Database policy tests live in `supabase/tests/database`. CI runs them against an isolated local Supabase database; it never runs them against production.

## Database changes

Versioned SQL migrations live in `supabase/migrations`. Review migrations and their RLS policies before applying them:

```bash
npx supabase db push --linked
```

Do not commit Supabase access tokens, database passwords, secret keys, or `service_role` credentials.

## Deployment

The production build is deployed by the pinned GitHub Pages workflow to <https://theonurag.github.io/tend/>. The workflow requires:

- repository secret `VITE_SUPABASE_PUBLISHABLE_KEY`; and
- GitHub Pages configured with **GitHub Actions** as its source.

The Supabase URL is public and fixed in the workflow. The publishable key is also browser-safe, but keeping it in an Actions secret avoids unnecessary copies in source control.

## Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md). Do not include private habit data, credentials, or exploit details in a public issue.

## License

[MIT](LICENSE)
