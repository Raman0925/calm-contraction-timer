// SPDX-License-Identifier: Apache-2.0
import { useEffect } from 'react';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import { subscribeToForegroundNotificationEvents } from '../data/notificationEvents';
import { syncSessionNotification, type NotificationDeps } from '../data/notificationSync';
import { useTimerServices } from './TimerServices';

/**
 * Keeps the ongoing notification in step with the stored contractions and the
 * user's setting, and handles its Start/Stop buttons while the app is open.
 */
export function useSessionNotificationSync(): void {
  const services = useTimerServices();
  const enabled = useSettingsStore(state => state.notificationsEnabled);

  useEffect(() => {
    const deps: NotificationDeps = { ...services, isEnabled: () => enabled };
    const sync = () => {
      syncSessionNotification(deps).catch((error: unknown) => {
        console.error('Updating the notification failed', error);
      });
    };
    sync();
    const unsubscribeWrites = services.repository.subscribe(sync);
    const unsubscribeEvents = subscribeToForegroundNotificationEvents(deps);
    return () => {
      unsubscribeWrites();
      unsubscribeEvents();
    };
  }, [services, enabled]);
}
