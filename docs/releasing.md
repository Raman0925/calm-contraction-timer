# Releasing

## How a release happens

1. Commits on `main` follow Conventional Commits. **release-please** keeps a release PR open
   that bumps `package.json` (and with it the Android `versionName`/`versionCode`) and
   updates `CHANGELOG.md`.
2. Merging that PR creates the tag `vX.Y.Z` and a GitHub Release.
3. The tag starts the **Release** workflow, which waits for approval in the `production`
   environment (Settings → Environments; only `v*` tags may deploy there).
4. After approval the **build** job makes the signed app bundle and checks that every native
   library is 16 KB aligned. A separate **publish** job, which runs no project code, gets a
   short-lived Google token, uploads the bundle to the Google Play **internal** track with the
   R8 mapping file and native debug symbols, and attaches the bundle and mapping to the GitHub
   Release.

Without `RELEASE_PLEASE_TOKEN`, GitHub does not start workflows for the tag that
release-please creates. Then start it by hand: **Actions → Release → Run workflow**, and under
**Use workflow from** choose the tag (for example `v1.2.0`). The workflow refuses to run from
anything but a version tag.

## Secrets and variables

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

Add these under **Settings → Secrets and variables → Actions → Variables**. They are
identifiers, not credentials:

| Variable                         | What it is                                  |
| -------------------------------- | ------------------------------------------- |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full name of the Workload Identity provider |
| `GCP_SERVICE_ACCOUNT`            | Email of the service account that publishes |
| `PLAY_RELEASE_STATUS`            | Optional; `draft` until the first publish   |

Google Play only accepts draft releases for an app that has never been published, so set
`PLAY_RELEASE_STATUS` to `draft` until then.

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

### Google Play access without a key file (Workload Identity Federation)

GitHub's OIDC token is exchanged for short-lived Google credentials, so no service-account key
exists anywhere. Google only accepts tokens from this repository's `v*` tags.

```sh
PROJECT_ID=your-project
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
REPO=Raman0925/calm-contraction-timer

gcloud services enable androidpublisher.googleapis.com iamcredentials.googleapis.com \
  --project "$PROJECT_ID"
gcloud iam service-accounts create play-publisher --project "$PROJECT_ID"

gcloud iam workload-identity-pools create github --location=global --project "$PROJECT_ID"
gcloud iam workload-identity-pools providers create-oidc github \
  --location=global --workload-identity-pool=github --project "$PROJECT_ID" \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping=google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref \
  --attribute-condition="assertion.repository=='$REPO' && assertion.ref.startsWith('refs/tags/v')"

gcloud iam service-accounts add-iam-policy-binding \
  "play-publisher@$PROJECT_ID.iam.gserviceaccount.com" --project "$PROJECT_ID" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$REPO"
```

- `GCP_WORKLOAD_IDENTITY_PROVIDER` =
  `projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github/providers/github`
- `GCP_SERVICE_ACCOUNT` = `play-publisher@<PROJECT_ID>.iam.gserviceaccount.com`

In **Play Console → Users and permissions**, invite that service account email and give it
**Release to testing tracks** for this app.

### release-please token (optional)

A fine-grained personal access token limited to this repository with **Contents** and **Pull
requests** read/write. With it, the release PR runs CI and the release tag starts the Release
workflow automatically.

## Before the first release

- Create the app in Play Console with package `com.calmcontractiontimer.app`, and upload the
  first bundle by hand (download it from the workflow's `release-bundle` artifact, or build
  locally with the secrets set). The Play API only updates apps that already exist.
- Create the in-app product `pro_unlock` (one-time, non-consumable) and activate it.
- Fill in the store listing, Data safety, content rating, target audience (adults) and the
  health apps declaration from [store-listing.md](store-listing.md).
- Privacy policy URL: `https://github.com/Raman0925/calm-contraction-timer/blob/main/PRIVACY.md`.
