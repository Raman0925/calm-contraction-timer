// SPDX-License-Identifier: Apache-2.0
import { formatClock, formatMinutes } from './format';

describe('formatClock', () => {
  it.each([
    [0, '00:00'],
    [999, '00:00'],
    [1_000, '00:01'],
    [65_000, '01:05'],
    [59 * 60_000 + 59_999, '59:59'],
    [3_600_000, '1:00:00'],
    [3_725_000, '1:02:05'],
  ])('%i ms -> %s', (ms, expected) => {
    expect(formatClock(ms)).toBe(expected);
  });

  it.each([-5_000, Number.NaN, Number.POSITIVE_INFINITY])('shows 00:00 for %p', ms => {
    expect(formatClock(ms)).toBe('00:00');
  });
});

describe('formatMinutes', () => {
  it('uses one decimal place', () => {
    expect(formatMinutes(270_000)).toBe('4.5');
    expect(formatMinutes(300_000)).toBe('5.0');
    expect(formatMinutes(-1)).toBe('0.0');
  });
});
