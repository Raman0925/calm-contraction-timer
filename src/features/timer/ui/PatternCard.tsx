// SPDX-License-Identifier: Apache-2.0
import { useTranslation } from 'react-i18next';
import { PatternStatusCard } from '@core/design';
import { MINUTE_MS } from '@core/utils/time';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import type { PatternStatus } from '../domain/computeStats';
import { thresholdsLabel } from '../domain/thresholds';

/** States the pattern against the user's thresholds as neutral information. */
export function PatternCard({ pattern }: { pattern: PatternStatus }) {
  const { t } = useTranslation();
  const thresholds = useSettingsStore(state => state.patternThresholds);
  const params = {
    label: thresholdsLabel(thresholds),
    minutes: Math.floor(pattern.sustainedMs / MINUTE_MS),
  };
  return (
    <PatternStatusCard
      state={pattern.state}
      message={t(`pattern.${pattern.state}`, params)}
      footnote={t('pattern.footnote')}
      testID="pattern-card"
    />
  );
}
