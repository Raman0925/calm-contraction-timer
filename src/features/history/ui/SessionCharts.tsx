// SPDX-License-Identifier: Apache-2.0
import { useTranslation } from 'react-i18next';
import { TrendChart } from '@core/design';
import { formatTime } from '@core/utils/dateFormat';
import { formatClock, formatMinutes } from '@core/utils/format';
import { MINUTE_MS, SECOND_MS } from '@core/utils/time';
import type { ContractionStat } from '@features/timer/domain/computeStats';

/** Duration per contraction (bars) and minutes between starts (line), on separate axes. */
export function SessionCharts({ items }: { items: ContractionStat[] }) {
  const { t } = useTranslation();
  const completed = items.filter(item => item.durationMs !== null);
  const spaced = items.filter(item => item.intervalMs !== null);
  const durations = completed.map(item => item.durationMs ?? 0);
  const intervals = spaced.map(item => item.intervalMs ?? 0);
  const range = (list: ContractionStat[]) =>
    t('history.chartRange', {
      start: formatTime(list[0]?.contraction.startedAt ?? 0),
      end: formatTime(list.at(-1)?.contraction.startedAt ?? 0),
    });

  return (
    <>
      {completed.length > 0 ? (
        <TrendChart
          kind="bar"
          title={t('history.durationChart')}
          values={durations.map(ms => Math.round(ms / SECOND_MS))}
          caption={range(completed)}
          accessibilityLabel={t('history.durationChartSummary', {
            max: formatClock(Math.max(...durations)),
            min: formatClock(Math.min(...durations)),
          })}
          testID="duration-chart"
        />
      ) : null}
      {spaced.length > 1 ? (
        <TrendChart
          kind="line"
          title={t('history.intervalChart')}
          values={intervals.map(ms => Number((ms / MINUTE_MS).toFixed(1)))}
          caption={range(spaced)}
          accessibilityLabel={t('history.intervalChartSummary', {
            min: formatMinutes(Math.min(...intervals)),
            max: formatMinutes(Math.max(...intervals)),
          })}
          testID="interval-chart"
        />
      ) : null}
    </>
  );
}
