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

Tend is a static, client-side application. Habit records stay in the current browser's `localStorage`; there is no Tend account or application server. Anyone with access to the browser profile or device may be able to read that local data, so Tend should not be treated as an encrypted vault.
