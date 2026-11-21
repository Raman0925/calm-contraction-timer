#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Captures Play Store screenshots from the real app on a running emulator.
# Called by .github/workflows/screenshots.yml; needs a google_apis image (adb root).
set -euo pipefail

PKG=com.calmcontractiontimer.app
APK=android/app/build/outputs/apk/release/app-release.apk
OUT=e2e/output/screenshots
mkdir -p "$OUT"

# Maestro may write takeScreenshot images next to the flow or into its debug
# output. Gather them in one place even when a flow fails.
collect() {
  find . \( -path ./node_modules -o -path ./android -o -path "./$OUT" \) -prune \
    -o \( -name '[0-9][0-9]-*.png' -o -name 'a11y-200-*.png' \) -newer "$APK" \
    -exec cp -f {} "$OUT/" \; || true
  ls -la "$OUT"
}
trap collect EXIT
run_flow() { maestro test --debug-output "e2e/output/debug/$(basename "$1" .yaml)" "$1"; }

adb root
adb wait-for-device
adb install -r "$APK"

# A clean status bar showing the emulator's own time.
adb shell settings put global sysui_demo_allowed 1
demo() { adb shell am broadcast -a com.android.systemui.demo -e command "$@" > /dev/null; }
demo enter
demo clock -e hhmm "$(adb shell date +%H%M | tr -d '\r')"
demo battery -e level 100 -e plugged false
demo network -e wifi show -e level 4 -e fully true -e mobile hide -e airplane hide
demo notifications -e visible false

# 1. Onboarding, which also creates the app's data folders.
run_flow e2e/screenshots/onboarding.yaml

# 2. Replace the empty database with a realistic, made-up history.
adb shell am force-stop "$PKG"
NOW_MS=$(( $(adb shell date +%s | tr -d '\r') * 1000 ))
node scripts/screenshots/seed-db.mjs seeded.db "$NOW_MS"
DB_DIR="/data/data/$PKG/databases"
adb push seeded.db "$DB_DIR/contractions.db"
adb shell rm -f "$DB_DIR/contractions.db-wal" "$DB_DIR/contractions.db-shm"
OWNER=$(adb shell stat -c %u:%g "/data/data/$PKG" | tr -d '\r')
adb shell chown "$OWNER" "$DB_DIR/contractions.db"
adb shell restorecon "$DB_DIR/contractions.db"

# 3. No network, so no test ad appears in store screenshots.
adb shell cmd connectivity airplane-mode enable
# Maestro's waits on the ticking timer proved unreliable on CI, so the shell
# waits between flows instead: a screenshot at about 45 s, Stop after over a minute.
run_flow e2e/screenshots/capture-start.yaml
sleep 38
run_flow e2e/screenshots/capture-contracting.yaml
sleep 22
run_flow e2e/screenshots/capture-finish.yaml

# 4. Accessibility check (not for the store): the same screens at 200% text size.
adb shell settings put system font_scale 2.0
run_flow e2e/screenshots/large-text.yaml
adb shell settings put system font_scale 1.0
