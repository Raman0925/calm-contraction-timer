// SPDX-License-Identifier: Apache-2.0
import notifee, { EventType, type Event } from 'react-native-notify-kit';
import type { NotificationDeps } from './notificationSync';
import {
  registerBackgroundNotificationHandler,
  subscribeToForegroundNotificationEvents,
} from './notificationEvents';

const T0 = Date.UTC(2026, 0, 10, 8, 0);

const mockBackgroundRepository = {
  start: jest.fn(() => Promise.resolve({ ok: true })),
  stop: jest.fn(() => Promise.resolve({ ok: true })),
  listAll: jest.fn(() => Promise.resolve([])),
};
jest.mock('./repositoryInstance', () => ({
  getContractionRepository: () => Promise.resolve(mockBackgroundRepository),
}));

describe('registerBackgroundNotificationHandler', () => {
  it('stops the contraction from the lock screen while the app is killed', async () => {
    registerBackgroundNotificationHandler();
    const handler = jest.mocked(notifee.onBackgroundEvent).mock.calls.at(-1)?.[0];
    await handler?.({ type: EventType.ACTION_PRESS, detail: { pressAction: { id: 'stop' } } });
    expect(mockBackgroundRepository.stop).toHaveBeenCalledWith(expect.any(Number));
    expect(notifee.displayNotification).not.toHaveBeenCalled();
    expect(notifee.cancelNotification).toHaveBeenCalledWith('session');
  });
});

function fakeDeps(): NotificationDeps {
  return {
    repository: {
      start: jest.fn(() => Promise.resolve({ ok: true })),
      stop: jest.fn(() => Promise.resolve({ ok: true })),
      listAll: jest.fn(() => Promise.resolve([])),
    } as unknown as NotificationDeps['repository'],
    notifier: {
      render: jest.fn(() => Promise.resolve()),
      requestPermission: jest.fn(),
      openSettings: jest.fn(),
    },
    clock: { now: () => T0 },
    isEnabled: () => true,
  };
}

describe('subscribeToForegroundNotificationEvents', () => {
  it('runs Start from the notification while the app is open', async () => {
    const deps = fakeDeps();
    subscribeToForegroundNotificationEvents(deps);
    const listener = jest.mocked(notifee.onForegroundEvent).mock.calls.at(-1)?.[0];
    const event: Event = { type: EventType.ACTION_PRESS, detail: { pressAction: { id: 'start' } } };

    listener?.(event);
    await new Promise(process.nextTick);
    expect(deps.repository.start).toHaveBeenCalledWith(T0);
  });

  it('ignores taps on the notification body', async () => {
    const deps = fakeDeps();
    subscribeToForegroundNotificationEvents(deps);
    const listener = jest.mocked(notifee.onForegroundEvent).mock.calls.at(-1)?.[0];

    listener?.({ type: EventType.PRESS, detail: { pressAction: { id: 'default' } } });
    await new Promise(process.nextTick);
    expect(deps.repository.start).not.toHaveBeenCalled();
    expect(deps.repository.stop).not.toHaveBeenCalled();
  });
});
