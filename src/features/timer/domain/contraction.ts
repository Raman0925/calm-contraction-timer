// SPDX-License-Identifier: Apache-2.0

/** How strong a contraction felt, from 1 (mild) to 3 (strong). */
export type Intensity = 1 | 2 | 3;

/** Maximum length of a contraction note, in characters. */
export const MAX_NOTE_LENGTH = 500;

/** A recorded contraction. Times are UTC epoch milliseconds. */
export interface Contraction {
  id: number;
  startedAt: number;
  /** Null while the contraction is in progress. */
  endedAt: number | null;
  intensity: Intensity | null;
  note: string | null;
}

/** Narrows a stored number to an {@link Intensity}, dropping anything out of range. */
export function toIntensity(value: number | null | undefined): Intensity | null {
  return value === 1 || value === 2 || value === 3 ? value : null;
}

/** Trims a note and turns blank notes into null. Long notes are cut to {@link MAX_NOTE_LENGTH}. */
export function normaliseNote(note: string | null | undefined): string | null {
  const trimmed = note?.trim() ?? '';
  return trimmed === '' ? null : trimmed.slice(0, MAX_NOTE_LENGTH);
}

/** Orders contractions by start time, oldest first, using the id to break ties. */
export function byStart(a: Contraction, b: Contraction): number {
  return a.startedAt - b.startedAt || a.id - b.id;
}
