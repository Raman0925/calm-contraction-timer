// SPDX-License-Identifier: Apache-2.0
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { BillingService } from '../data/billingService';
import { ProController, type RestoreResult } from '../data/ProController';
import { useProStore, type ProState } from '../data/proStore';

const ControllerContext = createContext<ProController | null>(null);

/** Runs the Pro purchase lifecycle for the app's lifetime. */
export function ProProvider({
  billing,
  children,
}: {
  billing: BillingService;
  children: ReactNode;
}) {
  const controller = useMemo(() => new ProController(billing), [billing]);

  useEffect(() => {
    // Both methods catch their own errors; billing can never break the app.
    controller.start().catch(() => undefined);
    return () => {
      controller.stop().catch(() => undefined);
    };
  }, [controller]);

  return <ControllerContext.Provider value={controller}>{children}</ControllerContext.Provider>;
}

/** Pro state and actions for screens. */
export interface ProViewState extends ProState {
  buy: () => void;
  /** Asks Google Play what this account owns. */
  restore: () => Promise<RestoreResult>;
  /** Reconnects and loads the price if an earlier attempt failed. Stable across renders. */
  refresh: () => void;
}

/** Reads Pro state; actions do nothing outside {@link ProProvider}. */
export function usePro(): ProViewState {
  const controller = useContext(ControllerContext);
  const state = useProStore();
  const refresh = useCallback(() => {
    controller?.refresh().catch(() => undefined);
  }, [controller]);
  return {
    ...state,
    buy: () => {
      controller?.buy().catch(() => undefined);
    },
    restore: () => controller?.restore() ?? Promise.resolve<RestoreResult>('error'),
    refresh,
  };
}

/** Whether Pro is unlocked. */
export const useIsPro = (): boolean => useProStore(state => state.isPro);
