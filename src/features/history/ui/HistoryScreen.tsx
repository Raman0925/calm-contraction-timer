// SPDX-License-Identifier: Apache-2.0
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet } from 'react-native';
import { EmptyState, Screen, SessionCard, spacing } from '@core/design';
import { formatDay, formatTime } from '@core/utils/dateFormat';
import { formatClock, formatMinutes } from '@core/utils/format';
import type { SessionSummary } from '../domain/sessionSummary';
import { useSessions } from './useSessions';

/** Lists past sessions, newest first. */
export function HistoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const sessions = useSessions();

  const renderItem = ({ item }: { item: SessionSummary }) => {
    const details = [
      t('history.contractions', { count: item.count }),
      item.avgDurationMs === null
        ? null
        : t('history.averageLength', { duration: formatClock(item.avgDurationMs) }),
      item.avgIntervalMs === null
        ? null
        : t('history.averageEvery', { interval: formatMinutes(item.avgIntervalMs) }),
    ];
    return (
      <SessionCard
        title={formatDay(item.startedAt)}
        subtitle={t('history.timeRange', {
          start: formatTime(item.startedAt),
          end: formatTime(item.lastActivityAt),
        })}
        details={details.filter(Boolean).join(' · ')}
        badge={item.inProgress ? t('history.inProgress') : undefined}
        accessibilityHint={t('history.openHint')}
        onPress={() => {
          navigation.navigate('SessionDetail', { sessionKey: item.key });
        }}
        testID={`session-${item.key}`}
      />
    );
  };

  return (
    <Screen scroll={false} testID="history-screen">
      {sessions?.length === 0 ? (
        <EmptyState
          icon="history"
          title={t('history.emptyTitle')}
          message={t('history.emptyMessage')}
        />
      ) : (
        <FlatList
          data={sessions ?? []}
          keyExtractor={item => String(item.key)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
