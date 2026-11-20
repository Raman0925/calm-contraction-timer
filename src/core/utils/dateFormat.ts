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
