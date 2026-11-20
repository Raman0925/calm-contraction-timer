// SPDX-License-Identifier: Apache-2.0
import type { Clock } from '@core/utils/clock';
import { currentSession, sessionNotificationState } from '../domain/currentSession';
import type { ContractionRepository } from './contractionRepository';
import type { NotificationActionId, SessionNotifier } from './sessionNotifier';

/** What notification sync and actions need. */
export interface NotificationDeps {
  repository: ContractionRepository;
  notifier: SessionNotifier;
  clock: Clock;
  /** Reads the user's setting at call time. */
  isEnabled: () => boolean;
}

/** Brings the ongoing notification in line with the stored contractions. */
export async function syncSessionNotification(deps: NotificationDeps): Promise<void> {
  const now = deps.clock.now();
  if (!deps.isEnabled()) {
    await deps.notifier.render(null, now);
    return;
  }
  const session = currentSession(await deps.repository.listAll(), now);
  await deps.notifier.render(sessionNotificationState(session), now);
}

const isActionId = (id: string | undefined): id is NotificationActionId =>
  id === 'start' || id === 'stop';

/**
 * Runs a Start/Stop button press from the notification, then refreshes the
 * notification. Works without the UI, so it can run while the app is killed.
 */
export async function handleNotificationAction(
  actionId: string | undefined,
  deps: NotificationDeps,
): Promise<void> {
  if (!isActionId(actionId)) {
    return;
  }
  const now = deps.clock.now();
  await (actionId === 'start' ? deps.repository.start(now) : deps.repository.stop(now));
  await syncSessionNotification(deps);
}
