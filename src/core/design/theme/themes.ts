// SPDX-License-Identifier: Apache-2.0
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { darkPalette, lightPalette, nightPalette } from './palettes';

/** Names of the themes the app can render. */
export type ThemeName = 'light' | 'dark' | 'night';

/**
 * The app theme: Paper's MD3 theme plus the theme name. Paper v5 declares its
 * theme as type aliases (not interfaces), so it is extended by intersection and
 * read through {@link useAppTheme} as the Paper docs recommend.
 */
export type AppTheme = MD3Theme & {
  name: ThemeName;
};

const ROUNDNESS = 4;

export const lightTheme: AppTheme = {
  ...MD3LightTheme,
  name: 'light',
  roundness: ROUNDNESS,
  colors: { ...MD3LightTheme.colors, ...lightPalette },
};

export const darkTheme: AppTheme = {
  ...MD3DarkTheme,
  name: 'dark',
  roundness: ROUNDNESS,
  colors: { ...MD3DarkTheme.colors, ...darkPalette },
};

export const nightTheme: AppTheme = {
  ...MD3DarkTheme,
  name: 'night',
  roundness: ROUNDNESS,
  colors: { ...MD3DarkTheme.colors, ...nightPalette },
};

const THEMES: Record<ThemeName, AppTheme> = {
  light: lightTheme,
  dark: darkTheme,
  night: nightTheme,
};

/** Returns the theme object for a theme name. */
export function getTheme(name: ThemeName): AppTheme {
  return THEMES[name];
}
