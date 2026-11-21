// SPDX-License-Identifier: Apache-2.0
import { needsAcknowledgement, proOwnership, type StorePurchase } from './entitlement';

const purchase = (overrides: Partial<StorePurchase>): StorePurchase => ({
  id: 't1',
  productId: 'pro_unlock',
  state: 'purchased',
  acknowledged: true,
  ...overrides,
});

describe('proOwnership', () => {
  it('is owned when a Pro purchase is complete', () => {
    expect(proOwnership([purchase({ state: 'pending' }), purchase({})], 'pro_unlock')).toBe(
      'owned',
    );
  });

  it('is pending while payment is not complete', () => {
    expect(proOwnership([purchase({ state: 'pending' })], 'pro_unlock')).toBe('pending');
  });

  it('ignores other products and unknown states', () => {
    expect(
      proOwnership(
        [purchase({ productId: 'other' }), purchase({ state: 'unknown' })],
        'pro_unlock',
      ),
    ).toBe('none');
    expect(proOwnership([], 'pro_unlock')).toBe('none');
  });
});

describe('needsAcknowledgement', () => {
  it('lists completed, unacknowledged Pro purchases only', () => {
    const due = purchase({ id: 'a', acknowledged: false });
    expect(
      needsAcknowledgement(
        [due, purchase({ id: 'b' }), purchase({ id: 'c', state: 'pending', acknowledged: false })],
        'pro_unlock',
      ),
    ).toEqual([due]);
  });
});
