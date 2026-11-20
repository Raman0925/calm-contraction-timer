# Contributing

Thanks for helping make labour a little calmer. Please read this before opening a pull request.

## Licence of contributions (inbound = outbound)

This project is licensed under the [Apache License 2.0](LICENSE). By submitting a
contribution you agree that it is licensed under the same terms, as described in
section 5 of the licence. We do not use a separate CLA.

## Developer Certificate of Origin (DCO)

Every commit must be signed off to certify the [Developer Certificate of Origin](https://developercertificate.org/):

```sh
git commit -s -m "fix(timer): keep the start time after process death"
```

This adds a `Signed-off-by: Your Name <you@example.com>` trailer. Pull requests with
unsigned commits cannot be merged.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`,
`refactor:`, `test:`, `chore:`, `ci:`, `build:`. Add a scope where it helps, for example
`feat(history): …`. Release notes are generated from these messages.

## Development setup

Requirements: Node 22 LTS, JDK 17, Android SDK (platform 36).

```sh
npm ci
npm run android     # build and run on a device or emulator
npm run verify      # format, lint, type-check, SPDX headers, tests with coverage
```

## Ground rules

- Every source file starts with `// SPDX-License-Identifier: Apache-2.0`.
- TypeScript strict, no `any`, zero ESLint warnings.
- Feature code imports UI from `@core/design`, never from `react-native-paper` directly,
  and never uses raw colours.
- Domain logic is pure TypeScript with an injected `Clock`.
- Health data never leaves the device except through a backup the user starts.
  Never pass contraction data to ads, billing or any other SDK.
- The timer screen never shows ads or upsells.
- Wording stays neutral and informational. The app never tells anyone to go to hospital
  and never diagnoses.
- New dependencies need a permissive licence; CI rejects copyleft licences.
