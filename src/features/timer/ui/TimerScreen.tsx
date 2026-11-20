// SPDX-License-Identifier: Apache-2.0
import { useTranslation } from 'react-i18next';
import { EmptyState, Screen } from '@core/design';

/** Home screen with the big Start/Stop button. Never shows ads or upsells. */
export function TimerScreen() {
  const { t } = useTranslation();
  return (
    <Screen testID="timer-screen">
      <EmptyState
        icon="timer-outline"
        title={t('timer.emptyTitle')}
        message={t('timer.emptyMessage')}
      />
    </Screen>
  );
}
