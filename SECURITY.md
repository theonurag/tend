# Security policy

## Supported version

Security fixes are applied to the latest version on the `main` branch.

## Reporting a vulnerability

Please use **Security → Advisories → Report a vulnerability** in this GitHub repository. This keeps the report private while it is investigated.

Do not open a public issue containing exploit details, credentials, personal habit data, or other sensitive information.

Please include:

- the affected file, feature, or URL;
- clear reproduction steps;
- the potential impact; and
- a suggested fix, if you have one.

You should receive an acknowledgement within seven days. Confirmed issues will be addressed according to severity, and coordinated disclosure will be discussed with the reporter.

## Privacy model

Tend is a static client application backed by Supabase Auth and PostgreSQL. Habit records are associated with an authenticated user ID, and database Row-Level Security limits reads and writes to that owner. Anonymous table access is denied, ownership columns are not browser-writable, and no privileged Supabase key is included in the frontend.

In production, habit records are not cached in browser `localStorage`; they remain in memory while the page is open. Local development uses a separate browser-storage adapter with non-production data. The Supabase client does persist the authentication session locally so it can refresh securely. Anyone with access to an unlocked browser profile may be able to use that active session, so users should sign out on shared devices and should not treat Tend as an encrypted vault.

The application has no analytics or advertising trackers and does not import legacy browser data.
