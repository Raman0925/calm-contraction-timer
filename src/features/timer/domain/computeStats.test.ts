// SPDX-License-Identifier: Apache-2.0
import { HOUR_MS, MINUTE_MS, SECOND_MS } from '@core/utils/time';
import { computeStats } from './computeStats';
import { contraction, series } from './testing/builders';
import { DEFAULT_THRESHOLDS, PATTERN_PRESETS } from './thresholds';

const BASE = Date.UTC(2026, 0, 10, 8, 0);
const at = (minutes: number) => BASE + minutes * MINUTE_MS;

describe('computeStats: per-contraction figures', () => {
  it('handles no contractions', () => {
    const stats = computeStats([], DEFAULT_THRESHOLDS, BASE);
    expect(stats.items).toEqual([]);
    expect(stats.active).toBeNull();
    expect(stats.lastCompleted).toBeNull();
    expect(stats.overall).toEqual({ count: 0, avgDurationMs: null, avgIntervalMs: null });
    expect(stats.pattern.state).toBe('none');
  });

  it('handles a single contraction', () => {
    const only = contraction(BASE, 0, 45);
    const stats = computeStats([only], DEFAULT_THRESHOLDS, at(1));
    expect(stats.items).toEqual([
      { contraction: only, durationMs: 45 * SECOND_MS, intervalMs: null, restMs: null },
    ]);
    expect(stats.overall.avgIntervalMs).toBeNull();
    expect(stats.pattern.state).toBe('none');
  });

  it('derives interval (start to start) and rest (end to start)', () => {
    const first = contraction(BASE, 0, 60);
    const second = contraction(BASE, 6, 50);
    const [, item] = computeStats([first, second], DEFAULT_THRESHOLDS, at(7)).items;
    expect(item?.intervalMs).toBe(6 * MINUTE_MS);
    expect(item?.restMs).toBe(5 * MINUTE_MS);
    expect(item?.durationMs).toBe(50 * SECOND_MS);
  });

  it('sorts input by start time', () => {
    const first = contraction(BASE, 0, 60);
    const second = contraction(BASE, 5, 60);
    const stats = computeStats([second, first], DEFAULT_THRESHOLDS, at(6));
    expect(stats.items.map(item => item.contraction)).toEqual([first, second]);
  });

  it('reports the contraction in progress without a duration', () => {
    const done = contraction(BASE, 0, 60);
    const running = contraction(BASE, 5, null);
    const stats = computeStats([done, running], DEFAULT_THRESHOLDS, at(5.5));
    expect(stats.active).toBe(running);
    expect(stats.items[1]?.durationMs).toBeNull();
    expect(stats.items[1]?.restMs).toBe(4 * MINUTE_MS);
    expect(stats.lastCompleted?.contraction).toBe(done);
    expect(stats.overall.avgDurationMs).toBe(60 * SECOND_MS);
  });

  it('keeps a zero-length contraction with a duration of 0', () => {
    const tap = contraction(BASE, 0, 0);
    const stats = computeStats([tap], DEFAULT_THRESHOLDS, at(1));
    expect(stats.items[0]?.durationMs).toBe(0);
    expect(stats.lastCompleted?.durationMs).toBe(0);
  });

  it('copes with double taps that share a start time', () => {
    const a = contraction(BASE, 0, 0);
    const b = contraction(BASE, 0, 0);
    const stats = computeStats([b, a], DEFAULT_THRESHOLDS, at(1));
    expect(stats.items.map(item => item.contraction.id)).toEqual([a.id, b.id]);
    expect(stats.items[1]?.intervalMs).toBe(0);
    expect(stats.items[1]?.restMs).toBe(0);
  });

  it('reports long gaps as they are', () => {
    const stats = computeStats(
      [contraction(BASE, 0, 60), contraction(BASE, 180, 60)],
      DEFAULT_THRESHOLDS,
      at(181),
    );
    expect(stats.items[1]?.intervalMs).toBe(3 * HOUR_MS);
    expect(stats.pattern.state).toBe('none');
  });

  it('is unaffected by a daylight-saving change (times are UTC epoch ms)', () => {
    // Europe moves clocks forward at 01:00 UTC on 29 March 2026.
    const dstChange = Date.UTC(2026, 2, 29, 1, 0);
    const stats = computeStats(
      series(dstChange - 10 * MINUTE_MS, 5, 5, 60),
      DEFAULT_THRESHOLDS,
      dstChange + 11 * MINUTE_MS,
    );
    expect(stats.items.slice(1).map(item => item.intervalMs)).toEqual(Array(4).fill(5 * MINUTE_MS));
  });
});

describe('computeStats: sessions', () => {
  it('does not measure intervals across a session boundary', () => {
    const yesterday = series(BASE, 3, 5, 60);
    const today = series(at(20 * 60), 2, 5, 60);
    const stats = computeStats([...yesterday, ...today], DEFAULT_THRESHOLDS, at(20 * 60 + 6));
    expect(stats.items[3]).toEqual(expect.objectContaining({ intervalMs: null, restMs: null }));
    expect(stats.overall.avgIntervalMs).toBe(5 * MINUTE_MS);
  });
});

describe('computeStats: averages', () => {
  it('averages only contractions that started in the last hour', () => {
    const old = contraction(BASE, 0, 30);
    const recent = [contraction(BASE, 70, 60), contraction(BASE, 76, 80)];
    const stats = computeStats([old, ...recent], DEFAULT_THRESHOLDS, at(90));
    expect(stats.lastHour).toEqual({
      count: 2,
      avgDurationMs: 70 * SECOND_MS,
      avgIntervalMs: 38 * MINUTE_MS,
    });
    expect(stats.overall.count).toBe(3);
  });
});

describe('computeStats: pattern', () => {
  it('matches 5-1-1 after an hour of qualifying contractions', () => {
    const stats = computeStats(series(BASE, 13, 5, 60), DEFAULT_THRESHOLDS, at(61));
    expect(stats.pattern).toEqual({
      state: 'matched',
      windowStartedAt: BASE,
      sustainedMs: 61 * MINUTE_MS,
    });
  });

  it('includes the exact threshold values', () => {
    const atLimits = series(BASE, 13, 5, 60);
    const stats = computeStats(atLimits, DEFAULT_THRESHOLDS, at(60 + 5));
    expect(stats.pattern).toEqual({
      state: 'matched',
      windowStartedAt: BASE,
      sustainedMs: 65 * MINUTE_MS,
    });
    const justShort = series(BASE, 13, 5, 59.999);
    expect(computeStats(justShort, DEFAULT_THRESHOLDS, at(61)).pattern.state).toBe('none');
  });

  it('is building before the sustained time is reached', () => {
    const stats = computeStats(series(BASE, 7, 5, 60), DEFAULT_THRESHOLDS, at(31));
    expect(stats.pattern.state).toBe('building');
    expect(stats.pattern.sustainedMs).toBe(31 * MINUTE_MS);
  });

  it('lapses when the next contraction is overdue', () => {
    const stats = computeStats(series(BASE, 13, 5, 60), DEFAULT_THRESHOLDS, at(60 + 5.5));
    expect(stats.pattern.state).toBe('none');
  });

  it('starts the window after a contraction that was too short', () => {
    const items = series(BASE, 13, 5, 60);
    items[3] = { ...items[3]!, endedAt: items[3]!.startedAt + 30 * SECOND_MS };
    const stats = computeStats(items, DEFAULT_THRESHOLDS, at(61));
    expect(stats.pattern.windowStartedAt).toBe(at(20));
    expect(stats.pattern.state).toBe('building');
  });

  it('starts the window after an interval that was too long', () => {
    const items = [...series(BASE, 3, 5, 60), ...series(at(20), 3, 5, 60)];
    const stats = computeStats(items, DEFAULT_THRESHOLDS, at(31));
    expect(stats.pattern.windowStartedAt).toBe(at(20));
  });

  it('is none when the latest completed contraction was too short', () => {
    const items = [...series(BASE, 6, 5, 60), contraction(BASE, 30, 20)];
    expect(computeStats(items, DEFAULT_THRESHOLDS, at(31)).pattern.state).toBe('none');
  });

  it('needs at least one interval', () => {
    expect(computeStats([contraction(BASE, 0, 90)], DEFAULT_THRESHOLDS, at(2)).pattern.state).toBe(
      'none',
    );
  });

  it('counts a contraction in progress that started on time', () => {
    const items = [contraction(BASE, 0, 70), contraction(BASE, 4, null)];
    const stats = computeStats(items, DEFAULT_THRESHOLDS, at(20));
    expect(stats.pattern.state).toBe('building');
    expect(stats.pattern.windowStartedAt).toBe(BASE);
  });

  it('ignores the run when the contraction in progress started too late', () => {
    const items = [...series(BASE, 13, 5, 60), contraction(BASE, 66, null)];
    expect(computeStats(items, DEFAULT_THRESHOLDS, at(66.5)).pattern.state).toBe('none');
  });

  it('respects the 4-1-1 and 7-1-1 presets', () => {
    const everySix = series(BASE, 12, 6, 70);
    const now = at(66 + 1);
    expect(computeStats(everySix, PATTERN_PRESETS['5-1-1'], now).pattern.state).toBe('none');
    expect(computeStats(everySix, PATTERN_PRESETS['7-1-1'], now).pattern.state).toBe('matched');
    const everyFourAndAHalf = series(BASE, 15, 4.5, 70);
    expect(computeStats(everyFourAndAHalf, PATTERN_PRESETS['4-1-1'], at(64)).pattern.state).toBe(
      'none',
    );
    expect(computeStats(everyFourAndAHalf, PATTERN_PRESETS['5-1-1'], at(64)).pattern.state).toBe(
      'matched',
    );
  });
});
