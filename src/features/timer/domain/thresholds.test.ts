// SPDX-License-Identifier: Apache-2.0
import {
  DEFAULT_THRESHOLDS,
  PATTERN_PRESETS,
  adjustThreshold,
  findPreset,
  thresholdsLabel,
} from './thresholds';

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

  it('adjusts one threshold by its step within limits', () => {
    expect(adjustThreshold(DEFAULT_THRESHOLDS, 'maxIntervalMinutes', 1).maxIntervalMinutes).toBe(6);
    expect(adjustThreshold(DEFAULT_THRESHOLDS, 'minDurationSeconds', -1).minDurationSeconds).toBe(
      50,
    );
    expect(adjustThreshold(DEFAULT_THRESHOLDS, 'sustainedMinutes', 99).sustainedMinutes).toBe(180);
    expect(adjustThreshold(DEFAULT_THRESHOLDS, 'maxIntervalMinutes', -99).maxIntervalMinutes).toBe(
      1,
    );
  });
});
