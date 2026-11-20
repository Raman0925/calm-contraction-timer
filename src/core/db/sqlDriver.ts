// SPDX-License-Identifier: Apache-2.0
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import type { MigrationTarget, SqlValue } from './migrator';
import * as schema from './schema';

/**
 * The SQLite calls the app needs, as op-sqlite 19 provides them. Tests supply
 * the same interface over sql.js, so they run the exact path the device runs.
 */
export interface SqlConnection extends MigrationTarget {
  /** Runs a query and returns its rows as arrays of column values. */
  executeRaw(sql: string, params?: SqlValue[]): Promise<{ rawRows: unknown[][] }>;
}

/**
 * Builds Drizzle on top of a {@link SqlConnection} through Drizzle's
 * `sqlite-proxy` driver. Drizzle's own op-sqlite driver expects op-sqlite's
 * old API (`executeRaw` returning an array) and fails on every select with 19.x.
 */
export function drizzleFor(connection: SqlConnection) {
  return drizzle(
    async (sql: string, params: SqlValue[], method: 'run' | 'all' | 'values' | 'get') => {
      if (method === 'run') {
        await connection.execute(sql, params);
        return { rows: [] };
      }
      const { rawRows } = await connection.executeRaw(sql, params);
      // For `get`, the proxy driver expects the single row itself (or nothing).
      return { rows: method === 'get' ? (rawRows[0] ?? []) : rawRows };
    },
    { schema },
  );
}
