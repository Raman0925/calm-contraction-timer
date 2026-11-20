// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { App } from '@app/App';
import { PATTERN_PRESETS } from '@features/timer/domain/thresholds';
import { createTestServices } from '@features/timer/ui/testing/createTestServices';
import { licenceTexts, licencedPackages } from '../data/licences';
import { useSettingsStore } from '../data/settingsStore';

type Setup = Awaited<ReturnType<typeof createTestServices>>;

const sharer = {
  share: jest.fn(() => Promise.resolve()),
  clearExports: jest.fn(() => Promise.resolve()),
};

async function openSettings(): Promise<Setup> {
  const setup = await createTestServices();
  setup.notifier.permitted = true;
  await render(<App services={setup.services} fileSharer={sharer} />);
  await screen.findByTestId('timer-screen');
  await fireEvent.press(screen.getByRole('button', { name: /Settings/ }));
  await screen.findByTestId('settings-screen');
  return setup;
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      themePreference: 'system',
      autoNight: true,
      keepAwake: true,
      notificationsEnabled: false,
      patternThresholds: PATTERN_PRESETS['5-1-1'],
      providerPhone: '',
      emergencyPhone: '',
    });
  });

  it('stores the chosen theme', async () => {
    await openSettings();
    await fireEvent.press(screen.getByText('Night (true black, dim)'));
    expect(useSettingsStore.getState().themePreference).toBe('night');
  });

  it('toggles switches from the whole row', async () => {
    await openSettings();
    const autoNight = screen.getByRole('switch', { name: 'Automatic night mode' });
    expect(autoNight).toBeChecked();
    await fireEvent.press(autoNight);
    expect(useSettingsStore.getState().autoNight).toBe(false);
    await fireEvent.press(screen.getByRole('switch', { name: 'Keep screen on' }));
    expect(useSettingsStore.getState().keepAwake).toBe(false);
  });

  it('asks for permission when the notification is turned on', async () => {
    const { notifier } = await openSettings();
    await fireEvent.press(screen.getByRole('switch', { name: 'Timer notification' }));
    expect(notifier.permissionRequests).toBe(1);
    expect(useSettingsStore.getState().notificationsEnabled).toBe(true);
  });

  it('opens system settings and stays off when permission is blocked', async () => {
    const setup = await openSettings();
    setup.notifier.grantPermission = false;
    await fireEvent.press(screen.getByRole('switch', { name: 'Timer notification' }));
    expect(setup.notifier.settingsOpened).toBe(1);
    expect(useSettingsStore.getState().notificationsEnabled).toBe(false);
  });

  it('switches presets and fine-tunes thresholds into a custom setting', async () => {
    await openSettings();
    await fireEvent.press(screen.getByRole('radio', { name: '4-1-1' }));
    expect(useSettingsStore.getState().patternThresholds).toEqual(PATTERN_PRESETS['4-1-1']);

    const interval = screen.getByTestId('threshold-maxIntervalMinutes');
    await fireEvent.press(
      within(interval).getByRole('button', {
        name: 'Increase Contractions at most this far apart',
      }),
    );
    expect(useSettingsStore.getState().patternThresholds.maxIntervalMinutes).toBe(5);
    await fireEvent.press(
      within(interval).getByRole('button', {
        name: 'Increase Contractions at most this far apart',
      }),
    );
    expect(screen.getByRole('radio', { name: 'Custom' })).toBeChecked();
  });

  it('keeps spaces while a phone number is typed one key at a time', async () => {
    await openSettings();
    let typed = '';
    for (const key of '+44 20') {
      typed += key;
      await fireEvent.changeText(screen.getByTestId('provider-phone'), typed);
    }
    expect(useSettingsStore.getState().providerPhone).toBe('+44 20');
  });

  it('saves phone numbers that the timer then offers to call', async () => {
    await openSettings();
    await fireEvent.changeText(screen.getByTestId('provider-phone'), '+44 20 7946 0000');
    await fireEvent.changeText(screen.getByTestId('emergency-phone'), '999');
    expect(useSettingsStore.getState()).toMatchObject({
      providerPhone: '+44 20 7946 0000',
      emergencyPhone: '999',
    });
    await fireEvent.press(screen.getByRole('button', { name: /Timer/ }));
    expect(await screen.findByRole('button', { name: 'Call my provider' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Call emergency number' })).toBeOnTheScreen();
  });

  it('deletes all contractions only after confirmation', async () => {
    const setup = await openSettings();
    await setup.services.repository.start(setup.clock.now());
    await fireEvent.press(screen.getByTestId('delete-all'));
    expect(await screen.findByText('Delete all contractions?')).toBeOnTheScreen();
    expect(await setup.services.repository.listAll()).toHaveLength(1);

    sharer.clearExports.mockClear();
    await fireEvent.press(screen.getByTestId('delete-all-confirm'));
    expect(await screen.findByText('All contractions were deleted.')).toBeOnTheScreen();
    expect(await setup.services.repository.listAll()).toEqual([]);
    expect(sharer.clearExports).toHaveBeenCalled();
  });

  it('shows the disclaimer and the open-source licences', async () => {
    await openSettings();
    await fireEvent.press(screen.getByTestId('open-disclaimer'));
    expect(await screen.findByText(/It is not a medical device/)).toBeOnTheScreen();
    expect(screen.getByText(/^You accepted this on /)).toBeOnTheScreen();
  });

  it('lists open-source licences and shows a licence text', async () => {
    await openSettings();
    await fireEvent.press(screen.getByTestId('open-licences'));
    await screen.findByTestId('licences-screen');
    const pkg = licencedPackages.slice(0, 10).find(p => p.text !== null);
    const text = pkg?.text == null ? undefined : licenceTexts[pkg.text];
    expect(pkg && text).toBeTruthy();
    await fireEvent.press(await screen.findByText(`${pkg?.name} ${pkg?.version}`));
    expect(await screen.findByText(text ?? '')).toBeOnTheScreen();
  });
});
