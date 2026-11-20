// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen } from '@testing-library/react-native';
import { App } from '@app/App';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import { createTestServices } from '@features/timer/ui/testing/createTestServices';

describe('Onboarding', () => {
  beforeEach(() => {
    useSettingsStore.setState({ disclaimerAcceptedAt: null });
  });

  it('walks through three cards and records accepting the disclaimer', async () => {
    const setup = await createTestServices();
    await render(<App services={setup.services} />);
    expect(await screen.findByText('One tap to time')).toBeOnTheScreen();
    expect(screen.getByText('Step 1 of 3')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('onboarding-next'));
    expect(screen.getByText('See the pattern')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('One tap to time')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('onboarding-next'));
    await fireEvent.press(screen.getByTestId('onboarding-next'));
    expect(screen.getByText(/It is not a medical device/)).toBeOnTheScreen();
    expect(screen.queryByTestId('onboarding-next')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'I understand' }));
    expect(await screen.findByTestId('timer-screen')).toBeOnTheScreen();
    expect(useSettingsStore.getState().disclaimerAcceptedAt).toBe(setup.clock.now());
  });

  it('is skipped once the disclaimer has been accepted', async () => {
    useSettingsStore.setState({ disclaimerAcceptedAt: 1 });
    const setup = await createTestServices();
    await render(<App services={setup.services} />);
    expect(await screen.findByTestId('timer-screen')).toBeOnTheScreen();
    expect(screen.queryByTestId('onboarding-screen')).toBeNull();
  });
});
