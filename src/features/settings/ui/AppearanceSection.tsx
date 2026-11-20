// SPDX-License-Identifier: Apache-2.0
import { useTranslation } from 'react-i18next';
import { AppText, ChoiceList, SwitchRow, type Choice, type ThemePreference } from '@core/design';
import { useSettingsStore } from '../data/settingsStore';

const THEME_OPTIONS: readonly ThemePreference[] = ['system', 'light', 'dark', 'night'];

/** Theme choice and automatic night mode. */
export function AppearanceSection() {
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
    <>
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
    </>
  );
}
