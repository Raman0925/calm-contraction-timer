// SPDX-License-Identifier: Apache-2.0
import { HOUR_MS, MINUTE_MS } from '@core/utils/time';
import { currentSession, sessionNotificationState } from './currentSession';
import { SESSION_GAP_MS } from './sessions';
import { contraction } from './testing/builders';

const BASE = Date.UTC(2026, 0, 10, 8, 0);

describe('currentSession', () => {
  it('is null with no contractions', () => {
    expect(currentSession([], BASE)).toBeNull();
  });

  it('returns the latest session while it is ongoing', () => {
    const old = contraction(BASE, 0, 60);
    const recent = contraction(BASE, 10 * 60, 60);
    const session = currentSession([old, recent], BASE + 10 * HOUR_MS + 5 * MINUTE_MS);
    expect(session?.contractions).toEqual([recent]);
  });

  it('is null once the gap has passed', () => {
    const only = contraction(BASE, 0, 60);
    expect(currentSession([only], BASE + MINUTE_MS + SESSION_GAP_MS + 1)).toBeNull();
  });
});

describe('sessionNotificationState', () => {
  it('is null without a session', () => {
    expect(sessionNotificationState(null)).toBeNull();
  });

  it('shows a running contraction', () => {
    const running = contraction(BASE, 5, null);
    const session = currentSession([contraction(BASE, 0, 60), running], BASE + 6 * MINUTE_MS);
    expect(sessionNotificationState(session)).toEqual({
      kind: 'contracting',
      startedAt: running.startedAt,
    });
  });

  it('shows rest since the last start and when the session expires', () => {
    const last = contraction(BASE, 0, 60);
    const session = currentSession([last], BASE + 2 * MINUTE_MS);
    expect(sessionNotificationState(session)).toEqual({
      kind: 'resting',
      lastStartedAt: last.startedAt,
      endsAt: last.endedAt! + SESSION_GAP_MS,
    });
  });
});
