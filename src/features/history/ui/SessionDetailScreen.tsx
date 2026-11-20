// SPDX-License-Identifier: Apache-2.0
import type { StaticScreenProps } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText, EmptyState, Screen, StatTile, UndoSnackbar, spacing } from '@core/design';
import { formatDay, formatTime } from '@core/utils/dateFormat';
import { formatClock, formatMinutes } from '@core/utils/format';
import { ContractionEditor } from './ContractionEditor';
import { ContractionList } from './ContractionList';
import { SessionCharts } from './SessionCharts';
import { useSessionDetail } from './useSessionDetail';

type Props = StaticScreenProps<{ sessionKey: number }>;

/** One session: summary, charts and every contraction, each editable. */
export function SessionDetailScreen({ route }: Props) {
  const { t } = useTranslation();
  const detail = useSessionDetail(route.params.sessionKey);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { session, stats, undoOffer } = detail;
  // Always the stored version, so a change made meanwhile (e.g. Stop from the notification) shows.
  const editing = stats.items.find(item => item.contraction.id === editingId)?.contraction ?? null;
  const closeEditor = () => {
    setEditingId(null);
  };
  const none = t('timer.noValue');

  const overlay = (
    <UndoSnackbar
      key={undoOffer?.id ?? 0}
      message={undoOffer?.message ?? null}
      undoLabel={undoOffer?.undo ? t('timer.undo') : undefined}
      onUndo={detail.undo}
      onDismiss={() => {
        if (undoOffer) {
          detail.dismissUndo(undoOffer.id);
        }
      }}
    />
  );

  if (!session) {
    return (
      <Screen testID="session-detail" overlay={overlay}>
        {detail.loaded ? <EmptyState icon="history" title={t('history.notFound')} /> : null}
      </Screen>
    );
  }

  return (
    <Screen testID="session-detail" overlay={overlay}>
      <View>
        <AppText variant="headlineSmall" accessibilityRole="header">
          {formatDay(session.startedAt)}
        </AppText>
        <AppText variant="bodyMedium">
          {t('history.timeRange', {
            start: formatTime(session.startedAt),
            end: formatTime(session.lastActivityAt),
          })}
        </AppText>
      </View>
      <View style={styles.tiles}>
        <StatTile label={t('timer.count')} value={String(stats.overall.count)} />
        <StatTile
          label={t('timer.avgDuration')}
          value={
            stats.overall.avgDurationMs === null ? none : formatClock(stats.overall.avgDurationMs)
          }
        />
        <StatTile
          label={t('timer.avgInterval')}
          value={
            stats.overall.avgIntervalMs === null
              ? none
              : t('timer.minutesValue', { value: formatMinutes(stats.overall.avgIntervalMs) })
          }
        />
      </View>
      <SessionCharts items={stats.items} />
      <ContractionList
        items={stats.items}
        onEdit={contraction => {
          setEditingId(contraction.id);
        }}
      />
      {editing ? (
        <ContractionEditor
          // Starts fresh if the contraction is stopped or restarted while the editor is open.
          key={`${editing.id}:${editing.endedAt === null ? 'running' : 'done'}`}
          contraction={editing}
          now={detail.now}
          onSave={draft => detail.save(editing, draft)}
          onDelete={() => {
            closeEditor();
            detail.remove(editing).catch((error: unknown) => {
              console.error('Deleting the contraction failed', error);
            });
          }}
          onDismiss={closeEditor}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
