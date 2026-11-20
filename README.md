# Calm Contraction Timer

The calmest, fastest contraction timer for labour. One big button, big numbers, a
true-black night mode for 3 AM hospital rooms, and no upsell on the timer screen.

> **Medical disclaimer.** This app records times you enter. It does not give medical
> advice or diagnose anything. Always follow the guidance of your midwife, doctor or
> maternity unit.

[![CI](https://github.com/Raman0925/calm-contraction-timer/actions/workflows/ci.yml/badge.svg)](https://github.com/Raman0925/calm-contraction-timer/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Raman0925/calm-contraction-timer/badge)](https://scorecard.dev/viewer/?uri=github.com/Raman0925/calm-contraction-timer)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

## Privacy

- All contraction data stays on your device. There is no backend and no account.
- Contraction data is never sent to ads, billing or analytics SDKs.
- Android backup and device transfer are disabled for app data; Pro users can make an
  explicit backup to their own Google Drive app-data folder.

## Tech stack

React Native 0.88 (CLI, New Architecture, Hermes) · TypeScript strict · React Navigation 7
(static config) · React Native Paper 5 (MD3) behind our own design system · zustand ·
MMKV · i18next. Android only; `minSdk 24`, `targetSdk 36`.

## Getting started

Requirements: Node 22 LTS (see `.nvmrc`), JDK 17, Android SDK platform 36.

```sh
npm ci
npm start            # Metro bundler
npm run android      # build and install on a device or emulator
```

| Script                   | What it does                                                  |
| ------------------------ | ------------------------------------------------------------- |
| `npm run verify`         | Everything CI checks except the Android build                 |
| `npm run lint`           | ESLint, zero warnings allowed                                 |
| `npm run typecheck`      | `tsc --noEmit`                                                |
| `npm test`               | Jest unit and component tests                                 |
| `npm run check:spdx`     | Ensures every source file has the SPDX header                 |
| `npm run licenses:check` | Fails if a production dependency has a non-permissive licence |
| `npm run db:generate`    | Generates a migration after editing `src/core/db/schema.ts`   |

## Project structure

```
src/
  app/          App root, navigation, error boundaries
  core/
    db/         Drizzle schema, generated migrations, op-sqlite client
    design/     Tokens, light/dark/night themes, shared components (the only place that imports Paper)
    i18n/       i18next setup and locale strings
    storage/    MMKV settings storage
    utils/      Clock and other pure helpers
  features/<feature>/{domain,data,ui}
```

Feature code imports UI only from `@core/design`; ESLint rejects raw colours and direct
Paper imports outside the design system.

## Roadmap

1. ✅ Project setup, design system, themes, navigation, i18n, CI
2. ✅ SQLite + Drizzle schema, migrations, repositories, `computeStats`
3. Timer screen, ongoing notification, crash/kill recovery, keep-awake
4. History, session detail, charts
5. CSV/PDF export, settings, onboarding and disclaimer
6. One-time Pro unlock
7. Consent (UMP) and a single banner on History for free users
8. Google Drive backup and restore (Pro)
9. Live Update notifications, accessibility and performance passes, release pipeline

## Database

Contractions live in an on-device SQLite database (op-sqlite + Drizzle). Times are
stored as UTC epoch milliseconds, so time-zone and daylight-saving changes never alter
data. Sessions are not stored; they are derived by grouping contractions with no gap
longer than 6 hours.

To change the schema, edit `src/core/db/schema.ts` and run `npm run db:generate`.
Never edit generated files in `src/core/db/migrations/`. The SQL is inlined at build
time, so if one ever has to change, restart Metro with `npm start -- --reset-cache`.

The app applies pending migrations on start, each in its own transaction. Tests run the
same SQL bundle against sql.js, including an upgrade from every previous version.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Commits use Conventional Commits and a DCO
sign-off. Please read the [Code of Conduct](CODE_OF_CONDUCT.md) and report security issues
as described in [SECURITY.md](SECURITY.md).

## Licence

Code: [Apache License 2.0](LICENSE); see also [NOTICE](NOTICE). The app name, icon and
store artwork are not covered by the code licence; see [TRADEMARKS.md](TRADEMARKS.md).
