// SPDX-License-Identifier: Apache-2.0
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  type AndroidAction,
} from 'react-native-notify-kit';
import { i18n } from '@core/i18n';
import type { SessionNotificationState } from '../domain/currentSession';
import type { NotificationActionId, SessionNotifier } from './sessionNotifier';

const CHANNEL_ID = 'session';
const NOTIFICATION_ID = 'session';

const action = (id: NotificationActionId, title: string): AndroidAction => ({
  title,
  // No launchActivity: the action runs in the background, also from the lock screen.
  pressAction: { id },
});

async function ensureChannel(): Promise<string> {
  return notifee.createChannel({
    id: CHANNEL_ID,
    name: i18n.t('notification.channelName'),
    description: i18n.t('notification.channelDescription'),
    importance: AndroidImportance.LOW,
    visibility: AndroidVisibility.PUBLIC,
  });
}

/**
 * Ongoing notification with a chronometer and a Start or Stop button.
 * It is a plain ongoing notification, not a foreground service.
 */
export const notifyKitSessionNotifier: SessionNotifier = {
  async render(state: SessionNotificationState | null, now: number) {
    if (state === null) {
      await notifee.cancelNotification(NOTIFICATION_ID);
      return;
    }
    const channelId = await ensureChannel();
    const contracting = state.kind === 'contracting';
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: i18n.t(contracting ? 'notification.contractingTitle' : 'notification.restingTitle'),
      body: i18n.t(contracting ? 'notification.contractingBody' : 'notification.restingBody'),
      android: {
        channelId,
        smallIcon: 'ic_stat_timer',
        category: AndroidCategory.PROGRESS,
        visibility: AndroidVisibility.PUBLIC,
        ongoing: true,
        autoCancel: false,
        onlyAlertOnce: true,
        showChronometer: true,
        timestamp: contracting ? state.startedAt : state.lastStartedAt,
        timeoutAfter: contracting ? undefined : Math.max(1, state.endsAt - now),
        pressAction: { id: 'default', launchActivity: 'default' },
        actions: [
          contracting
            ? action('stop', i18n.t('notification.stop'))
            : action('start', i18n.t('notification.start')),
        ],
      },
    });
  },

  async requestPermission() {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
  },

  async openSettings() {
    await notifee.openNotificationSettings();
  },
};
