// SPDX-License-Identifier: Apache-2.0
import initSqlJs, { type Database, type SqlJsStatic, type SqlValue as SqlJsValue } from 'sql.js';
import migrations from '../migrations/migrations';
import { runMigrations, type MigrationBundle, type SqlValue } from '../migrator';
import { drizzleFor, type SqlConnection } from '../sqlDriver';

let engine: Promise<SqlJsStatic> | undefined;

const toSqlJs = (params: SqlValue[] | undefined): SqlJsValue[] => params ?? [];

/**
 * An op-sqlite-shaped connection over sql.js, so tests run the same Drizzle
 * adapter and migrator as the device. Each call yields to the event loop, like
 * op-sqlite's async API, so interleaving bugs can show up in tests too.
 */
export function sqlJsConnection(client: Database): SqlConnection {
  const query = (sql: string, params?: SqlValue[]) => {
    const statement = client.prepare(sql, toSqlJs(params));
    try {
      const rows: Record<string, unknown>[] = [];
      const rawRows: unknown[][] = [];
      while (statement.step()) {
        rawRows.push(statement.get());
        rows.push(statement.getAsObject());
      }
      return { rows, rawRows };
    } finally {
      statement.free();
    }
  };
  const later = <T>(work: () => T) =>
    new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(work());
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }, 0);
    });

  return {
    execute: (sql, params) => later(() => ({ rows: query(sql, params).rows })),
    executeRaw: (sql, params) => later(() => ({ rawRows: query(sql, params).rawRows })),
    // Same all-or-nothing semantics as op-sqlite's executeBatch.
    executeBatch: commands =>
      later(() => {
        client.run('BEGIN');
        try {
          for (const [sql, params] of commands) {
            client.run(sql, toSqlJs(params));
          }
          client.run('COMMIT');
        } catch (error) {
          client.run('ROLLBACK');
          throw error;
        }
      }),
  };
}

/** The shipped migration bundle cut off after `upToIndex`. */
export function bundleUpTo(upToIndex: number): MigrationBundle {
  return {
    ...migrations,
    journal: { entries: migrations.journal.entries.filter(entry => entry.idx <= upToIndex) },
  };
}

/**
 * Creates an in-memory SQLite database (sql.js) migrated with the exact bundle
 * the app ships, optionally stopping after migration `upToIndex`.
 */
export async function createTestDatabase(upToIndex?: number) {
  // Loading the WebAssembly engine is slow; do it once per test worker.
  engine ??= initSqlJs();
  const SQL = await engine;
  const client = new SQL.Database();
  const connection = sqlJsConnection(client);
  await runMigrations(connection, upToIndex === undefined ? migrations : bundleUpTo(upToIndex));
  return { db: drizzleFor(connection), client, connection };
}
