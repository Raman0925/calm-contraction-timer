// SPDX-License-Identifier: Apache-2.0
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText, StatTile, spacing } from '@core/design';
import { formatClock, formatMinutes } from '@core/utils/format';
import type { Averages } from '../domain/computeStats';

/** Average length, frequency and count over the last hour. */
export function LastHourStats({ averages }: { averages: Averages }) {
  const { t } = useTranslation();
  const none = t('timer.noValue');
  return (
    <View style={styles.root}>
      <AppText variant="titleSmall" accessibilityRole="header">
        {t('timer.lastHour')}
      </AppText>
      <View style={styles.tiles}>
        <StatTile
          label={t('timer.avgDuration')}
          value={averages.avgDurationMs === null ? none : formatClock(averages.avgDurationMs)}
          testID="stat-duration"
        />
        <StatTile
          label={t('timer.avgInterval')}
          value={
            averages.avgIntervalMs === null
              ? none
              : t('timer.minutesValue', { value: formatMinutes(averages.avgIntervalMs) })
          }
          testID="stat-interval"
        />
        <StatTile label={t('timer.count')} value={String(averages.count)} testID="stat-count" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
