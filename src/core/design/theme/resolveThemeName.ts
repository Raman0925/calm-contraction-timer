// SPDX-License-Identifier: Apache-2.0
import type { ThemeName } from './themes';

/** What the user picked in Settings. `system` follows the OS and allows auto night mode. */
export type ThemePreference = 'system' | ThemeName;

/** Night mode switches on from 22:00 (inclusive) until 06:00 (exclusive), local time. */
export const NIGHT_START_HOUR = 22;
export const NIGHT_END_HOUR = 6;

/** Inputs needed to pick the theme. Pure data so the rule is easy to test. */
export interface ThemeInputs {
  preference: ThemePreference;
  systemScheme: 'light' | 'dark' | null | undefined;
  autoNight: boolean;
  sessionActive: boolean;
  /** Local hour of day, 0-23. */
  localHour: number;
}

/** True when the local hour falls inside the night window. */
export function isNightHour(localHour: number): boolean {
  return localHour >= NIGHT_START_HOUR || localHour < NIGHT_END_HOUR;
}

/**
 * Picks the theme to render. A manual choice always wins; otherwise night mode
 * applies during a session at night, and the OS scheme decides the rest.
 */
export function resolveThemeName(inputs: ThemeInputs): ThemeName {
  if (inputs.preference !== 'system') {
    return inputs.preference;
  }
  if (inputs.autoNight && inputs.sessionActive && isNightHour(inputs.localHour)) {
    return 'night';
  }
  return inputs.systemScheme === 'dark' ? 'dark' : 'light';
}
