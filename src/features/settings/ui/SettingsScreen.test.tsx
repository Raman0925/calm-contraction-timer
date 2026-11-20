// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppThemeProvider } from '@core/design';
import { createTestServices } from '@features/timer/ui/testing/createTestServices';
import { TimerServicesProvider } from '@features/timer/ui/TimerServices';
import { useSettingsStore } from '../data/settingsStore';
import { SettingsScreen } from './SettingsScreen';

async function renderSettings() {
  const setup = await createTestServices();
  await render(
    <TimerServicesProvider services={setup.services}>
      <AppThemeProvider preference="system" autoNight sessionActive={false}>
        <SettingsScreen />
      </AppThemeProvider>
    </TimerServicesProvider>,
  );
  return setup;
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      themePreference: 'system',
      autoNight: true,
      keepAwake: true,
      notificationsEnabled: false,
    });
  });

  it('stores the chosen theme', async () => {
    await renderSettings();
    await fireEvent.press(screen.getByText('Night (true black, dim)'));
    expect(useSettingsStore.getState().themePreference).toBe('night');
  });

  it('toggles switches from the whole row', async () => {
    await renderSettings();
    const autoNight = screen.getByRole('switch', { name: 'Automatic night mode' });
    expect(autoNight).toBeChecked();
    await fireEvent.press(autoNight);
    expect(useSettingsStore.getState().autoNight).toBe(false);
    await fireEvent.press(screen.getByRole('switch', { name: 'Keep screen on' }));
    expect(useSettingsStore.getState().keepAwake).toBe(false);
  });

  it('asks for permission when the notification is turned on', async () => {
    const { notifier } = await renderSettings();
    await fireEvent.press(screen.getByRole('switch', { name: 'Timer notification' }));
    expect(notifier.permissionRequests).toBe(1);
    expect(useSettingsStore.getState().notificationsEnabled).toBe(true);
  });

  it('opens system settings and stays off when permission is blocked', async () => {
    const setup = await renderSettings();
    setup.notifier.grantPermission = false;
    await fireEvent.press(screen.getByRole('switch', { name: 'Timer notification' }));
    expect(setup.notifier.settingsOpened).toBe(1);
    expect(useSettingsStore.getState().notificationsEnabled).toBe(false);
  });
});
