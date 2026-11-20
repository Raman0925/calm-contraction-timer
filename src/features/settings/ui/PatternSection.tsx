// SPDX-License-Identifier: Apache-2.0
import { useTranslation } from 'react-i18next';
import { AppText, ChipChoice, Stepper, type ChipOption } from '@core/design';
import {
  PATTERN_PRESETS,
  adjustThreshold,
  findPreset,
  type PatternPresetId,
  type PatternThresholds,
} from '@features/timer/domain/thresholds';
import { useSettingsStore } from '../data/settingsStore';

type PresetChoice = PatternPresetId | 'custom';

/** Pattern thresholds: pick a preset or fine-tune each value. */
export function PatternSection() {
  const { t } = useTranslation();
  const thresholds = useSettingsStore(state => state.patternThresholds);
  const setThresholds = useSettingsStore(state => state.setPatternThresholds);
  const preset: PresetChoice = findPreset(thresholds) ?? 'custom';

  const options: ChipOption<PresetChoice>[] = [
    ...(Object.keys(PATTERN_PRESETS) as PatternPresetId[]).map(id => ({ value: id, label: id })),
    { value: 'custom', label: t('settings.custom') },
  ];

  const stepper = (key: keyof PatternThresholds, label: string, value: string) => (
    <Stepper
      label={label}
      value={value}
      steps={[
        {
          label: '−',
          accessibilityLabel: t('settings.lessHint', { name: label }),
          onPress: () => {
            setThresholds(adjustThreshold(thresholds, key, -1));
          },
        },
        {
          label: '+',
          accessibilityLabel: t('settings.moreHint', { name: label }),
          onPress: () => {
            setThresholds(adjustThreshold(thresholds, key, 1));
          },
        },
      ]}
      testID={`threshold-${key}`}
    />
  );

  return (
    <>
      <AppText variant="titleSmall" accessibilityRole="header">
        {t('settings.patternSection')}
      </AppText>
      <AppText variant="bodyMedium">{t('settings.patternDescription')}</AppText>
      <ChipChoice
        label={t('settings.preset')}
        options={options}
        selected={preset}
        onChange={choice => {
          if (choice !== 'custom') {
            setThresholds(PATTERN_PRESETS[choice]);
          }
        }}
        testID="pattern-preset"
      />
      {stepper(
        'maxIntervalMinutes',
        t('settings.maxInterval'),
        t('settings.minutesValue', { value: thresholds.maxIntervalMinutes }),
      )}
      {stepper(
        'minDurationSeconds',
        t('settings.minDuration'),
        t('settings.secondsValue', { value: thresholds.minDurationSeconds }),
      )}
      {stepper(
        'sustainedMinutes',
        t('settings.sustained'),
        t('settings.minutesValue', { value: thresholds.sustainedMinutes }),
      )}
    </>
  );
}
