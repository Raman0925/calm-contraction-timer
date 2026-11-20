// SPDX-License-Identifier: Apache-2.0
import type { ReactNode } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { systemClock, type Clock } from '@core/utils/clock';
import { resolveThemeName, type ThemePreference } from './resolveThemeName';
import { getTheme } from './themes';
import { useLocalHour } from './useLocalHour';

interface AppThemeProviderProps {
  preference: ThemePreference;
  autoNight: boolean;
  sessionActive: boolean;
  clock?: Clock;
  children: ReactNode;
}

/** Resolves the active theme and provides it to Paper and the status bar. */
export function AppThemeProvider({
  preference,
  autoNight,
  sessionActive,
  clock = systemClock,
  children,
}: AppThemeProviderProps) {
  const systemScheme = useColorScheme();
  const localHour = useLocalHour(clock);
  const theme = getTheme(
    resolveThemeName({ preference, systemScheme, autoNight, sessionActive, localHour }),
  );

  return (
    <PaperProvider theme={theme}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      {children}
    </PaperProvider>
  );
}
