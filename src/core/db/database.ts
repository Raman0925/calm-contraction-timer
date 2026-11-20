// SPDX-License-Identifier: Apache-2.0
import type { drizzleFor } from './sqlDriver';

/** Drizzle database bound to the app schema; the same type on device and in tests. */
export type AppDatabase = ReturnType<typeof drizzleFor>;
