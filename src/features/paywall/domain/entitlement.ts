// SPDX-License-Identifier: Apache-2.0

/** A purchase as the store reports it, without any store SDK types. */
export interface StorePurchase {
  /** Store transaction id. */
  id: string;
  productId: string;
  state: 'pending' | 'purchased' | 'unknown';
  /** Google Play refunds purchases that are not acknowledged within 3 days. */
  acknowledged: boolean;
}

/** Why a purchase or store call did not complete. */
export type BillingErrorKind =
  'cancelled' | 'pending' | 'already-owned' | 'unavailable' | 'network' | 'failed';

/** What the owned purchases mean for the Pro unlock. */
export type ProOwnership = 'owned' | 'pending' | 'none';

/** Reads Pro ownership from the purchases the store returned. */
export function proOwnership(purchases: readonly StorePurchase[], productId: string): ProOwnership {
  const pro = purchases.filter(purchase => purchase.productId === productId);
  if (pro.some(purchase => purchase.state === 'purchased')) {
    return 'owned';
  }
  return pro.some(purchase => purchase.state === 'pending') ? 'pending' : 'none';
}

/** Purchases of `productId` that are paid for but not yet acknowledged. */
export function needsAcknowledgement(
  purchases: readonly StorePurchase[],
  productId: string,
): StorePurchase[] {
  return purchases.filter(
    purchase =>
      purchase.productId === productId && purchase.state === 'purchased' && !purchase.acknowledged,
  );
}
