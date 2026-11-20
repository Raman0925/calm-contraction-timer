// SPDX-License-Identifier: Apache-2.0
import { and, asc, eq, gt, gte, isNull, lt, ne } from 'drizzle-orm';
import type { AppDatabase } from '@core/db/database';
import { contractions, type ContractionRow } from '@core/db/schema';
import { err, ok, type Result } from '@core/utils/result';
import { normaliseNote, toIntensity, type Contraction } from '../domain/contraction';
import type {
  ContractionPatch,
  ContractionRepository,
  RestoreError,
  StartError,
  StopError,
  UpdateError,
} from './contractionRepository';

const toContraction = (row: ContractionRow): Contraction => ({
  id: row.id,
  startedAt: row.startedAt,
  endedAt: row.endedAt,
  intensity: toIntensity(row.intensity),
  note: row.note,
});

/** True when SQLite rejected a write because of a UNIQUE constraint (Drizzle may wrap the error). */
function isUniqueViolation(error: unknown): boolean {
  for (let e: unknown = error; e instanceof Error; e = e.cause) {
    if (e.message.includes('UNIQUE constraint failed')) {
      return true;
    }
  }
  return false;
}

const isValid = (c: Contraction): boolean =>
  Number.isFinite(c.startedAt) &&
  (c.endedAt === null || (Number.isFinite(c.endedAt) && c.endedAt >= c.startedAt));

/** {@link ContractionRepository} backed by SQLite through Drizzle. */
export class DrizzleContractionRepository implements ContractionRepository {
  private readonly listeners = new Set<() => void>();

  constructor(private readonly db: AppDatabase) {}

  async getActive(): Promise<Contraction | null> {
    const rows = await this.db.select().from(contractions).where(isNull(contractions.endedAt));
    const row = rows[0];
    return row ? toContraction(row) : null;
  }

  async listAll(): Promise<Contraction[]> {
    const rows = await this.db
      .select()
      .from(contractions)
      .orderBy(asc(contractions.startedAt), asc(contractions.id));
    return rows.map(toContraction);
  }

  async listSince(fromMs: number): Promise<Contraction[]> {
    const rows = await this.db
      .select()
      .from(contractions)
      .where(gte(contractions.startedAt, fromMs))
      .orderBy(asc(contractions.startedAt), asc(contractions.id));
    return rows.map(toContraction);
  }

  async start(startedAt: number): Promise<Result<Contraction, StartError>> {
    // The single-active unique index makes this safe against double taps.
    try {
      const rows = await this.db.insert(contractions).values({ startedAt }).returning();
      return this.written(rows[0]);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return err('already-active');
      }
      throw error;
    }
  }

  async stop(endedAt: number): Promise<Result<Contraction, StopError>> {
    const active = await this.getActive();
    if (!active) {
      return err('not-active');
    }
    if (endedAt < active.startedAt) {
      return err('end-before-start');
    }
    // Only an in-progress row is updated, so a second tap cannot move the end time.
    const rows = await this.db
      .update(contractions)
      .set({ endedAt })
      .where(and(eq(contractions.id, active.id), isNull(contractions.endedAt)))
      .returning();
    return rows[0] ? this.written(rows[0]) : err('not-active');
  }

  async update(id: number, patch: ContractionPatch): Promise<Result<Contraction, UpdateError>> {
    const existing = await this.findById(id);
    if (!existing) {
      return err('not-found');
    }
    const next: Contraction = {
      id,
      startedAt: patch.startedAt ?? existing.startedAt,
      endedAt: patch.endedAt === undefined ? existing.endedAt : patch.endedAt,
      intensity: patch.intensity === undefined ? existing.intensity : patch.intensity,
      note: patch.note === undefined ? existing.note : normaliseNote(patch.note),
    };
    if (!isValid(next) || (await this.breaksActiveOrder(next))) {
      return err('invalid');
    }
    try {
      const rows = await this.db
        .update(contractions)
        .set({
          startedAt: next.startedAt,
          endedAt: next.endedAt,
          intensity: next.intensity,
          note: next.note,
        })
        .where(eq(contractions.id, id))
        .returning();
      return this.written(rows[0]);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return err('conflict');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<Contraction | null> {
    const rows = await this.db.delete(contractions).where(eq(contractions.id, id)).returning();
    const row = rows[0];
    if (!row) {
      return null;
    }
    this.notify();
    return toContraction(row);
  }

  async restore(contraction: Contraction): Promise<Result<Contraction, RestoreError>> {
    if (!isValid(contraction)) {
      return err('invalid');
    }
    if (await this.breaksActiveOrder(contraction)) {
      return err('conflict');
    }
    try {
      const rows = await this.db.insert(contractions).values(contraction).returning();
      return this.written(rows[0]);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return err('conflict');
      }
      throw error;
    }
  }

  async removeAll(): Promise<void> {
    await this.db.delete(contractions);
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * The in-progress contraction must start after every other one, so the
   * timer and the stats always agree on which contraction is running.
   */
  private async breaksActiveOrder(candidate: Contraction): Promise<boolean> {
    const others = ne(contractions.id, candidate.id);
    const clash =
      candidate.endedAt === null
        ? and(others, gt(contractions.startedAt, candidate.startedAt))
        : and(
            others,
            isNull(contractions.endedAt),
            lt(contractions.startedAt, candidate.startedAt),
          );
    const rows = await this.db.select().from(contractions).where(clash).limit(1);
    return rows.length > 0;
  }

  private async findById(id: number): Promise<Contraction | null> {
    const rows = await this.db.select().from(contractions).where(eq(contractions.id, id));
    const row = rows[0];
    return row ? toContraction(row) : null;
  }

  /** Maps a row returned by a write, notifies subscribers and wraps it as a success. */
  private written(row: ContractionRow | undefined): Result<Contraction, never> {
    if (!row) {
      throw new Error('Write returned no row');
    }
    this.notify();
    return ok(toContraction(row));
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
