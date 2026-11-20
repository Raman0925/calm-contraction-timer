/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import migrations from './migrations/migrations';
import { runMigrations } from './migrator';
import { contractions } from './schema';
import { createTestDatabase } from './testing/createTestDatabase';

const { entries } = migrations.journal;
const bundled: Record<string, string> = migrations.migrations;
const keyOf = (idx: number) => `m${idx.toString().padStart(4, '0')}`;

describe('migration bundle', () => {
  it('ships every journal entry, identical to the SQL files on disk', () => {
    expect(Object.keys(bundled).sort()).toEqual(entries.map(entry => keyOf(entry.idx)).sort());
    for (const entry of entries) {
      const onDisk = readFileSync(join(__dirname, 'migrations', `${entry.tag}.sql`), 'utf8');
      // A mismatch means Metro/Jest served a stale inlined copy: rerun with --reset-cache.
      expect(bundled[keyOf(entry.idx)]).toBe(onDisk);
    }
  });
});

describe('runMigrations', () => {
  it('creates the latest schema on a fresh install', async () => {
    const { db } = await createTestDatabase();
    await db.insert(contractions).values({ startedAt: 1, endedAt: 2, intensity: 3, note: 'n' });
    expect(await db.select().from(contractions)).toHaveLength(1);
  });

  it('enforces the schema constraints', async () => {
    const { db } = await createTestDatabase();
    expect(() => {
      db.insert(contractions).values({ startedAt: 10, endedAt: 5 }).run();
    }).toThrow();
    expect(() => {
      db.insert(contractions).values({ startedAt: 10, intensity: 4 }).run();
    }).toThrow();
    db.insert(contractions).values({ startedAt: 10 }).run();
    expect(() => {
      db.insert(contractions).values({ startedAt: 20 }).run();
    }).toThrow();
  });

  it('does nothing when already up to date', async () => {
    const { db, target } = await createTestDatabase();
    db.run(sql`INSERT INTO contractions (started_at) VALUES (1)`);
    await runMigrations(target, migrations);
    expect(await db.select().from(contractions)).toHaveLength(1);
  });

  it.each(entries.map(entry => [entry.tag, entry.idx] as const))(
    'upgrades from %s to the latest version and keeps data',
    async (_tag, idx) => {
      const { db, target } = await createTestDatabase(idx);
      db.run(sql`INSERT INTO contractions (started_at, ended_at) VALUES (1000, 61000)`);
      await runMigrations(target, migrations);
      const rows = await db.select().from(contractions);
      expect(rows).toEqual([expect.objectContaining({ id: 1, startedAt: 1000, endedAt: 61000 })]);
    },
  );

  it('rolls back a failing migration completely so it can run again', async () => {
    const { client, target } = await createTestDatabase(-1);
    const first = entries[0]!;
    const broken = {
      journal: { entries: [first] },
      migrations: {
        [keyOf(first.idx)]: `${bundled[keyOf(first.idx)]}\n--> statement-breakpoint\nNOT SQL`,
      },
    };

    await expect(runMigrations(target, broken)).rejects.toThrow();
    expect(client.exec("SELECT name FROM sqlite_master WHERE name = 'contractions'")).toEqual([]);
    expect(client.exec('SELECT count(*) FROM __app_migrations')[0]?.values).toEqual([[0]]);

    await runMigrations(target, migrations);
    expect(client.exec('SELECT count(*) FROM __app_migrations')[0]?.values).toEqual([
      [entries.length],
    ]);
  });

  it('reports a journal entry missing from the bundle', async () => {
    const { target } = await createTestDatabase(-1);
    const last = entries.at(-1)!;
    await expect(
      runMigrations(target, { journal: { entries: [last] }, migrations: {} }),
    ).rejects.toThrow(`Migration ${last.tag} is missing from the bundle`);
  });
});
