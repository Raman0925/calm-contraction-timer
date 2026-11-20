// SPDX-License-Identifier: Apache-2.0
import type { SessionNotificationState } from '../domain/currentSession';

/** Ids of the Start/Stop buttons on the notification. */
export type NotificationActionId = 'start' | 'stop';

/** Shows the ongoing session notification. Implemented with notify-kit; faked in tests. */
export interface SessionNotifier {
  /** Shows or updates the notification for `state`, or removes it when `state` is null. */
  render(state: SessionNotificationState | null, now: number): Promise<void>;
  /** Asks for permission to post notifications. Resolves true when granted. */
  requestPermission(): Promise<boolean>;
  /** Opens the system notification settings for the app, e.g. after permission was blocked. */
  openSettings(): Promise<void>;
}
