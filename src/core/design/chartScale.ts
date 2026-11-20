// SPDX-License-Identifier: Apache-2.0

const NICE_FACTORS = [1, 2, 5, 10];

/**
 * Picks a readable axis step: the smallest 1, 2 or 5 × 10^n that fits
 * `maxValue` into `sections`. Never below `minStep`, so whole-number axes stay whole.
 */
export function niceStep(maxValue: number, sections: number, minStep = 1): number {
  const raw = Math.max(maxValue, 0) / sections;
  if (raw <= minStep) {
    return minStep;
  }
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const factor = NICE_FACTORS.find(f => f * magnitude >= raw) ?? 10;
  return factor * magnitude;
}
