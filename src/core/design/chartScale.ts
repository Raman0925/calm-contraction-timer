// SPDX-License-Identifier: Apache-2.0

const NICE_FACTORS = [1, 2, 2.5, 5, 10];

export interface ChartScale {
  step: number;
  sections: number;
}

/**
 * Picks a readable y axis: the smallest 1, 2, 2.5 or 5 × 10^n step that fits `maxValue`
 * into at most `maxSections`, then only as many sections as the data needs, so the
 * tallest value fills most of the chart. The step is a whole multiple of `minStep`, so
 * whole-number axes stay whole.
 */
export function niceScale(maxValue: number, maxSections: number, minStep = 1): ChartScale {
  const max = Math.max(maxValue, 0);
  const raw = max / maxSections;
  let step = minStep;
  if (raw > minStep) {
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    step =
      NICE_FACTORS.map(factor => factor * magnitude).find(
        candidate => candidate >= raw && Number.isInteger(candidate / minStep),
      ) ?? 10 * magnitude;
  }
  return { step, sections: Math.min(maxSections, Math.max(1, Math.ceil(max / step))) };
}
