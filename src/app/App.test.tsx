// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FakeBilling } from '@features/paywall/data/testing/FakeBilling';
import { createTestServices } from '@features/timer/ui/testing/createTestServices';
import { App } from './App';

describe('App', () => {
  it('opens on the timer tab once data is ready', async () => {
    const { services } = await createTestServices();
    await render(<App services={services} />);
    expect(await screen.findByTestId('timer-screen')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Start' })).toBeOnTheScreen();
  });

  it('keeps the timer working when Google Play is unavailable', async () => {
    const { services } = await createTestServices();
    const billing = new FakeBilling();
    billing.connectFails = true;
    await render(<App services={services} billing={billing} />);
    await waitFor(() => {
      expect(screen.getByTestId('start-stop')).toBeEnabled();
    });
    await fireEvent.press(screen.getByTestId('start-stop'));
    expect(await screen.findByRole('button', { name: 'Stop' })).toBeOnTheScreen();
  });

  it('clears any stale notification on launch', async () => {
    const { services, notifier } = await createTestServices();
    await render(<App services={services} />);
    await screen.findByTestId('timer-screen');
    await waitFor(() => {
      expect(notifier.last).toBeNull();
    });
  });
});
