// SPDX-License-Identifier: Apache-2.0
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider, EmptyState, Screen, useAppTheme } from '@core/design';
import { initI18n } from '@core/i18n';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import type { FileSharer } from '@features/export/data/fileSharer';
import { FileSharerProvider, useFileSharer } from '@features/export/ui/ExportServices';
import type { BillingService } from '@features/paywall/data/billingService';
import { PlayBilling } from '@features/paywall/data/playBilling';
import { ProProvider } from '@features/paywall/ui/ProServices';
import { TimerServicesProvider, type TimerServices } from '@features/timer/ui/TimerServices';
import { useCurrentSession } from '@features/timer/ui/useCurrentSession';
import { useSessionNotificationSync } from '@features/timer/ui/useSessionNotificationSync';
import { installGlobalErrorHandler } from './globalErrorHandler';
import { Navigation } from './navigation/RootNavigator';
import { toNavigationTheme } from './navigation/navigationTheme';
import { createProductionServices } from './services';

initI18n();
installGlobalErrorHandler();

const THEME_TICK_MS = 60_000;

function ThemedNavigation() {
  const theme = useAppTheme();
  const navigationTheme = useMemo(() => toNavigationTheme(theme), [theme]);
  return <Navigation theme={navigationTheme} />;
}

function ThemedApp({ sessionActive, children }: { sessionActive: boolean; children: ReactNode }) {
  const themePreference = useSettingsStore(state => state.themePreference);
  const autoNight = useSettingsStore(state => state.autoNight);
  return (
    <AppThemeProvider
      preference={themePreference}
      autoNight={autoNight}
      sessionActive={sessionActive}
    >
      {children}
    </AppThemeProvider>
  );
}

/** Runs once services are ready: theme follows the session, notification stays in sync. */
function ReadyApp() {
  const { session } = useCurrentSession(THEME_TICK_MS);
  const sharer = useFileSharer();
  useSessionNotificationSync();

  // Exported files are only needed while sharing; never keep them across launches.
  useEffect(() => {
    sharer.clearExports().catch((error: unknown) => {
      console.error('Clearing old exports failed', error);
    });
  }, [sharer]);
  return (
    <ThemedApp sessionActive={session !== null}>
      <ThemedNavigation />
    </ThemedApp>
  );
}

function BootScreen({ failed }: { failed: boolean }) {
  const { t } = useTranslation();
  return (
    <ThemedApp sessionActive={false}>
      <Screen scroll={false} testID="boot-screen">
        <EmptyState
          icon={failed ? 'database-alert-outline' : 'timer-sand'}
          title={failed ? t('app.dbErrorTitle') : t('app.loading')}
          message={failed ? t('app.dbErrorMessage') : undefined}
        />
      </Screen>
    </ThemedApp>
  );
}

interface AppProps {
  /** Injected in tests; production services are created on first launch otherwise. */
  services?: TimerServices;
  /** Injected in tests; the device share sheet otherwise. */
  fileSharer?: FileSharer;
  /** Injected in tests; Google Play otherwise. */
  billing?: BillingService;
}

/** App root: opens the database, then provides services, theme and navigation. */
export function App({ services: injected, fileSharer, billing: injectedBilling }: AppProps) {
  const [billing] = useState<BillingService>(() => injectedBilling ?? new PlayBilling());
  const [services, setServices] = useState<TimerServices | undefined>(injected);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (services) {
      return;
    }
    createProductionServices()
      .then(setServices)
      .catch((error: unknown) => {
        console.error('Opening the database failed', error);
        setFailed(true);
      });
  }, [services]);

  return (
    <SafeAreaProvider>
      {services ? (
        <TimerServicesProvider services={services}>
          <ProProvider billing={billing}>
            {fileSharer ? (
              <FileSharerProvider sharer={fileSharer}>
                <ReadyApp />
              </FileSharerProvider>
            ) : (
              <ReadyApp />
            )}
          </ProProvider>
        </TimerServicesProvider>
      ) : (
        <BootScreen failed={failed} />
      )}
    </SafeAreaProvider>
  );
}
