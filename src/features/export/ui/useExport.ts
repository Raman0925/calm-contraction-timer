// SPDX-License-Identifier: Apache-2.0
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDay, formatLocalDate, formatTime } from '@core/utils/dateFormat';
import { formatClock, formatMinutes } from '@core/utils/format';
import { MINUTE_MS } from '@core/utils/time';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import { computeStats, type ContractionStats } from '@features/timer/domain/computeStats';
import { groupIntoSessions, type Session } from '@features/timer/domain/sessions';
import { thresholdsLabel } from '@features/timer/domain/thresholds';
import { useContractions } from '@features/timer/ui/useContractions';
import { useTimerServices } from '@features/timer/ui/TimerServices';
import { contractionsToCsv } from '../domain/csv';
import { buildPdfReport, type ReportText } from '../domain/pdfReport';
import { useFileSharer } from './ExportServices';

/** View state for the export screen. */
export interface ExportState {
  loaded: boolean;
  session: Session | null;
  busy: boolean;
  failed: boolean;
  exportCsv: () => void;
  exportPdf: () => void;
}

/** View-model for exporting one session as CSV or as a PDF doctor report. */
export function useExport(sessionKey: number): ExportState {
  const { t } = useTranslation();
  const { repository, clock } = useTimerServices();
  const sharer = useFileSharer();
  const thresholds = useSettingsStore(state => state.patternThresholds);
  const contractions = useContractions(repository);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const session = useMemo(
    () =>
      groupIntoSessions(contractions ?? []).find(s =>
        s.contractions.some(c => c.id === sessionKey),
      ) ?? null,
    [contractions, sessionKey],
  );

  const run = useCallback((work: () => Promise<void>) => {
    setBusy(true);
    setFailed(false);
    work()
      .catch((error: unknown) => {
        console.error('Export failed', error);
        setFailed(true);
      })
      .finally(() => {
        setBusy(false);
      });
  }, []);

  const statsNow = useCallback(
    (s: Session) => computeStats(s.contractions, thresholds, clock.now()),
    [thresholds, clock],
  );

  const exportCsv = useCallback(() => {
    if (!session) {
      return;
    }
    run(() =>
      sharer.share({
        fileName: `contractions-${formatLocalDate(session.startedAt)}.csv`,
        mimeType: 'text/csv',
        contents: contractionsToCsv(statsNow(session).items),
        encoding: 'utf8',
        title: t('export.shareTitle'),
      }),
    );
  }, [session, run, sharer, statsNow, t]);

  const exportPdf = useCallback(() => {
    if (!session) {
      return;
    }
    run(async () => {
      const stats = statsNow(session);
      const text = reportText(stats, session, thresholdsLabel(thresholds), clock.now(), t);
      await sharer.share({
        fileName: `contraction-report-${formatLocalDate(session.startedAt)}.pdf`,
        mimeType: 'application/pdf',
        contents: await buildPdfReport(text, stats.items),
        encoding: 'base64',
        title: t('export.shareTitle'),
      });
    });
  }, [session, run, sharer, statsNow, thresholds, clock, t]);

  return { loaded: contractions !== null, session, busy, failed, exportCsv, exportPdf };
}

type Translate = ReturnType<typeof useTranslation>['t'];

/** All report text, translated and formatted. */
function reportText(
  stats: ContractionStats,
  session: Session,
  label: string,
  now: number,
  t: Translate,
): ReportText {
  const { overall, pattern } = stats;
  const none = t('timer.noValue');
  return {
    title: t('report.title'),
    details: [
      t('report.period', {
        day: formatDay(session.startedAt),
        start: formatTime(session.startedAt),
        end: formatTime(session.lastActivityAt),
      }),
      t('report.generated', { day: formatDay(now), time: formatTime(now) }),
      t('report.thresholds', { label }),
    ],
    summary: [
      t('history.contractions', { count: overall.count }),
      t('report.averageLength', {
        value: overall.avgDurationMs === null ? none : formatClock(overall.avgDurationMs),
      }),
      t('report.averageEvery', {
        value: overall.avgIntervalMs === null ? none : formatMinutes(overall.avgIntervalMs),
      }),
      t(`pattern.${pattern.state}`, {
        label,
        minutes: Math.floor(pattern.sustainedMs / MINUTE_MS),
      }),
    ],
    chartTitle: t('report.chartTitle'),
    columns: [
      t('report.start'),
      t('report.length'),
      t('report.every'),
      t('report.rest'),
      t('report.intensity'),
      t('report.note'),
    ],
    rows: stats.items.map(({ contraction, durationMs, intervalMs, restMs }) => [
      formatTime(contraction.startedAt),
      durationMs === null ? t('edit.stillRunning') : formatClock(durationMs),
      intervalMs === null ? '' : formatMinutes(intervalMs),
      restMs === null ? '' : formatClock(restMs),
      contraction.intensity === null ? '' : String(contraction.intensity),
      contraction.note ?? '',
    ]),
    disclaimer: t('report.disclaimer'),
    undrawableNotice: t('report.undrawable'),
    pageLabel: (page, pages) => t('report.page', { page, pages }),
  };
}
