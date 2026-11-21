// SPDX-License-Identifier: Apache-2.0
import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';
import { googleAds } from './googleAds';

describe('googleAds', () => {
  it('refreshes consent, then shows the form only if required', async () => {
    jest.mocked(AdsConsent.loadAndShowConsentFormIfRequired).mockResolvedValueOnce({
      canRequestAds: true,
      privacyOptionsRequirementStatus: 'REQUIRED',
    } as never);
    expect(await googleAds.gatherConsent()).toEqual({
      canRequestAds: true,
      privacyOptionsRequired: true,
    });
    expect(AdsConsent.requestInfoUpdate).toHaveBeenCalled();
  });

  it('reports the current consent when the form cannot be shown', async () => {
    jest
      .mocked(AdsConsent.loadAndShowConsentFormIfRequired)
      .mockRejectedValueOnce(new Error('null-activity'));
    jest.mocked(AdsConsent.getConsentInfo).mockResolvedValueOnce({
      canRequestAds: false,
      privacyOptionsRequirementStatus: 'REQUIRED',
    } as never);
    expect(await googleAds.gatherConsent()).toEqual({
      canRequestAds: false,
      privacyOptionsRequired: true,
    });
  });

  it('reads stored consent and the privacy options form result', async () => {
    expect(await googleAds.cachedConsent()).toEqual({
      canRequestAds: false,
      privacyOptionsRequired: false,
    });
    expect(await googleAds.showPrivacyOptions()).toEqual({
      canRequestAds: false,
      privacyOptionsRequired: false,
    });
  });

  it('asks only for general-audience ads and does not tag users as children', async () => {
    const sdk = {
      setRequestConfiguration: jest.fn(() => Promise.resolve()),
      initialize: jest.fn(() => Promise.resolve([])),
    };
    jest.mocked(mobileAds).mockReturnValue(sdk as never);
    await googleAds.initialize();
    expect(sdk.setRequestConfiguration).toHaveBeenCalledWith({
      maxAdContentRating: 'G',
      ageRestrictedTreatment: 'unspecified',
    });
    expect(sdk.initialize).toHaveBeenCalled();
  });
});
