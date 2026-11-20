// SPDX-License-Identifier: Apache-2.0
import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import type { AppTheme } from '@core/design';

/** Maps the app theme onto React Navigation's theme so headers and tab bars match. */
export function toNavigationTheme(theme: AppTheme): Theme {
  const base = theme.dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.elevation.level2,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
      notification: theme.colors.error,
    },
  };
}
