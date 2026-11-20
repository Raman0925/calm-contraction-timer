// SPDX-License-Identifier: Apache-2.0
import { computeStats } from '@features/timer/domain/computeStats';
import type { Session } from '@features/timer/domain/sessions';
import { DEFAULT_THRESHOLDS } from '@features/timer/domain/thresholds';

/** What the History list shows for one session. */
export interface SessionSummary {
  key: number;
  startedAt: number;
  lastActivityAt: number;
  inProgress: boolean;
  count: number;
  avgDurationMs: number | null;
  avgIntervalMs: number | null;
}

/** Summarises a session: span, count and average length and frequency. */
export function summariseSession(session: Session): SessionSummary {
  // Thresholds only affect the pattern, which the summary does not use.
  const { overall } = computeStats(
    session.contractions,
    DEFAULT_THRESHOLDS,
    session.lastActivityAt,
  );
  return {
    key: session.key,
    startedAt: session.startedAt,
    lastActivityAt: session.lastActivityAt,
    inProgress: session.inProgress,
    count: overall.count,
    avgDurationMs: overall.avgDurationMs,
    avgIntervalMs: overall.avgIntervalMs,
  };
}
