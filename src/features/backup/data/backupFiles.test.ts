// SPDX-License-Identifier: Apache-2.0
import { pick, saveDocuments } from '@react-native-documents/picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { FileTooLargeError, MAX_BACKUP_BYTES, pickerBackupFiles } from './backupFiles';

const { fs } = ReactNativeBlobUtil;
const cancel = { code: 'OPERATION_CANCELED' };

describe('pickerBackupFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stages the file in the cache, lets the user save it, then removes the copy', async () => {
    jest
      .mocked(saveDocuments)
      .mockResolvedValueOnce([{ uri: 'content://x', name: 'b.json', error: null }]);
    jest.mocked(fs.exists).mockResolvedValue(true);
    expect(await pickerBackupFiles.save('b.json', '{}')).toBe(true);
    expect(fs.writeFile).toHaveBeenCalledWith('/cache/backup/b.json', '{}', 'utf8');
    expect(saveDocuments).toHaveBeenCalledWith({
      sourceUris: ['file:///cache/backup/b.json'],
      mimeType: 'application/json',
      fileName: 'b.json',
    });
    expect(fs.unlink).toHaveBeenLastCalledWith('/cache/backup');
    jest.mocked(fs.exists).mockResolvedValue(false);
  });

  it('reports a cancelled save and rethrows real failures', async () => {
    jest.mocked(saveDocuments).mockRejectedValueOnce(cancel);
    expect(await pickerBackupFiles.save('b.json', '{}')).toBe(false);
    jest.mocked(saveDocuments).mockResolvedValueOnce([{ uri: 'x', name: null, error: 'denied' }]);
    await expect(pickerBackupFiles.save('b.json', '{}')).rejects.toThrow('denied');
  });

  it('reads the picked file directly, leaving no copy behind', async () => {
    jest.mocked(pick).mockResolvedValueOnce([{ uri: 'content://drive/1', size: 2048 }] as never);
    jest.mocked(fs.readFile).mockResolvedValueOnce('{"format":1}');
    expect(await pickerBackupFiles.open()).toBe('{"format":1}');
    expect(fs.readFile).toHaveBeenCalledWith('content://drive/1', 'utf8');
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('refuses to read a file too large to be a backup', async () => {
    jest
      .mocked(pick)
      .mockResolvedValueOnce([{ uri: 'content://video', size: MAX_BACKUP_BYTES + 1 }] as never);
    await expect(pickerBackupFiles.open()).rejects.toBeInstanceOf(FileTooLargeError);
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it('returns null when picking is cancelled', async () => {
    jest.mocked(pick).mockRejectedValueOnce(cancel);
    expect(await pickerBackupFiles.open()).toBeNull();
  });

  it('removes staged files left by an interrupted save', async () => {
    jest.mocked(fs.exists).mockResolvedValueOnce(true);
    await pickerBackupFiles.clearTemporaryFiles();
    expect(fs.unlink).toHaveBeenCalledWith('/cache/backup');
  });
});
