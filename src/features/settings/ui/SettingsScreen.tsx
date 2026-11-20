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
import { useSettingsStore } from '../data/settingsStore';

const THEME_OPTIONS: readonly ThemePreference[] = ['system', 'light', 'dark', 'night'];

/** App settings. */
export function SettingsScreen() {
  const { t } = useTranslation();
  const themePreference = useSettingsStore(state => state.themePreference);
  const autoNight = useSettingsStore(state => state.autoNight);
  const setThemePreference = useSettingsStore(state => state.setThemePreference);
  const setAutoNight = useSettingsStore(state => state.setAutoNight);

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
    </Screen>
  );
}
