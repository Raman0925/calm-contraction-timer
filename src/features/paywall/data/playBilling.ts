// SPDX-License-Identifier: Apache-2.0
import {
  ErrorCode,
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type EventSubscription,
  type Purchase,
} from 'react-native-iap';
import { PRO_PRODUCT_ID } from '@core/config';
import type { BillingErrorKind, StorePurchase } from '../domain/entitlement';
import { BillingError, type BillingService } from './billingService';

const ERROR_KINDS: Partial<Record<ErrorCode, BillingErrorKind>> = {
  [ErrorCode.UserCancelled]: 'cancelled',
  [ErrorCode.Pending]: 'pending',
  [ErrorCode.AlreadyOwned]: 'already-owned',
  [ErrorCode.NetworkError]: 'network',
  [ErrorCode.BillingUnavailable]: 'unavailable',
  [ErrorCode.ItemUnavailable]: 'unavailable',
  [ErrorCode.ServiceError]: 'unavailable',
};

/** Maps a store error code to a reason the app can explain. */
export const toErrorKind = (code: ErrorCode | undefined): BillingErrorKind =>
  (code && ERROR_KINDS[code]) ?? 'failed';

function errorCode(error: unknown): ErrorCode | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error;
    return Object.values(ErrorCode).find(value => value === code);
  }
  return undefined;
}

/**
 * Google Play Billing through react-native-iap. Keeps the SDK's purchase
 * objects internally, so the rest of the app only sees {@link StorePurchase}.
 */
export class PlayBilling implements BillingService {
  private readonly raw = new Map<string, Purchase>();
  private subscriptions: EventSubscription[] = [];

  private toStorePurchase(purchase: Purchase): StorePurchase {
    this.raw.set(purchase.id, purchase);
    return {
      id: purchase.id,
      productId: purchase.productId,
      state: purchase.purchaseState,
      acknowledged: 'isAcknowledgedAndroid' in purchase && purchase.isAcknowledgedAndroid === true,
    };
  }

  async connect(listener: Parameters<BillingService['connect']>[0]): Promise<void> {
    await initConnection();
    this.subscriptions = [
      purchaseUpdatedListener(purchase => {
        listener.onPurchase(this.toStorePurchase(purchase));
      }),
      purchaseErrorListener(error => {
        listener.onError(toErrorKind(error.code));
      }),
    ];
  }

  async disconnect(): Promise<void> {
    this.subscriptions.forEach(subscription => {
      subscription.remove();
    });
    this.subscriptions = [];
    await endConnection();
  }

  async fetchPro() {
    const products = await fetchProducts({ skus: [PRO_PRODUCT_ID], type: 'in-app' });
    const pro = products?.find(product => product.id === PRO_PRODUCT_ID);
    return pro ? { title: pro.title, price: pro.displayPrice } : null;
  }

  async buyPro(): Promise<void> {
    try {
      await requestPurchase({ request: { google: { skus: [PRO_PRODUCT_ID] } }, type: 'in-app' });
    } catch (error) {
      throw new BillingError(toErrorKind(errorCode(error)));
    }
  }

  async ownedPurchases(): Promise<StorePurchase[]> {
    const purchases = await getAvailablePurchases();
    return purchases.map(purchase => this.toStorePurchase(purchase));
  }

  async acknowledge(purchase: StorePurchase): Promise<void> {
    const raw = this.raw.get(purchase.id);
    if (!raw) {
      throw new BillingError('failed', `Unknown purchase ${purchase.id}`);
    }
    await finishTransaction({ purchase: raw, isConsumable: false });
  }
}
