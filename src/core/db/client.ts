// SPDX-License-Identifier: Apache-2.0
import { open } from '@op-engineering/op-sqlite';
import { drizzle } from 'drizzle-orm/op-sqlite';
import type { AppDatabase } from './database';
import migrations from './migrations/migrations';
import { runMigrations } from './migrator';
import * as schema from './schema';

/** File name of the on-device database. Excluded from Android backup. */
export const DATABASE_NAME = 'contractions.db';

let opening: Promise<AppDatabase> | undefined;

async function openAndMigrate(): Promise<AppDatabase> {
  const client = open({ name: DATABASE_NAME });
  await runMigrations(client, migrations);
  return drizzle(client, { schema });
}

/**
 * Opens the on-device database once per JS context and applies pending
 * migrations. Shared by the app and the notification background handler.
 * A failed attempt is not cached, so the next call retries.
 */
export function getAppDatabase(): Promise<AppDatabase> {
  opening ??= openAndMigrate().catch((error: unknown) => {
    opening = undefined;
    throw error;
  });
  return opening;
}
