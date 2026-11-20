// SPDX-License-Identifier: Apache-2.0
import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import migrations from '../migrations/migrations';
import { runMigrations, type MigrationBundle, type MigrationTarget } from '../migrator';
import * as schema from '../schema';

/**
 * Adapts a sql.js database to the migrator, with the same all-or-nothing
 * batch semantics as op-sqlite's `executeBatch`.
 */
export function sqlJsMigrationTarget(client: Database): MigrationTarget {
  return {
    execute: (sql, params) => {
      const statement = client.prepare(sql, params);
      const rows: Record<string, unknown>[] = [];
      while (statement.step()) {
        rows.push(statement.getAsObject());
      }
      statement.free();
      return Promise.resolve({ rows });
    },
    executeBatch: commands => {
      client.run('BEGIN');
      try {
        for (const [sql, params] of commands) {
          client.run(sql, params);
        }
        client.run('COMMIT');
      } catch (error) {
        client.run('ROLLBACK');
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
      return Promise.resolve();
    },
  };
}

/** The shipped migration bundle cut off after `upToIndex`. */
export function bundleUpTo(upToIndex: number): MigrationBundle {
  return {
    ...migrations,
    journal: { entries: migrations.journal.entries.filter(entry => entry.idx <= upToIndex) },
  };
}

let engine: Promise<SqlJsStatic> | undefined;

/**
 * Creates an in-memory SQLite database (sql.js) migrated with the exact bundle
 * the app ships, optionally stopping after migration `upToIndex`.
 */
export async function createTestDatabase(upToIndex?: number) {
  // Loading the WebAssembly engine is slow; do it once per test worker.
  engine ??= initSqlJs();
  const SQL = await engine;
  const client = new SQL.Database();
  const target = sqlJsMigrationTarget(client);
  await runMigrations(target, upToIndex === undefined ? migrations : bundleUpTo(upToIndex));
  return { db: drizzle(client, { schema }), client, target };
}
