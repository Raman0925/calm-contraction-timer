// SPDX-License-Identifier: Apache-2.0
import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { AppThemeProvider, nightTheme, type ThemePreference } from '@core/design';
import { MINUTE_MS, SECOND_MS } from '@core/utils/time';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import { createTestServices } from './testing/createTestServices';
import { TimerScreen } from './TimerScreen';
import { TimerServicesProvider } from './TimerServices';

type Setup = Awaited<ReturnType<typeof createTestServices>>;

async function renderTimer(setup: Setup, preference: ThemePreference = 'light') {
  await render(
    <NavigationContainer>
      <TimerServicesProvider services={setup.services}>
        <AppThemeProvider preference={preference} autoNight={false} sessionActive={false}>
          <TimerScreen />
        </AppThemeProvider>
      </TimerServicesProvider>
    </NavigationContainer>,
  );
  await screen.findByRole('button', { name: /Start|Stop/ });
}

const startStop = () => screen.getByTestId('start-stop');
const liveTimer = () => screen.getByTestId('live-timer');

/** Moves the fake clock and lets the 1-second ticker pick it up. */
async function elapse(setup: Setup, ms: number) {
  setup.clock.advance(ms);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(SECOND_MS);
  });
}

describe('TimerScreen', () => {
  let setup: Setup;

  beforeEach(async () => {
    jest.useFakeTimers();
    useSettingsStore.setState({
      notificationsEnabled: true,
      notificationPermissionAsked: false,
      keepAwake: true,
      providerPhone: '',
    });
    setup = await createTestServices();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is ready to start when idle', async () => {
    await renderTimer(setup);
    expect(within(liveTimer()).getByText('00:00')).toBeOnTheScreen();
    expect(screen.getByText('Tap Start when a contraction begins')).toBeOnTheScreen();
    expect(screen.queryByTestId('pattern-card')).toBeNull();
    expect(screen.queryByTestId('call-provider')).toBeNull();
  });

  it('starts timing at once, with feedback and an Undo offer', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await renderTimer(setup);
    await fireEvent.press(startStop());

    expect(await screen.findByRole('button', { name: 'Stop' })).toBeOnTheScreen();
    expect(await setup.services.repository.getActive()).not.toBeNull();
    expect(setup.haptics.confirm).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('Contraction started');
    expect(screen.getByText('Contraction started')).toBeOnTheScreen();
    expect(setup.notifier.permissionRequests).toBe(1);

    await elapse(setup, 65 * SECOND_MS);
    expect(within(liveTimer()).getByText('01:05')).toBeOnTheScreen();
  });

  it('undoes a Start', async () => {
    await renderTimer(setup);
    await fireEvent.press(startStop());
    await fireEvent.press(await screen.findByText('Undo'));
    expect(await screen.findByRole('button', { name: 'Start' })).toBeOnTheScreen();
    expect(await setup.services.repository.listAll()).toEqual([]);
  });

  it('shows rest time and the recorded contraction after Stop, and undoes Stop', async () => {
    await renderTimer(setup);
    await fireEvent.press(startStop());
    await screen.findByRole('button', { name: 'Stop' });
    await elapse(setup, 65 * SECOND_MS);
    await fireEvent.press(startStop());

    expect(await screen.findByRole('button', { name: 'Start' })).toBeOnTheScreen();
    expect(screen.getByText('Since the last contraction started')).toBeOnTheScreen();
    expect(screen.getByText(/Lasted 01:05/)).toBeOnTheScreen();
    expect(screen.getByTestId('pattern-card')).toBeOnTheScreen();

    await fireEvent.press(await screen.findByText('Undo'));
    expect(await screen.findByRole('button', { name: 'Stop' })).toBeOnTheScreen();
  });

  it('shows the notification for the first contraction once permission is granted', async () => {
    await renderTimer(setup);
    await fireEvent.press(startStop());
    await screen.findByRole('button', { name: 'Stop' });
    await screen.findByText('Undo');
    expect(setup.notifier.last).toEqual({
      kind: 'contracting',
      startedAt: setup.clock.now(),
    });
  });

  it('gives a new Undo offer its full time', async () => {
    await renderTimer(setup);
    await fireEvent.press(startStop());
    await screen.findByRole('button', { name: 'Stop' });
    await elapse(setup, 3 * SECOND_MS);
    await fireEvent.press(startStop());
    await screen.findByText('Contraction stopped');
    await act(async () => {
      await jest.advanceTimersByTimeAsync(3 * SECOND_MS);
    });
    expect(screen.getByText('Contraction stopped')).toBeOnTheScreen();
    expect(screen.getByText('Undo')).toBeOnTheScreen();
  });

  it('says so when an Undo is no longer possible', async () => {
    await renderTimer(setup);
    await fireEvent.press(startStop());
    await screen.findByRole('button', { name: 'Stop' });
    await fireEvent.press(startStop());
    await screen.findByText('Contraction stopped');
    // A new contraction is started from the notification before Undo is tapped.
    await setup.services.repository.start(setup.clock.now() + SECOND_MS);
    await fireEvent.press(screen.getByText('Undo'));
    expect(await screen.findByText(/Could not undo/)).toBeOnTheScreen();
  });

  it('asks for notification permission only once', async () => {
    await renderTimer(setup);
    for (let i = 0; i < 2; i += 1) {
      await fireEvent.press(startStop());
      await screen.findByRole('button', { name: 'Stop' });
      await fireEvent.press(startStop());
      await screen.findByRole('button', { name: 'Start' });
    }
    expect(setup.notifier.permissionRequests).toBe(1);
  });

  it('turns the notification setting off when permission is denied', async () => {
    setup.notifier.grantPermission = false;
    await renderTimer(setup);
    await fireEvent.press(startStop());
    await screen.findByRole('button', { name: 'Stop' });
    expect(useSettingsStore.getState().notificationsEnabled).toBe(false);
  });

  it('resumes a contraction that was running before the app was killed', async () => {
    await setup.services.repository.start(setup.clock.now() - 2 * MINUTE_MS);
    await renderTimer(setup);
    expect(await screen.findByRole('button', { name: 'Stop' })).toBeOnTheScreen();
    await elapse(setup, 0);
    expect(within(liveTimer()).getByText('02:00')).toBeOnTheScreen();
  });

  it('keeps the screen on only during a session when enabled', async () => {
    await renderTimer(setup);
    expect(setup.keepAwake.activate).not.toHaveBeenCalled();
    await fireEvent.press(startStop());
    await screen.findByRole('button', { name: 'Stop' });
    await elapse(setup, SECOND_MS);
    expect(setup.keepAwake.activate).toHaveBeenCalled();

    await act(() => {
      useSettingsStore.setState({ keepAwake: false });
    });
    expect(setup.keepAwake.deactivate).toHaveBeenCalled();
  });

  it('offers to call the saved provider number', async () => {
    useSettingsStore.setState({ providerPhone: '+441234567890' });
    await renderTimer(setup);
    expect(screen.getByRole('button', { name: 'Call my provider' })).toBeOnTheScreen();
  });

  it('renders in the night theme on true black', async () => {
    await renderTimer(setup, 'night');
    expect(screen.getByTestId('timer-screen')).toHaveStyle({
      backgroundColor: nightTheme.colors.background,
    });
  });
});
