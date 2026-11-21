// SPDX-License-Identifier: Apache-2.0
import type { BillingErrorKind, StorePurchase } from '../../domain/entitlement';
import {
  BillingError,
  type BillingListener,
  type BillingService,
  type ProOffer,
} from '../billingService';

/** Scriptable store for tests: set what it owns and what the next purchase does. */
export class FakeBilling implements BillingService {
  listener: BillingListener | null = null;
  owned: StorePurchase[] = [];
  offer: ProOffer | null = { title: 'Pro', price: '₹249.00' };
  acknowledged: string[] = [];
  /** What `buyPro` does next: complete, go pending, or fail with a reason. */
  nextPurchase: 'purchased' | 'pending' | BillingErrorKind = 'purchased';
  connectFails = false;

  connect(listener: BillingListener): Promise<void> {
    if (this.connectFails) {
      return Promise.reject(new BillingError('unavailable'));
    }
    this.listener = listener;
    return Promise.resolve();
  }

  disconnect(): Promise<void> {
    this.listener = null;
    return Promise.resolve();
  }

  fetchPro(): Promise<ProOffer | null> {
    return Promise.resolve(this.offer);
  }

  /** Like Google Play: store outcomes, including errors, arrive through the listener. */
  buyPro(): Promise<void> {
    const outcome = this.nextPurchase;
    if (outcome !== 'purchased' && outcome !== 'pending') {
      this.listener?.onError(outcome);
      return Promise.resolve();
    }
    const purchase = this.proPurchase(outcome, false);
    this.owned = [purchase];
    this.listener?.onPurchase(purchase);
    return Promise.resolve();
  }

  ownedPurchases(): Promise<StorePurchase[]> {
    return Promise.resolve(this.owned);
  }

  acknowledge(purchase: StorePurchase): Promise<void> {
    this.acknowledged.push(purchase.id);
    this.owned = this.owned.map(p => (p.id === purchase.id ? { ...p, acknowledged: true } : p));
    return Promise.resolve();
  }

  /** A Pro purchase in the given state. */
  proPurchase(state: StorePurchase['state'], acknowledged: boolean): StorePurchase {
    return { id: 'GPA.1', productId: 'pro_unlock', state, acknowledged };
  }
}
