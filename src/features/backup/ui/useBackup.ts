// SPDX-License-Identifier: Apache-2.0
import { useCallback, useState } from 'react';
import { formatLocalDate } from '@core/utils/dateFormat';
import { useTimerServices } from '@features/timer/ui/TimerServices';
import { FileTooLargeError } from '../data/backupFiles';
import { createBackup, parseBackup, type Backup, type BackupError } from '../domain/backupFile';
import { useBackupFiles } from './BackupServices';

/** Outcome shown under the backup buttons. */
export type BackupMessage =
  | { kind: 'saved' }
  | { kind: 'restored'; count: number }
  | { kind: 'error'; reason: BackupError | 'save-failed' | 'open-failed' | 'restore-failed' };

/** A checked backup waiting for the user to confirm the replacement. */
export interface PendingRestore {
  backup: Backup;
  /** How many contractions are on the phone now and would be replaced. */
  currentCount: number;
}

/** View-model for backing up to a file and restoring from one. */
export function useBackup() {
  const { repository, clock } = useTimerServices();
  const files = useBackupFiles();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<BackupMessage | null>(null);
  const [pending, setPending] = useState<PendingRestore | null>(null);

  /** Runs one action; failures show `failure` instead of escaping. */
  const run = useCallback((work: () => Promise<void>, failure: BackupMessage) => {
    setBusy(true);
    setMessage(null);
    work()
      .catch((error: unknown) => {
        if (error instanceof FileTooLargeError) {
          setMessage({ kind: 'error', reason: 'not-a-backup' });
          return;
        }
        console.error('Backup or restore failed', error);
        setMessage(failure);
      })
      .finally(() => {
        setBusy(false);
      });
  }, []);

  const backup = useCallback(() => {
    run(
      async () => {
        const now = clock.now();
        const text = createBackup(await repository.listAll(), now);
        const saved = await files.save(
          `calm-contraction-timer-backup-${formatLocalDate(now)}.json`,
          text,
        );
        if (saved) {
          setMessage({ kind: 'saved' });
        }
      },
      { kind: 'error', reason: 'save-failed' },
    );
  }, [run, clock, repository, files]);

  const chooseRestore = useCallback(() => {
    run(
      async () => {
        const text = await files.open();
        if (text === null) {
          return;
        }
        const parsed = parseBackup(text);
        if (!parsed.ok) {
          setMessage({ kind: 'error', reason: parsed.error });
          return;
        }
        setPending({ backup: parsed.value, currentCount: (await repository.listAll()).length });
      },
      { kind: 'error', reason: 'open-failed' },
    );
  }, [run, files, repository]);

  const confirmRestore = useCallback(() => {
    const restoring = pending;
    setPending(null);
    if (!restoring) {
      return;
    }
    run(
      async () => {
        await repository.replaceAll(restoring.backup.contractions);
        setMessage({ kind: 'restored', count: restoring.backup.contractions.length });
      },
      { kind: 'error', reason: 'restore-failed' },
    );
  }, [pending, run, repository]);

  const cancelRestore = useCallback(() => {
    setPending(null);
  }, []);

  return { busy, message, pending, backup, chooseRestore, confirmRestore, cancelRestore };
}
