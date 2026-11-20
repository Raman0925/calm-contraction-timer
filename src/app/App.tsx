// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider, useAppTheme } from '@core/design';
import { initI18n } from '@core/i18n';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import { installGlobalErrorHandler } from './globalErrorHandler';
import { Navigation } from './navigation/RootNavigator';
import { toNavigationTheme } from './navigation/navigationTheme';

initI18n();
installGlobalErrorHandler();

function ThemedNavigation() {
  const theme = useAppTheme();
  const navigationTheme = useMemo(() => toNavigationTheme(theme), [theme]);
  return <Navigation theme={navigationTheme} />;
}

/** App root: providers, theme and navigation. */
export function App() {
  const themePreference = useSettingsStore(state => state.themePreference);
  const autoNight = useSettingsStore(state => state.autoNight);

  return (
    <SafeAreaProvider>
      <AppThemeProvider preference={themePreference} autoNight={autoNight} sessionActive={false}>
        <ThemedNavigation />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
