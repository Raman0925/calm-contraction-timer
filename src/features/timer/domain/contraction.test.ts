// SPDX-License-Identifier: Apache-2.0
import { MAX_NOTE_LENGTH, normaliseNote, toIntensity } from './contraction';

describe('toIntensity', () => {
  it('keeps 1-3 and drops anything else', () => {
    expect([1, 2, 3].map(toIntensity)).toEqual([1, 2, 3]);
    expect([0, 4, 1.5, null, undefined].map(toIntensity)).toEqual([null, null, null, null, null]);
  });
});

describe('normaliseNote', () => {
  it('trims, nulls blanks and caps the length', () => {
    expect(normaliseNote('  back pain ')).toBe('back pain');
    expect(normaliseNote('   ')).toBeNull();
    expect(normaliseNote(null)).toBeNull();
    expect(normaliseNote('x'.repeat(MAX_NOTE_LENGTH + 10))).toHaveLength(MAX_NOTE_LENGTH);
  });
});
