// SPDX-License-Identifier: Apache-2.0
import type { Contraction } from './contraction';
import { SESSION_GAP_MS, groupIntoSessions, isSessionOngoing, type Session } from './sessions';

/** The latest session if it is still ongoing at `now`, otherwise null. */
export function currentSession(
  contractions: readonly Contraction[],
  now: number,
  gapMs: number = SESSION_GAP_MS,
): Session | null {
  const latest = groupIntoSessions(contractions, gapMs).at(-1);
  return latest && isSessionOngoing(latest, now, gapMs) ? latest : null;
}

/** What the ongoing notification should show. */
export type SessionNotificationState =
  | { kind: 'contracting'; startedAt: number }
  | { kind: 'resting'; lastStartedAt: number; endsAt: number };

/**
 * Maps the current session to the notification content: a running contraction
 * or rest since the last start. Returns null when there is no ongoing session.
 * `endsAt` is when the session times out, so the notification can expire.
 */
export function sessionNotificationState(
  session: Session | null,
  gapMs: number = SESSION_GAP_MS,
): SessionNotificationState | null {
  const last = session?.contractions.at(-1);
  if (!session || !last) {
    return null;
  }
  if (session.inProgress) {
    const running = session.contractions.find(c => c.endedAt === null) ?? last;
    return { kind: 'contracting', startedAt: running.startedAt };
  }
  return { kind: 'resting', lastStartedAt: last.startedAt, endsAt: session.lastActivityAt + gapMs };
}
