// SPDX-License-Identifier: Apache-2.0
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStateStorage } from '@core/storage/mmkv';
import type { BillingErrorKind } from '../domain/entitlement';
import type { ProOffer } from './billingService';

/** Where the purchase flow is. */
export type ProStatus = 'idle' | 'purchasing' | 'pending' | 'error';

/** Pro entitlement and purchase flow state. Only `isPro` is persisted. */
export interface ProState {
  isPro: boolean;
  offer: ProOffer | null;
  status: ProStatus;
  error: BillingErrorKind | null;
}

/** Pro state store. The entitlement survives restarts and works offline. */
export const useProStore = create<ProState>()(
  persist((): ProState => ({ isPro: false, offer: null, status: 'idle', error: null }), {
    name: 'pro',
    version: 1,
    storage: createJSONStorage(() => mmkvStateStorage),
    partialize: state => ({ isPro: state.isPro }),
  }),
);
