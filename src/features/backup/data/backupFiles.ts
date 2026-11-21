// SPDX-License-Identifier: Apache-2.0
import {
  errorCodes,
  isErrorWithCode,
  pick,
  saveDocuments,
  types,
} from '@react-native-documents/picker';
import ReactNativeBlobUtil from 'react-native-blob-util';

/** Backups are small JSON files; anything bigger is not one, and is never read into memory. */
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

/** Thrown by {@link BackupFiles.open} when the picked file is too large to be a backup. */
export class FileTooLargeError extends Error {
  constructor() {
    super('File is too large to be a backup');
    this.name = 'FileTooLargeError';
  }
}

/** Saves and opens backup files with the system file picker; faked in tests. */
export interface BackupFiles {
  /** Asks where to save, then writes the file there. Resolves false if the user cancels. */
  save(fileName: string, contents: string): Promise<boolean>;
  /** Lets the user pick a file and returns its text, or null if they cancel. */
  open(): Promise<string | null>;
  /** Removes temporary copies left by an interrupted save. */
  clearTemporaryFiles(): Promise<void>;
}

const { fs } = ReactNativeBlobUtil;
const stagingDir = () => `${fs.dirs.CacheDir}/backup`;

const cancelled = (error: unknown): boolean =>
  isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED;

async function clearTemporaryFiles(): Promise<void> {
  if (await fs.exists(stagingDir())) {
    await fs.unlink(stagingDir());
  }
}

/**
 * Uses Android's Storage Access Framework, so the user can keep backups in
 * Google Drive, Downloads or any storage app, with no account or permission
 * needed by this app. Saving stages a copy in the cache, which is always
 * removed; opening reads the picked file directly and leaves no copy behind.
 */
export const pickerBackupFiles: BackupFiles = {
  async save(fileName, contents) {
    await clearTemporaryFiles();
    await fs.mkdir(stagingDir());
    const path = `${stagingDir()}/${fileName}`;
    try {
      await fs.writeFile(path, contents, 'utf8');
      const [result] = await saveDocuments({
        sourceUris: [`file://${path}`],
        mimeType: 'application/json',
        fileName,
      });
      if (result.error) {
        throw new Error(result.error);
      }
      return true;
    } catch (error) {
      if (cancelled(error)) {
        return false;
      }
      throw error;
    } finally {
      await clearTemporaryFiles();
    }
  },

  async open() {
    try {
      // Any type: storage apps often label JSON as plain text or binary. The content is checked.
      const [file] = await pick({ mode: 'import', type: [types.allFiles] });
      if (file.size !== null && file.size > MAX_BACKUP_BYTES) {
        throw new FileTooLargeError();
      }
      // blob-util reads content:// URIs directly, so no copy of the data is written.
      return await fs.readFile(file.uri, 'utf8');
    } catch (error) {
      if (cancelled(error)) {
        return null;
      }
      throw error;
    }
  },

  clearTemporaryFiles,
};
