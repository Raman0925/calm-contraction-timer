// SPDX-License-Identifier: Apache-2.0

/** Source of the current time. Inject it so logic never calls Date.now() directly. */
export interface Clock {
  /** Current time as UTC epoch milliseconds. */
  now(): number;
}

/** The real wall clock. */
export const systemClock: Clock = {
  now: () => Date.now(),
};

/** A clock tests can move by hand. */
export class FakeClock implements Clock {
  constructor(private current = 0) {}

  now(): number {
    return this.current;
  }

  /** Moves the clock to an absolute epoch-ms value. */
  set(epochMs: number): void {
    this.current = epochMs;
  }

  /** Moves the clock forward by `ms`. */
  advance(ms: number): void {
    this.current += ms;
  }
}
