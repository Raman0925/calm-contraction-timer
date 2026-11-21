# Changelog

## [0.2.0](https://github.com/Raman0925/calm-contraction-timer/compare/v0.1.0...v0.2.0) (2026-11-21)


### Features

* **ads:** add UMP consent and a single History banner for free users ([9f3f634](https://github.com/Raman0925/calm-contraction-timer/commit/9f3f634e38a189a870dc1cfd98357c4a5c0c0f63))
* **backup:** back up to a file and restore from one (Pro) ([333a964](https://github.com/Raman0925/calm-contraction-timer/commit/333a9648c4f9cf27c129543c6e8e79a17a796d6b))
* bootstrap app with design system, themes, navigation and i18n ([3524496](https://github.com/Raman0925/calm-contraction-timer/commit/3524496564f87c3063ec5f706727e986b604c4d1))
* **brand:** add the app icon, adaptive launcher icon and Play Store artwork ([c7129ff](https://github.com/Raman0925/calm-contraction-timer/commit/c7129ff3d6ebfc0473931f27a3096f2bd857c145))
* **db:** add atomic batch writes and replaceAll to the repository ([f7bc7ec](https://github.com/Raman0925/calm-contraction-timer/commit/f7bc7ec92ba25f2897c6b0ca4c0cbd3209d6f2d0))
* **db:** add SQLite schema, bundled migrations and crash-safe migrator ([4b9d553](https://github.com/Raman0925/calm-contraction-timer/commit/4b9d5536d451294c233d8839d362ba413652a2e0))
* **design:** add chart, session card, dialog and form components ([140c887](https://github.com/Raman0925/calm-contraction-timer/commit/140c887d1def006f1a6b58e5513cf8e30c80b829))
* **design:** add timer components ([e3414df](https://github.com/Raman0925/calm-contraction-timer/commit/e3414df8c3744c56eff3b2a5008c069fefc3d6c7))
* **export:** add CSV and PDF doctor report export ([713b8b6](https://github.com/Raman0925/calm-contraction-timer/commit/713b8b6f3ef801e4bc4c323760cab02034f21317))
* **history:** add session list, session detail with charts, and editing ([8b29630](https://github.com/Raman0925/calm-contraction-timer/commit/8b29630e205246d4fe3d2bc13d0d9a5bdd4cac37))
* **native:** add KeepAwake TurboModule and haptics ([b414e7c](https://github.com/Raman0925/calm-contraction-timer/commit/b414e7c0b1c45a3f143653c51f69ffba3a457038))
* **notification:** show the session as a Live Update on Android 16+ ([940e799](https://github.com/Raman0925/calm-contraction-timer/commit/940e799bbf17b055ab73b5e2b71e7b300aac1247))
* **onboarding:** add onboarding that ends with the medical disclaimer ([93d45f8](https://github.com/Raman0925/calm-contraction-timer/commit/93d45f894bb16e600dfd5f994c778bb38faa2fe5))
* **pro:** add one-time Pro unlock with Google Play Billing ([c49a9b6](https://github.com/Raman0925/calm-contraction-timer/commit/c49a9b6300aee205149554fc3d9455e07fe11578))
* **settings:** add pattern, phone numbers, data, about and licences ([94c0b6e](https://github.com/Raman0925/calm-contraction-timer/commit/94c0b6e65c58553cbe41491cf118ee5e813f50bf))
* **timer:** add contraction domain model and computeStats ([c86e263](https://github.com/Raman0925/calm-contraction-timer/commit/c86e263ac2586bcc1a72053c2d5e5f3f83d0a070))
* **timer:** add contraction repository ([4f49ba9](https://github.com/Raman0925/calm-contraction-timer/commit/4f49ba98e1635d98b13f03f83d28d986bc74464f))
* **timer:** add ongoing session notification with lock-screen Start/Stop ([e5133cc](https://github.com/Raman0925/calm-contraction-timer/commit/e5133ccbf110158e907b49289d776af8e42d9f61))
* **timer:** add timer screen with live stats, undo and recovery ([4c15980](https://github.com/Raman0925/calm-contraction-timer/commit/4c15980bc83ff30c2514668d8bd91619c2c0c70e))


### Bug Fixes

* **a11y:** keep stat captions whole and tab labels clear at large text ([b88606e](https://github.com/Raman0925/calm-contraction-timer/commit/b88606e64d03c73ae91719e0768d3ec5f246e5bb))
* **android:** drop storage and download permissions added by react-native-blob-util ([8bc9d41](https://github.com/Raman0925/calm-contraction-timer/commit/8bc9d41896d40b9c34d49921f11213c5008efe5c))
* **brand:** give themed icons their own monochrome layer ([5f81932](https://github.com/Raman0925/calm-contraction-timer/commit/5f81932fa131e446d3569fdb5233e8e65b87d7f5))
* **charts:** fit the y axis to the data instead of always four sections ([f39aa52](https://github.com/Raman0925/calm-contraction-timer/commit/f39aa521f917823ed4d3696628834fa5b09d5b53))
* **ci:** make gradlew executable and stop major-version Dependabot PRs ([54e136b](https://github.com/Raman0925/calm-contraction-timer/commit/54e136ba759c3a13a6929f4c567da080d025fe27))
* **db:** run Drizzle through sqlite-proxy so queries work with op-sqlite 19 ([4521492](https://github.com/Raman0925/calm-contraction-timer/commit/452149244de91709d97d61cd78f741a02b02d559))
* **notification:** promote only the notification just posted, on Android 16 QPR2+ ([29d1c46](https://github.com/Raman0925/calm-contraction-timer/commit/29d1c46ca8d80a36240dc01e1b7b8a2407633fac))
