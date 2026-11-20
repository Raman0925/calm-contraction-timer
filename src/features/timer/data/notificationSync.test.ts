/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0
import { createTestDatabase } from '@core/db/testing/createTestDatabase';
import { FakeClock } from '@core/utils/clock';
import { MINUTE_MS } from '@core/utils/time';
import { DrizzleContractionRepository } from './DrizzleContractionRepository';
import { handleNotificationAction, syncSessionNotification } from './notificationSync';
import type { SessionNotifier } from './sessionNotifier';

const T0 = Date.UTC(2026, 0, 10, 8, 0);

async function setup(enabled = true) {
  const { db } = await createTestDatabase();
  const render = jest.fn<Promise<void>, Parameters<SessionNotifier['render']>>(() =>
    Promise.resolve(),
  );
  const notifier: SessionNotifier = {
    render,
    requestPermission: () => Promise.resolve(true),
    openSettings: () => Promise.resolve(),
  };
  const repository = new DrizzleContractionRepository(db);
  const clock = new FakeClock(T0);
  return {
    deps: { repository, notifier, clock, isEnabled: () => enabled },
    render,
    repository,
    clock,
  };
}

describe('syncSessionNotification', () => {
  it('clears the notification when there is no session', async () => {
    const { deps, render } = await setup();
    await syncSessionNotification(deps);
    expect(render).toHaveBeenLastCalledWith(null, T0);
  });

  it('shows the running contraction', async () => {
    const { deps, render, repository } = await setup();
    await repository.start(T0);
    await syncSessionNotification(deps);
    expect(render).toHaveBeenLastCalledWith({ kind: 'contracting', startedAt: T0 }, T0);
  });

  it('clears the notification when the setting is off', async () => {
    const { deps, render, repository } = await setup(false);
    await repository.start(T0);
    await syncSessionNotification(deps);
    expect(render).toHaveBeenLastCalledWith(null, T0);
  });
});

describe('handleNotificationAction', () => {
  it('starts and stops from the notification buttons', async () => {
    const { deps, render, repository, clock } = await setup();
    await handleNotificationAction('start', deps);
    expect((await repository.getActive())?.startedAt).toBe(T0);

    clock.advance(MINUTE_MS);
    await handleNotificationAction('stop', deps);
    expect(await repository.getActive()).toBeNull();
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: 'resting', lastStartedAt: T0 }),
      T0 + MINUTE_MS,
    );
  });

  it('ignores other presses', async () => {
    const { deps, render, repository } = await setup();
    await handleNotificationAction('default', deps);
    await handleNotificationAction(undefined, deps);
    expect(await repository.listAll()).toEqual([]);
    expect(render).not.toHaveBeenCalled();
  });
});
