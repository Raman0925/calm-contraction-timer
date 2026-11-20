// SPDX-License-Identifier: Apache-2.0
import type { StaticScreenProps } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AppButton, AppText, EmptyState, Screen, useAppTheme } from '@core/design';
import { formatDay, formatTime } from '@core/utils/dateFormat';
import { useExport } from './useExport';

type Props = StaticScreenProps<{ sessionKey: number }>;

/** Export one session as a spreadsheet or a doctor report. */
export function ExportScreen({ route }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { loaded, session, busy, failed, exportCsv, exportPdf } = useExport(
    route.params.sessionKey,
  );

  if (!session) {
    return (
      <Screen testID="export-screen">
        {loaded ? <EmptyState icon="history" title={t('history.notFound')} /> : null}
      </Screen>
    );
  }

  return (
    <Screen testID="export-screen">
      <AppText variant="titleMedium" accessibilityRole="header">
        {t('history.timeRange', {
          start: `${formatDay(session.startedAt)}, ${formatTime(session.startedAt)}`,
          end: formatTime(session.lastActivityAt),
        })}
      </AppText>
      <AppText variant="bodyMedium">{t('export.intro')}</AppText>
      <AppButton
        label={t('export.csv')}
        accessibilityHint={t('export.csvHint')}
        icon="file-delimited-outline"
        onPress={exportCsv}
        disabled={busy}
        testID="export-csv"
      />
      <AppButton
        label={t('export.pdf')}
        accessibilityHint={t('export.pdfHint')}
        icon="file-pdf-box"
        mode="contained-tonal"
        onPress={exportPdf}
        disabled={busy}
        testID="export-pdf"
      />
      {failed ? (
        <AppText
          variant="bodyMedium"
          style={{ color: theme.colors.error }}
          accessibilityLiveRegion="polite"
        >
          {t('export.failed')}
        </AppText>
      ) : null}
    </Screen>
  );
}
