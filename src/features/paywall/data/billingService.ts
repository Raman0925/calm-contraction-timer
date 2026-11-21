// SPDX-License-Identifier: Apache-2.0
import type { BillingErrorKind, StorePurchase } from '../domain/entitlement';

/** The Pro product as the store sells it in the user's country. */
export interface ProOffer {
  title: string;
  /** Localised price, e.g. "₹249.00". */
  price: string;
}

/** A store failure with a reason the UI can explain. */
export class BillingError extends Error {
  constructor(
    readonly kind: BillingErrorKind,
    message?: string,
  ) {
    super(message ?? kind);
    this.name = 'BillingError';
  }
}

/** Store events delivered while connected. */
export interface BillingListener {
  onPurchase(purchase: StorePurchase): void;
  onError(kind: BillingErrorKind): void;
}

/**
 * The store, behind an interface so tests use a fake and the app never
 * depends on billing to work. Implemented with react-native-iap.
 */
export interface BillingService {
  connect(listener: BillingListener): Promise<void>;
  disconnect(): Promise<void>;
  fetchPro(): Promise<ProOffer | null>;
  /** Starts the purchase flow; the result arrives through the listener. */
  buyPro(): Promise<void>;
  /** Owned and pending purchases. */
  ownedPurchases(): Promise<StorePurchase[]>;
  /** Acknowledges a non-consumable purchase. */
  acknowledge(purchase: StorePurchase): Promise<void>;
}
