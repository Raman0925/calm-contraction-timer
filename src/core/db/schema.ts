// SPDX-License-Identifier: Apache-2.0
import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * One contraction. Times are UTC epoch milliseconds, so time-zone and DST
 * changes never alter stored data. `endedAt` is null while the contraction is
 * in progress; at most one row may be in progress at a time.
 *
 * Sessions are not stored: they are derived by grouping contractions (see
 * `groupIntoSessions`), so edits and deletes can never leave them stale.
 */
export const contractions = sqliteTable(
  'contractions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    startedAt: integer('started_at').notNull(),
    endedAt: integer('ended_at'),
    intensity: integer('intensity'),
    note: text('note'),
  },
  table => [
    index('contractions_started_at_idx').on(table.startedAt),
    // Every in-progress row indexes the same value, so a second one violates uniqueness.
    uniqueIndex('contractions_single_active_idx')
      .on(sql`(${table.endedAt} IS NULL)`)
      .where(sql`${table.endedAt} IS NULL`),
    check(
      'contractions_end_after_start',
      sql`${table.endedAt} IS NULL OR ${table.endedAt} >= ${table.startedAt}`,
    ),
    check(
      'contractions_intensity_range',
      sql`${table.intensity} IS NULL OR ${table.intensity} BETWEEN 1 AND 3`,
    ),
  ],
);

/** Row type as stored. */
export type ContractionRow = typeof contractions.$inferSelect;
export type NewContractionRow = typeof contractions.$inferInsert;
