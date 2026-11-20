// SPDX-License-Identifier: Apache-2.0
import { useTranslation } from 'react-i18next';
import { EmptyState, Screen } from '@core/design';

/** Lists past sessions, newest first. */
export function HistoryScreen() {
  const { t } = useTranslation();
  return (
    <Screen testID="history-screen">
      <EmptyState
        icon="history"
        title={t('history.emptyTitle')}
        message={t('history.emptyMessage')}
      />
    </Screen>
  );
}
