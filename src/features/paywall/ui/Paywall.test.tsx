// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen } from '@testing-library/react-native';
import { App } from '@app/App';
import { createTestServices } from '@features/timer/ui/testing/createTestServices';
import { useProStore } from '../data/proStore';
import { FakeBilling } from '../data/testing/FakeBilling';

async function openPaywall(billing: FakeBilling) {
  const setup = await createTestServices();
  await render(<App services={setup.services} billing={billing} />);
  await screen.findByTestId('timer-screen');
  await fireEvent.press(screen.getByRole('button', { name: /Settings/ }));
  await fireEvent.press(await screen.findByTestId('open-paywall'));
  await screen.findByTestId('paywall-screen');
}

describe('Paywall', () => {
  beforeEach(() => {
    useProStore.setState({ isPro: false, status: 'idle', error: null, offer: null });
  });

  it('shows the one-time price and the benefits', async () => {
    await openPaywall(new FakeBilling());
    expect(await screen.findByRole('button', { name: 'Unlock Pro for ₹249.00' })).toBeEnabled();
    expect(screen.getByText(/one-time purchase. No subscription/)).toBeOnTheScreen();
    expect(screen.getByText(/Back up to a file and restore it/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeOnTheScreen();
  });

  it('explains a pending payment and keeps the buy button off', async () => {
    const billing = new FakeBilling();
    billing.nextPurchase = 'pending';
    await openPaywall(billing);
    await fireEvent.press(await screen.findByTestId('pro-buy'));
    expect(await screen.findByText(/payment is being processed/)).toBeOnTheScreen();
    expect(screen.getByTestId('pro-buy')).toBeDisabled();
  });

  it('says nothing when the purchase is cancelled', async () => {
    const billing = new FakeBilling();
    billing.nextPurchase = 'cancelled';
    await openPaywall(billing);
    await fireEvent.press(await screen.findByTestId('pro-buy'));
    expect(screen.queryByTestId('pro-status')).toBeNull();
    expect(useProStore.getState().isPro).toBe(false);
  });

  it('explains a network failure', async () => {
    const billing = new FakeBilling();
    billing.nextPurchase = 'network';
    await openPaywall(billing);
    await fireEvent.press(await screen.findByTestId('pro-buy'));
    expect(await screen.findByText(/No connection to Google Play/)).toBeOnTheScreen();
  });

  it('restores a purchase made earlier on this account', async () => {
    const billing = new FakeBilling();
    await openPaywall(billing);
    billing.owned = [billing.proPurchase('purchased', true)];
    await fireEvent.press(screen.getByTestId('pro-restore'));
    expect(
      await screen.findByText('Pro is active. Thank you for supporting the app!'),
    ).toBeOnTheScreen();
  });

  it('says so when there is nothing to restore', async () => {
    await openPaywall(new FakeBilling());
    await fireEvent.press(screen.getByTestId('pro-restore'));
    expect(await screen.findByText(/No Pro purchase was found/)).toBeOnTheScreen();
  });

  it('restores from Settings and then shows Pro as active', async () => {
    const billing = new FakeBilling();
    const setup = await createTestServices();
    await render(<App services={setup.services} billing={billing} />);
    await screen.findByTestId('timer-screen');
    await fireEvent.press(screen.getByRole('button', { name: /Settings/ }));
    billing.owned = [billing.proPurchase('purchased', true)];
    await fireEvent.press(await screen.findByTestId('settings-restore'));
    expect(await screen.findByText('Pro is active on this phone.')).toBeOnTheScreen();
    expect(screen.getByText('Pro is active')).toBeOnTheScreen();
  });

  it('says so when Google Play cannot be reached for a restore', async () => {
    const billing = new FakeBilling();
    await openPaywall(billing);
    billing.ownedPurchases = () => Promise.reject(new Error('offline'));
    await fireEvent.press(screen.getByTestId('pro-restore'));
    expect(await screen.findByText(/Could not reach Google Play/)).toBeOnTheScreen();
  });

  it('works without a price when Google Play is unavailable', async () => {
    const billing = new FakeBilling();
    billing.offer = null;
    await openPaywall(billing);
    expect(await screen.findByText(/Google Play is not available right now/)).toBeOnTheScreen();
    expect(screen.getByTestId('pro-buy')).toBeDisabled();
  });
});
