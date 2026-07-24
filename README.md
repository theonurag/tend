# Tend

An open-source, privacy-first 90-day habit tracker that runs entirely in your browser. Tend uses a compact spreadsheet-like matrix so many habits can be tracked together without turning the everyday screen into a dashboard.

## Run

From the workspace root:

```bash
python3 -m http.server 4173 --directory habits
```

Open <http://localhost:4173/>.

## Core model

- **One row per habit:** the frozen first column opens the habit's cue, action, minimum version, reason, and progress.
- **Ninety day columns:** each available cell is a simple achieved/not-achieved toggle; future days remain unavailable.
- **Independent start dates:** every habit begins its own 90-day journey when it is created.
- **Quiet missed days:** unmarked days stay visually neutral and never erase previous progress.
- **Private by default:** all state remains in browser `localStorage` under `tend-v1`. Tend has no account, analytics, tracking, or server-side data store.

## Evidence and boundaries

Ninety days is a motivating practice frame, not a scientific promise that every behavior becomes automatic on day 90. Habits form at different rates. Tend is not medical or psychological treatment.

## Verify

```bash
npm run check
npm test
```

The project uses static HTML, CSS, vanilla JavaScript modules, and Node’s built-in test runner.

## Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md). Do not include private habit data, credentials, or exploit details in a public issue.

## License

[MIT](LICENSE)
