// SPDX-License-Identifier: Apache-2.0
import { computeStats } from '@features/timer/domain/computeStats';
import { contraction } from '@features/timer/domain/testing/builders';
import { DEFAULT_THRESHOLDS } from '@features/timer/domain/thresholds';
import { UTF8_BOM, contractionsToCsv } from './csv';

const BASE = Date.UTC(2026, 0, 10, 8, 0);

describe('contractionsToCsv', () => {
  it('writes a header and one row per contraction in UTC', () => {
    const items = computeStats(
      [contraction(BASE, 0, 60, { intensity: 2 }), contraction(BASE, 5, 75)],
      DEFAULT_THRESHOLDS,
      BASE,
    ).items;
    const csv = contractionsToCsv(items);
    expect(csv.startsWith(UTF8_BOM)).toBe(true);
    expect(csv.slice(1).split('\r\n')).toEqual([
      'start,end,duration_seconds,interval_minutes,rest_seconds,intensity,note',
      '2026-01-10T08:00:00+00:00,2026-01-10T08:01:00+00:00,60,,,2,',
      '2026-01-10T08:05:00+00:00,2026-01-10T08:06:15+00:00,75,5.00,240,,',
      '',
    ]);
  });

  it('leaves the end and duration blank while running', () => {
    const items = computeStats([contraction(BASE, 0, null)], DEFAULT_THRESHOLDS, BASE).items;
    expect(contractionsToCsv(items)).toContain('2026-01-10T08:00:00+00:00,,,,,,');
  });

  it('quotes notes with commas, quotes and line breaks', () => {
    const note = 'back pain, "strong"\nthen better';
    const items = computeStats(
      [contraction(BASE, 0, 60, { note })],
      DEFAULT_THRESHOLDS,
      BASE,
    ).items;
    expect(contractionsToCsv(items)).toContain('"back pain, ""strong""\nthen better"');
  });

  it('defuses notes that a spreadsheet would treat as formulas', () => {
    const items = computeStats(
      [contraction(BASE, 0, 60, { note: '=HYPERLINK("x")' })],
      DEFAULT_THRESHOLDS,
      BASE,
    ).items;
    expect(contractionsToCsv(items)).toContain(`"'=HYPERLINK(""x"")"`);
  });
});
