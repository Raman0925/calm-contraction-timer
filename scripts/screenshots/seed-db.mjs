// SPDX-License-Identifier: Apache-2.0
/**
 * Builds a contractions database with a realistic, made-up history for store
 * screenshots, using the app's own migration SQL and bookkeeping so the app
 * opens it as its own. No real data is involved.
 *
 * Usage: node scripts/screenshots/seed-db.mjs <out.db> <now epoch ms>
 */
import { Buffer } from 'node:buffer';
import { readFileSync, writeFileSync } from 'node:fs';
import initSqlJs from 'sql.js';

const [, , out, nowArg] = process.argv;
const NOW = Number(nowArg);
if (!out || !Number.isFinite(NOW)) {
  console.error('Usage: seed-db.mjs <out.db> <now epoch ms>');
  process.exit(1);
}

const MINUTE = 60_000;
const SECOND = 1_000;
const MIGRATIONS = 'src/core/db/migrations';

// Deterministic jitter, so every run produces the same screenshots.
let seed = 7;
const jitter = range => {
  seed = (seed * 16807) % 2147483647;
  return ((seed / 2147483647) * 2 - 1) * range;
};

/** Contractions as [minutes before now, duration seconds, intensity, note]. */
function history() {
  const rows = [];
  // Two evenings ago: early, irregular contractions that faded away.
  let t = 2 * 24 * 60 + 210;
  for (const gap of [0, 18, 12, 21, 15, 24, 17]) {
    t -= gap;
    rows.push([t, 32 + jitter(8), 1, gap === 0 ? 'Mild, like period pain' : null]);
  }
  // Today: building from about 9 minutes apart to a steady 4-5 minutes.
  t = 143.5;
  for (const gap of [0, 9.5, 8.8, 8, 7.2, 6.8, 6.1, 5.6, 5.4]) {
    t -= gap;
    rows.push([t, 45 + jitter(6), 2, null]);
  }
  for (let i = 0; i < 18; i += 1) {
    t -= 4.6 + jitter(0.35);
    rows.push([t, 69 + jitter(6), i < 8 ? 2 : 3, i === 4 ? 'Waters broke' : null]);
  }
  return rows.filter(([minutesAgo]) => minutesAgo > 1.5);
}

const SQL = await initSqlJs();
const db = new SQL.Database();
const journal = JSON.parse(readFileSync(`${MIGRATIONS}/meta/_journal.json`, 'utf8'));
db.run(
  'CREATE TABLE IF NOT EXISTS __app_migrations (idx INTEGER PRIMARY KEY, tag TEXT NOT NULL, generated_at INTEGER NOT NULL)',
);
for (const entry of journal.entries) {
  const source = readFileSync(`${MIGRATIONS}/${entry.tag}.sql`, 'utf8');
  for (const statement of source.split('--> statement-breakpoint')) {
    if (statement.trim()) {
      db.run(statement);
    }
  }
  db.run('INSERT INTO __app_migrations (idx, tag, generated_at) VALUES (?, ?, ?)', [
    entry.idx,
    entry.tag,
    entry.when,
  ]);
}

const insert = db.prepare(
  'INSERT INTO contractions (started_at, ended_at, intensity, note) VALUES (?, ?, ?, ?)',
);
for (const [minutesAgo, seconds, intensity, note] of history().sort((a, b) => b[0] - a[0])) {
  const startedAt = Math.round(NOW - minutesAgo * MINUTE);
  insert.run([startedAt, startedAt + Math.round(seconds * SECOND), intensity, note]);
}
insert.free();

writeFileSync(out, Buffer.from(db.export()));
console.log(`Wrote ${out}`);
