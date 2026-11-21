// SPDX-License-Identifier: Apache-2.0
import { ProController } from './ProController';
import { useProStore } from './proStore';
import { FakeBilling } from './testing/FakeBilling';

const state = () => useProStore.getState();

async function started(billing = new FakeBilling()) {
  const controller = new ProController(billing);
  await controller.start();
  return { billing, controller };
}

describe('ProController', () => {
  beforeEach(() => {
    useProStore.setState({ isPro: false, offer: null, status: 'idle', error: null });
  });

  it('loads the localised offer on start', async () => {
    await started();
    expect(state().offer).toEqual({ title: 'Pro', price: '₹249.00' });
  });

  it('unlocks Pro and acknowledges the purchase', async () => {
    const { billing, controller } = await started();
    await controller.buy();
    expect(state()).toMatchObject({ isPro: true, status: 'idle', error: null });
    expect(billing.acknowledged).toEqual(['GPA.1']);
  });

  it('waits for a pending payment without unlocking', async () => {
    const billing = new FakeBilling();
    billing.nextPurchase = 'pending';
    const { controller } = await started(billing);
    await controller.buy();
    expect(state()).toMatchObject({ isPro: false, status: 'pending' });
    expect(billing.acknowledged).toEqual([]);
  });

  it('returns to idle quietly when the user cancels', async () => {
    const billing = new FakeBilling();
    billing.nextPurchase = 'cancelled';
    const { controller } = await started(billing);
    await controller.buy();
    expect(state()).toMatchObject({ isPro: false, status: 'idle', error: null });
  });

  it('reports other failures', async () => {
    const billing = new FakeBilling();
    billing.nextPurchase = 'network';
    const { controller } = await started(billing);
    await controller.buy();
    expect(state()).toMatchObject({ status: 'error', error: 'network' });
  });

  it('restores an earlier purchase on start and acknowledges it if needed', async () => {
    const billing = new FakeBilling();
    billing.owned = [billing.proPurchase('purchased', false)];
    await started(billing);
    expect(state().isPro).toBe(true);
    expect(billing.acknowledged).toEqual(['GPA.1']);
  });

  it('treats already-owned as a restore', async () => {
    const billing = new FakeBilling();
    billing.nextPurchase = 'already-owned';
    const { controller } = await started(billing);
    billing.owned = [billing.proPurchase('purchased', true)];
    await controller.buy();
    await Promise.resolve();
    expect(state().isPro).toBe(true);
  });

  it('revokes Pro when a restore no longer finds it (refund)', async () => {
    useProStore.setState({ isPro: true });
    const { controller } = await started();
    expect(await controller.restore()).toBe('none');
    expect(state().isPro).toBe(false);
  });

  it('keeps the saved entitlement when the store is unreachable', async () => {
    useProStore.setState({ isPro: true });
    const billing = new FakeBilling();
    billing.connectFails = true;
    await started(billing);
    expect(state().isPro).toBe(true);
  });

  it('keeps the current entitlement when a restore fails', async () => {
    const billing = new FakeBilling();
    billing.owned = [billing.proPurchase('purchased', true)];
    const { controller } = await started(billing);
    billing.ownedPurchases = () => Promise.reject(new Error('offline'));
    expect(await controller.restore()).toBe('error');
    expect(state().isPro).toBe(true);
  });

  it('reacts to errors and pending payments reported by the store', async () => {
    const { billing } = await started();
    billing.listener?.onError('pending');
    expect(state().status).toBe('pending');
    billing.listener?.onError('unavailable');
    expect(state()).toMatchObject({ status: 'error', error: 'unavailable' });
  });

  it('clears a pending state when the payment no longer exists', async () => {
    const billing = new FakeBilling();
    billing.owned = [billing.proPurchase('pending', false)];
    const { controller } = await started(billing);
    expect(state().status).toBe('pending');
    billing.owned = [];
    await controller.restore();
    expect(state()).toMatchObject({ isPro: false, status: 'idle' });
  });

  it('never lets an older restore revoke a purchase that just completed', async () => {
    const billing = new FakeBilling();
    const { controller } = await started(billing);
    // The purchase completes while the store is still answering an earlier "what do I own?".
    billing.ownedPurchases = () => {
      billing.listener?.onPurchase(billing.proPurchase('purchased', true));
      return Promise.resolve([]);
    };
    await controller.restore();
    await Promise.resolve();
    expect(state().isPro).toBe(true);
  });

  it('reconnects later when Google Play was unreachable at launch', async () => {
    const billing = new FakeBilling();
    billing.connectFails = true;
    const { controller } = await started(billing);
    expect(state().offer).toBeNull();
    expect(await controller.restore()).toBe('error');

    billing.connectFails = false;
    await controller.refresh();
    expect(state().offer).toEqual({ title: 'Pro', price: '₹249.00' });
    await controller.buy();
    expect(state().isPro).toBe(true);
  });

  it('stops showing "purchasing" for a purchase in an unknown state', async () => {
    const { billing, controller } = await started();
    billing.buyPro = () => {
      billing.listener?.onPurchase(billing.proPurchase('unknown', false));
      return Promise.resolve();
    };
    await controller.buy();
    await Promise.resolve();
    expect(state().status).toBe('idle');
  });

  it('disconnects from the store', async () => {
    const { billing, controller } = await started();
    await controller.stop();
    expect(billing.listener).toBeNull();
  });

  it('still unlocks when acknowledging fails, to retry later', async () => {
    const billing = new FakeBilling();
    billing.acknowledge = () => Promise.reject(new Error('offline'));
    const { controller } = await started(billing);
    await controller.buy();
    expect(state().isPro).toBe(true);
  });
});
