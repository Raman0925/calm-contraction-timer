// SPDX-License-Identifier: Apache-2.0
import { HOUR_MS, MINUTE_MS, SECOND_MS } from './time';

const pad2 = (value: number): string => value.toString().padStart(2, '0');

const safeMs = (ms: number): number => (Number.isFinite(ms) && ms > 0 ? ms : 0);

/**
 * Formats a duration as `mm:ss`, or `h:mm:ss` from one hour. Seconds are
 * floored so a running timer never shows a second that has not passed yet.
 * Negative or invalid input shows `00:00`.
 */
export function formatClock(ms: number): string {
  const total = safeMs(ms);
  const hours = Math.floor(total / HOUR_MS);
  const minutes = Math.floor((total % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((total % MINUTE_MS) / SECOND_MS);
  return hours > 0
    ? `${hours}:${pad2(minutes)}:${pad2(seconds)}`
    : `${pad2(minutes)}:${pad2(seconds)}`;
}

/** Formats a duration in minutes with one decimal place, e.g. `4.5`. */
export function formatMinutes(ms: number): string {
  return (safeMs(ms) / MINUTE_MS).toFixed(1);
}
