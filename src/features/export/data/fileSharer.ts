// SPDX-License-Identifier: Apache-2.0
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';

/** A file to hand to the system share sheet. */
export interface SharedFile {
  fileName: string;
  mimeType: string;
  contents: string;
  encoding: 'utf8' | 'base64';
  /** Title of the share sheet. */
  title: string;
}

/** Writes export files and opens the share sheet. Implemented natively; faked in tests. */
export interface FileSharer {
  share(file: SharedFile): Promise<void>;
  /** Removes every exported file from the phone. */
  clearExports(): Promise<void>;
}

const { fs } = ReactNativeBlobUtil;
const exportsDir = () => `${fs.dirs.CacheDir}/exports`;

async function clearExports(): Promise<void> {
  if (await fs.exists(exportsDir())) {
    await fs.unlink(exportsDir());
  }
}

/**
 * Writes to a private exports folder in the app cache (never backed up) and
 * shares it through react-native-share's FileProvider. Only the latest export
 * is kept: the folder is cleared before each new one, on Delete all and at
 * launch. Cancelling the share sheet is not an error.
 */
export const nativeFileSharer: FileSharer = {
  async share(file) {
    await clearExports();
    await fs.mkdir(exportsDir());
    const path = `${exportsDir()}/${file.fileName}`;
    await fs.writeFile(path, file.contents, file.encoding);
    await Share.open({
      url: `file://${path}`,
      type: file.mimeType,
      filename: file.fileName,
      title: file.title,
      failOnCancel: false,
    });
  },
  clearExports,
};
