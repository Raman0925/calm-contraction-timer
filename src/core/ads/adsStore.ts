// SPDX-License-Identifier: Apache-2.0
import { create } from 'zustand';

/** Whether ads may be shown right now. Not persisted: consent lives in the UMP SDK. */
export interface AdsState {
  canRequestAds: boolean;
  /** The ads SDK has finished initialising. */
  ready: boolean;
  privacyOptionsRequired: boolean;
}

export const useAdsStore = create<AdsState>()(() => ({
  canRequestAds: false,
  ready: false,
  privacyOptionsRequired: false,
}));
