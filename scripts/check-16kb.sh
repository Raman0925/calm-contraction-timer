#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Fails unless every native library is ready for 16 KB memory pages, as Google Play requires:
# 16 KB-aligned ELF LOAD segments, and (for an APK) 16 KB alignment inside the archive.
# Only 64-bit ABIs (arm64-v8a, x86_64) are checked: the requirement covers them alone, since
# 32-bit devices never use 16 KB pages, and React Native ships its 32-bit libraries 4 KB-aligned.
# Usage: scripts/check-16kb.sh path/to/app.apk | path/to/app.aab
set -euo pipefail

ARCHIVE="$1"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

if [[ "$ARCHIVE" == *.apk ]]; then
  ZIPALIGN="$(ls -d "$ANDROID_HOME"/build-tools/*/ | sort -V | tail -1)zipalign"
  "$ZIPALIGN" -c -P 16 -v 4 "$ARCHIVE" > /dev/null
  unzip -q "$ARCHIVE" 'lib/*' -d "$WORK"
else
  # App bundles keep native libraries under base/lib/<abi>/.
  unzip -q "$ARCHIVE" 'base/lib/*' -d "$WORK"
fi

count=0
failed=0
while IFS= read -r lib; do
  count=$((count + 1))
  # An objdump error must fail the check rather than pass silently.
  headers="$(objdump -p "$lib")"
  if grep -E '^\s*LOAD' <<< "$headers" | awk '{print $NF}' | grep -qvE '^2\*\*(1[4-9]|[2-9][0-9])$'; then
    echo "Not 16 KB aligned: ${lib#"$WORK"/}"
    failed=1
  fi
done < <(find "$WORK" -path '*/lib/arm64-v8a/*.so' -o -path '*/lib/x86_64/*.so')

if [ "$count" -eq 0 ]; then
  echo "No 64-bit native libraries found in $ARCHIVE"
  exit 1
fi
[ "$failed" -eq 0 ] && echo "All $count 64-bit native libraries are 16 KB aligned."
exit "$failed"
