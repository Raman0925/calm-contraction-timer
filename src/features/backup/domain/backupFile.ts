// SPDX-License-Identifier: Apache-2.0
import { err, ok, type Result } from '@core/utils/result';
import {
  MAX_NOTE_LENGTH,
  byStart,
  toIntensity,
  type Contraction,
} from '@features/timer/domain/contraction';

/** Identifies the file as a backup from this app. */
export const BACKUP_FORMAT = 'calm-contraction-timer-backup';
/** Bump when the shape changes; older apps refuse newer files instead of misreading them. */
export const BACKUP_VERSION = 1;

/** U+FEFF, which some editors put at the start of a UTF-8 file. */
const BYTE_ORDER_MARK = 0xfeff;

/** A backup that passed every check, ready to restore. */
export interface Backup {
  createdAt: number;
  contractions: Contraction[];
}

/** Why a file cannot be restored. */
export type BackupError = 'not-a-backup' | 'newer-version' | 'invalid';

/**
 * Serialises contractions as a versioned, human-readable JSON backup. A
 * contraction still running is left out: restored days later, perhaps on
 * another phone, it would otherwise appear to have been running all along.
 */
export function createBackup(contractions: readonly Contraction[], createdAt: number): string {
  const file = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt,
    contractions: contractions.filter(c => c.endedAt !== null).sort(byStart),
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTime = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

function toContraction(value: unknown): Contraction | null {
  if (!isRecord(value)) {
    return null;
  }
  const { id, startedAt, endedAt, intensity, note } = value;
  const validEnd =
    endedAt === null || (isTime(endedAt) && isTime(startedAt) && endedAt >= startedAt);
  const validIntensity = intensity === null || toIntensity(intensity as number) !== null;
  const validNote = note === null || (typeof note === 'string' && note.length <= MAX_NOTE_LENGTH);
  if (!isTime(id) || !isTime(startedAt) || !validEnd || !validIntensity || !validNote) {
    return null;
  }
  return {
    id,
    startedAt,
    endedAt: endedAt,
    intensity: toIntensity(intensity as number | null),
    note: note,
  };
}

/**
 * Checks a file completely before anything is changed: format, version, every
 * field, unique ids, and at most one contraction in progress, which must be
 * the latest (the same rules the database enforces).
 */
export function parseBackup(text: string): Result<Backup, BackupError> {
  let data: unknown;
  try {
    // Editors such as Windows Notepad may add a byte-order mark when re-saving.
    data = JSON.parse(text.charCodeAt(0) === BYTE_ORDER_MARK ? text.slice(1) : text);
  } catch {
    return err('not-a-backup');
  }
  if (!isRecord(data) || data.format !== BACKUP_FORMAT) {
    return err('not-a-backup');
  }
  if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) {
    return err('newer-version');
  }
  if (!isTime(data.createdAt) || !Array.isArray(data.contractions)) {
    return err('invalid');
  }
  const contractions = data.contractions.map(toContraction);
  if (contractions.some(c => c === null)) {
    return err('invalid');
  }
  const valid = (contractions as Contraction[]).sort(byStart);
  const running = valid.filter(c => c.endedAt === null);
  const uniqueIds = new Set(valid.map(c => c.id)).size === valid.length;
  if (!uniqueIds || running.length > 1 || (running[0] && running[0] !== valid.at(-1))) {
    return err('invalid');
  }
  return ok({ createdAt: data.createdAt, contractions: valid });
}
