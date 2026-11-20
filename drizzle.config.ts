// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'drizzle-kit';

// `driver: 'expo'` makes drizzle-kit emit migrations.js, a bundle Metro can ship
// inside the app. op-sqlite's migrator reads the same bundle format.
export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/core/db/schema.ts',
  out: './src/core/db/migrations',
});
