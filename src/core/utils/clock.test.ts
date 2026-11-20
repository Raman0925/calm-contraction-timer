// SPDX-License-Identifier: Apache-2.0
import { FakeClock } from './clock';

describe('FakeClock', () => {
  it('can be set and advanced', () => {
    const clock = new FakeClock(1_000);
    clock.advance(500);
    expect(clock.now()).toBe(1_500);
    clock.set(42);
    expect(clock.now()).toBe(42);
  });
});
