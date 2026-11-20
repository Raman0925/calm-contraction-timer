// SPDX-License-Identifier: Apache-2.0
import notifee, { EventType, type Event } from 'react-native-notify-kit';
import { systemClock } from '@core/utils/clock';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import { handleNotificationAction, type NotificationDeps } from './notificationSync';
import { notifyKitSessionNotifier } from './NotifyKitSessionNotifier';
import { getContractionRepository } from './repositoryInstance';

/** Production dependencies for notification sync and actions. */
export async function notificationDeps(): Promise<NotificationDeps> {
  return {
    repository: await getContractionRepository(),
    notifier: notifyKitSessionNotifier,
    clock: systemClock,
    isEnabled: () => useSettingsStore.getState().notificationsEnabled,
  };
}

async function onEvent(
  { type, detail }: Event,
  getDeps: () => Promise<NotificationDeps> | NotificationDeps,
): Promise<void> {
  if (type === EventType.ACTION_PRESS) {
    await handleNotificationAction(detail.pressAction?.id, await getDeps());
  }
}

/** Handles Start/Stop presses while the app is in the background or killed. Call from index.js. */
export function registerBackgroundNotificationHandler(): void {
  notifee.onBackgroundEvent(event => onEvent(event, notificationDeps));
}

/** Handles Start/Stop presses while the app is open. Returns an unsubscribe function. */
export function subscribeToForegroundNotificationEvents(deps: NotificationDeps): () => void {
  return notifee.onForegroundEvent(event => {
    onEvent(event, () => deps).catch((error: unknown) => {
      console.error('Notification action failed', error);
    });
  });
}
