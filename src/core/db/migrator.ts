// SPDX-License-Identifier: Apache-2.0

/** A SQL parameter value. */
export type SqlValue = string | number | null;

/**
 * The slice of op-sqlite's database API the migrator needs. `executeBatch`
 * must run all commands in one transaction, as op-sqlite does.
 */
export interface MigrationTarget {
  execute(sql: string, params?: SqlValue[]): Promise<{ rows: Record<string, unknown>[] }>;
  executeBatch(commands: [string, SqlValue[]][]): Promise<unknown>;
}

/** The bundle drizzle-kit writes to `migrations/migrations.js`. */
export interface MigrationBundle {
  journal: { entries: { idx: number; tag: string; when: number }[] };
  migrations: Record<string, string>;
}

const MIGRATIONS_TABLE = '__app_migrations';
const STATEMENT_BREAKPOINT = '--> statement-breakpoint';

const keyOf = (idx: number): string => `m${idx.toString().padStart(4, '0')}`;

/**
 * Applies pending migrations in order. Each migration and its bookkeeping row
 * commit in a single transaction, so a crash part-way through leaves the
 * database at the previous version and the migration simply runs again.
 *
 * Used instead of Drizzle's op-sqlite migrator, which does not await its
 * transaction and can leave a half-applied migration behind.
 */
export async function runMigrations(db: MigrationTarget, bundle: MigrationBundle): Promise<void> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (idx INTEGER PRIMARY KEY, tag TEXT NOT NULL, generated_at INTEGER NOT NULL)`,
  );
  const { rows } = await db.execute(`SELECT idx FROM ${MIGRATIONS_TABLE}`);
  const applied = new Set(rows.map(row => Number(row.idx)));

  const pending = [...bundle.journal.entries]
    .sort((a, b) => a.idx - b.idx)
    .filter(entry => !applied.has(entry.idx));

  for (const entry of pending) {
    const source = bundle.migrations[keyOf(entry.idx)];
    if (source === undefined) {
      throw new Error(`Migration ${entry.tag} is missing from the bundle`);
    }
    const statements = source
      .split(STATEMENT_BREAKPOINT)
      .map(statement => statement.trim())
      .filter(statement => statement !== '');
    await db.executeBatch([
      ...statements.map((statement): [string, SqlValue[]] => [statement, []]),
      [
        `INSERT INTO ${MIGRATIONS_TABLE} (idx, tag, generated_at) VALUES (?, ?, ?)`,
        [entry.idx, entry.tag, entry.when],
      ],
    ]);
  }
}
