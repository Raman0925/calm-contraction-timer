// SPDX-License-Identifier: Apache-2.0
import { createContext, useContext, type ReactNode } from 'react';
import { nativeFileSharer, type FileSharer } from '../data/fileSharer';

const FileSharerContext = createContext<FileSharer>(nativeFileSharer);

/** Overrides how exported files are shared; tests pass a fake. */
export function FileSharerProvider({
  sharer,
  children,
}: {
  sharer: FileSharer;
  children: ReactNode;
}) {
  return <FileSharerContext.Provider value={sharer}>{children}</FileSharerContext.Provider>;
}

/** The file sharer in use: the device share sheet unless overridden. */
export const useFileSharer = (): FileSharer => useContext(FileSharerContext);
