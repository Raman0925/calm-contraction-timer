# Releasing

## How a release happens

1. Commits on `main` follow Conventional Commits. **release-please** keeps a release PR open
   that bumps `package.json` (and with it the Android `versionName`/`versionCode`) and
   updates `CHANGELOG.md`.
2. Merging that PR creates the tag `vX.Y.Z` and a GitHub Release.
3. The tag starts the **Release** workflow, which waits for approval in the `production`
   environment (Settings → Environments; only `v*` tags may deploy there).
4. After approval the **build** job makes the signed app bundle and checks that every native
   library is 16 KB aligned. A separate **publish** job, which runs no project code, attaches
   the bundle, the R8 mapping file and the native debug symbols to the GitHub Release.
5. Upload the bundle to Play Console by hand (see below).

Without `RELEASE_PLEASE_TOKEN`, GitHub does not start workflows for the tag that
release-please creates. Then start it by hand: **Actions → Release → Run workflow**, and under
**Use workflow from** choose the tag (for example `v1.2.0`). The workflow refuses to run from
anything but a version tag.

## Secrets

Add these under **Settings → Environments → production → Environment secrets** (the
release-please token is a repository secret). Nothing here is ever committed.

| Secret                       | What it is                             |
| ---------------------------- | -------------------------------------- |
| `CCT_UPLOAD_KEYSTORE_BASE64` | Upload keystore, base64-encoded        |
| `CCT_UPLOAD_STORE_PASSWORD`  | Keystore password                      |
| `CCT_UPLOAD_KEY_ALIAS`       | Key alias in the keystore              |
| `CCT_UPLOAD_KEY_PASSWORD`    | Key password                           |
| `CCT_ADMOB_APP_ID`           | AdMob app ID, `ca-app-pub-…~…`         |
| `CCT_ADMOB_BANNER_ID`        | AdMob banner ad unit, `ca-app-pub-…/…` |
| `RELEASE_PLEASE_TOKEN`       | Optional repository secret; see below  |

The build fails if any secret above (except the optional token) is missing or empty, so a
release can never be signed with the debug key or ship test ads.

### Upload key

```sh
keytool -genkeypair -v -keystore upload.jks -alias upload \
  -keyalg RSA -keysize 4096 -validity 10000
base64 -w0 upload.jks   # value of CCT_UPLOAD_KEYSTORE_BASE64 (macOS: base64 -i upload.jks)
```

Enrol the app in **Play App Signing** and register this as the upload key. Keep `upload.jks`
and its passwords in a password manager; never commit them.

### AdMob IDs

In the AdMob console create the app (Android, linked to the Play listing once it exists) and
one **Banner** ad unit. Copy the app ID and the ad unit ID.

### release-please token (optional)

A fine-grained personal access token limited to this repository with **Contents** and **Pull
requests** read/write. With it, the release PR runs CI and the release tag starts the Release
workflow automatically.

## Uploading to Google Play

1. Download `calm-contraction-timer-vX.Y.Z.aab` and `mapping-vX.Y.Z.txt` from the GitHub
   Release.
2. In Play Console open **Test and release → Testing → Internal testing → Create new release**
   and upload the `.aab`.
3. In **App bundle explorer**, select that version and under **Downloads** upload the
   mapping file (ReTrace mapping file). Native debug symbols are inside the bundle, so Play
   picks them up on its own.
4. Review and roll out; promote to production when it is ready.

## Before the first release

- Create the app in Play Console with package `com.calmcontractiontimer.app`.
- Create the in-app product `pro_unlock` (one-time, non-consumable) and activate it.
- Fill in the store listing, Data safety, content rating, target audience (adults) and the
  health apps declaration from [store-listing.md](store-listing.md).
- Privacy policy URL: `https://github.com/Raman0925/calm-contraction-timer/blob/main/PRIVACY.md`.
