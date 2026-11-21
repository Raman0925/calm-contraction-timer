// SPDX-License-Identifier: Apache-2.0

/** What Google's consent tool (UMP) currently allows. */
export interface ConsentState {
  /** Ads may be requested (consent given, or not required where the user is). */
  canRequestAds: boolean;
  /** The law requires a way to change the choice later, e.g. in the EEA and UK. */
  privacyOptionsRequired: boolean;
}

/**
 * Consent and ads SDK, behind an interface so tests use a fake and ad
 * failures stay contained. Implemented with react-native-google-mobile-ads.
 */
export interface AdsService {
  /** Consent stored from an earlier session; no network, no UI. */
  cachedConsent(): Promise<ConsentState>;
  /** Refreshes consent information and shows the consent form when it is required. */
  gatherConsent(): Promise<ConsentState>;
  /** Configures and starts the ads SDK. Call only once consent allows ads. */
  initialize(): Promise<void>;
  /** Shows the form for changing the consent choice. */
  showPrivacyOptions(): Promise<ConsentState>;
}
