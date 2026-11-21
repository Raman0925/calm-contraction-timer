// SPDX-License-Identifier: Apache-2.0
import type { Result } from '@core/utils/result';
import type { Contraction, Intensity } from '../domain/contraction';

/** Fields of a contraction the user can edit. */
export interface ContractionPatch {
  startedAt?: number;
  /** Set to null to put a contraction back in progress (Undo of Stop). */
  endedAt?: number | null;
  intensity?: Intensity | null;
  note?: string | null;
}

export type StartError = 'already-active';
export type StopError = 'not-active' | 'end-before-start';
export type UpdateError = 'not-found' | 'invalid' | 'conflict';
export type RestoreError = 'conflict' | 'invalid';

/**
 * Single source of truth for contractions. Every successful write notifies
 * subscribers so view-models can reload.
 */
export interface ContractionRepository {
  /** The contraction in progress, if any. */
  getActive(): Promise<Contraction | null>;
  /** All contractions, oldest first. */
  listAll(): Promise<Contraction[]>;
  /** Contractions that started at or after `fromMs`, oldest first. */
  listSince(fromMs: number): Promise<Contraction[]>;
  /** Records a new in-progress contraction. Persists immediately. */
  start(startedAt: number): Promise<Result<Contraction, StartError>>;
  /** Ends the contraction in progress. Safe against double taps. */
  stop(endedAt: number): Promise<Result<Contraction, StopError>>;
  /**
   * Edits a contraction. End must not be before start, and the in-progress
   * contraction must stay the latest one. `conflict` means another contraction
   * is already in progress.
   */
  update(id: number, patch: ContractionPatch): Promise<Result<Contraction, UpdateError>>;
  /** Deletes a contraction and returns it so the caller can offer Undo. */
  remove(id: number): Promise<Contraction | null>;
  /**
   * Puts back a contraction removed earlier, with the same id. `conflict` means
   * the id is taken or it would clash with the contraction in progress.
   */
  restore(contraction: Contraction): Promise<Result<Contraction, RestoreError>>;
  /** Deletes every contraction. Callers confirm first; this cannot be undone. */
  removeAll(): Promise<void>;
  /**
   * Replaces all contractions with `contractions` in one transaction (restore from
   * backup): either everything is replaced or nothing changes.
   */
  replaceAll(contractions: readonly Contraction[]): Promise<void>;
  /** Calls `listener` after every successful write. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
}
