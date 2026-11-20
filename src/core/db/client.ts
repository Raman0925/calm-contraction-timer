// SPDX-License-Identifier: Apache-2.0
import { open } from '@op-engineering/op-sqlite';
import { drizzle } from 'drizzle-orm/op-sqlite';
import type { AppDatabase } from './database';
import migrations from './migrations/migrations';
import { runMigrations } from './migrator';
import * as schema from './schema';

/** File name of the on-device database. Excluded from Android backup. */
export const DATABASE_NAME = 'contractions.db';

/** Opens the on-device database and applies any pending migrations. */
export async function openAppDatabase(): Promise<AppDatabase> {
  const client = open({ name: DATABASE_NAME });
  await runMigrations(client, migrations);
  return drizzle(client, { schema });
}
