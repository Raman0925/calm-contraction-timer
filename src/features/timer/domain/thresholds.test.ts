// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_THRESHOLDS, PATTERN_PRESETS, findPreset, thresholdsLabel } from './thresholds';

describe('thresholds', () => {
  it('defaults to 5-1-1', () => {
    expect(findPreset(DEFAULT_THRESHOLDS)).toBe('5-1-1');
  });

  it('recognises every preset by value', () => {
    expect(findPreset({ ...PATTERN_PRESETS['4-1-1'] })).toBe('4-1-1');
    expect(findPreset({ ...PATTERN_PRESETS['7-1-1'] })).toBe('7-1-1');
  });

  it('returns null for custom values', () => {
    expect(
      findPreset({ maxIntervalMinutes: 6, minDurationSeconds: 60, sustainedMinutes: 60 }),
    ).toBeNull();
  });

  it('labels thresholds', () => {
    expect(thresholdsLabel(DEFAULT_THRESHOLDS)).toBe('5-1-1');
    expect(
      thresholdsLabel({ maxIntervalMinutes: 6, minDurationSeconds: 90, sustainedMinutes: 90 }),
    ).toBe('6-1.5-1.5');
  });
});
