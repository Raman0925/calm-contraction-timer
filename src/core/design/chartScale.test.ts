// SPDX-License-Identifier: Apache-2.0
import { niceScale } from './chartScale';

describe('niceScale', () => {
  it.each([
    [0, 1, 1],
    [3, 1, 3],
    [5.3, 2, 3],
    [9.8, 5, 2],
    [60, 20, 3],
    [75, 20, 4],
    [80, 20, 4],
    [86, 25, 4],
    [130, 50, 3],
    [600, 200, 3],
  ])('max %p fits in up to 4 sections as step %p × %p', (max, step, sections) => {
    expect(niceScale(max, 4)).toEqual({ step, sections });
  });

  it('keeps whole-number steps when the raw step is below 10', () => {
    // 2.5 would fit 8.4 / 4 = 2.1, but is not a whole number.
    expect(niceScale(8.4, 4)).toEqual({ step: 5, sections: 2 });
  });

  it('never goes above the section limit', () => {
    expect(niceScale(1_000_000, 4).sections).toBeLessThanOrEqual(4);
  });
});
