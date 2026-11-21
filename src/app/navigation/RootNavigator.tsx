// SPDX-License-Identifier: Apache-2.0
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStaticNavigation, type StaticParamList } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppText, Icon, type IconName } from '@core/design';
import { i18n } from '@core/i18n';
import { ExportScreen } from '@features/export/ui/ExportScreen';
import { HistoryScreen } from '@features/history/ui/HistoryScreen';
import { OnboardingScreen } from '@features/onboarding/ui/OnboardingScreen';
import { PaywallScreen } from '@features/paywall/ui/PaywallScreen';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import { DisclaimerScreen } from '@features/settings/ui/DisclaimerScreen';
import { LicencesScreen } from '@features/settings/ui/LicencesScreen';
import { SessionDetailScreen } from '@features/history/ui/SessionDetailScreen';
import { SettingsScreen } from '@features/settings/ui/SettingsScreen';
import { TimerScreen } from '@features/timer/ui/TimerScreen';
import { withScreenBoundary } from '../ScreenErrorBoundary';

const tabIcon =
  (name: IconName) =>
  ({ color, size }: { color: string; size: number }) => (
    <Icon name={name} color={color} size={size} />
  );

/**
 * The tab bar has a fixed height, so labels stop growing at 1.3× (like Android's own
 * navigation bars) instead of running into the gesture area. Screen content scales fully.
 */
const TAB_LABEL_MAX_FONT_SCALE = 1.3;
const tabLabel = ({ color, children }: { color: string; children: string }) => (
  <AppText variant="labelMedium" style={{ color }} maxFontSizeMultiplier={TAB_LABEL_MAX_FONT_SCALE}>
    {children}
  </AppText>
);

const HomeTabs = createBottomTabNavigator({
  screenOptions: { tabBarLabel: tabLabel },
  screens: {
    Timer: {
      screen: withScreenBoundary(TimerScreen),
      options: () => ({
        title: i18n.t('tabs.timer'),
        tabBarIcon: tabIcon('timer-outline'),
        tabBarButtonTestID: 'tab-timer',
      }),
    },
    History: {
      screen: withScreenBoundary(HistoryScreen),
      options: () => ({
        title: i18n.t('tabs.history'),
        tabBarIcon: tabIcon('history'),
        tabBarButtonTestID: 'tab-history',
      }),
    },
    Settings: {
      screen: withScreenBoundary(SettingsScreen),
      options: () => ({
        title: i18n.t('tabs.settings'),
        tabBarIcon: tabIcon('cog-outline'),
        tabBarButtonTestID: 'tab-settings',
      }),
    },
  },
});

/** Onboarding shows until the medical disclaimer has been accepted. */
const useNeedsOnboarding = () => useSettingsStore(state => state.disclaimerAcceptedAt === null);
const useIsOnboarded = () => !useNeedsOnboarding();

const RootStack = createNativeStackNavigator({
  groups: {
    Onboarding: {
      if: useNeedsOnboarding,
      screens: {
        Onboarding: {
          screen: withScreenBoundary(OnboardingScreen),
          options: { headerShown: false },
        },
      },
    },
    App: {
      if: useIsOnboarded,
      screens: {
        Home: { screen: HomeTabs, options: { headerShown: false } },
        SessionDetail: {
          screen: withScreenBoundary(SessionDetailScreen),
          options: () => ({ title: i18n.t('history.sessionTitle') }),
        },
        Export: {
          screen: withScreenBoundary(ExportScreen),
          options: () => ({ title: i18n.t('export.title') }),
        },
        Disclaimer: {
          screen: withScreenBoundary(DisclaimerScreen),
          options: () => ({ title: i18n.t('disclaimer.title') }),
        },
        Licences: {
          screen: withScreenBoundary(LicencesScreen),
          options: () => ({ title: i18n.t('licences.title') }),
        },
        Paywall: {
          screen: withScreenBoundary(PaywallScreen),
          options: () => ({ title: i18n.t('pro.badge'), presentation: 'modal' }),
        },
      },
    },
  },
});

/** Top-level navigation container generated from the static config. */
export const Navigation = createStaticNavigation(RootStack);

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
