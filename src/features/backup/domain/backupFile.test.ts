// SPDX-License-Identifier: Apache-2.0
import { contraction } from '@features/timer/domain/testing/builders';
import { BACKUP_FORMAT, createBackup, parseBackup } from './backupFile';

const BASE = Date.UTC(2026, 0, 10, 8, 0);
const NOW = BASE + 60 * 60_000;

const file = (overrides: Record<string, unknown>) =>
  JSON.stringify({
    format: BACKUP_FORMAT,
    version: 1,
    createdAt: NOW,
    contractions: [],
    ...overrides,
  });

describe('backup files', () => {
  it('round-trips contractions with intensity and notes, oldest first', () => {
    const items = [
      contraction(BASE, 5, 70, { intensity: 3, note: ['waters "broke"', 'at 08:05'].join('\n') }),
      contraction(BASE, 0, 60),
    ];
    expect(parseBackup(createBackup(items, NOW))).toEqual({
      ok: true,
      value: { createdAt: NOW, contractions: [items[1], items[0]] },
    });
  });

  it('leaves out a contraction that is still running', () => {
    const items = [contraction(BASE, 0, 60), contraction(BASE, 10, null)];
    const restored = parseBackup(createBackup(items, NOW));
    expect(restored.ok && restored.value.contractions).toEqual([items[0]]);
  });

  it('accepts a file re-saved with a byte-order mark', () => {
    const text = String.fromCharCode(0xfeff) + createBackup([contraction(BASE, 0, 60)], NOW);
    expect(parseBackup(text).ok).toBe(true);
  });

  it('round-trips an empty history', () => {
    expect(parseBackup(createBackup([], NOW))).toEqual({
      ok: true,
      value: { createdAt: NOW, contractions: [] },
    });
  });

  it.each([
    ['not JSON', 'hello'],
    ['another JSON file', JSON.stringify({ name: 'x' })],
    ['a JSON array', '[]'],
  ])('rejects %s as not a backup', (_label, text) => {
    expect(parseBackup(text)).toEqual({ ok: false, error: 'not-a-backup' });
  });

  it('refuses a backup from a newer app version', () => {
    expect(parseBackup(file({ version: 2 }))).toEqual({ ok: false, error: 'newer-version' });
  });

  it.each([
    ['a missing date', { createdAt: undefined }],
    [
      'an end before the start',
      { contractions: [{ id: 1, startedAt: 10, endedAt: 5, intensity: null, note: null }] },
    ],
    [
      'an intensity of 4',
      { contractions: [{ id: 1, startedAt: 10, endedAt: 20, intensity: 4, note: null }] },
    ],
    [
      'a fractional id',
      { contractions: [{ id: 1.5, startedAt: 10, endedAt: 20, intensity: null, note: null }] },
    ],
    [
      'an overlong note',
      {
        contractions: [
          { id: 1, startedAt: 10, endedAt: 20, intensity: null, note: 'x'.repeat(501) },
        ],
      },
    ],
    [
      'duplicate ids',
      {
        contractions: [
          { id: 1, startedAt: 10, endedAt: 20, intensity: null, note: null },
          { id: 1, startedAt: 30, endedAt: 40, intensity: null, note: null },
        ],
      },
    ],
    [
      'two running contractions',
      {
        contractions: [
          { id: 1, startedAt: 10, endedAt: null, intensity: null, note: null },
          { id: 2, startedAt: 30, endedAt: null, intensity: null, note: null },
        ],
      },
    ],
    [
      'a running contraction that is not the latest',
      {
        contractions: [
          { id: 1, startedAt: 10, endedAt: null, intensity: null, note: null },
          { id: 2, startedAt: 30, endedAt: 40, intensity: null, note: null },
        ],
      },
    ],
  ])('rejects a backup with %s', (_label, overrides) => {
    expect(parseBackup(file(overrides))).toEqual({ ok: false, error: 'invalid' });
  });
});
