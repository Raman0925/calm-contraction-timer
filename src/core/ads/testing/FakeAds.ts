// SPDX-License-Identifier: Apache-2.0
import type { AdsService, ConsentState } from '../adsService';

/** Scriptable consent and ads SDK for tests. */
export class FakeAds implements AdsService {
  cached: ConsentState = { canRequestAds: false, privacyOptionsRequired: false };
  fresh: ConsentState = { canRequestAds: true, privacyOptionsRequired: false };
  afterPrivacyOptions: ConsentState = { canRequestAds: true, privacyOptionsRequired: true };
  initializeCalls = 0;
  gatherCalls = 0;
  failGather = false;

  cachedConsent(): Promise<ConsentState> {
    return Promise.resolve(this.cached);
  }

  gatherConsent(): Promise<ConsentState> {
    this.gatherCalls += 1;
    return this.failGather ? Promise.reject(new Error('offline')) : Promise.resolve(this.fresh);
  }

  initialize(): Promise<void> {
    this.initializeCalls += 1;
    return Promise.resolve();
  }

  showPrivacyOptions(): Promise<ConsentState> {
    return Promise.resolve(this.afterPrivacyOptions);
  }
}
