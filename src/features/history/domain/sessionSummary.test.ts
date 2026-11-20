// SPDX-License-Identifier: Apache-2.0
import { MINUTE_MS, SECOND_MS } from '@core/utils/time';
import { groupIntoSessions } from '@features/timer/domain/sessions';
import { contraction, series } from '@features/timer/domain/testing/builders';
import { summariseSession } from './sessionSummary';

const BASE = Date.UTC(2026, 0, 10, 8, 0);

describe('summariseSession', () => {
  it('summarises count, span and averages', () => {
    const [session] = groupIntoSessions(series(BASE, 3, 5, 60));
    expect(summariseSession(session!)).toEqual({
      key: session!.key,
      startedAt: BASE,
      lastActivityAt: BASE + 10 * MINUTE_MS + 60 * SECOND_MS,
      inProgress: false,
      count: 3,
      avgDurationMs: 60 * SECOND_MS,
      avgIntervalMs: 5 * MINUTE_MS,
    });
  });

  it('marks a session with a running contraction', () => {
    const [session] = groupIntoSessions([contraction(BASE, 0, 60), contraction(BASE, 4, null)]);
    expect(summariseSession(session!)).toMatchObject({ inProgress: true, count: 2 });
  });
});
