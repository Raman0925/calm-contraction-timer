// SPDX-License-Identifier: Apache-2.0
import { isNightHour, resolveThemeName, type ThemeInputs } from './resolveThemeName';

const base: ThemeInputs = {
  preference: 'system',
  systemScheme: 'light',
  autoNight: true,
  sessionActive: true,
  localHour: 12,
};

describe('isNightHour', () => {
  it.each([
    [21, false],
    [22, true],
    [23, true],
    [0, true],
    [5, true],
    [6, false],
    [12, false],
  ])('hour %i -> %s', (hour, expected) => {
    expect(isNightHour(hour)).toBe(expected);
  });
});

describe('resolveThemeName', () => {
  it('follows the system scheme by day', () => {
    expect(resolveThemeName(base)).toBe('light');
    expect(resolveThemeName({ ...base, systemScheme: 'dark' })).toBe('dark');
  });

  it('falls back to light when the system scheme is unknown', () => {
    expect(resolveThemeName({ ...base, systemScheme: null })).toBe('light');
  });

  it('switches to night during an active session at night', () => {
    expect(resolveThemeName({ ...base, localHour: 23 })).toBe('night');
  });

  it('stays on the system theme at night without an active session', () => {
    expect(resolveThemeName({ ...base, localHour: 23, sessionActive: false })).toBe('light');
  });

  it('stays on the system theme at night when auto night is off', () => {
    expect(resolveThemeName({ ...base, localHour: 23, autoNight: false })).toBe('light');
  });

  it('always honours a manual choice', () => {
    expect(resolveThemeName({ ...base, preference: 'dark', localHour: 23 })).toBe('dark');
    expect(resolveThemeName({ ...base, preference: 'night', localHour: 12 })).toBe('night');
  });
});
