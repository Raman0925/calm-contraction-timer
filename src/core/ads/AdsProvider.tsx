// SPDX-License-Identifier: Apache-2.0
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { AdsController } from './AdsController';
import type { AdsService } from './adsService';
import { useAdsStore } from './adsStore';

const ControllerContext = createContext<AdsController | null>(null);

interface AdsProviderProps {
  ads: AdsService;
  /** False for Pro users and before onboarding: no consent form and no ads SDK. */
  enabled: boolean;
  children: ReactNode;
}

/** Runs the consent flow once per launch for users who can see ads. */
export function AdsProvider({ ads, enabled, children }: AdsProviderProps) {
  const controller = useMemo(() => new AdsController(ads), [ads]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const start = () => {
      controller.start().catch(() => undefined);
    };
    start();
    // If consent could not be gathered (offline, no Activity), try again on return.
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        start();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [controller, enabled]);

  return <ControllerContext.Provider value={controller}>{children}</ControllerContext.Provider>;
}

/** Whether a banner may be shown, and the privacy options entry point. */
export function useAds() {
  const controller = useContext(ControllerContext);
  const canShowAds = useAdsStore(state => state.ready && state.canRequestAds);
  const privacyOptionsRequired = useAdsStore(state => state.privacyOptionsRequired);
  const showPrivacyOptions = useCallback(() => {
    controller?.showPrivacyOptions().catch(() => undefined);
  }, [controller]);
  return { canShowAds, privacyOptionsRequired, showPrivacyOptions };
}
