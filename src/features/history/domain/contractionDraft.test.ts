// SPDX-License-Identifier: Apache-2.0
import { MINUTE_MS, SECOND_MS } from '@core/utils/time';
import { contraction } from '@features/timer/domain/testing/builders';
import { changeDuration, shiftStart, toDraft, toPatch, undoPatch } from './contractionDraft';

const BASE = Date.UTC(2026, 0, 10, 8, 0);
const NOW = BASE + 30 * MINUTE_MS;

describe('contraction drafts', () => {
  const done = contraction(BASE, 0, 60, { intensity: 2, note: 'back' });

  it('saves an unchanged contraction as it was', () => {
    expect(toPatch(toDraft(done))).toEqual({
      startedAt: done.startedAt,
      endedAt: done.endedAt,
      intensity: 2,
      note: 'back',
    });
  });

  it('moves the start and keeps the duration', () => {
    const patch = toPatch(shiftStart(toDraft(done), -MINUTE_MS, NOW));
    expect(patch).toMatchObject({ startedAt: BASE - MINUTE_MS, endedAt: BASE });
  });

  it('never moves the end past now', () => {
    const patch = toPatch(shiftStart(toDraft(done), 60 * MINUTE_MS, NOW));
    expect(patch.endedAt).toBe(NOW);
    expect(toPatch(changeDuration(toDraft(done), 60 * MINUTE_MS, NOW)).endedAt).toBe(NOW);
  });

  it('never starts a running contraction in the future', () => {
    const running = toDraft(contraction(BASE, 0, null));
    expect(shiftStart(running, 60 * MINUTE_MS, NOW).startedAt).toBe(NOW);
  });

  it('changes the duration but never below zero', () => {
    expect(toPatch(changeDuration(toDraft(done), 10 * SECOND_MS, NOW)).endedAt).toBe(
      BASE + 70 * SECOND_MS,
    );
    expect(toPatch(changeDuration(toDraft(done), -5 * MINUTE_MS, NOW)).endedAt).toBe(BASE);
  });

  it('leaves a running contraction running', () => {
    const running = toDraft(contraction(BASE, 0, null));
    expect(changeDuration(running, SECOND_MS, NOW)).toBe(running);
    expect(toPatch(running)).not.toHaveProperty('endedAt');
  });

  it('turns a blank note into null', () => {
    expect(toPatch({ ...toDraft(done), note: '   ' }).note).toBeNull();
  });

  it('undoes only the fields an edit wrote', () => {
    const running = contraction(BASE, 0, null, { note: 'x' });
    const applied = toPatch({ ...toDraft(running), note: 'y' });
    expect(undoPatch(running, applied)).toEqual({ startedAt: BASE, intensity: null, note: 'x' });
    expect(undoPatch(done, toPatch(toDraft(done)))).toEqual({
      startedAt: done.startedAt,
      endedAt: done.endedAt,
      intensity: 2,
      note: 'back',
    });
  });
});
