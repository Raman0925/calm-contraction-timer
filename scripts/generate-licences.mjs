// SPDX-License-Identifier: Apache-2.0
/**
 * Writes the in-app open-source licences list from the production dependency
 * tree. Runs on every install (postinstall), so CI always ships fresh data.
 * Licence texts are de-duplicated to keep the bundle small.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

const OUTPUT = 'src/features/settings/data/licences.generated.json';
// license-checker falls back to a README when a package has no licence file; keep real ones only.
const LICENCE_FILE = /^(licen[cs]e|copying|notice)/i;
const dir = mkdtempSync(join(tmpdir(), 'licences-'));
const raw = join(dir, 'licences.json');

try {
  const result = spawnSync(
    'npx',
    [
      'license-checker-rseidelsohn',
      '--production',
      '--excludePrivatePackages',
      '--json',
      '--customPath',
      'scripts/licence-fields.json',
      '--out',
      raw,
    ],
    { stdio: 'inherit', shell: process.platform === 'win32' },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  const entries = JSON.parse(readFileSync(raw, 'utf8'));
  const texts = [];
  const textIndex = new Map();
  const packages = Object.keys(entries)
    .sort()
    .map(id => {
      const entry = entries[id];
      const at = id.lastIndexOf('@');
      const isLicenceFile = LICENCE_FILE.test(basename(entry.licenseFile ?? ''));
      const text = isLicenceFile ? (entry.licenseText ?? '').replace(/\r\n/g, '\n').trim() : '';
      if (text && !textIndex.has(text)) {
        textIndex.set(text, texts.length);
        texts.push(text);
      }
      return {
        name: id.slice(0, at),
        version: id.slice(at + 1),
        licence: String(entry.licenses ?? 'UNKNOWN'),
        repository: entry.repository ?? null,
        text: text ? textIndex.get(text) : null,
      };
    });

  writeFileSync(OUTPUT, `${JSON.stringify({ packages, texts })}\n`);
  console.log(`Wrote ${packages.length} packages and ${texts.length} licence texts to ${OUTPUT}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
