// SPDX-License-Identifier: Apache-2.0
import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  AgeRestrictedTreatment,
  MaxAdContentRating,
  type AdsConsentInfo,
} from 'react-native-google-mobile-ads';
import type { AdsService, ConsentState } from './adsService';

const toConsentState = (info: AdsConsentInfo): ConsentState => ({
  canRequestAds: info.canRequestAds,
  privacyOptionsRequired:
    info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
});

/** Google Mobile Ads with the User Messaging Platform for consent. */
export const googleAds: AdsService = {
  async cachedConsent() {
    return toConsentState(await AdsConsent.getConsentInfo());
  },

  async gatherConsent() {
    await AdsConsent.requestInfoUpdate();
    try {
      return toConsentState(await AdsConsent.loadAndShowConsentFormIfRequired());
    } catch (error) {
      // The form could not be shown (e.g. no Activity). The update above may still have
      // changed what is allowed, so report UMP's current answer rather than an old one.
      console.warn('Consent form was not shown', error);
      return toConsentState(await AdsConsent.getConsentInfo());
    }
  },

  async initialize() {
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.G,
      // The app is for adults: not child-directed and no age-specific treatment.
      ageRestrictedTreatment: AgeRestrictedTreatment.UNSPECIFIED,
    });
    await mobileAds().initialize();
  },

  async showPrivacyOptions() {
    return toConsentState(await AdsConsent.showPrivacyOptionsForm());
  },
};
