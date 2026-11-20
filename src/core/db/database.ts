// SPDX-License-Identifier: Apache-2.0
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from './schema';

/** Drizzle database bound to the app schema. Async on device, sync in tests. */
export type AppDatabase =
  | BaseSQLiteDatabase<'async', unknown, typeof schema>
  | BaseSQLiteDatabase<'sync', unknown, typeof schema>;
