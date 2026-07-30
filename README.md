# Tend

An open-source, privacy-first habit tracker. Tend uses a compact, full-screen spreadsheet-like matrix so many habits can be tracked together without turning the everyday screen into a dashboard.

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
- **Flexible practice length:** choose the initial number of days for each habit and extend it later by editing the habit.
- **Independent start dates:** every habit begins its own journey when it is created.
- **Quiet missed days:** unmarked days stay visually neutral and never erase previous progress.
- **Private accounts:** passwordless Supabase Auth identifies each user. PostgreSQL Row-Level Security limits every habit and event query to its owner.

## Architecture

- `src/domain/` contains pure journey and calendar rules.
- `src/application/` coordinates habit use cases through a repository contract.
- `src/data/` provides interchangeable local-development and Supabase adapters.
- `src/features/` owns tracker, editor, authentication, and growth-card UI.
- `styles/` contains shared and feature-specific styles.
- `supabase/` contains append-only migrations and database policy tests.

See `AGENTS.md` for task routing and the smallest verification command for each
area.

## Data and privacy

Supabase PostgreSQL is Tend's production source of truth. Production habit data is held in memory while the page is open and is not copied to browser `localStorage`. Local development deliberately uses a `localStorage` repository so UI work does not require a production account. The Supabase client stores the signed-in session locally so it can refresh securely; signing out removes the local session. Tend has no analytics or advertising trackers.

No legacy browser data is imported. A user begins with a fresh server-side account.

## Evidence and boundaries

Any chosen duration is a motivating practice frame, not a scientific promise that a behavior becomes automatic by its final day. Habits form at different rates. Tend is not medical or psychological treatment.

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
