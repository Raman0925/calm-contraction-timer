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
- Android backup and device transfer are disabled for app data. Pro users can save an
  explicit backup file wherever they choose, such as their own Google Drive.

See [PRIVACY.md](PRIVACY.md). It is also the privacy policy linked from the app.

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

## Timer and notification

Start is written to the database the moment it is tapped, so a running contraction
survives the app being killed, a reboot or a time-zone change; the timer resumes from the
stored start time. During a session an ongoing notification shows a chronometer with a
Start or Stop button that works from the lock screen, even when the app is not running.
It is a plain ongoing notification, not a foreground service, and the app asks for
notification permission when the first contraction is timed, not at launch.

Known limitation: after the phone restarts, the notification comes back the next time the
app is opened. No timing data is lost in the meantime.

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

## Export

Each session can be shared as a CSV spreadsheet (times in local ISO 8601 with the UTC
offset) or as a PDF doctor report with a summary, a chart, the full table and a disclaimer
footer. Files are written to the app cache and handed to the Android share menu; nothing is
uploaded by the app.

## Backup and restore (Pro)

**Settings → Back up to a file** writes a versioned JSON file
(`calm-contraction-timer-backup-YYYY-MM-DD.json`) to any place the user picks with Android's
system file picker, such as Google Drive or Downloads. No Google Cloud project, sign-in or
storage permission is needed. **Restore from a file** checks the whole file first (format,
version, every field, unique ids, at most one running contraction), shows how many
contractions will be replaced, and after confirmation replaces them in one database
transaction, so a failure changes nothing. Older app versions refuse backups made by newer
ones instead of misreading them.

## Pro unlock

Pro is a single non-consumable in-app product sold through Google Play Billing
(react-native-iap). It unlocks the PDF doctor report, file backup and restore, and removes
the History banner. The timer itself is never limited.

The app connects on start, restores owned purchases (which also revokes Pro after a refund),
acknowledges purchases within Google Play's 3-day window, and handles pending, cancelled and
failed purchases. The entitlement is stored on the phone, so Pro keeps working offline. Billing
errors are caught in one place and never affect the timer.

**Play Console setup (required before release):** create an in-app product with the id
`pro_unlock` (see `PRO_PRODUCT_ID` in `src/core/config.ts`), set its price, and activate it.
Purchases can be tested with licence testers on the internal track.

## Ads and consent

Free users see one anchored adaptive banner at the bottom of History, never on the timer.
On launch the app uses the consent stored from the last session, refreshes it with Google's
User Messaging Platform (showing the form where required) and starts the Mobile Ads SDK only
when ads may be requested. **Settings → Privacy options** appears where the law requires it.
Requests are limited to G-rated content, and no contraction data or targeting keywords are
sent. Pro users never start the consent flow or the SDK.

The repository only contains Google's public **test** IDs. Debug builds always use them;
release builds use real IDs only when the release workflow provides them:

| Environment variable  | What it is                              |
| --------------------- | --------------------------------------- |
| `CCT_ADMOB_APP_ID`    | AdMob app ID (`ca-app-pub-…~…`)         |
| `CCT_ADMOB_BANNER_ID` | AdMob banner ad unit (`ca-app-pub-…/…`) |

**Play Console Data safety:** contraction data never leaves the phone except through exports
the user shares. The free version's AdMob banner collects and shares, for advertising and
fraud prevention: device or other IDs (advertising ID), approximate location, app interactions
and diagnostics, as described in Google's AdMob data disclosure. Declare these in the Data
safety form and keep it in step with [PRIVACY.md](PRIVACY.md).

## Tests

- `npm test` runs unit and component tests (Jest + Testing Library) in UTC, against an
  in-memory SQLite database that runs the same migrations as the app.
- `e2e/flows` holds [Maestro](https://maestro.mobile.dev) flows: onboarding, timing three
  contractions, History and CSV export. The **E2E** workflow runs them on an emulator on every
  push to `main` and nightly. To run them locally, install Maestro, then:

  ```sh
  cd android && ./gradlew assembleRelease -PreactNativeArchitectures=x86_64 && cd ..
  adb install -r android/app/build/outputs/apk/release/app-release.apk
  maestro test e2e/flows
  ```

Without the upload-key environment variables, release builds are signed with the debug key so
they can be installed for testing. Google Play rejects those builds.

## Open-source licences

`npm install` (and `npm ci` in CI) regenerates
`src/features/settings/data/licences.generated.json` from the production dependencies, which
the app shows under **Settings → Open-source licences**. CI fails if any production dependency
has a licence outside the allow-list in `package.json` (`licenses:check`).

## Roadmap

1. ✅ Project setup, design system, themes, navigation, i18n, CI
2. ✅ SQLite + Drizzle schema, migrations, repositories, `computeStats`
3. ✅ Timer screen, ongoing notification, crash/kill recovery, keep-awake
4. ✅ History, session detail, charts, editing
5. ✅ CSV/PDF export, settings, onboarding and disclaimer
6. ✅ One-time Pro unlock
7. ✅ Consent (UMP) and a single banner on History for free users
8. ✅ Backup to a file and restore (Pro)
9. Live Update notifications, accessibility and performance passes, release pipeline

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Commits use Conventional Commits and a DCO
sign-off. Please read the [Code of Conduct](CODE_OF_CONDUCT.md) and report security issues
as described in [SECURITY.md](SECURITY.md).

## Licence

Code: [Apache License 2.0](LICENSE); see also [NOTICE](NOTICE). The app name, icon and
store artwork are not covered by the code licence; see [TRADEMARKS.md](TRADEMARKS.md).
