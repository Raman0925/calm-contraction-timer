// SPDX-License-Identifier: Apache-2.0
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AdsProvider } from '@core/ads/AdsProvider';
import type { AdsService } from '@core/ads/adsService';
import { googleAds } from '@core/ads/googleAds';
import { AppThemeProvider, EmptyState, Screen, useAppTheme } from '@core/design';
import { initI18n } from '@core/i18n';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import type { BackupFiles } from '@features/backup/data/backupFiles';
import { BackupFilesProvider, useBackupFiles } from '@features/backup/ui/BackupServices';
import type { FileSharer } from '@features/export/data/fileSharer';
import { FileSharerProvider, useFileSharer } from '@features/export/ui/ExportServices';
import type { BillingService } from '@features/paywall/data/billingService';
import { PlayBilling } from '@features/paywall/data/playBilling';
import { ProProvider, useIsPro } from '@features/paywall/ui/ProServices';
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
function ReadyApp({ ads }: { ads: AdsService }) {
  const { session } = useCurrentSession(THEME_TICK_MS);
  const sharer = useFileSharer();
  const backupFiles = useBackupFiles();
  const isPro = useIsPro();
  const disclaimerAccepted = useSettingsStore(state => state.disclaimerAcceptedAt !== null);
  // Decided once per launch: losing Pro mid-session (a refund) must not pop the consent
  // form over a running timer; it waits for the next launch.
  const [launchedAsFree] = useState(!isPro);
  useSessionNotificationSync();

  // Exported and staged backup files are only needed briefly; never keep them across launches.
  useEffect(() => {
    Promise.all([sharer.clearExports(), backupFiles.clearTemporaryFiles()]).catch(
      (error: unknown) => {
        console.error('Clearing temporary files failed', error);
      },
    );
  }, [sharer, backupFiles]);
  return (
    <AdsProvider ads={ads} enabled={launchedAsFree && !isPro && disclaimerAccepted}>
      <ThemedApp sessionActive={session !== null}>
        <ThemedNavigation />
      </ThemedApp>
    </AdsProvider>
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

/** Applies the fakes tests pass in; in the app every service uses its default. */
function TestOverrides({
  fileSharer,
  backupFiles,
  children,
}: {
  fileSharer?: FileSharer;
  backupFiles?: BackupFiles;
  children: ReactNode;
}) {
  let content = children;
  if (fileSharer) {
    content = <FileSharerProvider sharer={fileSharer}>{content}</FileSharerProvider>;
  }
  if (backupFiles) {
    content = <BackupFilesProvider files={backupFiles}>{content}</BackupFilesProvider>;
  }
  return content;
}

interface AppProps {
  /** Injected in tests; production services are created on first launch otherwise. */
  services?: TimerServices;
  /** Injected in tests; the device share sheet otherwise. */
  fileSharer?: FileSharer;
  /** Injected in tests; Google Play otherwise. */
  billing?: BillingService;
  /** Injected in tests; Google Mobile Ads with UMP consent otherwise. */
  ads?: AdsService;
  /** Injected in tests; the system file picker otherwise. */
  backupFiles?: BackupFiles;
}

/** App root: opens the database, then provides services, theme and navigation. */
export function App({
  services: injected,
  fileSharer,
  billing: injectedBilling,
  ads = googleAds,
  backupFiles,
}: AppProps) {
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
            <TestOverrides fileSharer={fileSharer} backupFiles={backupFiles}>
              <ReadyApp ads={ads} />
            </TestOverrides>
          </ProProvider>
        </TimerServicesProvider>
      ) : (
        <BootScreen failed={failed} />
      )}
    </SafeAreaProvider>
  );
}
