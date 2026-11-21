// SPDX-License-Identifier: Apache-2.0
import notifee, { AuthorizationStatus } from 'react-native-notify-kit';
import { HOUR_MS } from '@core/utils/time';
import NativeLiveUpdate from '@core/native/NativeLiveUpdate';
import { notifyKitSessionNotifier } from './NotifyKitSessionNotifier';

const T0 = Date.UTC(2026, 0, 10, 8, 0);
const displayed = () => jest.mocked(notifee.displayNotification).mock.calls.at(-1)?.[0];

describe('notifyKitSessionNotifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a running contraction as an ongoing chronometer with a Stop button', async () => {
    await notifyKitSessionNotifier.render({ kind: 'contracting', startedAt: T0 }, T0);
    expect(displayed()).toMatchObject({
      id: 'session',
      title: 'Contraction in progress',
      android: {
        channelId: 'session',
        ongoing: true,
        showChronometer: true,
        timestamp: T0,
        timeoutAfter: undefined,
        actions: [{ title: 'Stop', pressAction: { id: 'stop' } }],
      },
    });
    expect(displayed()?.android?.actions?.[0]?.pressAction).not.toHaveProperty('launchActivity');
  });

  it('asks Android 16+ to show it as a Live Update with a short chip text', async () => {
    await notifyKitSessionNotifier.render({ kind: 'contracting', startedAt: T0 }, T0);
    expect(NativeLiveUpdate.promote).toHaveBeenLastCalledWith('session', 'Contraction');
  });

  it('still shows the notification when Live Update promotion fails', async () => {
    jest.mocked(NativeLiveUpdate.promote).mockRejectedValueOnce(new Error('denied'));
    await expect(
      notifyKitSessionNotifier.render({ kind: 'contracting', startedAt: T0 }, T0),
    ).resolves.toBeUndefined();
    expect(notifee.displayNotification).toHaveBeenCalled();
  });

  it('shows rest with a Start button that expires with the session', async () => {
    const state = { kind: 'resting', lastStartedAt: T0, endsAt: T0 + 6 * HOUR_MS } as const;
    await notifyKitSessionNotifier.render(state, T0 + HOUR_MS);
    expect(displayed()).toMatchObject({
      title: 'Resting',
      android: {
        timestamp: T0,
        timeoutAfter: 5 * HOUR_MS,
        actions: [{ title: 'Start', pressAction: { id: 'start' } }],
      },
    });
  });

  it('removes the notification when there is no session', async () => {
    await notifyKitSessionNotifier.render(null, T0);
    expect(notifee.cancelNotification).toHaveBeenCalledWith('session');
    expect(notifee.displayNotification).not.toHaveBeenCalled();
  });

  it('reports whether permission was granted', async () => {
    const settings = await notifee.requestPermission();
    jest.mocked(notifee.requestPermission).mockResolvedValueOnce({
      ...settings,
      authorizationStatus: AuthorizationStatus.DENIED,
    });
    expect(await notifyKitSessionNotifier.requestPermission()).toBe(false);
    jest.mocked(notifee.requestPermission).mockResolvedValueOnce({
      ...settings,
      authorizationStatus: AuthorizationStatus.AUTHORIZED,
    });
    expect(await notifyKitSessionNotifier.requestPermission()).toBe(true);
  });
});
