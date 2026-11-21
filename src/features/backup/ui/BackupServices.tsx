// SPDX-License-Identifier: Apache-2.0
import { createContext, useContext, type ReactNode } from 'react';
import { pickerBackupFiles, type BackupFiles } from '../data/backupFiles';

const BackupFilesContext = createContext<BackupFiles>(pickerBackupFiles);

/** Overrides how backup files are saved and opened; tests pass a fake. */
export function BackupFilesProvider({
  files,
  children,
}: {
  files: BackupFiles;
  children: ReactNode;
}) {
  return <BackupFilesContext.Provider value={files}>{children}</BackupFilesContext.Provider>;
}

/** The backup file picker in use: the system picker unless overridden. */
export const useBackupFiles = (): BackupFiles => useContext(BackupFilesContext);
