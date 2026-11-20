// SPDX-License-Identifier: Apache-2.0
import { HOUR_MS, MINUTE_MS } from '@core/utils/time';
import { SESSION_GAP_MS, groupIntoSessions, isSessionOngoing } from './sessions';
import { contraction } from './testing/builders';

const BASE = Date.UTC(2026, 0, 10, 8, 0);

describe('groupIntoSessions', () => {
  it('returns nothing for no contractions', () => {
    expect(groupIntoSessions([])).toEqual([]);
  });

  it('keeps contractions within 6 h of each other together', () => {
    const a = contraction(BASE, 0, 60);
    const b = contraction(BASE, 5 * 60, 60);
    const sessions = groupIntoSessions([b, a]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.key).toBe(a.id);
    expect(sessions[0]?.contractions).toEqual([a, b]);
  });

  it('starts a new session after more than 6 h measured from the previous end', () => {
    const a = contraction(BASE, 0, 60);
    const exactly = contraction(BASE, 1 + 6 * 60, 60);
    const later = contraction(BASE, 1 + 6 * 60 + 1 + 6 * 60 + 1, 60);
    const sessions = groupIntoSessions([a, exactly, later]);
    expect(sessions.map(s => s.contractions.length)).toEqual([2, 1]);
    expect(sessions[1]?.key).toBe(later.id);
  });

  it('measures the gap from the start of an in-progress contraction', () => {
    const active = contraction(BASE, 0, null);
    const sessions = groupIntoSessions([active]);
    expect(sessions[0]?.lastActivityAt).toBe(active.startedAt);
  });
});

describe('isSessionOngoing', () => {
  it('is true up to the gap and false after it', () => {
    const [session] = groupIntoSessions([contraction(BASE, 0, 60)]);
    if (!session) {
      throw new Error('expected a session');
    }
    expect(isSessionOngoing(session, session.lastActivityAt + SESSION_GAP_MS)).toBe(true);
    expect(isSessionOngoing(session, session.lastActivityAt + SESSION_GAP_MS + 1)).toBe(false);
    expect(isSessionOngoing(session, session.lastActivityAt + HOUR_MS - MINUTE_MS)).toBe(true);
  });

  it('stays ongoing while a forgotten contraction is still running', () => {
    const [session] = groupIntoSessions([contraction(BASE, 0, 60), contraction(BASE, 5, null)]);
    expect(session?.inProgress).toBe(true);
    expect(session && isSessionOngoing(session, BASE + 2 * SESSION_GAP_MS)).toBe(true);
  });
});
