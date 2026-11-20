/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0
import { createTestDatabase } from '@core/db/testing/createTestDatabase';
import { MINUTE_MS } from '@core/utils/time';
import { DrizzleContractionRepository } from './DrizzleContractionRepository';

const T0 = Date.UTC(2026, 0, 10, 8, 0);

async function setup() {
  const { db } = await createTestDatabase();
  const repo = new DrizzleContractionRepository(db);
  const listener = jest.fn();
  repo.subscribe(listener);
  return { repo, listener };
}

async function recordOne(repo: DrizzleContractionRepository, startedAt = T0) {
  await repo.start(startedAt);
  await repo.stop(startedAt + MINUTE_MS);
}

describe('DrizzleContractionRepository', () => {
  it('persists the start immediately and finds it as active', async () => {
    const { repo, listener } = await setup();
    const started = await repo.start(T0);
    const expected = { id: 1, startedAt: T0, endedAt: null, intensity: null, note: null };
    expect(started).toEqual({ ok: true, value: expected });
    expect(await repo.getActive()).toEqual(expected);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('refuses a second start while one is in progress', async () => {
    const { repo, listener } = await setup();
    await repo.start(T0);
    expect(await repo.start(T0 + 300)).toEqual({ ok: false, error: 'already-active' });
    expect(await repo.listAll()).toHaveLength(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('survives concurrent double taps', async () => {
    const { repo } = await setup();
    const results = await Promise.all([repo.start(T0), repo.start(T0)]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(await repo.listAll()).toHaveLength(1);
  });

  it('stops the active contraction', async () => {
    const { repo } = await setup();
    await repo.start(T0);
    const stopped = await repo.stop(T0 + MINUTE_MS);
    expect(stopped.ok && stopped.value.endedAt).toBe(T0 + MINUTE_MS);
    expect(await repo.getActive()).toBeNull();
    expect(await repo.stop(T0 + 2 * MINUTE_MS)).toEqual({ ok: false, error: 'not-active' });
  });

  it('rejects a stop before the start', async () => {
    const { repo } = await setup();
    await repo.start(T0);
    expect(await repo.stop(T0 - 1)).toEqual({ ok: false, error: 'end-before-start' });
  });

  it('lists in start order and filters by time', async () => {
    const { repo } = await setup();
    for (const offset of [10, 0, 5]) {
      await recordOne(repo, T0 + offset * MINUTE_MS);
    }
    const starts = (await repo.listAll()).map(c => c.startedAt);
    expect(starts).toEqual([0, 5, 10].map(m => T0 + m * MINUTE_MS));
    expect(await repo.listSince(T0 + 5 * MINUTE_MS)).toHaveLength(2);
  });

  it('edits times, intensity and note', async () => {
    const { repo } = await setup();
    await recordOne(repo);
    const updated = await repo.update(1, {
      startedAt: T0 - MINUTE_MS,
      intensity: 2,
      note: '  waters broke ',
    });
    expect(updated).toEqual({
      ok: true,
      value: {
        id: 1,
        startedAt: T0 - MINUTE_MS,
        endedAt: T0 + MINUTE_MS,
        intensity: 2,
        note: 'waters broke',
      },
    });
    const cleared = await repo.update(1, { intensity: null, note: '' });
    expect(cleared.ok && [cleared.value.intensity, cleared.value.note]).toEqual([null, null]);
  });

  it('rejects invalid edits and unknown ids', async () => {
    const { repo } = await setup();
    await recordOne(repo);
    expect(await repo.update(1, { endedAt: T0 - 1 })).toEqual({ ok: false, error: 'invalid' });
    expect(await repo.update(99, { note: 'x' })).toEqual({ ok: false, error: 'not-found' });
  });

  it('removes and restores with the same id for Undo', async () => {
    const { repo, listener } = await setup();
    await recordOne(repo);
    await repo.update(1, { note: 'keep me' });
    const removed = await repo.remove(1);
    expect(await repo.listAll()).toEqual([]);
    expect(await repo.remove(1)).toBeNull();
    expect(await repo.restore(removed!)).toEqual({ ok: true, value: removed });
    expect(await repo.restore(removed!)).toEqual({ ok: false, error: 'conflict' });
    expect(listener).toHaveBeenCalledTimes(5);
  });

  it('will not restore an in-progress contraction over another one', async () => {
    const { repo } = await setup();
    await repo.start(T0);
    const removed = await repo.remove(1);
    await repo.start(T0 + MINUTE_MS);
    expect(await repo.restore(removed!)).toEqual({ ok: false, error: 'conflict' });
    expect(await repo.restore({ ...removed!, endedAt: T0 - 1 })).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('keeps the first end time when Stop is double-tapped', async () => {
    const { repo } = await setup();
    await repo.start(T0);
    const results = await Promise.all([repo.stop(T0 + MINUTE_MS), repo.stop(T0 + 2 * MINUTE_MS)]);
    expect(results.map(result => result.ok)).toEqual([true, false]);
    expect((await repo.listAll())[0]?.endedAt).toBe(T0 + MINUTE_MS);
  });

  it('undoes a Stop by clearing the end time', async () => {
    const { repo } = await setup();
    await recordOne(repo);
    const undone = await repo.update(1, { endedAt: null });
    expect(undone.ok && undone.value.endedAt).toBeNull();
    expect((await repo.getActive())?.id).toBe(1);
  });

  it('will not undo a Stop while another contraction is running', async () => {
    const { repo } = await setup();
    await recordOne(repo);
    await repo.start(T0 + 5 * MINUTE_MS);
    expect(await repo.update(1, { endedAt: null })).toEqual({ ok: false, error: 'invalid' });
  });

  it('keeps the running contraction the latest one', async () => {
    const { repo } = await setup();
    await recordOne(repo);
    await repo.start(T0 + 5 * MINUTE_MS);
    expect(
      await repo.update(1, { startedAt: T0 + 6 * MINUTE_MS, endedAt: T0 + 7 * MINUTE_MS }),
    ).toEqual({
      ok: false,
      error: 'invalid',
    });
    const later = {
      id: 9,
      startedAt: T0 + 9 * MINUTE_MS,
      endedAt: T0 + 10 * MINUTE_MS,
      intensity: null,
      note: null,
    };
    expect(await repo.restore(later)).toEqual({ ok: false, error: 'conflict' });
  });

  it('deletes everything', async () => {
    const { repo } = await setup();
    await repo.start(T0);
    await repo.removeAll();
    expect(await repo.listAll()).toEqual([]);
  });

  it('stops notifying after unsubscribe', async () => {
    const { repo } = await setup();
    const listener = jest.fn();
    const unsubscribe = repo.subscribe(listener);
    unsubscribe();
    await repo.start(T0);
    expect(listener).not.toHaveBeenCalled();
  });
});
