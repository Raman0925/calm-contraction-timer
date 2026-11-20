// SPDX-License-Identifier: Apache-2.0
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText, ListRow } from '@core/design';
import { formatClock, formatMinutes } from '@core/utils/format';
import type { ContractionStat } from '../domain/computeStats';

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

/** The latest contractions, newest first, with start time, length and frequency. */
export function RecentContractions({ items }: { items: ContractionStat[] }) {
  const { t } = useTranslation();
  return (
    <View testID="recent-contractions">
      <AppText variant="titleSmall" accessibilityRole="header">
        {t('timer.recent')}
      </AppText>
      {items.map(item => {
        const parts = [
          item.durationMs === null
            ? t('timer.contractionLabel')
            : t('timer.recentDuration', { duration: formatClock(item.durationMs) }),
          item.intervalMs === null
            ? null
            : t('timer.recentInterval', { minutes: formatMinutes(item.intervalMs) }),
        ];
        return (
          <ListRow
            key={item.contraction.id}
            icon="timer-outline"
            title={timeFormat.format(item.contraction.startedAt)}
            description={parts.filter(Boolean).join(' · ')}
          />
        );
      })}
    </View>
  );
}
