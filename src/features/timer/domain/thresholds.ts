// SPDX-License-Identifier: Apache-2.0

/** The user's pattern thresholds, e.g. 5-1-1. */
export interface PatternThresholds {
  /** Contractions start at most this many minutes apart. */
  maxIntervalMinutes: number;
  /** Each contraction lasts at least this many seconds. */
  minDurationSeconds: number;
  /** The pattern has held for at least this many minutes. */
  sustainedMinutes: number;
}

/** Built-in presets. 5-1-1 is the default. */
export const PATTERN_PRESETS = {
  '5-1-1': { maxIntervalMinutes: 5, minDurationSeconds: 60, sustainedMinutes: 60 },
  '4-1-1': { maxIntervalMinutes: 4, minDurationSeconds: 60, sustainedMinutes: 60 },
  '7-1-1': { maxIntervalMinutes: 7, minDurationSeconds: 60, sustainedMinutes: 60 },
} as const satisfies Record<string, PatternThresholds>;

export type PatternPresetId = keyof typeof PATTERN_PRESETS;

export const DEFAULT_THRESHOLDS: PatternThresholds = PATTERN_PRESETS['5-1-1'];

/** Returns the preset these thresholds equal, or null for a custom setting. */
export function findPreset(thresholds: PatternThresholds): PatternPresetId | null {
  const ids = Object.keys(PATTERN_PRESETS) as PatternPresetId[];
  return (
    ids.find(id => {
      const preset = PATTERN_PRESETS[id];
      return (
        preset.maxIntervalMinutes === thresholds.maxIntervalMinutes &&
        preset.minDurationSeconds === thresholds.minDurationSeconds &&
        preset.sustainedMinutes === thresholds.sustainedMinutes
      );
    }) ?? null
  );
}

/** Short label such as `5-1-1`; custom values read like `6-1.5-90`. */
export function thresholdsLabel(thresholds: PatternThresholds): string {
  return `${thresholds.maxIntervalMinutes}-${thresholds.minDurationSeconds / 60}-${thresholds.sustainedMinutes / 60}`;
}
