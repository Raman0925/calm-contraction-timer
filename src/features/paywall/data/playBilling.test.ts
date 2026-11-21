// SPDX-License-Identifier: Apache-2.0
import {
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
} from 'react-native-iap';
import { BillingError } from './billingService';
import { PlayBilling, toErrorKind } from './playBilling';

const androidPurchase = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'GPA.1',
    productId: 'pro_unlock',
    purchaseState: 'purchased',
    isAcknowledgedAndroid: false,
    ...overrides,
  }) as unknown as Purchase;

describe('PlayBilling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('relays purchases and errors from Google Play', async () => {
    const billing = new PlayBilling();
    const listener = { onPurchase: jest.fn(), onError: jest.fn() };
    await billing.connect(listener);

    jest.mocked(purchaseUpdatedListener).mock.calls[0]?.[0](androidPurchase());
    jest.mocked(purchaseErrorListener).mock.calls[0]?.[0]({
      code: ErrorCode.UserCancelled,
      message: 'cancelled',
    });

    expect(listener.onPurchase).toHaveBeenCalledWith({
      id: 'GPA.1',
      productId: 'pro_unlock',
      state: 'purchased',
      acknowledged: false,
    });
    expect(listener.onError).toHaveBeenCalledWith('cancelled');
  });

  it('acknowledges a purchase as non-consumable', async () => {
    const raw = androidPurchase();
    jest.mocked(getAvailablePurchases).mockResolvedValueOnce([raw]);
    const billing = new PlayBilling();
    const [owned] = await billing.ownedPurchases();
    await billing.acknowledge(owned!);
    expect(finishTransaction).toHaveBeenCalledWith({ purchase: raw, isConsumable: false });
  });

  it('refuses to acknowledge a purchase it has not seen', async () => {
    await expect(
      new PlayBilling().acknowledge({
        id: 'x',
        productId: 'pro_unlock',
        state: 'purchased',
        acknowledged: false,
      }),
    ).rejects.toBeInstanceOf(BillingError);
  });

  it('requests the Pro product as an in-app purchase', async () => {
    await new PlayBilling().buyPro();
    expect(requestPurchase).toHaveBeenCalledWith({
      request: { google: { skus: ['pro_unlock'] } },
      type: 'in-app',
    });
  });

  it('turns a rejected purchase into a reason', async () => {
    jest.mocked(requestPurchase).mockRejectedValueOnce({ code: ErrorCode.NetworkError });
    await expect(new PlayBilling().buyPro()).rejects.toMatchObject({ kind: 'network' });
  });

  it('reads the localised price', async () => {
    jest
      .mocked(fetchProducts)
      .mockResolvedValueOnce([
        { id: 'pro_unlock', title: 'Pro', displayPrice: '₹249.00' },
      ] as never);
    expect(await new PlayBilling().fetchPro()).toEqual({ title: 'Pro', price: '₹249.00' });
  });

  it('maps unknown codes to a general failure', () => {
    expect(toErrorKind(undefined)).toBe('failed');
    expect(toErrorKind(ErrorCode.Pending)).toBe('pending');
  });
});
