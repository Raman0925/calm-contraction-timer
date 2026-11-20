// SPDX-License-Identifier: Apache-2.0
import { HOUR_MS, MINUTE_MS, SECOND_MS } from '@core/utils/time';
import { byStart, type Contraction } from './contraction';
import { SESSION_GAP_MS } from './sessions';
import type { PatternThresholds } from './thresholds';

/** Per-contraction figures derived from its neighbours. */
export interface ContractionStat {
  contraction: Contraction;
  /** End minus start; null while in progress. */
  durationMs: number | null;
  /** Start of the previous contraction to this start; null for the first in a session. */
  intervalMs: number | null;
  /** End of the previous contraction to this start; null if unknown or first in a session. */
  restMs: number | null;
}

/** Averages over a group of contractions. Null when there is nothing to average. */
export interface Averages {
  count: number;
  avgDurationMs: number | null;
  avgIntervalMs: number | null;
}

/**
 * How the recent contractions compare with the user's thresholds.
 * - `none`: no current run of contractions meets the interval and duration thresholds.
 * - `building`: a run meets them but has not lasted the sustained time yet.
 * - `matched`: a run has met them for at least the sustained time.
 */
export interface PatternStatus {
  state: 'none' | 'building' | 'matched';
  /** Start of the first contraction in the current run. */
  windowStartedAt: number | null;
  /** How long the current run has held, up to now. */
  sustainedMs: number;
}

export interface ContractionStats {
  /** Every contraction with its derived figures, oldest first. */
  items: ContractionStat[];
  /** The contraction in progress, if any. */
  active: Contraction | null;
  /** The most recent completed contraction. */
  lastCompleted: ContractionStat | null;
  /** Contractions that started in the last 60 minutes. */
  lastHour: Averages;
  /** All contractions passed in. */
  overall: Averages;
  pattern: PatternStatus;
}

const ROLLING_WINDOW_MS = HOUR_MS;

const NO_PATTERN: PatternStatus = { state: 'none', windowStartedAt: null, sustainedMs: 0 };

const average = (values: number[]): number | null =>
  values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;

function toStats(sorted: Contraction[]): ContractionStat[] {
  return sorted.map((contraction, index) => {
    const candidate = index > 0 ? sorted[index - 1] : undefined;
    // Figures never span two sessions: a gap that long is not an interval.
    const previous =
      candidate &&
      contraction.startedAt - (candidate.endedAt ?? candidate.startedAt) <= SESSION_GAP_MS
        ? candidate
        : undefined;
    return {
      contraction,
      durationMs: contraction.endedAt === null ? null : contraction.endedAt - contraction.startedAt,
      intervalMs: previous ? contraction.startedAt - previous.startedAt : null,
      restMs:
        previous?.endedAt != null ? Math.max(0, contraction.startedAt - previous.endedAt) : null,
    };
  });
}

function averagesOf(items: ContractionStat[]): Averages {
  return {
    count: items.length,
    avgDurationMs: average(items.flatMap(item => item.durationMs ?? [])),
    avgIntervalMs: average(items.flatMap(item => item.intervalMs ?? [])),
  };
}

/**
 * Finds the trailing run of contractions that meets the thresholds. Walks back
 * from the latest completed contraction while each one lasts long enough and
 * starts within the interval of the next. The run must still be current: the
 * next contraction (or now, if none is in progress) is within the interval.
 */
function patternOf(items: ContractionStat[], thresholds: PatternThresholds, now: number) {
  const maxIntervalMs = thresholds.maxIntervalMinutes * MINUTE_MS;
  const minDurationMs = thresholds.minDurationSeconds * SECOND_MS;
  const qualifies = (item: ContractionStat | undefined): item is ContractionStat =>
    item?.durationMs != null && item.durationMs >= minDurationMs;

  const latest = items.at(-1);
  if (!latest) {
    return NO_PATTERN;
  }
  const inProgress = latest.durationMs === null;
  const lastIndex = inProgress ? items.length - 2 : items.length - 1;
  const last = items[lastIndex];

  if (!qualifies(last)) {
    return NO_PATTERN;
  }
  const gapAfterLast =
    (inProgress ? latest.contraction.startedAt : now) - last.contraction.startedAt;
  if (gapAfterLast > maxIntervalMs) {
    return NO_PATTERN;
  }

  let first = lastIndex;
  while (first > 0) {
    const current = items[first];
    const previous = items[first - 1];
    if (!qualifies(previous) || current?.intervalMs == null || current.intervalMs > maxIntervalMs) {
      break;
    }
    first -= 1;
  }

  const intervalsSeen = lastIndex - first + (inProgress ? 1 : 0);
  const windowStartedAt = items[first]?.contraction.startedAt;
  if (intervalsSeen === 0 || windowStartedAt === undefined) {
    return NO_PATTERN;
  }

  const sustainedMs = Math.max(0, now - windowStartedAt);
  const state = sustainedMs >= thresholds.sustainedMinutes * MINUTE_MS ? 'matched' : 'building';
  return { state, windowStartedAt, sustainedMs } satisfies PatternStatus;
}

/**
 * Derives durations, intervals, rest times, last-hour and overall averages,
 * and the pattern status. Pure: the caller supplies `now` from its Clock.
 * Input order does not matter.
 */
export function computeStats(
  contractions: readonly Contraction[],
  thresholds: PatternThresholds,
  now: number,
): ContractionStats {
  const items = toStats([...contractions].sort(byStart));
  const active = items.find(item => item.durationMs === null)?.contraction ?? null;
  const completed = items.filter(item => item.durationMs !== null);
  const recent = items.filter(item => item.contraction.startedAt >= now - ROLLING_WINDOW_MS);

  return {
    items,
    active,
    lastCompleted: completed.at(-1) ?? null,
    lastHour: averagesOf(recent),
    overall: averagesOf(items),
    pattern: patternOf(items, thresholds, now),
  };
}
