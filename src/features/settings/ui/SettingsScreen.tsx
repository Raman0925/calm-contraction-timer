// SPDX-License-Identifier: Apache-2.0
import { useTranslation } from 'react-i18next';
import {
  AppText,
  ChoiceList,
  Screen,
  SwitchRow,
  type Choice,
  type ThemePreference,
} from '@core/design';
import { useTimerServices } from '@features/timer/ui/TimerServices';
import { useSettingsStore } from '../data/settingsStore';

const THEME_OPTIONS: readonly ThemePreference[] = ['system', 'light', 'dark', 'night'];

/** App settings. */
export function SettingsScreen() {
  const { t } = useTranslation();
  const themePreference = useSettingsStore(state => state.themePreference);
  const autoNight = useSettingsStore(state => state.autoNight);
  const setThemePreference = useSettingsStore(state => state.setThemePreference);
  const setAutoNight = useSettingsStore(state => state.setAutoNight);
  const keepAwake = useSettingsStore(state => state.keepAwake);
  const setKeepAwake = useSettingsStore(state => state.setKeepAwake);
  const notificationsEnabled = useSettingsStore(state => state.notificationsEnabled);
  const setNotificationsEnabled = useSettingsStore(state => state.setNotificationsEnabled);
  const { notifier } = useTimerServices();

  /** Turning the notification on needs permission; if it is blocked, open system settings. */
  const changeNotifications = (enabled: boolean) => {
    if (!enabled) {
      setNotificationsEnabled(false);
      return;
    }
    notifier
      .requestPermission()
      .then(async granted => {
        setNotificationsEnabled(granted);
        if (!granted) {
          await notifier.openSettings();
        }
      })
      .catch((error: unknown) => {
        console.error('Notification permission request failed', error);
      });
  };

  const themeChoices: Choice<ThemePreference>[] = THEME_OPTIONS.map(value => ({
    value,
    label: t(`settings.theme.${value}`),
  }));

  return (
    <Screen testID="settings-screen">
      <AppText variant="titleSmall" accessibilityRole="header">
        {t('settings.appearance')}
      </AppText>
      <ChoiceList
        choices={themeChoices}
        selected={themePreference}
        onChange={setThemePreference}
        testID="theme-choice"
      />
      <SwitchRow
        title={t('settings.autoNight')}
        description={t('settings.autoNightDescription')}
        value={autoNight}
        onValueChange={setAutoNight}
        testID="auto-night-switch"
      />
      <AppText variant="titleSmall" accessibilityRole="header">
        {t('settings.timerSection')}
      </AppText>
      <SwitchRow
        title={t('settings.keepAwake')}
        description={t('settings.keepAwakeDescription')}
        value={keepAwake}
        onValueChange={setKeepAwake}
        testID="keep-awake-switch"
      />
      <SwitchRow
        title={t('settings.notifications')}
        description={t('settings.notificationsDescription')}
        value={notificationsEnabled}
        onValueChange={changeNotifications}
        testID="notifications-switch"
      />
    </Screen>
  );
}
