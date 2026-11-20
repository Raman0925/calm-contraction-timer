// SPDX-License-Identifier: Apache-2.0
import { MINUTE_MS, SECOND_MS } from '@core/utils/time';
import type { Contraction } from '../contraction';

let nextId = 1;

/** Builds a contraction starting `startMin` minutes after `base` and lasting `durationSec`. */
export function contraction(
  base: number,
  startMin: number,
  durationSec: number | null,
  overrides: Partial<Contraction> = {},
): Contraction {
  const startedAt = base + startMin * MINUTE_MS;
  return {
    id: nextId++,
    startedAt,
    endedAt: durationSec === null ? null : startedAt + durationSec * SECOND_MS,
    intensity: null,
    note: null,
    ...overrides,
  };
}

/** Builds `count` contractions every `everyMin` minutes, each lasting `durationSec`. */
export function series(base: number, count: number, everyMin: number, durationSec: number) {
  return Array.from({ length: count }, (_, i) => contraction(base, i * everyMin, durationSec));
}
