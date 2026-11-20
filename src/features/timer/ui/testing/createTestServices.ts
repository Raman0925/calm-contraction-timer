// SPDX-License-Identifier: Apache-2.0
import { createTestDatabase } from '@core/db/testing/createTestDatabase';
import { FakeClock } from '@core/utils/clock';
import { DrizzleContractionRepository } from '../../data/DrizzleContractionRepository';
import type { SessionNotificationState } from '../../domain/currentSession';
import type { TimerServices } from '../TimerServices';

/**
 * Fake notifier that records what it showed. Like Android 13+, it cannot post
 * until permission has been granted; clearing always works.
 */
export class FakeNotifier {
  rendered: (SessionNotificationState | null)[] = [];
  permissionRequests = 0;
  /** What the user will answer when asked. */
  grantPermission = true;
  /** Whether permission has been granted. */
  permitted = false;

  render(state: SessionNotificationState | null): Promise<void> {
    if (state !== null && !this.permitted) {
      return Promise.reject(new Error('POST_NOTIFICATIONS not granted'));
    }
    this.rendered.push(state);
    return Promise.resolve();
  }

  requestPermission(): Promise<boolean> {
    this.permissionRequests += 1;
    this.permitted = this.grantPermission;
    return Promise.resolve(this.grantPermission);
  }

  settingsOpened = 0;

  openSettings(): Promise<void> {
    this.settingsOpened += 1;
    return Promise.resolve();
  }

  /** The last state rendered, or undefined if nothing was rendered yet. */
  get last(): SessionNotificationState | null | undefined {
    return this.rendered.at(-1);
  }
}

/**
 * Timer services for tests: a real repository on in-memory SQLite, a fake
 * clock, and recording fakes for the notifier, haptics and keep-awake.
 */
export async function createTestServices(startAt = Date.UTC(2026, 0, 10, 8, 0)) {
  const { db } = await createTestDatabase();
  const clock = new FakeClock(startAt);
  const notifier = new FakeNotifier();
  const haptics = { confirm: jest.fn() };
  const keepAwake = { activate: jest.fn(), deactivate: jest.fn() };
  const services: TimerServices = {
    repository: new DrizzleContractionRepository(db),
    notifier,
    haptics,
    keepAwake,
    clock,
  };
  return { services, clock, notifier, haptics, keepAwake };
}
