# Google Play store listing (draft)

Copy these into Play Console. Brand assets are in `assets/brand/play/`; regenerate the icon
and feature graphic with `npm run brand:render`, and the screenshots with the
**Screenshots** workflow (Actions → Screenshots → Run workflow).

## Main store listing

**App name** (30 max)

Calm Contraction Timer

**Short description** (80 max)

Time contractions with one tap. See your 5-1-1 pattern. Private, no account.

**Full description** (4000 max)

When labour starts, you need a timer that just works. Calm Contraction Timer is one big
button, big numbers and nothing in the way.

TIME CONTRACTIONS WITH ONE TAP
• Tap Start when a contraction begins and Stop when it ends.
• See how long it lasted and how long since the last one started.
• Start and Stop from the lock screen notification, even when the app is closed.
• Made a mistake? Every tap can be undone for 5 seconds, and any entry can be edited later.

SEE THE PATTERN
• Average length and frequency over the last hour.
• A calm, neutral note when your contractions match your setting, such as 5-1-1
(5 minutes apart, 1 minute long, for 1 hour). 4-1-1, 7-1-1 or your own values.
• History groups contractions into sessions, with charts and every contraction listed.
• Add intensity and a note to any contraction.

MADE FOR 3 AM
• A true-black night theme with dim amber colours that switches on by itself at night.
• Keeps the screen on while you time.
• Works with large text, screen readers and "Remove animations".
• Save the number of your midwife or maternity unit and call it from the timer.

PRIVATE BY DESIGN
• No account and no cloud: your contractions are stored on your phone and never uploaded.
• No ads on the timer, ever. The free version shows one small Google AdMob banner in History.
• Open source: anyone can check what the app does.

PRO (ONE-TIME PURCHASE, NO SUBSCRIPTION)
• Doctor report (PDF) with summary, chart and full table to share with your midwife.
• Back up to a file and restore it, for example on a new phone.
• No ads.
The spreadsheet (CSV) export is free for everyone.

IMPORTANT
Calm Contraction Timer records the times you enter. It is not a medical device and does not
give medical advice, diagnose or tell you when to seek care. Always follow the advice of your
midwife, doctor or maternity unit, and contact them or the emergency services whenever you
are worried.

## Graphics

| Asset                           | File                                             |
| ------------------------------- | ------------------------------------------------ |
| App icon (512 × 512)            | `assets/brand/play/icon-512.png`                 |
| Feature graphic (1024 × 500)    | `assets/brand/play/feature-graphic-1024x500.png` |
| Phone screenshots (1080 × 1920) | `assets/brand/play/screenshots/`                 |

Suggested screenshot order and captions:

1. `01-timer-pattern` — See your pattern at a glance
2. `02-timer-contracting` — One big button, big numbers
3. `03-history` — Every session, kept on your phone
4. `04-session` — Length, frequency and rest for every contraction
5. `05-session-charts` — Clear charts to share with your midwife
6. `07-night` — A true-black night theme for 3 AM
7. `06-onboarding` — Simple from the first tap

## Categorisation and contact

- **Category:** Health & Fitness (alternative: Parenting). Not "Medical", which is meant for
  apps for healthcare professionals.
- **Tags:** pregnancy, labour, contractions, timer.
- **Contact email:** a support address you will monitor (required by Play).
- **Privacy policy:** `https://github.com/Raman0925/calm-contraction-timer/blob/main/PRIVACY.md`

## App content declarations

- **Target audience:** 18 and over. Not designed for children.
- **Ads:** Yes, contains ads (free version, History screen only).
- **Content rating:** no violence, sexuality, language, gambling or user-to-user contact.
  Shares no location. The app has a medical disclaimer and gives no medical advice.
- **Health apps declaration:** a pregnancy/labour tracking feature for personal use. It is not
  a medical device and is not used for diagnosis or treatment.
- **Data safety:**
  - Health info (contraction times and notes): **not collected** (stays on the device;
    exports and backups go only where the user sends them).
  - Device or other IDs (advertising ID), approximate location, app interactions, crash
    and performance diagnostics: **collected and shared** by Google AdMob, for advertising
    and fraud prevention, in the free version.
  - Purchase history: Google Play processes the Pro purchase.
  - Data is encrypted in transit (AdMob, Google Play). Users can delete all app data in
    **Settings → Delete all contractions** or by uninstalling.
