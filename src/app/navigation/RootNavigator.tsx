// SPDX-License-Identifier: Apache-2.0
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStaticNavigation, type StaticParamList } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon, type IconName } from '@core/design';
import { i18n } from '@core/i18n';
import { HistoryScreen } from '@features/history/ui/HistoryScreen';
import { SettingsScreen } from '@features/settings/ui/SettingsScreen';
import { TimerScreen } from '@features/timer/ui/TimerScreen';
import { withScreenBoundary } from '../ScreenErrorBoundary';

const tabIcon =
  (name: IconName) =>
  ({ color, size }: { color: string; size: number }) => (
    <Icon name={name} color={color} size={size} />
  );

const HomeTabs = createBottomTabNavigator({
  screens: {
    Timer: {
      screen: withScreenBoundary(TimerScreen),
      options: () => ({ title: i18n.t('tabs.timer'), tabBarIcon: tabIcon('timer-outline') }),
    },
    History: {
      screen: withScreenBoundary(HistoryScreen),
      options: () => ({ title: i18n.t('tabs.history'), tabBarIcon: tabIcon('history') }),
    },
    Settings: {
      screen: withScreenBoundary(SettingsScreen),
      options: () => ({ title: i18n.t('tabs.settings'), tabBarIcon: tabIcon('cog-outline') }),
    },
  },
});

const RootStack = createNativeStackNavigator({
  screens: {
    Home: { screen: HomeTabs, options: { headerShown: false } },
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
