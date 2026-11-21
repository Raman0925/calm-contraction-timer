// SPDX-License-Identifier: Apache-2.0
import type { BackupFiles } from '../backupFiles';

/** In-memory file picker for tests: records saves and returns a chosen file on open. */
export class FakeBackupFiles implements BackupFiles {
  saved: { fileName: string; contents: string }[] = [];
  /** Text returned by the next `open()`; null simulates the user cancelling. */
  toOpen: string | null = null;
  cancelSave = false;
  fail = false;

  save(fileName: string, contents: string): Promise<boolean> {
    if (this.fail) {
      return Promise.reject(new Error('storage unavailable'));
    }
    if (this.cancelSave) {
      return Promise.resolve(false);
    }
    this.saved.push({ fileName, contents });
    return Promise.resolve(true);
  }

  temporaryFilesCleared = 0;

  clearTemporaryFiles(): Promise<void> {
    this.temporaryFilesCleared += 1;
    return Promise.resolve();
  }

  open(): Promise<string | null> {
    return this.fail
      ? Promise.reject(new Error('storage unavailable'))
      : Promise.resolve(this.toOpen);
  }
}
