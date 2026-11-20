// SPDX-License-Identifier: Apache-2.0
import type { TextStyle } from 'react-native';

/** Spacing scale in dp. Use these instead of raw numbers for margins and padding. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Corner radii in dp. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

/** Animation durations in ms. Skip animations entirely when reduce-motion is on. */
export const durations = {
  fast: 120,
  normal: 220,
  slow: 360,
} as const;

/** Minimum sizes required by the accessibility guidelines. */
export const touchTarget = {
  min: 48,
  mainButton: 120,
} as const;

/** Style for every number that ticks: tabular digits stop the layout from jittering. */
export const timerDigits: TextStyle = {
  fontVariant: ['tabular-nums'],
  fontWeight: '300',
  letterSpacing: 0,
};
