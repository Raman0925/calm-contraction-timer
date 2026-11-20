// SPDX-License-Identifier: Apache-2.0
import { err, ok } from './result';

describe('Result', () => {
  it('wraps values and errors', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(err('nope')).toEqual({ ok: false, error: 'nope' });
  });
});
