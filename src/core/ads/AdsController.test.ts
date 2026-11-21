// SPDX-License-Identifier: Apache-2.0
import { AdsController } from './AdsController';
import { useAdsStore } from './adsStore';
import { FakeAds } from './testing/FakeAds';

const state = () => useAdsStore.getState();

describe('AdsController', () => {
  beforeEach(() => {
    useAdsStore.setState({ canRequestAds: false, ready: false, privacyOptionsRequired: false });
  });

  it('starts the SDK once consent allows ads', async () => {
    const ads = new FakeAds();
    await new AdsController(ads).start();
    expect(state()).toEqual({ canRequestAds: true, ready: true, privacyOptionsRequired: false });
    expect(ads.initializeCalls).toBe(1);
  });

  it('uses consent from the last session and initialises only once', async () => {
    const ads = new FakeAds();
    ads.cached = { canRequestAds: true, privacyOptionsRequired: true };
    ads.fresh = { canRequestAds: true, privacyOptionsRequired: true };
    await new AdsController(ads).start();
    expect(ads.initializeCalls).toBe(1);
    expect(state().privacyOptionsRequired).toBe(true);
  });

  it('never starts the SDK without consent', async () => {
    const ads = new FakeAds();
    ads.fresh = { canRequestAds: false, privacyOptionsRequired: true };
    await new AdsController(ads).start();
    expect(state()).toMatchObject({ canRequestAds: false, ready: false });
    expect(ads.initializeCalls).toBe(0);
  });

  it('runs the consent flow only once per launch', async () => {
    const ads = new FakeAds();
    const controller = new AdsController(ads);
    await controller.start();
    await controller.start();
    expect(ads.gatherCalls).toBe(1);
  });

  it('keeps working when consent cannot be gathered', async () => {
    const ads = new FakeAds();
    ads.failGather = true;
    await expect(new AdsController(ads).start()).resolves.toBeUndefined();
    expect(state().ready).toBe(false);
  });

  it('never lets a late stored answer override fresh consent', async () => {
    const ads = new FakeAds();
    ads.cached = { canRequestAds: true, privacyOptionsRequired: false };
    ads.fresh = { canRequestAds: false, privacyOptionsRequired: true };
    let releaseCached: () => void = () => undefined;
    ads.cachedConsent = () =>
      new Promise(resolve => {
        releaseCached = () => {
          resolve(ads.cached);
        };
      });
    const started = new AdsController(ads).start();
    await Promise.resolve();
    await Promise.resolve();
    releaseCached();
    await started;
    expect(state()).toMatchObject({ canRequestAds: false, privacyOptionsRequired: true });
  });

  it('tries again after gathering consent failed', async () => {
    const ads = new FakeAds();
    ads.failGather = true;
    const controller = new AdsController(ads);
    await controller.start();
    ads.failGather = false;
    await controller.start();
    expect(ads.gatherCalls).toBe(2);
    expect(state().ready).toBe(true);
  });

  it('applies a changed choice from the privacy options form', async () => {
    const ads = new FakeAds();
    ads.afterPrivacyOptions = { canRequestAds: false, privacyOptionsRequired: true };
    const controller = new AdsController(ads);
    await controller.start();
    await controller.showPrivacyOptions();
    expect(state()).toMatchObject({ canRequestAds: false, privacyOptionsRequired: true });
  });
});
