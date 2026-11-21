// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen } from '@testing-library/react-native';
import { App } from '@app/App';
import { MINUTE_MS } from '@core/utils/time';
import { useProStore } from '@features/paywall/data/proStore';
import { FakeBilling } from '@features/paywall/data/testing/FakeBilling';
import { createTestServices } from '@features/timer/ui/testing/createTestServices';
import { BACKUP_FORMAT, createBackup, parseBackup } from '../domain/backupFile';
import { FileTooLargeError } from '../data/backupFiles';
import { FakeBackupFiles } from '../data/testing/FakeBackupFiles';

const NOW = Date.UTC(2026, 0, 11, 9, 0);

async function openSettings(files: FakeBackupFiles, pro = true) {
  const setup = await createTestServices(NOW);
  const { repository } = setup.services;
  await repository.start(NOW - 20 * MINUTE_MS);
  await repository.stop(NOW - 19 * MINUTE_MS);
  const billing = new FakeBilling();
  billing.owned = pro ? [billing.proPurchase('purchased', true)] : [];
  useProStore.setState({ isPro: pro });
  await render(<App services={setup.services} billing={billing} backupFiles={files} />);
  await screen.findByTestId('timer-screen');
  await fireEvent.press(screen.getByRole('button', { name: /Settings/ }));
  await screen.findByTestId('backup-save');
  return setup;
}

const backupOf = (count: number) =>
  createBackup(
    Array.from({ length: count }, (_, i) => ({
      id: 100 + i,
      startedAt: NOW - (60 - i * 5) * MINUTE_MS,
      endedAt: NOW - (59 - i * 5) * MINUTE_MS,
      intensity: null,
      note: null,
    })),
    NOW - 60 * MINUTE_MS,
  );

describe('Backup', () => {
  it('saves every contraction to a backup file', async () => {
    const files = new FakeBackupFiles();
    await openSettings(files);
    await fireEvent.press(screen.getByTestId('backup-save'));

    expect(await screen.findByText('Backup saved.')).toBeOnTheScreen();
    expect(files.saved[0]?.fileName).toBe('calm-contraction-timer-backup-2026-01-11.json');
    const parsed = parseBackup(files.saved[0]?.contents ?? '');
    expect(parsed.ok && parsed.value.contractions).toHaveLength(1);
  });

  it('says nothing when saving is cancelled, and explains a failure', async () => {
    const files = new FakeBackupFiles();
    files.cancelSave = true;
    await openSettings(files);
    await fireEvent.press(screen.getByTestId('backup-save'));
    expect(screen.queryByTestId('backup-message')).toBeNull();

    files.fail = true;
    await fireEvent.press(screen.getByTestId('backup-save'));
    expect(await screen.findByText(/backup could not be saved/)).toBeOnTheScreen();
  });

  it('restores a backup after confirmation, replacing what is on the phone', async () => {
    const files = new FakeBackupFiles();
    files.toOpen = backupOf(3);
    const setup = await openSettings(files);
    await fireEvent.press(screen.getByTestId('backup-restore'));

    expect(
      await screen.findByText(
        /The 1 contraction on this phone will be deleted. It will be replaced by 3 contractions/,
      ),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('backup-confirm'));
    expect(await screen.findByText('Restored 3 contractions.')).toBeOnTheScreen();
    expect((await setup.services.repository.listAll()).map(c => c.id)).toEqual([100, 101, 102]);
  });

  it('changes nothing when the restore is cancelled', async () => {
    const files = new FakeBackupFiles();
    files.toOpen = backupOf(3);
    const setup = await openSettings(files);
    await fireEvent.press(screen.getByTestId('backup-restore'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Cancel' }));
    expect(await setup.services.repository.listAll()).toHaveLength(1);
  });

  it.each([
    ['a file from another app', '{"hello":"world"}', /not a Calm Contraction Timer backup/],
    [
      'a backup from a newer version',
      JSON.stringify({ format: BACKUP_FORMAT, version: 99, createdAt: NOW, contractions: [] }),
      /made by a newer version/,
    ],
  ])('explains why %s cannot be restored', async (_label, text, expected) => {
    const files = new FakeBackupFiles();
    files.toOpen = text;
    const setup = await openSettings(files);
    await fireEvent.press(screen.getByTestId('backup-restore'));
    expect(await screen.findByText(expected)).toBeOnTheScreen();
    expect(await setup.services.repository.listAll()).toHaveLength(1);
  });

  it('treats a file too large to be a backup as not a backup', async () => {
    const files = new FakeBackupFiles();
    files.open = () => Promise.reject(new FileTooLargeError());
    await openSettings(files);
    await fireEvent.press(screen.getByTestId('backup-restore'));
    expect(await screen.findByText(/not a Calm Contraction Timer backup/)).toBeOnTheScreen();
  });

  it('removes temporary backup files at launch', async () => {
    const files = new FakeBackupFiles();
    await openSettings(files);
    expect(files.temporaryFilesCleared).toBeGreaterThan(0);
  });

  it('offers Pro instead of backup for free users', async () => {
    const files = new FakeBackupFiles();
    await openSettings(files, false);
    expect(screen.getByTestId('backup-save')).toHaveAccessibleName('Back up to a file · Pro');
    await fireEvent.press(screen.getByTestId('backup-restore'));
    expect(await screen.findByTestId('paywall-screen')).toBeOnTheScreen();
    expect(files.saved).toEqual([]);
  });
});
