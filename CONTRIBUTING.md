# Contributing

Thanks for helping improve Tend.

1. Create a branch from `main`.
2. Keep changes focused and avoid adding trackers, analytics, remote fonts, or unnecessary dependencies.
3. Use the task map and scoped rules in `AGENTS.md`. Keep domain rules pure,
   persistence behind `src/data/`, and DOM behavior in its owning feature.
4. Run the smallest relevant test script while working, then `npm run verify`
   before opening a pull request.
5. Open a pull request describing the user impact and verification performed.

Report security vulnerabilities privately according to [SECURITY.md](SECURITY.md), not through a public issue.
