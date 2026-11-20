// SPDX-License-Identifier: Apache-2.0
import { formatLocalIso } from '@core/utils/dateFormat';
import { MINUTE_MS, SECOND_MS } from '@core/utils/time';
import type { ContractionStat } from '@features/timer/domain/computeStats';

/** Column headers; stable English names so spreadsheets and scripts can rely on them. */
export const CSV_HEADER = [
  'start',
  'end',
  'duration_seconds',
  'interval_minutes',
  'rest_seconds',
  'intensity',
  'note',
] as const;

/** Quotes a field when it contains a comma, quote or line break (RFC 4180). */
function escapeField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Neutralises values a spreadsheet would run as a formula (CSV injection). */
function safeText(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

const seconds = (ms: number | null) => (ms === null ? '' : String(Math.round(ms / SECOND_MS)));
const minutes = (ms: number | null) => (ms === null ? '' : (ms / MINUTE_MS).toFixed(2));

/** Byte-order mark, so Excel reads the file as UTF-8 (accents, emoji, non-Latin notes). */
export const UTF8_BOM = '﻿';

/** Builds a CSV of contractions, oldest first, with CRLF line endings and a UTF-8 BOM. */
export function contractionsToCsv(items: readonly ContractionStat[]): string {
  const rows = items.map(({ contraction, durationMs, intervalMs, restMs }) => [
    formatLocalIso(contraction.startedAt),
    contraction.endedAt === null ? '' : formatLocalIso(contraction.endedAt),
    seconds(durationMs),
    minutes(intervalMs),
    seconds(restMs),
    contraction.intensity === null ? '' : String(contraction.intensity),
    contraction.note === null ? '' : safeText(contraction.note),
  ]);
  const lines = [[...CSV_HEADER], ...rows].map(row => row.map(escapeField).join(','));
  return `${UTF8_BOM}${lines.join('\r\n')}\r\n`;
}
