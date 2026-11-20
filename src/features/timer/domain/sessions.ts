// SPDX-License-Identifier: Apache-2.0
import { HOUR_MS } from '@core/utils/time';
import { byStart, type Contraction } from './contraction';

/** A new session starts after this long without contractions. */
export const SESSION_GAP_MS = 6 * HOUR_MS;

/** A run of contractions with no gap longer than {@link SESSION_GAP_MS}. */
export interface Session {
  /**
   * The id of the session's first contraction. Changes if that contraction is
   * deleted or another is edited to start before it.
   */
  key: number;
  startedAt: number;
  /** End of the last contraction, or its start while it is in progress. */
  lastActivityAt: number;
  /** True while one of its contractions is still running. */
  inProgress: boolean;
  contractions: Contraction[];
}

const lastActivity = (contraction: Contraction): number =>
  contraction.endedAt ?? contraction.startedAt;

/**
 * Groups contractions into sessions, oldest session first. The gap is measured
 * from the end of one contraction to the start of the next.
 */
export function groupIntoSessions(
  contractions: readonly Contraction[],
  gapMs: number = SESSION_GAP_MS,
): Session[] {
  const sessions: Session[] = [];
  let current: Session | undefined;

  for (const contraction of [...contractions].sort(byStart)) {
    if (current && contraction.startedAt - current.lastActivityAt <= gapMs) {
      current.contractions.push(contraction);
      current.lastActivityAt = Math.max(current.lastActivityAt, lastActivity(contraction));
      current.inProgress ||= contraction.endedAt === null;
    } else {
      current = {
        key: contraction.id,
        startedAt: contraction.startedAt,
        lastActivityAt: lastActivity(contraction),
        inProgress: contraction.endedAt === null,
        contractions: [contraction],
      };
      sessions.push(current);
    }
  }
  return sessions;
}

/**
 * True while a contraction is running, or when a new contraction started at
 * `now` would continue `session`.
 */
export function isSessionOngoing(session: Session, now: number, gapMs: number = SESSION_GAP_MS) {
  return session.inProgress || now - session.lastActivityAt <= gapMs;
}
