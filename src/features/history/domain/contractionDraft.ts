// SPDX-License-Identifier: Apache-2.0
import type { ContractionPatch } from '@features/timer/data/contractionRepository';
import {
  normaliseNote,
  type Contraction,
  type Intensity,
} from '@features/timer/domain/contraction';

/** Editable copy of a contraction. Duration is null while it is in progress. */
export interface ContractionDraft {
  startedAt: number;
  durationMs: number | null;
  intensity: Intensity | null;
  note: string;
}

/** Starts editing `contraction`. */
export function toDraft(contraction: Contraction): ContractionDraft {
  return {
    startedAt: contraction.startedAt,
    durationMs: contraction.endedAt === null ? null : contraction.endedAt - contraction.startedAt,
    intensity: contraction.intensity,
    note: contraction.note ?? '',
  };
}

/** Moves the start time, keeping the duration. Neither start nor end can pass `now`. */
export function shiftStart(
  draft: ContractionDraft,
  deltaMs: number,
  now: number,
): ContractionDraft {
  const latestStart = now - (draft.durationMs ?? 0);
  return { ...draft, startedAt: Math.min(draft.startedAt + deltaMs, latestStart) };
}

/** Lengthens or shortens a finished contraction: never below zero, never ending after `now`. */
export function changeDuration(
  draft: ContractionDraft,
  deltaMs: number,
  now: number,
): ContractionDraft {
  if (draft.durationMs === null) {
    return draft;
  }
  const longest = Math.max(0, now - draft.startedAt);
  return { ...draft, durationMs: Math.min(longest, Math.max(0, draft.durationMs + deltaMs)) };
}

/** The repository patch that saves `draft`. An in-progress contraction keeps running. */
export function toPatch(draft: ContractionDraft): ContractionPatch {
  return {
    startedAt: draft.startedAt,
    ...(draft.durationMs === null ? {} : { endedAt: draft.startedAt + draft.durationMs }),
    intensity: draft.intensity,
    note: normaliseNote(draft.note),
  };
}

/**
 * The patch that undoes `applied`: the original values of only the fields it
 * wrote. A contraction stopped in the meantime is therefore never restarted.
 */
export function undoPatch(original: Contraction, applied: ContractionPatch): ContractionPatch {
  return {
    ...('startedAt' in applied ? { startedAt: original.startedAt } : {}),
    ...('endedAt' in applied ? { endedAt: original.endedAt } : {}),
    ...('intensity' in applied ? { intensity: original.intensity } : {}),
    ...('note' in applied ? { note: original.note } : {}),
  };
}
