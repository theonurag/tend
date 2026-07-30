# Feature rules

Each feature owns its DOM behavior, markup helpers, and feature-specific CSS.

- Call application services instead of Supabase or `localStorage` directly.
- Keep stable selectors close to the feature that uses them.
- Prefer pure markup or formatting helpers that can be tested without a
  browser.
- Shared code belongs in `src/shared/` only when at least two features use it.
- Do not create a global feature barrel export.
