// SPDX-License-Identifier: Apache-2.0

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/** Local wall-clock time, e.g. `09:42`, in the device's locale and time zone. */
export const formatTime = (epochMs: number): string => timeFormat.format(epochMs);

/** Local day, e.g. `Sat 10 Jan`, in the device's locale and time zone. */
export const formatDay = (epochMs: number): string => dayFormat.format(epochMs);

const pad = (value: number, length = 2): string => String(Math.abs(value)).padStart(length, '0');

/**
 * Local date and time with its UTC offset, e.g. `2026-01-10T09:42:05+05:30`.
 * Unambiguous in any time zone, and readable by spreadsheets.
 */
export function formatLocalIso(epochMs: number): string {
  const date = new Date(epochMs);
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.trunc(offsetMinutes / 60))}:${pad(offsetMinutes % 60)}`
  );
}

/** Local calendar date, e.g. `2026-01-10`, for file names. */
export function formatLocalDate(epochMs: number): string {
  return formatLocalIso(epochMs).slice(0, 10);
}
