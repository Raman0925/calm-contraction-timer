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

/** Allowed range and step for each threshold in Settings. */
export const THRESHOLD_LIMITS = {
  maxIntervalMinutes: { min: 1, max: 15, step: 1 },
  minDurationSeconds: { min: 30, max: 120, step: 10 },
  sustainedMinutes: { min: 15, max: 180, step: 15 },
} as const satisfies Record<keyof PatternThresholds, { min: number; max: number; step: number }>;

/** Moves one threshold by `steps` of its step size, kept within its limits. */
export function adjustThreshold(
  thresholds: PatternThresholds,
  key: keyof PatternThresholds,
  steps: number,
): PatternThresholds {
  const { min, max, step } = THRESHOLD_LIMITS[key];
  return { ...thresholds, [key]: Math.min(max, Math.max(min, thresholds[key] + steps * step)) };
}
