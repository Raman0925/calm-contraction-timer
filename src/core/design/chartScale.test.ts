// SPDX-License-Identifier: Apache-2.0
import { niceStep } from './chartScale';

describe('niceStep', () => {
  it.each([
    [0, 1],
    [3, 1],
    [5.3, 2],
    [60, 20],
    [75, 20],
    [90, 50],
    [130, 50],
    [600, 200],
  ])('max %p over 4 sections -> step %p', (max, step) => {
    expect(niceStep(max, 4)).toBe(step);
  });
});
