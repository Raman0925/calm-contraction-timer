// SPDX-License-Identifier: Apache-2.0
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText, ListRow } from '@core/design';
import { formatTime } from '@core/utils/dateFormat';
import { formatClock, formatMinutes } from '@core/utils/format';
import type { ContractionStat } from '@features/timer/domain/computeStats';
import type { Contraction } from '@features/timer/domain/contraction';

interface ContractionListProps {
  /** Oldest first, as computeStats returns them; shown newest first. */
  items: ContractionStat[];
  onEdit: (contraction: Contraction) => void;
}

/**
 * Every contraction in the session with start, length, frequency, rest,
 * intensity and note. Doubles as the table view of the charts.
 */
export function ContractionList({ items, onEdit }: ContractionListProps) {
  const { t } = useTranslation();
  return (
    <View testID="contraction-list">
      <AppText variant="titleSmall" accessibilityRole="header">
        {t('history.contractionsHeader')}
      </AppText>
      {[...items].reverse().map(({ contraction, durationMs, intervalMs, restMs }) => {
        const parts = [
          durationMs === null
            ? t('edit.stillRunning')
            : t('timer.recentDuration', { duration: formatClock(durationMs) }),
          intervalMs === null
            ? null
            : t('timer.recentInterval', { minutes: formatMinutes(intervalMs) }),
          restMs === null ? null : t('history.rest', { rest: formatClock(restMs) }),
          contraction.intensity === null
            ? null
            : t('history.intensityValue', { value: contraction.intensity }),
          contraction.note,
        ];
        return (
          <ListRow
            key={contraction.id}
            icon={contraction.note ? 'note-text-outline' : 'timer-outline'}
            title={formatTime(contraction.startedAt)}
            description={parts.filter(Boolean).join(' · ')}
            onPress={() => {
              onEdit(contraction);
            }}
            accessibilityHint={t('history.editHint')}
            testID={`contraction-${contraction.id}`}
          />
        );
      })}
    </View>
  );
}
